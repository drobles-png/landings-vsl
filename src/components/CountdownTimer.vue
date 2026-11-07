<script setup lang="ts">
// Temporizador del encabezado. Ciclos de TIMER_CYCLE_HOURS (config/funnel.ts) anclados al reloj de
// Ecuador (con 12 h: 00:00 y 12:00): al llegar a 0 se reinicia solo, todos los visitantes ven la misma
// cuenta y recargar la página no la reinicia. Textos en LANDING.timer (content/copy.ts).
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { TIMER_CYCLE_HOURS } from '@/config/funnel'
import { LANDING } from '@/content/copy'

const CYCLE_MS = TIMER_CYCLE_HOURS * 60 * 60 * 1000
const EC_OFFSET_MS = -5 * 60 * 60 * 1000 // Ecuador: UTC-5 sin horario de verano

function msLeft(now: number): number {
  const elapsed = (((now + EC_OFFSET_MS) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS
  return CYCLE_MS - elapsed
}

const now = ref(Date.now())
let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => window.clearInterval(timer))

const pad = (n: number) => String(n).padStart(2, '0')
const parts = computed(() => {
  const s = Math.floor(msLeft(now.value) / 1000)
  return [
    { v: pad(Math.floor(s / 3600)), u: 'h' },
    { v: pad(Math.floor((s % 3600) / 60)), u: 'm' },
    { v: pad(s % 60), u: 's' },
  ]
})
// Para lectores de pantalla: solo horas y minutos (no anunciar cada segundo)
const spoken = computed(() => `${LANDING.timer.label}: ${LANDING.timer.prefix.toLowerCase()} ${Number(parts.value[0]!.v)} h ${Number(parts.value[1]!.v)} min`)
</script>

<template>
  <div class="countdown">
    <span class="sr-only">{{ spoken }}</span>
    <span class="countdown__label" aria-hidden="true">
      <span class="countdown__what">{{ LANDING.timer.label }}</span>
      <span class="countdown__short">{{ LANDING.timer.short }}</span>
      <small>{{ LANDING.timer.prefix }}</small>
    </span>
    <span class="countdown__time" aria-hidden="true">
      <span v-for="p in parts" :key="p.u" class="countdown__unit"><b>{{ p.v }}</b><i>{{ p.u }}</i></span>
    </span>
  </div>
</template>

<style scoped lang="scss">
.countdown {
  display: flex;
  align-items: center;
  gap: 12px;

  &__label {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    @include eyebrow;
    color: $ink-muted;
    font-size: 0.75rem;
    line-height: 1.35;

    small {
      color: $primary;
      font-size: inherit;
      white-space: nowrap;
    }
  }

  // En celular: texto corto, pero que siga diciendo QUÉ cierra
  &__short {
    display: none;
  }
  @media (max-width: 560px) {
    gap: 8px;

    &__what {
      display: none;
    }
    &__short {
      display: inline;
      white-space: nowrap;
    }
  }

  &__time {
    display: flex;
    padding-bottom: 2px;
    border-bottom: 1px solid $primary;
  }

  &__unit {
    display: inline-flex;
    align-items: baseline;
    padding: 0 3px;

    b {
      min-width: 2ch;
      color: $ink;
      font-weight: 500;
      font-size: 1.1rem;
      font-variant-numeric: tabular-nums lining-nums;
      text-align: right;
    }
    i {
      margin-left: 1px;
      color: $ink-muted;
      font-style: normal;
      font-size: 0.75rem;
    }
  }
}
</style>
