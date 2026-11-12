<script setup lang="ts">
// /pago (solo si PAYMENT_ENABLED): resumen + cobro. InitiateCheckout (Pixel + CAPI) y etapa
// `pago_iniciado` en GHL con el mismo event_id.
//  - PAYMENT_PROVIDER 'payphone': Cajita de Payphone (api/payphone-order entrega token y monto).
//    Sin credenciales en Vercel, o en local sin `pnpm dev:api`: plan B por WhatsApp/Instagram.
//  - PAYMENT_PROVIDER 'link': botón a PAYMENT_URL. Sin URL: plan B.
// El router exige contacto guardado (en localhost se puede abrir directo para diseñar).
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import StepShell from '@/components/StepShell.vue'
import {
  CLIENT,
  CURRENCY,
  IS_LOCAL,
  PAYMENT_PROVIDER,
  PAYMENT_URL,
  PRICE,
  PRODUCT_NAME,
  eventDateLabel,
  priceLabel,
  whatsappLink,
} from '@/config/funnel'
import { PAGO } from '@/content/copy'
import { useContactStore } from '@/stores/contact'
import { sendCapiEvent } from '@/utils/capi'
import { fbq, generateEventId, trackStage } from '@/utils/ghl'
import { loadPayphone, type PayphoneOrder } from '@/utils/payphone'

const c = useContactStore().get()
const product = PRODUCT_NAME || '[Nombre del producto o evento]'
const waHref = whatsappLink(PAGO.whatsappMsg(`${c.nombre} ${c.apellido}`.trim()))

// ── Enlace de otra pasarela ('link') ──────────────────────────────────────────
// Prellena la pasarela con los datos del registro (si la pasarela acepta estos parámetros)
const payHref = computed(() => {
  if (PAYMENT_PROVIDER !== 'link' || !PAYMENT_URL) return ''
  const url = new URL(PAYMENT_URL)
  if (c.email) url.searchParams.set('email', c.email)
  if (c.nombre) url.searchParams.set('name', `${c.nombre} ${c.apellido}`.trim())
  if (c.telefono) url.searchParams.set('phone', c.telefono)
  return url.toString()
})

// ── Cajita de Payphone ('payphone') ───────────────────────────────────────────
// loading → ready | off (sin credenciales: plan B) | error | expired
const payState = ref<'loading' | 'ready' | 'off' | 'error' | 'expired'>(
  PAYMENT_PROVIDER === 'payphone' ? 'loading' : payHref.value ? 'ready' : 'off',
)
// El formulario de Payphone vence a los 10 min: pasado eso se pide un intento nuevo
const PAYPHONE_TTL_MS = 9.5 * 60 * 1000
let expiryTimer: ReturnType<typeof setTimeout> | undefined

async function mountPayphone() {
  payState.value = 'loading'
  clearTimeout(expiryTimer)
  try {
    const res = await fetch('/api/payphone-order', { method: 'POST' })
    if (!res.ok) throw new Error(String(res.status))
    const order = (await res.json()) as PayphoneOrder
    if (!order.enabled) {
      payState.value = 'off'
      return
    }
    if (IS_LOCAL && order.amount !== Math.round(PRICE * 100)) {
      console.error('[Payphone] PRICE_CENTS de api/payphone-*.ts no coincide con PRICE de funnel.ts')
    }
    const PPaymentButtonBox = await loadPayphone()
    payState.value = 'ready'
    await nextTick()
    new PPaymentButtonBox({
      token: order.token,
      clientTransactionId: order.clientTransactionId,
      amount: order.amount,
      amountWithoutTax: order.amountWithoutTax,
      currency: order.currency,
      storeId: order.storeId,
      reference: order.reference,
      lang: 'es',
      defaultMethod: 'card',
      timeZone: -5,
      // Datos reales del comprador (Payphone rechaza datos fijos)
      email: c.email || undefined,
      phoneNumber: c.telefono || undefined,
    }).render('pp-button')
    expiryTimer = setTimeout(() => (payState.value = 'expired'), PAYPHONE_TTL_MS)
  } catch {
    // En local no hay /api (salvo con `pnpm dev:api`): se ve el plan B
    payState.value = IS_LOCAL ? 'off' : 'error'
  }
}

onBeforeUnmount(() => clearTimeout(expiryTimer))

onMounted(() => {
  if (PAYMENT_PROVIDER === 'payphone') mountPayphone()

  const eventId = generateEventId('checkout')
  const custom = { content_name: product, value: PRICE, currency: CURRENCY }
  fbq('track', 'InitiateCheckout', custom, { eventID: eventId })
  sendCapiEvent(
    'InitiateCheckout',
    eventId,
    { email: c.email, phone: c.telefono, firstName: c.nombre, lastName: c.apellido },
    custom,
  )
  trackStage('pago_iniciado', c, {
    tags: ['step-3-pago-iniciado'],
    titulo: '💳 PAGO INICIADO',
    detalle: {
      Total: priceLabel(),
      Pasarela:
        PAYMENT_PROVIDER === 'payphone' ? 'Payphone (Cajita de pagos)' : PAYMENT_URL ? 'Enlace de pago' : 'Sin enlace: se cobra por WhatsApp/correo',
    },
    eventId,
  })
})
</script>

