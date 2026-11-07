<script setup lang="ts">
// Equipo (LANDING.team en copy.ts). Sin items, no se muestra nada.
import PersonAvatar from '@/components/PersonAvatar.vue'
import { LANDING } from '@/content/copy'

const t = LANDING.team
</script>

<template>
  <section v-if="t.items.length" class="section section--alt" aria-labelledby="team-title">
    <div class="wrap">
      <p class="eyebrow">{{ t.eyebrow }}</p>
      <h2 id="team-title" class="section__title">{{ t.title }}</h2>
      <ul class="team" role="list">
        <li v-for="m in t.items" :key="m.name" class="member">
          <PersonAvatar :name="m.name" :photo="m.photo" :size="88" />
          <h3 class="member__name">{{ m.name }}</h3>
          <p class="member__role">{{ m.role }}</p>
          <p v-if="m.bio" class="member__bio">{{ m.bio }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped lang="scss">
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
}

.team {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.member {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border: 1px solid $line;
  border-radius: $radius-md;
  background: $surface;
  text-align: center;

  &__name {
    margin: 14px 0 2px;
    font-size: 1.1rem;
  }

  &__role {
    color: $primary;
    font-size: 0.85rem;
    font-weight: 600;
  }

  &__bio {
    margin-top: 10px;
    color: $ink-muted;
    font-size: 0.9rem;
  }
}
</style>
