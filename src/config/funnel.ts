// Configuración del funnel. TODO lo que cambia entre clientes vive aquí.
// Regla: un valor vacío = esa integración se omite (nunca cae en la cuenta de otro cliente).
// Los textos de la página están en src/content/copy.ts; los colores en src/styles/tokens.scss.

// ── Cliente ───────────────────────────────────────────────────────────────────
export const CLIENT = {
  name: '', // nombre comercial que se muestra: "Mi Marca"
  person: '', // quien habla en el VSL: "Juan Pérez"
  instagram: '', // URL completa
  facebook: '',
}

/** Nombre que se muestra en la página (wordmark, títulos, legales). */
export const BRAND_NAME = CLIENT.name || '[Marca]'
/** Quien habla en el VSL. */
export const PERSON_NAME = CLIENT.person || '[Nombre de quien habla]'

// Dominio público (canonical, og:url). Vacío = window.location.origin
export const SITE_URL = ''

// ── Meta ──────────────────────────────────────────────────────────────────────
// vite.config.ts inyecta el snippet del pixel en index.html con este id (vacío = sin pixel).
// CAPI lee el id y el token desde env vars de Vercel (META_PIXEL_ID, META_CAPI_TOKEN), nunca de aquí.
export const META_PIXEL_ID = ''

// ── GoHighLevel (subcuenta DEL CLIENTE) ───────────────────────────────────────
export const GHL_CONTACT_WEBHOOK = '' // "obtener contacto"
export const GHL_QUALIFICATION_WEBHOOK = '' // "obtener cualificación"
export const GHL_BOOKING_CALENDAR = '' // URL del src del iframe del código de inserción
// Id del iframe en formato del código de inserción de GHL (<calendarId>_<timestamp>);
// form_embed.js lo usa para el alto automático. Cópialo del embed que manda el cliente.
export const GHL_BOOKING_FRAME_ID = ''

// ── Imágenes ──────────────────────────────────────────────────────────────────
// Portada del video en la landing (foto de quien habla). URL de Cloudinary (f_auto,q_auto,w_1200).
// Si el CDN falla se usa VSL_POSTER_FALLBACK (archivo en public/). Ambos vacíos = recuadro oscuro.
export const VSL_POSTER = ''
export const VSL_POSTER_FALLBACK = '' // ej. '/vsl-poster.webp'
// Logo como URL absoluta (para el JSON-LD de la empresa). Vacío = el JSON-LD va sin logo.
export const LOGO_URL = ''

// ── Video ─────────────────────────────────────────────────────────────────────
export const WISTIA_MEDIA_ID = ''
// Segundos que el CTA de /ver-video queda bloqueado (0 = sin bloqueo). En localhost son 3 s.
export const CTA_UNLOCK_SECONDS = 120

// ── Temporizador del encabezado ───────────────────────────────────────────────
// Duración de cada ciclo; se reinicia solo al llegar a 0 (anclado a la hora de Ecuador).
export const TIMER_CYCLE_HOURS = 12

// ── Registro ──────────────────────────────────────────────────────────────────
// true = el formulario de registro pide ciudad (va a GHL como `ciudad`)
export const ASK_CITY = false
// País preseleccionado del teléfono (ISO 3166 alfa-2)
export const DEFAULT_COUNTRY = 'EC'

// ── Pago (OPCIONAL: solo funnels que cobran, ej. masterclass) ─────────────────
// false = las rutas /pago e /inscripcion-confirmada ni siquiera se registran.
export const PAYMENT_ENABLED = false
export const PRICE = 0
export const CURRENCY = 'USD'
export const PRODUCT_NAME = ''
// Cómo se cobra (references/pago.md):
//  'payphone' → Cajita de Payphone en /pago. El pago se confirma en el servidor y Purchase solo
//               sale si Payphone lo aprobó. Credenciales en Vercel: PAYPHONE_TOKEN, PAYPHONE_STORE_ID.
//               El monto lo fija api/payphone-order.ts (PRICE_CENTS): debe coincidir con PRICE.
//  'link'     → botón a PAYMENT_URL (otra pasarela). No se puede verificar el pago: Purchase sale
//               cuando la persona vuelve a /inscripcion-confirmada.
export const PAYMENT_PROVIDER: 'payphone' | 'link' = 'payphone'
// Solo con 'link': URL de la pasarela; debe redirigir al terminar a <dominio>/inscripcion-confirmada
export const PAYMENT_URL = ''
// WhatsApp de respaldo para cobrar si el pago no está configurado (formato 593987654321)
export const WHATSAPP_NUMBER = ''

// ── Evento en vivo (OPCIONAL) ─────────────────────────────────────────────────
// ISO con zona: '2026-11-20T19:00:00-05:00'. Vacío = "Te avisamos la fecha por WhatsApp y correo"
export const EVENT_DATE = ''
export const EVENT_DURATION_MIN = 90

// ── Legal (páginas de privacidad y aviso legal) ───────────────────────────────
export const LEGAL = {
  razonSocial: '',
  ruc: '',
  ciudad: '',
  email: '',
}

// Prefijo de las claves de localStorage/sessionStorage (2-3 letras del cliente)
export const STORAGE_PREFIX = 'fn'

// Nombre del funnel para tags y notas de GHL ("funnel-micliente")
export const FUNNEL_TAG = 'funnel'

export const IS_LOCAL = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)

export function whatsappLink(text: string): string {
  if (!WHATSAPP_NUMBER) return ''
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

export function priceLabel(): string {
  return `$${PRICE.toFixed(2)} ${CURRENCY}`
}

/** "jueves, 20 de noviembre, 19:00 (hora de Ecuador)" o el aviso si aún no hay fecha. */
export function eventDateLabel(): string {
  if (!EVENT_DATE) return 'Te avisamos la fecha por WhatsApp y correo'
  const d = new Date(EVENT_DATE)
  const tz = { timeZone: 'America/Guayaquil' } as const
  const fecha = d.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', ...tz })
  const hora = d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', ...tz })
  return `${fecha}, ${hora} (hora de Ecuador)`
}