<template>
  <StepShell :step="PAGO.step">
    <section class="pago">
      <h1 class="pago__title">{{ c.nombre ? `${c.nombre}, te` : 'Te' }} {{ PAGO.title }}</h1>
      <p class="pago__sub">{{ PAGO.sub }}</p>

      <div class="summary">
        <strong class="summary__name">{{ product }}</strong>
        <ul role="list">
          <li><i class="fa-regular fa-calendar" aria-hidden="true"></i> {{ eventDateLabel() }}</li>
          <li v-for="b in PAGO.bullets" :key="b"><i class="fa-solid fa-check" aria-hidden="true"></i> {{ b }}</li>
        </ul>
        <div class="summary__total">
          <span>Total</span>
          <strong>{{ priceLabel() }}</strong>
        </div>
      </div>

      <!-- Otra pasarela: botón -->
      <a v-if="payHref" :href="payHref" class="btn btn--lg btn--block">
        <i class="fa-solid fa-lock" aria-hidden="true"></i> Pagar {{ priceLabel() }} de forma segura
      </a>

      <!-- Payphone: el formulario lo pinta Payphone dentro de #pp-button -->
      <template v-if="PAYMENT_PROVIDER === 'payphone'">
        <p v-if="payState === 'loading'" class="paybox paybox--loading" role="status">
          <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Cargando el pago seguro…
        </p>
        <div v-show="payState === 'ready'" class="paybox">
          <p class="paybox__secure"><i class="fa-solid fa-lock" aria-hidden="true"></i> Pago seguro con Payphone</p>
          <div id="pp-button"></div>
        </div>
        <template v-if="payState === 'expired' || payState === 'error'">
          <p class="pago__notice" role="status">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            {{ payState === 'expired' ? PAGO.expired : PAGO.loadError }}
          </p>
          <button type="button" class="btn btn--lg btn--block" @click="mountPayphone">
            <i class="fa-solid fa-rotate-right" aria-hidden="true"></i> Volver a cargar el pago
          </button>
        </template>
      </template>

      <!-- Plan B: pago sin configurar, o la Cajita no cargó -->
      <template v-if="payState === 'off' || payState === 'error'">
        <p v-if="payState === 'off'" class="pago__notice" role="status">
          <i class="fa-solid fa-circle-info" aria-hidden="true"></i> {{ PAGO.noLink }}
        </p>
        <a v-if="waHref" :href="waHref" target="_blank" rel="noopener" class="btn btn--ghost btn--block">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Pagar por WhatsApp
        </a>
        <a v-else-if="CLIENT.instagram" :href="CLIENT.instagram" target="_blank" rel="noopener" class="btn btn--ghost btn--block">
          <i class="fa-brands fa-instagram" aria-hidden="true"></i> Escríbenos por Instagram
        </a>
      </template>

      <RouterLink :to="{ path: '/', query: { editar: '1' } }" class="pago__edit">
        <i class="fa-solid fa-pen" aria-hidden="true"></i> Corregir mis datos
      </RouterLink>
    </section>
  </StepShell>
</template>

<style scoped lang="scss">
.pago {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__title {
    font-size: clamp(1.5rem, 5vw, 2rem);
    text-align: center;
  }

  &__sub {
    color: $ink-muted;
    text-align: center;
  }

  &__notice {
    display: flex;
    gap: 10px;
    padding: 14px;
    border-radius: $radius-md;
    background: $primary-soft;
    font-size: 0.9rem;

    i {
      margin-top: 4px;
      color: $primary;
    }
  }

  &__edit {
    align-self: center;
    padding: 8px;
    color: $ink-muted;
    font-size: 0.875rem;
  }
}

.summary {
  padding: 20px;
  border: 1px solid $line;
  border-radius: $radius-md;
  background: $raised;

  &__name {
    font-size: 1.1rem;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 14px 0;
    padding: 0;
    list-style: none;
    color: $ink-muted;
    font-size: 0.9rem;
  }

  i {
    width: 18px;
    color: $primary;
  }

  &__total {
    display: flex;
    justify-content: space-between;
    padding-top: 14px;
    border-top: 1px solid $line;

    strong {
      font-family: $font-mono;
      font-size: 1.15rem;
    }
  }
}

// La Cajita trae su propio diseño claro: va sobre fondo blanco aunque la marca sea oscura
.paybox {
  padding: 16px;
  border-radius: $radius-md;
  background: #fff;
  color: #1a1a1a;

  &--loading {
    border: 1px solid $line;
    background: $raised;
    color: $ink-muted;
    text-align: center;
  }

  &__secure {
    margin-bottom: 8px;
    color: #555;
    font-size: 0.85rem;
  }
}
</style>
