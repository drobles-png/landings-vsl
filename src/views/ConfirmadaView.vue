<script setup lang="ts">
// /inscripcion-confirmada (solo si PAYMENT_ENABLED). La pasarela redirige aquí al terminar.
//  - 'payphone': llega /inscripcion-confirmada?id=<int>&clientTransactionId=<str>. Se confirma con
//    Payphone en el servidor (api/payphone-confirm; hay 5 min o Payphone reversa el cobro) y Purchase
//    + etapa `pagado` solo salen si el pago quedó aprobado por el monto correcto. event_id fijo
//    `purchase_<transactionId>`: aunque recargue, Meta no cuenta dos compras. En local, ?demo=1
//    muestra el éxito sin eventos.
//  - 'link': no hay cómo verificar el pago. Purchase sale UNA vez por dispositivo al llegar aquí
//    (el router exige contacto guardado).
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import GhlCalendar from '@/components/GhlCalendar.vue'
import StepShell from '@/components/StepShell.vue'
import {
  BRAND_NAME,
  CLIENT,
  CURRENCY,
  EVENT_DATE,
  EVENT_DURATION_MIN,
  GHL_BOOKING_CALENDAR,
  IS_LOCAL,
  PAYMENT_PROVIDER,
  PRICE,
  PRODUCT_NAME,
  STORAGE_PREFIX,
  WHATSAPP_NUMBER,
  eventDateLabel,
  priceLabel,
  whatsappLink,
} from '@/config/funnel'
import { CONFIRMADA } from '@/content/copy'
import { useContactStore } from '@/stores/contact'
import { sendCapiEvent } from '@/utils/capi'
import { fbq, generateEventId, trackStage } from '@/utils/ghl'
import { confirmPayphone } from '@/utils/payphone'

const PURCHASE_KEY = `${STORAGE_PREFIX}_purchase_at`
const route = useRoute()
const c = useContactStore().get()
const product = PRODUCT_NAME || '[Nombre del producto o evento]'

// checking → approved | failed (rechazado/cancelado) | error (no se pudo confirmar) | nodata (sin parámetros)
const state = ref<'checking' | 'approved' | 'failed' | 'error' | 'nodata'>(
  PAYMENT_PROVIDER === 'payphone' ? 'checking' : 'approved',
)
const txId = ref('')

const calendarHref = computed(() => {
  if (!EVENT_DATE) return ''
  const start = new Date(EVENT_DATE)
  const end = new Date(start.getTime() + EVENT_DURATION_MIN * 60_000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${product} — ${BRAND_NAME}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: 'El enlace de acceso llega a tu correo y WhatsApp.',
  })
  return `https://calendar.google.com/calendar/render?${params}`
})

const helpHref = computed(
  () => whatsappLink(CONFIRMADA.helpMsg(`${c.nombre} ${c.apellido}`.trim(), txId.value)) || CLIENT.instagram,
)

/** Purchase (Pixel + CAPI) + etapa `pagado` en GHL, una sola vez por transacción/dispositivo. */
function firePurchase(transactionId: string, fallback: { email: string; phone: string } = { email: '', phone: '' }) {
  const key = transactionId ? `${PURCHASE_KEY}_${transactionId}` : PURCHASE_KEY
  try {
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, String(Date.now()))
  } catch {
    // Sin storage: con Payphone seguimos (el event_id fijo evita el doble conteo); con 'link' no
    if (!transactionId) return
  }
  const contacto = { ...c, email: c.email || fallback.email, telefono: c.telefono || fallback.phone }
  const eventId = transactionId ? `purchase_${transactionId}` : generateEventId('purchase')
  const custom = {
    content_name: product,
    value: PRICE,
    currency: CURRENCY,
    ...(transactionId ? { order_id: transactionId } : {}),
  }
  fbq('track', 'Purchase', custom, { eventID: eventId })
  sendCapiEvent(
    'Purchase',
    eventId,
    { email: contacto.email, phone: contacto.telefono, firstName: c.nombre, lastName: c.apellido },
    custom,
  )
  trackStage('pagado', contacto, {
    tags: ['step-4-pagado'],
    titulo: '💰 PAGADO',
    detalle: {
      Total: priceLabel(),
      Fecha: eventDateLabel(),
      ...(transactionId ? { Pasarela: 'Payphone', Transacción: transactionId } : {}),
    },
    eventId,
    extra: transactionId ? { payphone_transaction_id: transactionId } : {},
  })
}

