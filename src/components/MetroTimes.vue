<!-- Три способа добраться: пешком / транспорт / машина -->
<template>
  <div class="flex flex-wrap items-center" :class="dense ? 'gap-1' : 'gap-1.5'">
    <span
      v-for="mode in modes"
      :key="mode.key"
      :class="dense ? 'inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-500' : 'inline-flex items-center gap-1 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200/70'"
      :title="mode.label + ': ~' + mode.speed + ' км/ч, ≈ ' + textFor(mode) + ' мин'"
    >
      <AppIcon :name="mode.icon" :size="dense ? 11 : 12" :stroke="mode.color" :stroke-width="2" />
      <b class="tabular-nums" :style="{ color: mode.color }">{{ textFor(mode) }}</b>
      <span v-if="!dense" class="hidden font-semibold normal-case text-slate-400 min-[380px]:inline">мин</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { transportMinutes } from '@/utils/format.js'

const props = defineProps({
  meters: { type: [Number, String], default: 0 },
  dense: { type: Boolean, default: false },
})

const times = computed(() => transportMinutes(props.meters))

const MODES = [
  { key: 'walk', icon: 'walk', label: 'Пешком', speed: '5', color: '#10b981' },
  { key: 'bus', icon: 'bus', label: 'Транспорт', speed: '20', color: '#f59e0b' },
  { key: 'car', icon: 'car', label: 'На машине', speed: '40', color: '#6366f1' },
]

const modes = computed(() => MODES.map((m) => ({ ...m, value: times.value[m.key] ?? 0 })))

const textFor = (mode) => (mode.value >= 1 ? String(mode.value) : '<1')
</script>
