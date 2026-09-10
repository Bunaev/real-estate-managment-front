<!-- Карточка ЖК: grid (вертикальная) и list (горизонтальная на sm+).
     Обложка-рендер подаётся как «вложенная» картинка: мягкая подложка-паспарту,
     тонкая рамка и лёгкая внутренняя тень. Если картинки нет — красивое градиентное место. -->
<template>
  <article
    role="link"
    tabindex="0"
    class="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl bg-white/90 shadow-lg shadow-slate-900/[0.06] ring-1 ring-slate-200/70 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-900/[0.12] hover:ring-indigo-200"
    :class="variant === 'list' ? 'sm:flex-row sm:items-stretch' : ''"
    @click="go"
    @keydown.enter.prevent="go"
  >
    <!-- ======= Cover frame (render или градиент-заглушка) ======= -->
    <div
      class="relative shrink-0 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-200/40 p-1.5 ring-1 ring-slate-200/60"
      :class="variant === 'list' ? 'flex w-full sm:w-72 sm:self-stretch' : 'w-full'"
    >
      <div
        class="relative w-full overflow-hidden rounded-[0.8rem] ring-1 ring-slate-900/5"
        :class="variant === 'list' ? 'h-40 flex-1 sm:h-auto' : 'h-40 sm:h-44'"
        :style="!coverOk ? { background: gradient } : undefined"
      >
        <!-- Fallback: градиент + буква, пока нет картинки -->
        <template v-if="!coverOk">
          <div class="dot-grid-light absolute inset-0 opacity-60" />
          <div class="absolute -bottom-7 -right-2 select-none text-[6.5rem] font-black leading-none text-white/15">
            {{ firstLetter(complex.name) }}
          </div>
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
        </template>

        <!-- Рендер ЖК: всегда в потоке (opacity), lazy-загрузка работает корректно -->
        <img
          :src="coverSrc"
          :alt="complex.name"
          loading="lazy"
          decoding="async"
          class="pointer-events-none absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-105"
          :class="coverOk ? 'opacity-100' : 'opacity-0'"
          @load="onImgLoad"
          @error="onImgError"
        />

        <!-- hover-блик -->
        <div class="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-full" />
        <!-- внутренняя тень: эффект «вложенности» -->
        <div class="pointer-events-none absolute inset-0 shadow-[inset_0_1px_10px_rgba(15,23,42,0.18),inset_0_0_24px_rgba(15,23,42,0.10)]" />

        <!-- бейдж -->
        <div class="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-slate-950/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
          Новостройка
        </div>
      </div>
    </div>

    <!-- ======= Body ======= -->
    <div class="flex min-w-0 flex-1 flex-col gap-3 p-5">
      <h3 class="line-clamp-1 text-lg font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-700">
        {{ complex.name }}
      </h3>

      <p class="flex items-start gap-2 text-sm text-slate-500">
        <AppIcon name="location" :size="15" stroke="#94a3b8" class="mt-0.5 shrink-0" />
        <span class="line-clamp-1">{{ addressLine }}</span>
      </p>
      <p class="flex items-center gap-2 text-sm text-slate-500">
        <AppIcon name="developer" :size="15" stroke="#94a3b8" class="shrink-0" />
        <span class="line-clamp-1">{{ complex.developer }}</span>
      </p>

      <!-- Метро: одна компактная строка на станцию (пешком/транспорт/машина) -->
      <div v-if="metroLine.length" class="space-y-1">
        <div
          v-for="m in metroLine"
          :key="m.stationName"
          class="flex items-center gap-1.5 rounded-lg bg-indigo-50/70 px-2 py-1"
          :title="m.stationName + ' — расстояние ' + formatMeters(m.distance)"
        >
          <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/80 ring-1 ring-indigo-100" :title="stationLineTitle(m.stationName)">
            <span class="h-2 w-2 rounded-full" :style="stationDotStyle(m.stationName)" />
          </span>
          <span class="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-700">{{ m.stationName }}</span>
          <MetroTimes :meters="m.distance" dense />
        </div>
        <span v-if="(complex.metroDistances || []).length > metroLine.length" class="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          +{{ (complex.metroDistances || []).length - metroLine.length }} станции
        </span>
      </div>

      <!-- Footer -->
      <div class="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <div class="flex items-center gap-3.5 text-xs font-semibold text-slate-500">
          <span class="inline-flex items-center gap-1.5"><AppIcon name="building" :size="14" stroke="#818cf8" />{{ countBuildings }}</span>
          <span class="inline-flex items-center gap-1.5"><AppIcon name="door" :size="14" stroke="#818cf8" />{{ countEntrance }}</span>
          <span class="hidden min-[420px]:inline-flex items-center gap-1.5"><AppIcon name="apartment" :size="14" stroke="#818cf8" />{{ countApartment }}</span>
        </div>
        <span class="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 transition-all duration-300 group-hover:gap-2.5">
          Подробнее
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-transform duration-300 group-hover:rotate-45">
            <AppIcon name="arrow-up-right" :size="15" :stroke-width="2.5" />
          </span>
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import MetroTimes from '@/components/MetroTimes.vue'
import { renderCoverUrl } from '@/api'
import { complexGradient, firstLetter, formatMeters } from '@/utils/format.js'
import { stationDotStyle, stationLineTitle } from '@/utils/metroLines.js'

const props = defineProps({
  complex: { type: Object, required: true },
  variant: { type: String, default: 'grid' }, // 'grid' | 'list'
})

const router = useRouter()
const coverOk = ref(false)
const attempts = ref(0)
let retryTimer = null

watch(
  () => props.complex?.id,
  () => {
    clearTimeout(retryTimer)
    attempts.value = 0
    coverOk.value = false
  }
)

const onImgLoad = () => {
  clearTimeout(retryTimer)
  attempts.value = 0
  coverOk.value = true
}

const onImgError = () => {
  if (attempts.value >= 3) return // оставляем градиент-заглушку
  clearTimeout(retryTimer)
  retryTimer = setTimeout(() => {
    attempts.value++ // смена src (cache-busting) → повторная попытка
  }, 400)
}

const gradient = computed(() => complexGradient(props.complex?.id || 1))
const coverSrc = computed(() => {
  const u = renderCoverUrl(props.complex?.id)
  return attempts.value ? `${u}${u.includes('?') ? '&' : '?'}attempt=${attempts.value}` : u
})
const metroLine = computed(() => (props.complex?.metroDistances || []).slice(0, 3))
const countBuildings = computed(() => props.complex?.countBuildings || 0)
const countEntrance = computed(() => props.complex?.countEntrance || 0)
const countApartment = computed(() => props.complex?.countApartment || 0)
const addressLine = computed(() =>
  [props.complex?.location, props.complex?.district, props.complex?.address].filter(Boolean).join(', ')
)

const go = () => {
  router.push({
    name: 'complex-detail',
    params: { id: props.complex.id },
    state: { summary: props.complex },
  })
}

onBeforeUnmount(() => clearTimeout(retryTimer))
</script>