onMounted(async () => {
  if (PAYMENT_PROVIDER !== 'payphone') {
    firePurchase('')
    return
  }
  const id = String(route.query.id ?? '')
  const clientTx = String(route.query.clientTransactionId ?? '')
  if (!id || !clientTx) {
    state.value = IS_LOCAL && route.query.demo ? 'approved' : 'nodata'
    return
  }
  txId.value = id
  try {
    // Apenas carga: Payphone reversa el cobro si no se confirma en 5 minutos
    const r = await confirmPayphone(id, clientTx)
    if (r.approved) {
      state.value = 'approved'
      firePurchase(String(r.transactionId), { email: r.email, phone: r.phone })
    } else {
      state.value = r.statusCode === 2 || r.statusCode === 3 ? 'failed' : 'error'
    }
  } catch {
    state.value = 'error'
  }
})
</script>

<template>
  <StepShell>
    <section v-if="state === 'checking'" class="ok" role="status">
      <i class="fa-solid fa-spinner fa-spin ok__spin" aria-hidden="true"></i>
      <h1 class="ok__title">{{ CONFIRMADA.checking }}</h1>
      <p class="ok__date">{{ CONFIRMADA.checkingSub }}</p>
    </section>

    <section v-else-if="state !== 'approved'" class="ok">
      <span class="ok__badge ok__badge--warn" aria-hidden="true"><i class="fa-solid fa-exclamation"></i></span>
      <h1 class="ok__title">
        {{ state === 'failed' ? CONFIRMADA.failedTitle : state === 'nodata' ? CONFIRMADA.nodataTitle : CONFIRMADA.errorTitle }}
      </h1>
      <p class="ok__date">
        {{ state === 'failed' ? CONFIRMADA.failedSub : state === 'nodata' ? CONFIRMADA.nodataSub : CONFIRMADA.errorSub }}
        <strong v-if="txId && state === 'error'"> Transacción: {{ txId }}</strong>
      </p>
      <RouterLink v-if="state !== 'error'" to="/pago" class="btn btn--lg">
        <i class="fa-solid fa-lock" aria-hidden="true"></i> Ir al pago
      </RouterLink>
      <a v-if="helpHref" :href="helpHref" target="_blank" rel="noopener" class="btn btn--ghost">
        <i :class="['fa-brands', WHATSAPP_NUMBER ? 'fa-whatsapp' : 'fa-instagram']" aria-hidden="true"></i> Escríbenos
      </a>
    </section>

    <section v-else class="ok">
      <span class="ok__badge" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
      <h1 class="ok__title">{{ c.nombre ? `¡Listo, ${c.nombre}!` : '¡Listo!' }} {{ CONFIRMADA.title }}</h1>
      <p class="ok__date"><i class="fa-regular fa-calendar" aria-hidden="true"></i> {{ eventDateLabel() }}</p>

      <a v-if="calendarHref" :href="calendarHref" target="_blank" rel="noopener" class="btn btn--ghost">
        <i class="fa-regular fa-calendar-plus" aria-hidden="true"></i> Agregar a Google Calendar
      </a>

      <ol class="ok__steps" role="list">
        <li v-for="(s, i) in CONFIRMADA.steps" :key="i">
          <i :class="s.icon" aria-hidden="true"></i>
          <p>{{ s.text }}</p>
        </li>
      </ol>

      <GhlCalendar
        v-if="GHL_BOOKING_CALENDAR"
        :contacto="c"
        collapsible
        :title="CONFIRMADA.calendarTitle"
        :button-label="CONFIRMADA.calendarButton"
      />
    </section>
  </StepShell>
</template>

<style scoped lang="scss">
.ok {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;

  &__badge {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: $primary-soft;
    color: $primary;
    font-size: 1.6rem;
  }

  &__badge--warn {
    background: $raised;
    color: $ink-muted;
  }

  &__spin {
    color: $primary;
    font-size: 2rem;
  }

  &__title {
    font-size: clamp(1.6rem, 5vw, 2.25rem);
  }

  &__date {
    color: $ink-muted;
  }

  &__steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    margin: 8px 0;
    padding: 0;
    list-style: none;
    text-align: left;

    li {
      display: flex;
      gap: 14px;
      padding: 16px;
      border: 1px solid $line;
      border-radius: $radius-md;
      background: $raised;
    }

    i {
      margin-top: 4px;
      color: $primary;
    }
  }

  :deep(.ghlcal__title) {
    font-size: 1.15rem;
  }
}
</style>
