import type { VercelRequest, VercelResponse } from '@vercel/node'

// Confirma con Payphone el pago que vuelve a /inscripcion-confirmada?id=…&clientTransactionId=…
// Payphone reversa el cobro si no se confirma en los primeros 5 minutos: la página lo llama apenas carga.
// Confirmar es idempotente del lado de Payphone (recargar la página devuelve el mismo estado).
// Solo con statusCode 3 (Approved) y el monto correcto la página dispara Purchase.

const PRICE_CENTS = 0 // debe coincidir con payphone-order.ts (PRICE × 100)
const CONFIRM_URL = 'https://paymentbox.payphonetodoesposible.com/api/confirm'

function hostOf(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    return new URL(value).host
  } catch {
    return undefined
  }
}

function isSameOrigin(req: VercelRequest): boolean {
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host
  const origin = hostOf(req.headers.origin as string | undefined) ?? hostOf(req.headers.referer)
  return Boolean(host && origin && origin === host)
}

interface PayphoneConfirm {
  statusCode?: number
  transactionStatus?: string
  transactionId?: number
  clientTransactionId?: string
  amount?: number
  email?: string
  phoneNumber?: string
  optionalParameter4?: string // nombre del titular, cuando Payphone lo envía
  message?: string
  errorCode?: number
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

  const token = process.env.PAYPHONE_TOKEN
  if (!token) {
    res.status(503).json({ approved: false, error: 'Payphone no configurado' })
    return
  }

  const { id, clientTransactionId } = (req.body ?? {}) as { id?: unknown; clientTransactionId?: unknown }
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0 || typeof clientTransactionId !== 'string' || !clientTransactionId) {
    res.status(400).json({ approved: false, error: 'id y clientTransactionId son requeridos' })
    return
  }

  try {
    const ppRes = await fetch(CONFIRM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: numericId, clientTxId: clientTransactionId }),
    })
    const data = (await ppRes.json()) as PayphoneConfirm
    const approved = ppRes.ok && data.statusCode === 3 && data.amount === PRICE_CENTS

    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({
      approved,
      status: data.transactionStatus ?? (ppRes.ok ? 'Unknown' : 'Error'),
      statusCode: data.statusCode ?? null,
      transactionId: data.transactionId ?? numericId,
      clientTransactionId: data.clientTransactionId ?? clientTransactionId,
      amount: data.amount ?? null,
      // Respaldo si la persona pagó en otro dispositivo y no hay contacto guardado
      email: data.email ?? '',
      phone: data.phoneNumber ?? '',
      message: data.message ?? '',
    })
  } catch {
    res.status(502).json({ approved: false, error: 'No se pudo confirmar con Payphone' })
  }
}
