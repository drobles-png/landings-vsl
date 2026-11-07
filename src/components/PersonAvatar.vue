<script setup lang="ts">
// Foto de una persona (Cloudinary). Sin foto, o si la URL falla, muestra las iniciales.
import { computed, ref } from 'vue'

const props = defineProps<{ name: string; photo?: string; size?: number }>()

const failed = ref(false)
const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join(''),
)
</script>

<template>
  <span
    class="avatar"
    :style="{
      width: `${size ?? 56}px`,
      height: `${size ?? 56}px`,
      fontSize: `${Math.round((size ?? 56) * 0.36)}px`,
    }"
  >
    <img
      v-if="photo && !failed"
      :src="photo"
      :alt="name"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    />
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>

<style scoped lang="scss">
.avatar {
  display: inline-grid;
  flex: none;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: $primary-soft;
  color: $primary;
  font-weight: 600;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
