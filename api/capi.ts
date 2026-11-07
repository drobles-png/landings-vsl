import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createHash } from 'crypto'

// Conversions API server-side de Meta — espeja los eventos del Pixel del navegador
// para mejorar el match rate y sobrevivir a bloqueadores de anuncios / ITP.
// El pixel id y el access token viven solo en env vars de Vercel (META_PIXEL_ID, META_CAPI_TOKEN),
// nunca en el bundle del cliente. Si falta alguno, el envío se omite sin error.
const GRAPH_VERSION = 'v23.0'

// Solo los eventos que dispara el funnel. Cualquier otro (ej. un Purchase inventado) se rechaza.
const ALLOWED_EVENTS = new Set([
  'CompleteRegistration',
  'ViewContent',
  'Lead',
  'Schedule',
  'InitiateCheckout',
  'Purchase',
])

function hostOf(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    return new URL(value).host
  } catch {
    return undefined
  }
}

/**
 * La página y /api viven en el mismo deployment, así que el Origin (o el Referer) del navegador
 * debe coincidir con el Host de la petición. Funciona igual en el dominio del cliente y en los
 * previews de Vercel. Corta el abuso desde otros sitios; no es autenticación (curl puede falsearlo).
 */
function isSameOrigin(req: VercelRequest): boolean {
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host
  const origin = hostOf(req.headers.origin as string | undefined) ?? hostOf(req.headers.referer)
  return Boolean(host && origin && origin === host)
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

interface CapiRequestBody {
  event_name?: string
  event_id?: string
  event_source_url?: string
  user_data?: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    fbc?: string
    fbp?: string
  }
  custom_data?: Record<string, unknown>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!isSameOrigin(req)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const pixelId = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) {
    // Pixel o token no configurados todavía — no bloquear al cliente, solo omitir el envío.
    res.status(200).json({ skipped: true })
    return
  }

  const {
    event_name,
    event_id,
    event_source_url,
    user_data = {},
    custom_data = {},
  } = (req.body ?? {}) as CapiRequestBody

  if (typeof event_name !== 'string' || typeof event_id !== 'string' || !event_id) {
    res.status(400).json({ error: 'event_name y event_id son requeridos' })
    return
  }
  if (!ALLOWED_EVENTS.has(event_name)) {
    res.status(400).json({ error: 'event_name no permitido' })
    return
  }

  const forwardedFor = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()

  const payload = {
    data: [
      {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id,
        event_source_url,
        action_source: 'website',
        user_data: {
          em: user_data.email ? [sha256(user_data.email)] : undefined,
          ph: user_data.phone ? [sha256(normalizePhone(user_data.phone))] : undefined,
          fn: user_data.firstName ? [sha256(user_data.firstName)] : undefined,
          ln: user_data.lastName ? [sha256(user_data.lastName)] : undefined,
          fbc: user_data.fbc || undefined,
          fbp: user_data.fbp || undefined,
          client_ip_address: forwardedFor,
          client_user_agent: req.headers['user-agent'],
        },
        custom_data,
      },
    ],
    ...(process.env.META_CAPI_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE }
      : {}),
    // En el cuerpo y no en la URL: así el token no queda en logs de proxies ni de Vercel.
    access_token: token,
  }

  try {
    const metaRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await metaRes.json()
    res.status(metaRes.ok ? 200 : 502).json(json)
  } catch {
    res.status(502).json({ error: 'CAPI request failed' })
  }
}
