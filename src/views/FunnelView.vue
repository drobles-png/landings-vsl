<script setup lang="ts">
// Landing (/). Todo el texto sale de LANDING en src/content/copy.ts.
// Cada botón que abre el registro lleva data-cta="registro" (lo usa el e2e).
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import RegistrationModal from '@/components/RegistrationModal.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import TeamSection from '@/components/TeamSection.vue'
import TestimonialsSection from '@/components/TestimonialsSection.vue'
import {
  IS_LOCAL,
  PERSON_NAME,
  STORAGE_PREFIX,
  VSL_POSTER,
  VSL_POSTER_FALLBACK,
} from '@/config/funnel'
import { LANDING } from '@/content/copy'
import { captureFbParams } from '@/utils/fbclid'

const route = useRoute()
const router = useRouter()
const modalOpen = ref(false)
const showSticky = ref(false)

// Portada del video: Cloudinary → archivo local → recuadro oscuro
const poster = ref(VSL_POSTER || VSL_POSTER_FALLBACK)
function onPosterError() {
  poster.value = poster.value !== VSL_POSTER_FALLBACK ? VSL_POSTER_FALLBACK : ''
}

function openModal() {
  // Quien no calificó hace menos de 24 h vuelve a /sin-espacio
  if (!IS_LOCAL) {
    const disqAt = Number(localStorage.getItem(`${STORAGE_PREFIX}_disq_at`))
    if (disqAt && Date.now() - disqAt < 24 * 60 * 60 * 1000) {
      router.push('/sin-espacio')
      return
    }
  }
  modalOpen.value = true
}

const onScroll = () => (showSticky.value = window.scrollY > 700)

