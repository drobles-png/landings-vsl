import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import FunnelView from '@/views/FunnelView.vue'
import { IS_LOCAL, PAYMENT_ENABLED, PAYMENT_PROVIDER, SITE_URL } from '@/config/funnel'
import { SEO } from '@/content/copy'
import { useContactStore } from '@/stores/contact'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    description: string
    /** Pasos privados (después del registro): no se indexan */
    noindex?: boolean
    /** Exige contacto guardado; si no, vuelve a /. `strict` también aplica en localhost. */
    requiresContact?: boolean | 'strict'
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'funnel', component: FunnelView, meta: { ...SEO.landing } },
  {
    path: '/ver-video',
    name: 'video',
    component: () => import('@/views/VideoView.vue'),
    meta: { ...SEO.video, noindex: true },
  },
  {
    path: '/agendar',
    name: 'booking',
    component: () => import('@/views/BookingView.vue'),
    meta: { ...SEO.booking, noindex: true, requiresContact: true },
  },
  {
    path: '/cita-confirmada',
    name: 'booked',
    component: () => import('@/views/BookedView.vue'),
    meta: { ...SEO.booked, noindex: true },
  },
  {
    path: '/sin-espacio',
    name: 'no-space',
    component: () => import('@/views/NoSpaceView.vue'),
    meta: { ...SEO.noSpace, noindex: true },
  },
  {
    path: '/politicas-privacidad',
    name: 'privacy-policy',
    component: () => import('@/views/PrivacyPolicyView.vue'),
    meta: { ...SEO.privacy },
  },
  {
    path: '/aviso-legal',
    name: 'legal-notice',
    component: () => import('@/views/LegalNoticeView.vue'),
    meta: { ...SEO.legal },
  },
]

// Flujo de pago OPCIONAL: las rutas solo existen si PAYMENT_ENABLED (si no, caen en el redirect a /)
if (PAYMENT_ENABLED) {
  routes.push(
    {
      path: '/pago',
      name: 'pago',
      component: () => import('@/views/PagoView.vue'),
      meta: { ...SEO.pago, noindex: true, requiresContact: true },
    },
    {
      // La pasarela redirige aquí y se dispara Purchase. Con Payphone el pago se verifica en el
      // servidor (sirve aunque pague en otro dispositivo); con 'link' exige contacto guardado SIEMPRE.
      path: '/inscripcion-confirmada',
      name: 'confirmada',
      component: () => import('@/views/ConfirmadaView.vue'),
      meta: { ...SEO.confirmada, noindex: true, requiresContact: PAYMENT_PROVIDER === 'payphone' ? false : 'strict' },
    },
  )
}

routes.push({ path: '/:pathMatch(.*)*', redirect: '/' })

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes,
})

router.beforeEach((to) => {
  const rule = to.meta.requiresContact
  if (!rule || (rule !== 'strict' && IS_LOCAL)) return true
  return useContactStore().has() ? true : { path: '/', replace: true }
})

// ── SEO por ruta + PageView en navegación SPA ─────────────────────────────────
const ORIGIN = SITE_URL || window.location.origin

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

let firstNavigation = true

router.afterEach((to, from) => {
  const { title, description, noindex } = to.meta
  const url = ORIGIN + to.path
  document.title = title
  setMeta('name', 'description', description)
  setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url

  // El PageView inicial lo manda el snippet del pixel: repetirlo solo en navegaciones SPA
  if (!firstNavigation && to.path !== from.path) {
    ;(window as unknown as { fbq?: (...a: unknown[]) => void }).fbq?.('track', 'PageView')
  }
  firstNavigation = false
})

export default router
