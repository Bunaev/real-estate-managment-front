<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-0 bottom-5 z-[120] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      <TransitionGroup name="toast">
        <div
          v-for="t in store.toasts"
          :key="t.id"
          class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-2xl shadow-slate-900/15 ring-1 backdrop-blur"
          :class="borderClass(t.type)"
          role="status"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" :class="iconBg(t.type)">
            <svg v-if="t.type === 'success'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            <svg v-else-if="t.type === 'error'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17.5v.5" /></svg>
            <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /><path d="M12 7v5l3 2" /></svg>
          </span>
          <p class="min-w-0 flex-1 text-sm font-medium text-slate-700">{{ t.message }}</p>
          <button class="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Скрыть" @click="store.dismiss(t.id)">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useUiStore } from '@/stores/uiStore'

const store = useUiStore()

const borderClass = (type) =>
  type === 'success' ? 'ring-emerald-200' : type === 'error' ? 'ring-rose-200' : 'ring-sky-200'
const iconBg = (type) =>
  type === 'success'
    ? 'bg-emerald-50 text-emerald-600'
    : type === 'error'
      ? 'bg-rose-50 text-rose-600'
      : 'bg-sky-50 text-sky-600'
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
