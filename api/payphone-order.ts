import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'crypto'

// Crea un intento de pago para la Cajita de Payphone (solo con PAYMENT_PROVIDER = 'payphone').
// El monto lo fija el servidor: el navegador no puede cambiar lo que se cobra.
// PAYPHONE_TOKEN y PAYPHONE_STORE_ID viven solo en env vars de Vercel. Si faltan,
// responde { enabled: false } y /pago muestra el plan B (WhatsApp / Instagram).
// El token de la Cajita termina en el navegador por diseño de Payphone; se entrega desde aquí
// para poder rotarlo sin redeploy del frontend.

// Monto en centavos: PRICE de src/config/funnel.ts × 100. Debe coincidir con payphone-confirm.ts.
// (Las funciones de /api no importan funnel.ts porque ese archivo usa window.)
const PRICE_CENTS = 0
// Texto que ve el comprador en Payphone (máx. 100 caracteres)
const REFERENCE = ''

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

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!isSameOrigin(req)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const token = process.env.PAYPHONE_TOKEN
  const storeId = process.env.PAYPHONE_STORE_ID
  if (!token || !storeId || PRICE_CENTS <= 0) {
    res.status(200).json({ enabled: false })
    return
  }

  // Único por intento y ≤ 50 caracteres (regla de Payphone)
  const clientTransactionId = `tx-${Date.now()}-${randomBytes(4).toString('hex')}`

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({
    enabled: true,
    token,
    storeId,
    clientTransactionId,
    amount: PRICE_CENTS,
    amountWithoutTax: PRICE_CENTS,
    currency: 'USD',
    reference: REFERENCE || 'Pago',
  })
}
