<!-- Развёрнутая карточка квартиры: планировка, характеристики, сроки, площади, заметки -->
<template>
  <div class="apartment-card group relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-white via-slate-50 to-indigo-50/60 text-slate-900 shadow-xl shadow-slate-900/[0.06] ring-1 ring-slate-200/70">
    <!-- soft background -->
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-indigo-200/25 blur-3xl transition-all duration-700 group-hover:scale-110" />
      <div class="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-fuchsia-200/20 blur-3xl transition-all duration-700 group-hover:scale-105" />
      <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300" />
    </div>

    <div class="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <!-- Планировка квартиры -->
      <button
        type="button"
        class="group/plan relative flex min-h-[15rem] items-center justify-center overflow-hidden bg-white/50 p-4 text-left backdrop-blur-sm lg:p-6"
        :title="planUrl ? 'Увеличить планировку' : 'Планировка недоступна'"
        @click="openImage(0)"
      >
        <span class="dot-grid pointer-events-none absolute inset-0 opacity-25 transition-opacity duration-700 group-hover/plan:opacity-15" />

        <img
          v-if="planUrl"
          :src="planUrl"
          :alt="'Планировка квартиры №' + a.number"
          class="relative max-h-[24rem] w-auto max-w-full rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 transition-all duration-700 ease-out group-hover/plan:scale-[1.04] group-hover/plan:-rotate-1"
          loading="lazy"
        />
        <div v-else class="relative flex flex-col items-center gap-2.5 text-center">
          <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-md ring-1 ring-slate-200 transition-transform duration-500 group-hover/plan:scale-105">
            <AppIcon name="image" :size="26" />
          </span>
          <div>
            <p class="text-sm font-bold text-slate-500">Планировка недоступна</p>
            <p class="mt-0.5 text-xs text-slate-400">Загрузите рендер из админ-панели</p>
          </div>
        </div>

        <span class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur">
          Планировка
        </span>
        <span
          v-if="planUrl"
          class="absolute right-3 top-3 flex h-8 items-center gap-1.5 rounded-lg bg-slate-950/70 px-2.5 text-[10px] font-bold text-white opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover/plan:opacity-100"
        >
          <AppIcon name="search" :size="12" /> увеличить
        </span>
      </button>

      <!-- Контент -->
      <div class="relative flex flex-col gap-4 p-4 sm:p-5">
        <!-- Заголовок -->
        <div class="flex flex-wrap items-start justify-between gap-2.5">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">Квартира</p>
            <h3 class="mt-0.5 text-2xl font-black leading-none tracking-tight text-slate-900">№{{ a.number }}</h3>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">{{ apartmentTypeLabel(a.type) }}</span>
            <span class="rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm" :class="statusChip(a.status)">{{ statusLabel(a.status) }}</span>
          </div>
        </div>

        <!-- Цена -->
        <div class="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-3.5 shadow-sm backdrop-blur">
          <div class="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-indigo-200/40 blur-2xl" />
          <div class="pointer-events-none absolute -bottom-8 right-12 h-20 w-20 rounded-full bg-fuchsia-200/30 blur-2xl" />
          <p class="relative text-[10px] font-bold uppercase tracking-widest text-slate-400">Стоимость</p>
          <div class="relative mt-0.5 flex flex-wrap items-end gap-x-3 gap-y-0.5">
            <p class="text-2xl font-black tracking-tight text-slate-900">{{ formatMoney(a.price) }}</p>
            <p v-if="pricePerM2" class="mb-0.5 text-sm font-semibold text-slate-400">{{ formatMoney(pricePerM2) }} / м²</p>
          </div>
        </div>

        <!-- Сроки -->
        <div v-if="quartersParts.length" :class="quartersParts.length === 1 ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-2 gap-2'">
          <div
            v-for="(q, i) in quartersParts"
            :key="i"
            class="rounded-xl border border-slate-200/70 bg-white/70 p-2.5 shadow-sm backdrop-blur transition-all duration-300 hover:border-indigo-200 hover:bg-white"
          >
            <div class="flex items-center gap-1.5 text-indigo-400">
              <span class="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100">
                <AppIcon name="calendar" :size="12" />
              </span>
              <span class="text-[9px] font-bold uppercase tracking-widest text-slate-400">{{ i === 0 ? 'Сдача' : 'Ключи' }}</span>
            </div>
            <p class="mt-1 text-sm font-extrabold leading-tight text-slate-700">{{ q }}</p>
          </div>
        </div>

        <!-- Характеристики -->
        <dl class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div
            v-for="(spec, i) in specs"
            :key="spec.label"
            class="spec-item rounded-xl border border-slate-200/60 bg-slate-50/80 px-2.5 py-2"
            :style="{ transitionDelay: (i * 25) + 'ms' }"
          >
            <dt class="text-[9px] font-bold uppercase tracking-wider text-slate-400">{{ spec.label }}</dt>
            <dd class="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <AppIcon v-if="spec.icon" :name="spec.icon" :size="12" :stroke="spec.color || '#94a3b8'" />
              <span class="truncate">{{ spec.value }}</span>
            </dd>
          </div>
        </dl>

        <!-- Заметки -->
        <div
          class="note-block rounded-xl border p-3 transition-all duration-300"
          :class="notes ? 'border-amber-200/80 bg-amber-50/70' : 'border-dashed border-slate-200 bg-slate-50/60'"
        >
          <div class="flex items-start gap-2.5">
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-300"
              :class="notes ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400 ring-1 ring-slate-200'"
            >
              <AppIcon name="edit" :size="14" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[9px] font-bold uppercase tracking-widest" :class="notes ? 'text-amber-500' : 'text-slate-400'">
                {{ notes ? 'Заметка' : 'Дополнительно' }}
              </p>
              <p v-if="notes" class="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{{ notes }}</p>
              <p v-else class="mt-0.5 text-sm italic leading-relaxed text-slate-400">Дополнительных сведений нет</p>
            </div>
          </div>
        </div>

        <!-- Площади -->
        <div class="rounded-xl border border-slate-200/60 bg-white/60 p-3 backdrop-blur">
          <p class="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Площади по помещениям</p>
          <ApartmentRooms :apartment="a" show-total />
        </div>

        <!-- План секции -->
        <button
          v-if="sectionUrl"
          type="button"
          class="group/section flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/70 p-2.5 text-left shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-md"
          title="Увеличить план секции"
          @click="openImage(1)"
        >
          <span class="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200 transition-transform duration-300 group-hover/section:scale-105">
            <img :src="sectionUrl" alt="План секции" class="h-full w-full object-contain" loading="lazy" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-slate-700">План секции</span>
            <span class="block truncate text-xs text-slate-400">{{ sectionLabel }}</span>
          </span>
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200 transition-all duration-300 group-hover/section:text-indigo-500">
            <AppIcon name="search" :size="13" />
          </span>
        </button>
        <div v-else class="flex items-center gap-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-2.5 text-slate-400">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200">
            <AppIcon name="image" :size="15" />
          </span>
          <span class="text-xs font-semibold">План секции не загружен</span>
        </div>

        <!-- Место под будущие кнопки -->
        <div v-if="$slots.actions" class="mt-auto flex flex-wrap gap-2 pt-0.5">
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
const notes = computed(() => (a.notes || '').trim())
const quartersParts = computed(() => (props.quarters || '').split(' / ').filter(Boolean))

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
  return list
})

