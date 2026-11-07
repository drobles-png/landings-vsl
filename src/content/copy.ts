// Textos de la página. Un cliente nuevo edita SOLO este archivo (y config/funnel.ts).
// Todo lo que está entre [corchetes] es un marcador: reemplazar con lo que dice el VSL del cliente.
// No inventar cifras, testimonios, garantías ni bonos.
import { BRAND_NAME, PERSON_NAME } from '@/config/funnel'

export interface Testimonial {
  name: string
  role: string
  quote: string
  /** Resultado concreto que dijo el testimonio (opcional): "+30% en ventas" */
  result?: string
  photo?: string
}

export interface TeamMember {
  name: string
  role: string
  bio?: string
  photo?: string
}

export const SEO = {
  landing: {
    title: `${BRAND_NAME} | [Promesa principal del VSL]`,
    description: '[Descripción de 150 caracteres con la promesa y para quién es]',
  },
  video: { title: `Mira el video | ${BRAND_NAME}`, description: '[Descripción del video]' },
  booking: { title: `Agenda tu reunión | ${BRAND_NAME}`, description: 'Elige el día y la hora.' },
  booked: { title: `Reunión confirmada | ${BRAND_NAME}`, description: 'Tu reunión está confirmada.' },
  noSpace: { title: `Todavía no es el momento | ${BRAND_NAME}`, description: 'Gracias por tu interés.' },
  pago: { title: `Confirma tu lugar | ${BRAND_NAME}`, description: 'Completa tu inscripción.' },
  confirmada: { title: `Inscripción confirmada | ${BRAND_NAME}`, description: 'Tu lugar está confirmado.' },
  privacy: { title: `Política de privacidad | ${BRAND_NAME}`, description: `Política de privacidad de ${BRAND_NAME}.` },
  legal: { title: `Aviso legal | ${BRAND_NAME}`, description: `Aviso legal de ${BRAND_NAME}.` },
}

// ── Landing (/) ───────────────────────────────────────────────────────────────
export const LANDING = {
  topbarTag: '[Categoría o propuesta en 4 palabras]',
  audience: ['[Para quién es 1]', '[Para quién es 2]', '[Para quién es 3]'],
  headline: '[Promesa principal del VSL]',
  headlineAccent: '[parte destacada de la promesa]',
  sub: `[Subtítulo: el dolor en una frase]. ${PERSON_NAME} te lo cuenta en un video corto.`,
  videoCaption: `${PERSON_NAME} · [Duración del video]`,
  cta: 'Ver el video completo',
  ctaNote: 'Sin costo · Solo te pedimos tus datos para mostrártelo',

  pains: {
    eyebrow: 'El problema',
    title: '[Titular del dolor]',
    items: [
      { icon: 'fa-circle-exclamation', title: '[Dolor 1]', text: '[Explicación del dolor 1, en la voz del VSL]' },
      { icon: 'fa-circle-exclamation', title: '[Dolor 2]', text: '[Explicación del dolor 2]' },
    ],
  },

  steps: {
    eyebrow: 'Cómo funciona',
    title: '[Titular de la solución en N pasos]',
    items: [
      { title: '[Paso 1]', text: '[Qué se resuelve en el paso 1]' },
      { title: '[Paso 2]', text: '[Qué se resuelve en el paso 2]' },
      { title: '[Paso 3]', text: '[Qué se resuelve en el paso 3]' },
    ],
    cta: 'Quiero ver cómo',
  },

  // Testimonios REALES del cliente (del VSL, de Google o de capturas que mande). Vacío = la sección
  // no se muestra. photo: URL de Cloudinary o '' (muestra las iniciales).
  // Formato: { name: 'Ana Pérez', role: 'Dueña de X · Quito', quote: '…', result: '+30% en ventas', photo: '' }
  testimonials: {
    eyebrow: 'Resultados',
    title: '[Lo que dicen quienes ya lo hicieron]',
    items: [] as Testimonial[],
  },

  // Quién está detrás (genera confianza antes de agendar). Vacío = la sección no se muestra.
  // Formato: { name: 'Juan Pérez', role: 'CEO y fundador', bio: '…', photo: '' }
  team: {
    eyebrow: 'Quién te acompaña',
    title: '[El equipo detrás de la reunión]',
    items: [] as TeamMember[],
  },

  fit: {
    eyebrow: 'Antes de seguir',
    title: '¿Es para ti?',
    items: [
      { yes: true, text: '[Sí es para ti si…]' },
      { yes: true, text: '[Sí es para ti si…]' },
      { yes: false, text: '[No es para ti si…]' },
    ],
  },

  closing: {
    eyebrow: 'Siguiente paso',
    title: '[Llamado final: mira el video y agendemos]',
    sub: '[Qué pasa en la reunión y por qué vale la pena]',
    cta: 'Ver el video completo',
  },

  sticky: { title: '[Nombre corto de la oferta]', sub: `Video de ${PERSON_NAME}`, cta: 'Ver video' },
  disclaimer:
    'Los resultados dependen de cada caso. Este sitio no está respaldado por Meta Platforms, Inc. ni forma parte de Facebook.',
}

