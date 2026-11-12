// Carga perezosa de la Cajita de Payphone (solo en /pago) y llamadas a las funciones de /api.
// Docs: https://docs.payphone.app/cajita-de-pagos

const CSS_URL = 'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css'
const JS_URL = 'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js'

export interface PayphoneOrder {
  enabled: boolean
  token: string
  storeId: string
  clientTransactionId: string
  amount: number
  amountWithoutTax: number
  currency: string
  reference: string
}

export interface PayphoneConfirmation {
  approved: boolean
  status: string
  statusCode: number | null
  transactionId: number
  clientTransactionId: string
  amount: number | null
  email: string
  phone: string
  message: string
}

type PPaymentButtonBoxCtor = new (config: Record<string, unknown>) => { render: (id: string) => void }

let loading: Promise<PPaymentButtonBoxCtor> | null = null

export function loadPayphone(): Promise<PPaymentButtonBoxCtor> {
  const w = window as unknown as { PPaymentButtonBox?: PPaymentButtonBoxCtor }
  if (w.PPaymentButtonBox) return Promise.resolve(w.PPaymentButtonBox)
  if (loading) return loading

  if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS_URL
    document.head.appendChild(link)
  }

  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.type = 'module' // el script de Payphone es un módulo
    s.src = JS_URL
    s.onload = () => (w.PPaymentButtonBox ? resolve(w.PPaymentButtonBox) : reject(new Error('Payphone no cargó')))
    s.onerror = () => {
      loading = null
      reject(new Error('Payphone no cargó'))
    }
    document.head.appendChild(s)
  })
  return loading
}

export async function confirmPayphone(id: string, clientTransactionId: string): Promise<PayphoneConfirmation> {
  const res = await fetch('/api/payphone-confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, clientTransactionId }),
  })
  return (await res.json()) as PayphoneConfirmation
}
