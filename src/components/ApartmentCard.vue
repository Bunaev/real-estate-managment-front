<!-- Развёрнутая карточка квартиры: планировка, план секции, характеристики, площади -->
<template>
  <div class="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/[0.07] ring-1 ring-slate-200/70">
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <!-- Планировка квартиры -->
      <button
        type="button"
        class="group relative flex min-h-[15rem] items-center justify-center bg-slate-50/80 p-4 lg:p-6"
        :title="'Увеличить планировку'"
        @click="openImage(0)"
      >
        <span class="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <img
          v-if="planUrl"
          :src="planUrl"
          :alt="'Планировка квартиры №' + a.number"
          class="relative max-h-[24rem] w-auto max-w-full rounded-2xl bg-white shadow-md ring-1 ring-slate-200 transition-transform duration-500 group-hover:scale-[1.015]"
          loading="lazy"
        />
        <span v-else class="relative text-sm font-semibold text-slate-400">Планировка недоступна</span>

        <span class="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 ring-1 ring-slate-200 backdrop-blur">
          Планировка квартиры
        </span>
        <span v-if="planUrl" class="absolute right-4 top-4 flex h-9 items-center gap-1.5 rounded-xl bg-slate-950/70 px-2.5 text-[11px] font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
          <AppIcon name="search" :size="13" /> увеличить
        </span>
      </button>

      <!-- Информация -->
      <div class="flex flex-col gap-4 p-5 lg:p-6">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-xl font-black tracking-tight text-slate-900">Квартира №{{ a.number }}</h3>
          <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="typeChip(a.type)">{{ apartmentTypeLabel(a.type) }}</span>
          <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="statusChip(a.status)">{{ statusLabel(a.status) }}</span>
        </div>

        <div class="flex flex-wrap items-end gap-x-4 gap-y-1">
          <p class="text-3xl font-black tracking-tight text-slate-900">{{ formatMoney(a.price) }}</p>
          <p v-if="pricePerM2" class="text-sm font-semibold text-slate-400">{{ formatMoney(pricePerM2) }} / м²</p>
        </div>

        <!-- Характеристики -->
        <dl class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <div v-for="spec in specs" :key="spec.label" class="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/60">
            <dt class="text-[10px] font-bold uppercase tracking-wider text-slate-400">{{ spec.label }}</dt>
            <dd class="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <AppIcon v-if="spec.icon" :name="spec.icon" :size="13" :stroke="spec.color || '#94a3b8'" />
              {{ spec.value }}
            </dd>
          </div>
        </dl>

        <!-- Состав площадей -->
        <div>
          <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Площади по помещениям</p>
          <ApartmentRooms :apartment="a" show-total />
        </div>

        <!-- План секции -->
        <button
          v-if="sectionUrl"
          type="button"
          class="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
          title="Увеличить план секции"
          @click="openImage(1)"
        >
          <span class="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <img :src="sectionUrl" alt="План секции" class="h-full w-full object-contain" loading="lazy" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-slate-800">План секции</span>
            <span class="block truncate text-xs text-slate-500">{{ sectionLabel }}</span>
          </span>
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200 transition group-hover:text-indigo-600">
            <AppIcon name="search" :size="14" />
          </span>
        </button>

        <!-- Место под будущие кнопки (бронь, звонок и т.п.) -->
        <div v-if="$slots.actions" class="mt-auto flex flex-wrap gap-2 pt-1">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <ImageLightbox :open="lightbox.open" :images="images" :start-index="lightbox.index" @close="lightbox.open = false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import ApartmentRooms from '@/components/ApartmentRooms.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import { publicFileUrl } from '@/api'
import { apartmentTypeLabel, statusLabel } from '@/utils/format.js'

const props = defineProps({
  apartment: { type: Object, required: true },
  quarters: { type: String, default: null },
  buildingName: { type: String, default: '' },
  entranceName: { type: String, default: '' },
})

const a = props.apartment
const planUrl = publicFileUrl(a.planKey)
const sectionUrl = publicFileUrl(a.entrancePlanKey)
const pricePerM2 = a.area ? Math.round(a.price / a.area) : null

const images = computed(() =>
  [
    planUrl && { url: planUrl, caption: `Планировка квартиры №${a.number}` },
    sectionUrl && { url: sectionUrl, caption: `План секции · ${sectionLabel.value}` },
  ].filter(Boolean)
)
const sectionLabel = computed(() => [props.buildingName, props.entranceName].filter(Boolean).join(' · ') || 'Секция')

const lightbox = ref({ open: false, index: 0 })
const openImage = (index) => {
  if (!images.value.length) return
  lightbox.value = { open: true, index: Math.min(index, images.value.length - 1) }
}

const specs = computed(() => {
  const list = [
    { label: 'Этаж', value: a.floor, icon: 'floor' },
    { label: 'Площадь', value: a.area ? `${fmt(a.area)} м²` : '—', icon: 'area' },
    { label: 'Корпус', value: props.buildingName || '—', icon: 'building' },
    { label: 'Секция', value: props.entranceName || '—', icon: 'door' },
    { label: 'Санузел', value: bathroomLabel(a.bathroomType) || '—', icon: 'bath' },
    { label: 'Балкон', value: a.hasBalcony ? 'есть' : 'нет', icon: 'balcony' },
  ]
  if (props.quarters) list.push({ label: 'Сдача / ключи', value: props.quarters, icon: 'calendar', color: '#6366f1' })
  return list
})

const fmt = (v) => Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 1 })
const formatMoney = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(v) || 0) + ' ₽'
const bathroomLabel = (t) => ({ COMBINED: 'Совмещённый', SEPARATE: 'Раздельный' }[t] || '')
const typeChip = (t) =>
  ({ STUDIO: 'bg-sky-50 text-sky-700', ONE_ROOM: 'bg-indigo-50 text-indigo-700', TWO_ROOM: 'bg-violet-50 text-violet-700', THREE_ROOM: 'bg-fuchsia-50 text-fuchsia-700', FOUR_ROOM: 'bg-pink-50 text-pink-700' }[t] || 'bg-slate-100 text-slate-600')
const statusChip = (s) =>
  ({ AVAILABLE: 'bg-emerald-50 text-emerald-700', RESERVED: 'bg-amber-50 text-amber-700', SOLD: 'bg-rose-50 text-rose-700' }[s] || 'bg-slate-100 text-slate-600')
</script>

<style scoped>
.dot-grid {
  background-image: radial-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px);
  background-size: 18px 18px;
}
</style>
