<!-- Пагинация каталога -->
<template>
  <div v-if="totalPages > 1" class="mt-10 flex flex-col items-center gap-3">
    <nav class="flex items-center gap-1.5" aria-label="Пагинация">
      <!-- Previous -->
      <button
        class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-35"
        :disabled="currentPage <= 0"
        :aria-label="'Предыдущая страница'"
        @click="emit('page-change', currentPage - 1)"
      >
        <AppIcon name="arrow-left" :size="17" />
      </button>

      <!-- Pages -->
      <template v-for="p in visiblePages" :key="p">
        <span v-if="p === '...'" class="px-1.5 text-sm font-semibold text-slate-400">…</span>
        <button
          v-else
          :aria-current="p === currentPage ? 'page' : undefined"
          class="min-w-10 rounded-xl px-1 py-0 text-sm font-semibold transition-all duration-200"
          :class="
            p === currentPage
              ? 'h-10 scale-105 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
              : 'h-10 border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-indigo-700'
          "
          @click="emit('page-change', p)"
        >
          {{ p + 1 }}
        </button>
      </template>

      <!-- Next -->
      <button
        class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 text-slate-500 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-35"
        :disabled="currentPage >= totalPages - 1"
        :aria-label="'Следующая страница'"
        @click="emit('page-change', currentPage + 1)"
      >
        <AppIcon name="arrow-right" :size="17" />
      </button>
    </nav>
    <p class="text-xs font-medium text-slate-400">Страница {{ currentPage + 1 }} из {{ totalPages }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})
const emit = defineEmits(['page-change'])

const visiblePages = computed(() => {
  const pages = []
  const total = props.totalPages
  const curr = props.currentPage
  if (total <= 7) {
    for (let i = 0; i < total; i++) pages.push(i)
    return pages
  }
  pages.push(0)
  let left = Math.max(1, curr - 2)
  let right = Math.min(total - 2, curr + 2)
  if (left > 2) pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 3) pages.push('...')
  if (total - 1 > right) pages.push(total - 1)
  return pages
})
</script>
