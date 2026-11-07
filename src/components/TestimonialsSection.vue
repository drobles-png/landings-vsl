<script setup lang="ts">
// Testimonios reales (LANDING.testimonials en copy.ts). Sin items, no se muestra nada.
import PersonAvatar from '@/components/PersonAvatar.vue'
import { LANDING } from '@/content/copy'

const t = LANDING.testimonials
</script>

<template>
  <section v-if="t.items.length" class="section" aria-labelledby="testimonials-title">
    <div class="wrap">
      <p class="eyebrow">{{ t.eyebrow }}</p>
      <h2 id="testimonials-title" class="section__title">{{ t.title }}</h2>
      <ul class="quotes" role="list">
        <li v-for="item in t.items" :key="item.name" class="quote">
          <p v-if="item.result" class="quote__result">
            <i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> {{ item.result }}
          </p>
          <blockquote class="quote__text">“{{ item.quote }}”</blockquote>
          <footer class="quote__who">
            <PersonAvatar :name="item.name" :photo="item.photo" :size="44" />
            <span class="quote__meta">
              <strong>{{ item.name }}</strong>
              <span>{{ item.role }}</span>
            </span>
          </footer>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">
.section {
  padding: 64px 0;

  &__title {
    max-width: 720px;
    margin: 8px 0 28px;
    font-size: clamp(1.6rem, 5vw, 2.25rem);
  }
}

.quotes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.quote {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border: 1px solid $line;
  border-radius: $radius-md;
  background: $raised;

  &__result {
    align-self: flex-start;
    padding: 4px 10px;
    border-radius: 999px;
    background: $primary-soft;
    color: $primary;
    font-size: 0.85rem;
    font-weight: 600;
  }

  &__text {
    flex: 1;
    margin: 0;
    font-size: 1rem;
    line-height: 1.55;
  }

  &__who {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
    color: $ink-muted;
    font-size: 0.85rem;

    strong {
      color: $ink;
      font-size: 0.95rem;
    }
  }
}
</style>
