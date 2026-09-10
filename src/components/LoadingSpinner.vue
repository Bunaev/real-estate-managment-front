<!-- Современный лоадер с пульсирующими точками -->
<template>
  <div class="flex flex-col items-center justify-center gap-4 py-14">
    <div class="flex items-center gap-2 rounded-full bg-white/80 px-5 py-3.5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/70 backdrop-blur">
      <span class="loader-dot" />
      <span class="loader-dot" style="animation-delay: 0.15s" />
      <span class="loader-dot" style="animation-delay: 0.3s" />
    </div>
    <p class="text-sm font-medium text-slate-400">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: 'Загрузка…' },
})
</script>

<style scoped>
.loader-dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  animation: bounce 1s ease-in-out infinite;
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-6px);
    opacity: 1;
  }
}
</style>