const fmt = (v) => Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 1 })
const formatMoney = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(v) || 0) + ' ₽'
const bathroomLabel = (t) => ({ COMBINED: 'Совмещённый', SEPARATE: 'Раздельный' }[t] || '')
const typeChip = (t) =>
  ({ STUDIO: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60', ONE_ROOM: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60', TWO_ROOM: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60', THREE_ROOM: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200/60', FOUR_ROOM: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200/60' }[t] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200')
const statusChip = (s) =>
  ({ AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60', RESERVED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60', SOLD: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60' }[s] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200')
</script>

<style scoped>
.apartment-card {
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease, border-color 0.45s ease;
}
.apartment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 45px -18px rgba(15, 23, 42, 0.14), 0 8px 20px -10px rgba(79, 70, 229, 0.08);
}
.spec-item {
  transition: transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease, border-color 0.22s ease;
}
.spec-item:hover {
  transform: translateY(-1px);
  border-color: #c7d2fe;
  background: #fff;
  box-shadow: 0 6px 16px -8px rgba(15, 23, 42, 0.12);
}
.note-block {
  transition: transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
}
.note-block:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px -10px rgba(15, 23, 42, 0.12);
}
.dot-grid {
  background-image: radial-gradient(rgba(148, 163, 184, 0.28) 1px, transparent 1px);
  background-size: 18px 18px;
}
</style>