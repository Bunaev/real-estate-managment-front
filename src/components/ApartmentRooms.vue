<!-- Состав площадей квартиры: кухня / комнаты / санузел / коридор.
     У студий отдельной кухни нет — кухня входит в комнату (единое пространство). -->
<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <!-- Студия -->
    <span
      v-if="isStudio"
      class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
      title="У студий кухня объединена с комнатой"
    >
      <AppIcon name="apartment" :size="12" :stroke-width="2.2" />
      Студия · {{ fmt(a.roomsArea) }} м²
      <span class="rounded-full bg-white/20 px-1.5 text-[10px] font-semibold">кухня внутри</span>
    </span>
    <template v-else>
      <span v-if="has(a.kitchenArea)" class="area-chip bg-amber-50 text-amber-700 ring-1 ring-amber-200/70" title="Кухня">
        <AppIcon name="kitchen" :size="12" :stroke-width="2" />
        Кухня {{ fmt(a.kitchenArea) }} м²
      </span>
      <span v-if="has(a.roomsArea)" class="area-chip bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/70" title="Суммарная площадь комнат">
        <AppIcon name="apartment" :size="12" :stroke-width="2" />
        Комнаты {{ fmt(a.roomsArea) }} м²
      </span>
    </template>

    <span v-if="has(a.bathroomArea)" class="area-chip bg-sky-50 text-sky-700 ring-1 ring-sky-200/70" title="Санузел">
      <AppIcon name="bath" :size="12" :stroke-width="2" />
      Санузел {{ fmt(a.bathroomArea) }} м²
    </span>
    <span v-if="has(a.hallwayArea)" class="area-chip bg-slate-100 text-slate-600 ring-1 ring-slate-200/80" title="Коридор / прихожая">
      <AppIcon name="door" :size="12" :stroke-width="2" />
      Коридор {{ fmt(a.hallwayArea) }} м²
    </span>

    <span v-if="showTotal && has(a.area)" class="area-chip bg-slate-900 text-white ring-1 ring-slate-900/10" title="Общая площадь">
      Итого {{ fmt(a.area) }} м²
    </span>
  </div>
</template>

<script setup>
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  apartment: { type: Object, required: true },
  showTotal: { type: Boolean, default: false },
})

const a = props.apartment
const isStudio = a?.type === 'STUDIO'
const has = (v) => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v))
const fmt = (v) => Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 1 })
</script>

<style scoped>
.area-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 9999px;
  padding: 0.2rem 0.55rem;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
}
</style>