onMounted(() => {
  captureFbParams()
  window.addEventListener('scroll', onScroll, { passive: true })
  // /?editar=1 (desde "Corregir mis datos") reabre el registro con lo guardado
  if (route.query.editar) modalOpen.value = true
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="landing">
    <header class="topbar">
      <div class="wrap topbar__inner">
        <BrandLogo />
        <span class="topbar__tag">{{ LANDING.topbarTag }}</span>
      </div>
    </header>

    <!-- HERO -->
    <section class="hero" aria-labelledby="hero-title">
      <div class="wrap hero__inner">
        <ul class="hero__audience" role="list">
          <li v-for="a in LANDING.audience" :key="a">
            <i class="fa-solid fa-check" aria-hidden="true"></i>{{ a }}
          </li>
        </ul>
        <h1 id="hero-title" class="hero__title">
          {{ LANDING.headline }} <span class="accent">{{ LANDING.headlineAccent }}</span>
        </h1>
        <p class="hero__sub">{{ LANDING.sub }}</p>

        <button type="button" class="vsl" data-cta="registro" aria-label="Ver el video completo" @click="openModal">
          <img
            v-if="poster"
            class="vsl__poster"
            :src="poster"
            alt=""
            fetchpriority="high"
            decoding="async"
            @error="onPosterError"
          />
          <span class="vsl__play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>
          <span class="vsl__caption">
            <strong>{{ PERSON_NAME }}</strong>
            <span>{{ LANDING.videoCaption }}</span>
          </span>
        </button>

        <div class="hero__cta">
          <button type="button" class="btn btn--lg" data-cta="registro" @click="openModal">
            <i class="fa-solid fa-play" aria-hidden="true"></i> {{ LANDING.cta }}
          </button>
          <p class="hero__note">
            <i class="fa-solid fa-lock" aria-hidden="true"></i> {{ LANDING.ctaNote }}
          </p>
        </div>
      </div>
    </section>

    <!-- DOLOR -->
    <section class="section" aria-labelledby="pains-title">
      <div class="wrap">
        <p class="eyebrow">{{ LANDING.pains.eyebrow }}</p>
        <h2 id="pains-title" class="section__title">{{ LANDING.pains.title }}</h2>
        <div class="cards">
          <article v-for="p in LANDING.pains.items" :key="p.title" class="card">
            <i :class="['fa-solid', p.icon, 'card__icon']" aria-hidden="true"></i>
            <h3 class="card__title">{{ p.title }}</h3>
            <p class="card__text">{{ p.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- PASOS -->
    <section class="section section--alt" aria-labelledby="steps-title">
      <div class="wrap">
        <p class="eyebrow">{{ LANDING.steps.eyebrow }}</p>
        <h2 id="steps-title" class="section__title">{{ LANDING.steps.title }}</h2>
        <ol class="cards cards--3" role="list">
          <li v-for="(s, i) in LANDING.steps.items" :key="s.title" class="card">
            <span class="card__num" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3 class="card__title">{{ s.title }}</h3>
            <p class="card__text">{{ s.text }}</p>
          </li>
        </ol>
        <div class="section__cta">
          <button type="button" class="btn" data-cta="registro" @click="openModal">
            {{ LANDING.steps.cta }} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- TESTIMONIOS Y EQUIPO (opcionales: sin items no se muestran) -->
    <TestimonialsSection />
    <TeamSection />

    <!-- ¿ES PARA TI? -->
    <section class="section" aria-labelledby="fit-title">
      <div class="wrap">
        <p class="eyebrow">{{ LANDING.fit.eyebrow }}</p>
        <h2 id="fit-title" class="section__title">{{ LANDING.fit.title }}</h2>
        <ul class="cards cards--3" role="list">
          <li v-for="(f, i) in LANDING.fit.items" :key="i" class="card" :class="{ 'card--no': !f.yes }">
            <i :class="['fa-solid', f.yes ? 'fa-circle-check' : 'fa-circle-xmark', 'card__icon']" aria-hidden="true"></i>
            <p class="card__text">
              <span class="sr-only">{{ f.yes ? 'Sí es para ti:' : 'No es para ti:' }}</span>
              {{ f.text }}
            </p>
          </li>
        </ul>
      </div>
    </section>

    <!-- CIERRE -->
    <section class="closing" aria-labelledby="closing-title">
      <div class="wrap closing__inner">
        <p class="eyebrow eyebrow--light">{{ LANDING.closing.eyebrow }}</p>
        <h2 id="closing-title" class="closing__title">{{ LANDING.closing.title }}</h2>
        <p class="closing__sub">{{ LANDING.closing.sub }}</p>
        <button type="button" class="btn btn--lg" data-cta="registro" @click="openModal">
          <i class="fa-solid fa-play" aria-hidden="true"></i> {{ LANDING.closing.cta }}
        </button>
      </div>
    </section>

    <SiteFooter :disclaimer="LANDING.disclaimer" />

    <!-- CTA fijo en celular -->
    <Transition name="sticky">
      <div v-if="showSticky && !modalOpen" class="sticky" role="region" aria-label="Ver el video">
        <div class="sticky__copy">
          <strong>{{ LANDING.sticky.title }}</strong>
          <span>{{ LANDING.sticky.sub }}</span>
        </div>
        <button type="button" class="btn" data-cta="registro" @click="openModal">
          {{ LANDING.sticky.cta }} <i class="fa-solid fa-play" aria-hidden="true"></i>
        </button>
      </div>
    </Transition>

    <RegistrationModal :open="modalOpen" @close="modalOpen = false" />
  </div>
</template>

<style scoped lang="scss">
.accent {
  color: $primary;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid $line;
  background: rgba($surface, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 60px;
  }

  &__tag {
    @include eyebrow;
    color: $ink-muted;
    text-align: right;

    @media (max-width: 480px) {
      display: none;
    }
  }
}

.hero {
  padding: 40px 0 56px;

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__audience {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin: 0 0 20px;
    padding: 0;
    list-style: none;

    li {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid $line;
      border-radius: 999px;
      background: $raised;
      font-size: 0.8rem;

      i {
        color: $primary;
      }
    }
  }

  &__title {
    max-width: 820px;
    font-size: clamp(2rem, 7vw, 3.5rem);
    letter-spacing: -0.03em;
  }

  &__sub {
    max-width: 620px;
    margin: 16px 0 28px;
    color: $ink-muted;
    font-size: 1.05rem;
  }

  &__cta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 24px;
  }

  &__note {
    color: $ink-muted;
    font-size: 0.85rem;
  }
}

.vsl {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 760px;
  aspect-ratio: 16 / 9;
  padding: 0;
  border: 0;
  border-radius: $radius-lg;
  background: $surface-dark;
  color: $ink-on-dark;
  cursor: pointer;
  font: inherit;
  overflow: hidden;

  &__poster {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.85;
  }

  &__play {
    position: relative;
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    border-radius: 50%;
    background: $primary;
    color: $on-primary;
    font-size: 1.6rem;
    box-shadow: 0 0 0 10px rgba($primary, 0.2);
    transition: transform 0.2s ease;
  }

  &:hover &__play {
    transform: scale(1.06);
  }

  &__caption {
    position: absolute;
    left: 16px;
    bottom: 14px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: 0.8rem;
    color: $ink-on-dark-muted;

    strong {
      color: $ink-on-dark;
      font-size: 0.95rem;
    }
  }
}

.section {
  padding: 64px 0;

  &--alt {
    background: $raised;
    border-block: 1px solid $line;
  }

  &__title {
    max-width: 720px;
    margin: 8px 0 28px;
    font-size: clamp(1.6rem, 5vw, 2.25rem);
  }

  &__cta {
    margin-top: 28px;
  }
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  padding: 24px;
  border: 1px solid $line;
  border-radius: $radius-md;
  background: $raised;

  .section--alt & {
    background: $surface;
  }

  &__icon {
    color: $primary;
    font-size: 1.4rem;
  }

  &__num {
    font-family: $font-mono;
    color: $primary;
  }

  &__title {
    margin: 10px 0 6px;
    font-size: 1.15rem;
  }

  &__text {
    color: $ink-muted;
  }

  &--no &__icon {
    color: $ink-muted;
  }
}

.closing {
  padding: 72px 0;
  background: $surface-dark;
  color: $ink-on-dark;

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .eyebrow--light {
    color: $ink-on-dark-muted;
  }

  &__title {
    max-width: 680px;
    margin: 8px 0 12px;
    font-size: clamp(1.75rem, 5vw, 2.5rem);
  }

  &__sub {
    max-width: 560px;
    margin-bottom: 28px;
    color: $ink-on-dark-muted;
  }
}

.sticky {
  position: fixed;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  left: 12px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 10px 10px 16px;
  border: 1px solid $line;
  border-radius: $radius-md;
  background: $raised;
  box-shadow: $shadow-modal;

  &__copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: 0.8rem;
    color: $ink-muted;

    strong {
      overflow: hidden;
      color: $ink;
      font-size: 0.9rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .btn {
    flex: none;
  }

  @media (min-width: 900px) {
    right: auto;
    left: 50%;
    width: 560px;
    transform: translateX(-50%);
  }
}

.sticky-enter-active,
.sticky-leave-active {
  transition:
    opacity 0.2s ease,
    translate 0.2s ease;
}
.sticky-enter-from,
.sticky-leave-to {
  opacity: 0;
  translate: 0 12px;
}
</style>
