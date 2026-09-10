<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="open" class="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" :aria-label="title">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px]" @click="emit('close')" />
        <div
          class="relative max-h-[92vh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/80"
          :class="sizeClass"
          @click.stop
        >
          <!-- header -->
          <div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
            <div>
              <h3 class="text-lg font-extrabold tracking-tight text-slate-900">{{ title }}</h3>
              <p v-if="subtitle" class="mt-0.5 text-sm text-slate-500">{{ subtitle }}</p>
            </div>
            <button class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Закрыть" @click="emit('close')">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <!-- body -->
          <div class="px-6 py-5">
            <slot />
          </div>

          <!-- footer -->
          <div v-if="$slots.footer" class="flex flex-col-reverse items-stretch gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  width: { type: String, default: 'md' }, // sm | md | lg | xl
})
const emit = defineEmits(['close'])

const sizeClass = computed(() => ({
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}[props.width] || 'sm:max-w-lg'))

const onKey = (e) => {
  if (e.key === 'Escape' && props.open) emit('close')
}
watch(() => props.open, (v) => {
  if (v) document.addEventListener('keydown', onKey)
  else document.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.22s ease;
}
.overlay-enter-active .relative,
.overlay-leave-active .relative {
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.overlay-enter-from .relative {
  transform: translateY(18px) scale(0.97);
  opacity: 0;
}
.overlay-leave-to .relative {
  transform: translateY(10px) scale(0.98);
  opacity: 0;
}
</style>
