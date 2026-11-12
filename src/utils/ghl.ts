/**
 * Envíos a GoHighLevel con el contrato estándar (ver references/contrato-ghl.md).
 * Todos los webhooks de la subcuenta actualizan el MISMO contacto (GHL deduplica por email/teléfono
 * si la desduplicación está activa), así que el avance de etapa reutiliza el webhook de contacto.
 */
import { FUNNEL_TAG, GHL_CONTACT_WEBHOOK } from '@/config/funnel'
import { getStoredFbParams } from './fbclid'

export function generateEventId(prefix = 'evt'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

// En localhost no sale nada al CRM del cliente (solo se ve en consola como [GHL stub]),
// salvo que la página se abra con ?ghl=1 para probar los workflows a propósito.
const LOCAL_STUB =
  /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) &&
  !new URLSearchParams(window.location.search).has('ghl')

/** Vacío = no se envía nada. Nunca lanza: el tracking jamás bloquea la UX. */
export async function postToGhl(url: string, body: Record<string, unknown>): Promise<void> {
  if (!url) return
  if (LOCAL_STUB) {
    console.info('[GHL stub]', body.etapa, body)
    return
  }
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true, // sobrevive a la navegación inmediata (router.push / cierre de pestaña)
    })
  } catch {
    /* silencioso */
  }
}

export interface ContactoNota {
  nombre?: string
  apellido?: string
  email?: string
  telefono?: string
  ciudad?: string
  pais?: string
}

const SEP = '━━━━━━━━━━━━━━━━━━━━━━━━'

/**
 * Nota legible para el CRM. Va en `nota` y `notas` (el workflow usa cualquiera).
 * @param titulo   primera línea, ej. "✅ CALIFICA" o "📝 NUEVO REGISTRO"
 * @param detalle  pares etiqueta → valor legible (usar siempre la versión _label)
 */
export function buildNota(
  titulo: string,
  contacto: ContactoNota,
  detalle: Record<string, string> = {},
  eventId = '',
): string {
  const fb = getStoredFbParams()
  const origen = (
    ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'] as const
  )
    .filter((k) => fb[k])
    .map((k) => `${k}=${fb[k]}`)

  return [
    `${titulo} — ${FUNNEL_TAG}`,
    SEP,
    `👤 ${`${contacto.nombre ?? ''} ${contacto.apellido ?? ''}`.trim() || '—'}`,
    `📧 ${contacto.email || '—'}`,
    `📱 ${contacto.telefono || '—'}`,
    ...(contacto.ciudad ? [`🏙️ ${contacto.ciudad}`] : []),
    ...(contacto.pais ? [`🌎 ${contacto.pais}`] : []),
    ...(Object.keys(detalle).length ? [SEP, ...Object.entries(detalle).map(([k, v]) => `${k}: ${v}`)] : []),
    SEP,
    origen.length ? `📣 Origen: ${origen.join(' · ')}` : '📣 Origen: directo / orgánico (sin fbclid ni UTM)',
    `🕐 ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}`,
    ...(eventId ? [`🔑 event_id: ${eventId}`] : []),
  ].join('\n')
}

/**
 * Payload estándar: contacto + etapa + tags + nota/notas + event_id + atribución.
 * `extra` agrega campos de la etapa (respuestas, *_label, califica, resultado…).
 */
export function buildPayload(
  etapa: string,
  contacto: ContactoNota,
  opts: { tags: string[]; titulo: string; detalle?: Record<string, string>; eventId?: string; extra?: Record<string, unknown> },
): Record<string, unknown> {
  const event_id = opts.eventId ?? generateEventId(etapa)
  const nota = buildNota(opts.titulo, contacto, opts.detalle, event_id)
  return {
    ...contacto,
    etapa,
    tags: [FUNNEL_TAG, ...opts.tags],
    nota,
    notas: nota,
    event_id,
    timestamp: new Date().toISOString(),
    url_pagina: window.location.href,
    ...getStoredFbParams(),
    ...(opts.extra ?? {}),
  }
}

/** Avance de etapa del mismo contacto por el webhook de contacto. */
export function trackStage(
  etapa: string,
  contacto: ContactoNota,
  opts: { tags: string[]; titulo: string; detalle?: Record<string, string>; eventId?: string; extra?: Record<string, unknown> },
): Promise<void> {
  return postToGhl(GHL_CONTACT_WEBHOOK, buildPayload(etapa, contacto, opts))
}

export function fbq(...args: unknown[]) {
  ;(window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.(...args)
}