// ── Modal de registro ─────────────────────────────────────────────────────────
export const REGISTRO = {
  eyebrow: '[Nombre corto de la oferta]',
  title: 'Mira el video completo',
  sub: '[Por qué dejar tus datos: qué vas a ver y qué pasa después]',
  submit: 'Ver el video completo',
  submitPago: 'Continuar',
  legal: 'Tus datos están seguros · No spam',
}

// ── /ver-video ────────────────────────────────────────────────────────────────
export const VIDEO = {
  step: 'Paso 1 de 2',
  eyebrow: `${PERSON_NAME} · ${BRAND_NAME}`,
  title: '[Titular del VSL completo]',
  sub: 'Mira el video completo. Al final puedes agendar una reunión.',
  lockText: 'El botón se habilita en',
  cta: 'Agendar mi reunión',
  trust: 'Reunión sin costo · Cupos sujetos a cualificación',
}

// ── Cualificación (las preguntas están en utils/qualification.ts) ─────────────
export const CUALIFICACION = {
  eyebrow: 'Último paso',
  title: 'Cuéntanos de tu caso',
  sub: 'Una pregunta a la vez. Te toma un minuto.',
  consent: `Acepto que ${BRAND_NAME} me contacte por WhatsApp y correo, y acepto su`,
  submit: 'Ver horarios disponibles',
}

// ── /agendar ──────────────────────────────────────────────────────────────────
export const BOOKING = {
  step: 'Paso 2 de 2',
  title: 'Elige tu horario',
  sub: '[Qué se conversa en la reunión]. Sin costo.',
  pending:
    'Estamos terminando de configurar el calendario. Te escribiremos por WhatsApp para coordinar tu reunión.',
}

// ── /cita-confirmada ──────────────────────────────────────────────────────────
export const BOOKED = {
  title: 'Tu reunión está confirmada',
  sub: 'Te enviamos los detalles a tu correo.',
  steps: [
    { icon: 'fa-solid fa-envelope', title: 'Revisa tu correo', text: 'Ahí tienes la fecha, la hora y el enlace.' },
    { icon: 'fa-brands fa-whatsapp', title: 'Te escribimos por WhatsApp', text: 'Para confirmar y resolver dudas antes.' },
    { icon: 'fa-solid fa-list-check', title: '[Qué preparar]', text: '[Qué tener a mano para la reunión]' },
  ],
}

// ── /sin-espacio ──────────────────────────────────────────────────────────────
export const NO_SPACE = {
  title: 'Todavía no es el momento, y está bien',
  text: '[Por qué hoy no hay reunión para su caso, con respeto]. Cuando estés listo, aquí estamos.',
  cooldown: 'Ya enviaste una solicitud. Podrás intentarlo de nuevo en',
  resourcesTitle: `Sigue aprendiendo con ${BRAND_NAME}`,
  resourcesText: '[Qué publica la marca en redes]',
}

// ── Pago (opcional) ───────────────────────────────────────────────────────────
export const PAGO = {
  step: 'Paso 2 de 2 · Confirma tu lugar',
  title: 'falta un paso para confirmar tu lugar',
  sub: 'Tu lugar queda reservado cuando completas el pago.',
  bullets: ['[Formato: en vivo, en línea]', '[Qué se lleva el asistente]'],
  noLink: 'Recibimos tus datos. Te enviaremos el enlace de pago a tu WhatsApp y a tu correo.',
  whatsappMsg: (nombre: string) => `Hola, soy ${nombre}. Me registré y quiero completar mi pago.`,
}

export const CONFIRMADA = {
  title: 'Tu lugar está confirmado',
  steps: [
    { icon: 'fa-solid fa-envelope-open-text', text: 'Revisa tu correo: ahí te llega la confirmación y el acceso.' },
    { icon: 'fa-brands fa-whatsapp', text: 'Te escribiremos por WhatsApp antes de empezar.' },
    { icon: 'fa-solid fa-list-check', text: '[Qué preparar antes del evento]' },
  ],
  calendarTitle: '¿Prefieres que veamos tu caso? Agenda una reunión',
  calendarButton: 'Agendar una reunión',
}
