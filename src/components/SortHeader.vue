<!-- Заголовок таблицы с сортировкой: стрелки вверх/вниз по клику -->
<template>
  <th scope="col" :class="['px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400', alignClass]">
    <button
      type="button"
      class="group inline-flex items-center gap-1.5 transition hover:text-slate-700"
      :class="align === 'right' ? 'w-full justify-end' : align === 'center' ? 'w-full justify-center' : ''"
      :title="'Сортировать по: ' + label"
      @click="emit('sort', field)"
    >
      <span class="whitespace-nowrap">{{ label }}</span>
      <span class="flex flex-col leading-none">
        <svg viewBox="0 0 10 6" class="h-1.5 w-2.5" :class="upClass"><path d="M5 0l5 6H0z" fill="currentColor" /></svg>
        <svg viewBox="0 0 10 6" class="mt-[2px] h-1.5 w-2.5" :class="downClass"><path d="M5 6L0 0h10z" fill="currentColor" /></svg>
      </span>
    </button>
  </th>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  field: { type: String, required: true },
  sortField: { type: String, default: '' },
  sortDir: { type: String, default: 'asc' },
  align: { type: String, default: 'left' },
})
const emit = defineEmits(['sort'])

const active = computed(() => props.sortField === props.field)
const alignClass = computed(() => (props.align === 'right' ? 'text-right' : props.align === 'center' ? 'text-center' : 'text-left'))
const upClass = computed(() => (active.value && props.sortDir === 'asc' ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'))
const downClass = computed(() => (active.value && props.sortDir === 'desc' ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-400'))
</script>
