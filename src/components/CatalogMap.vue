<!-- Каталог на карте: маркеры ЖК, список, карточка объекта по клику -->
<template>
  <section class="overflow-hidden rounded-3xl bg-white/85 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/70 backdrop-blur">
    <!-- Top bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div class="flex items-center gap-2">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <AppIcon name="map" :size="17" />
        </span>
        <div>
          <p class="text-sm font-extrabold tracking-tight text-slate-900">Карта жилых комплексов</p>
          <p class="text-xs text-slate-500">
            На карте: <b class="text-slate-700">{{ points.length }}</b>
            <template v-if="withoutCoords"> · без координат: {{ withoutCoords }}</template>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-ghost !px-3.5 !py-2 !text-xs" :disabled="!points.length" @click="fitAll">
          <AppIcon name="grid" :size="14" /> Показать все
        </button>
        <button class="btn btn-ghost !px-3 !py-2" title="Приблизить" @click="zoomBy(1)">
          <AppIcon name="plus" :size="15" />
        </button>
        <button class="btn btn-ghost !px-3 !py-2" title="Отдалить" @click="zoomBy(-1)">
          <span class="text-base font-black leading-none">−</span>
        </button>
      </div>
    </div>

    <!-- Активные фильтры (те же, что в сетке/списке) -->
    <div v-if="chips.length" class="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-5 py-3">
      <span class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Фильтры:</span>
      <button
        v-for="chip in chips"
        :key="chip.key"
        class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100"
        title="Убрать фильтр"
        @click="removeChip(chip)"
      >
        {{ chip.label }}
        <AppIcon name="close" :size="11" stroke="#6366f1" />
      </button>
      <button class="ml-1 text-[11px] font-bold text-rose-500 transition hover:text-rose-600" @click="resetFilters">Сбросить всё</button>
    </div>

    <!-- Map -->
    <div class="relative">
      <div ref="mapEl" class="h-[26rem] w-full sm:h-[32rem] lg:h-[38rem]" />

      <!-- Loading -->
      <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <div class="flex items-center gap-2 rounded-full bg-white px-5 py-3 shadow-lg ring-1 ring-slate-200/70">
          <span class="live-dot" />
          <span class="text-sm font-semibold text-slate-500">Загружаем объекты на карту…</span>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 px-6 text-center backdrop-blur-sm">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><AppIcon name="alert" :size="22" /></span>
        <p class="text-sm font-semibold text-slate-600">{{ error }}</p>
        <button class="btn btn-primary !py-2 !text-xs" @click="load">Повторить</button>
      </div>

      <!-- No coordinates -->
      <div v-else-if="!points.length" class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 px-6 text-center backdrop-blur-sm">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><AppIcon name="location" :size="22" /></span>
        <p class="max-w-sm text-sm font-semibold text-slate-600">У найденных ЖК пока не заданы координаты — карта появится, когда в мастере ЖК вы укажете точку.</p>
      </div>

      <!-- Tile error banner -->
      <p v-if="tilesError" class="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200">
        Тайлы карты не загрузились (нет доступа к сети) — метки всё равно доступны
      </p>

      <!-- Sidebar list -->
      <aside
        v-if="points.length"
        class="absolute left-4 top-4 z-10 hidden max-h-[78%] w-72 flex-col overflow-hidden rounded-2xl bg-white/92 shadow-xl ring-1 ring-slate-200/70 backdrop-blur lg:flex"
      >
        <div class="border-b border-slate-100 px-3.5 py-3">
          <div class="relative">
            <AppIcon name="search" :size="14" stroke="#94a3b8" class="absolute left-3 top-1/2 -translate-y-1/2" />
            <input v-model="query" type="text" class="field !rounded-full !py-2 !pl-9 !text-xs" placeholder="Поиск ЖК на карте…" />
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-1.5">
          <button
            v-for="c in filteredPoints"
            :key="c.id"
            class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-slate-50"
            :class="selected?.id === c.id ? 'bg-indigo-50' : ''"
            @click="select(c, true)"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-[11px] font-black text-white">
              {{ firstLetter(c.name) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-bold text-slate-800">{{ c.name }}</span>
              <span class="block truncate text-[11px] text-slate-400">{{ [c.district, c.developer].filter(Boolean).join(' · ') }}</span>
            </span>
          </button>
          <p v-if="!filteredPoints.length" class="px-3 py-4 text-center text-xs text-slate-400">Ничего не найдено</p>
        </div>
      </aside>

      <!-- Selected complex card -->
      <Transition name="cm-card">
        <div
          v-if="selected"
          class="absolute bottom-4 left-4 right-4 z-20 overflow-hidden rounded-3xl bg-white/95 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200/70 backdrop-blur sm:left-auto sm:w-[23rem]"
        >
          <!-- render -->
          <div class="relative h-36 w-full overflow-hidden bg-slate-100">
            <img
              v-if="renderVisible"
              :src="renderCoverUrl(selected.id)"
              :alt="selected.name"
              class="h-full w-full object-cover"
              @error="renderVisible = false"
            />
            <div v-else class="h-full w-full" :style="{ background: complexGradient(selected.id) }" />
            <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
            <button class="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950/45 text-white backdrop-blur transition hover:bg-slate-950/70" aria-label="Закрыть карточку" @click="selected = null">
              <AppIcon name="close" :size="14" />
            </button>
            <p class="absolute bottom-3 left-4 right-4 truncate text-base font-extrabold text-white drop-shadow">{{ selected.name }}</p>
          </div>

          <div class="space-y-3 p-4">
            <p class="flex items-start gap-2 text-xs text-slate-500">
              <AppIcon name="location" :size="14" stroke="#94a3b8" class="mt-0.5 shrink-0" />
              <span class="line-clamp-2">{{ addressLineOf(selected) }}</span>
            </p>
            <p class="flex items-center gap-2 text-xs text-slate-500">
              <AppIcon name="developer" :size="14" stroke="#94a3b8" class="shrink-0" />
              <span class="truncate">{{ selected.developer }}</span>
            </p>

            <div v-if="metroOf(selected).length" class="flex flex-wrap gap-1.5">
              <span v-for="m in metroOf(selected)" :key="m.stationName" class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                <span class="h-2 w-2 shrink-0 rounded-full" :style="stationDotStyle(m.stationName)" :title="stationLineTitle(m.stationName)" />
                {{ m.stationName }}
                <MetroTimes :meters="m.distance" dense />
              </span>
            </div>

            <div class="flex items-center gap-4 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
              <span class="inline-flex items-center gap-1.5"><AppIcon name="building" :size="14" stroke="#818cf8" />{{ selected.countBuildings || 0 }} корп.</span>
              <span class="inline-flex items-center gap-1.5"><AppIcon name="door" :size="14" stroke="#818cf8" />{{ selected.countEntrance || 0 }} секц.</span>
              <span class="inline-flex items-center gap-1.5"><AppIcon name="apartment" :size="14" stroke="#818cf8" />{{ selected.countApartment || 0 }} кв.</span>
            </div>

            <button class="btn btn-primary w-full !py-2.5" @click="openComplex(selected)">
              Открыть карточку ЖК
              <AppIcon name="arrow-up-right" :size="14" :stroke-width="2.6" />
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Map as MlMap, Marker, NavigationControl, LngLatBounds } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import AppIcon from '@/components/AppIcon.vue'
import MetroTimes from '@/components/MetroTimes.vue'
import { complexApi, renderCoverUrl } from '@/api'
import { complexGradient, firstLetter, apartmentTypeLabel, statusLabel, bathroomLabel } from '@/utils/format.js'
import { stationDotStyle, stationLineTitle } from '@/utils/metroLines.js'
import { rasterMapStyle, SPB_CENTER, SPB_ZOOM, prefersReducedMotion, escapeHtml } from '@/utils/mapStyle.js'

const props = defineProps({
  filters: { type: Object, default: () => ({}) },
  references: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['apply'])

const router = useRouter()
const mapEl = ref(null)
const points = ref([])
const withoutCoords = ref(0)
const loading = ref(true)
const error = ref('')
const tilesError = ref(false)
const selected = ref(null)
const renderVisible = ref(true)
const query = ref('')

let map = null
let markers = [] // { marker, el, id }
let resizeObserver = null

const filteredPoints = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return points.value
  return points.value.filter((c) => `${c.name} ${c.developer} ${c.district} ${c.address}`.toLowerCase().includes(q))
})

const addressLineOf = (c) => [c.location, c.district, c.address].filter(Boolean).join(', ')
const metroOf = (c) => (c.metroDistances || []).slice(0, 2)

/* ---------------- активные фильтры ---------------- */
const nameById = (list, id) => (list || []).find((x) => x.id === id)?.name
const namesByIds = (list, ids) => (ids || []).map((id) => nameById(list, id)).filter(Boolean)
const joinNames = (names) => (names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', '))

const chips = computed(() => {
  const f = props.filters || {}
  const refs = props.references || {}
  const out = []

  if (f.locationId != null) out.push({ key: 'locationId', label: 'Локация: ' + (nameById(refs.locations, f.locationId) || f.locationId) })
  if (f.districtId != null) out.push({ key: 'districtId', label: 'Район: ' + (nameById(refs.districts, f.districtId) || f.districtId) })

  const devs = namesByIds(refs.developers, f.developerIds)
  if (devs.length) out.push({ key: 'developerIds', label: 'Застройщик: ' + joinNames(devs) })

  const metro = namesByIds(refs.metroStations, f.metroStationIds)
  if (metro.length) out.push({ key: 'metroStationIds', label: 'Метро: ' + joinNames(metro) })

  if ((f.types || []).length) out.push({ key: 'types', label: 'Тип: ' + f.types.map(apartmentTypeLabel).join(', ') })
  if (f.status) out.push({ key: 'status', label: 'Статус: ' + statusLabel(f.status) })
  if (f.bathroomType) out.push({ key: 'bathroomType', label: 'Санузел: ' + bathroomLabel(f.bathroomType) })
  if (f.hasBalcony != null) out.push({ key: 'hasBalcony', label: 'Балкон: ' + (f.hasBalcony ? 'есть' : 'нет') })

  const range = (fromKey, toKey, title, suffix = '') => {
    if (f[fromKey] == null && f[toKey] == null) return
    out.push({ key: fromKey, label: `${title}: ${f[fromKey] ?? '…'}–${f[toKey] ?? '…'}${suffix}` })
  }
  range('floorFrom', 'floorTo', 'Этаж')
  range('areaFrom', 'areaTo', 'Площадь', ' м²')
  range('priceFrom', 'priceTo', 'Цена', ' ₽')

  return out
})

const clearField = (key) => {
  const f = props.filters
  f[key] = Array.isArray(f[key]) ? [] : null
}

const removeChip = (chip) => {
  if (chip.key === 'floorFrom' || chip.key === 'floorTo') {
    clearField('floorFrom')
    clearField('floorTo')
  } else if (chip.key === 'areaFrom' || chip.key === 'areaTo') {
    clearField('areaFrom')
    clearField('areaTo')
  } else if (chip.key === 'priceFrom' || chip.key === 'priceTo') {
    clearField('priceFrom')
    clearField('priceTo')
  } else {
    clearField(chip.key)
  }
  emit('apply')
}

const resetFilters = () => {
  Object.keys(props.filters || {}).forEach(clearField)
  emit('apply')
}

/* ---------------- data ---------------- */
const validCoords = (c) =>
  Number.isFinite(c?.latitude) &&
  Number.isFinite(c?.longitude) &&
  Math.abs(c.latitude) <= 90 &&
  Math.abs(c.longitude) <= 180 &&
  !(c.latitude === 0 && c.longitude === 0)

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await complexApi.getComplexes(props.filters || {}, 0, 200)
    const content = res.data.content || []
    const withCoords = content.filter(validCoords)
    withoutCoords.value = content.length - withCoords.length
    points.value = withCoords
    await nextTick()
    drawMarkers()
    map?.resize()
    fitAll()
  } catch (e) {
    error.value = e.message
    points.value = []
  } finally {
    loading.value = false
  }
}

/* ---------------- map ---------------- */
const initMap = () => {
  map = new MlMap({
    container: mapEl.value,
    style: rasterMapStyle(),
    center: SPB_CENTER,
    zoom: SPB_ZOOM,
    attributionControl: { compact: true },
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
  map.on('error', () => (tilesError.value = true))
  map.on('click', () => {
    // клик по фону — снимаем выделение
    selected.value = null
  })
}

const drawMarkers = () => {
  if (!map) return
  markers.forEach(({ marker }) => marker.remove())
  markers = []

  points.value.forEach((c, i) => {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'cm-marker'
    // Внутренняя обёртка: анимация/трансформация только на ней,
    // корневой элемент остаётся под управлением maplibre (position: absolute + transform)
    el.innerHTML = `<span class="cm-marker__inner" style="--i:${i}"><span class="cm-marker__dot"></span><span class="cm-marker__label">${escapeHtml(c.name)}</span></span>`
    el.addEventListener('click', (ev) => {
      ev.stopPropagation()
      select(c, true)
    })
    const marker = new Marker({ element: el, anchor: 'center' }).setLngLat([c.longitude, c.latitude]).addTo(map)
    // субпиксельное позиционирование: без «прыжка» метки в конце жеста
    marker.setSubpixelPositioning?.(true)
    markers.push({ marker, el, id: c.id })
  })
}

const syncActive = () => {
  markers.forEach(({ el, id }) => el.classList.toggle('is-active', selected.value?.id === id))
}

const select = (complex, fly) => {
  selected.value = complex
  renderVisible.value = true
  syncActive()
  if (fly && map) {
    map.flyTo({
      center: [complex.longitude, complex.latitude],
      zoom: Math.max(map.getZoom(), 14.5),
      duration: prefersReducedMotion() ? 0 : 1100,
      essential: true,
    })
  }
}

const fitAll = () => {
  if (!map || !points.value.length) return
  // Карта должна иметь реальные размеры, иначе fitBounds уводит камеру в «мировой» масштаб
  if (!mapEl.value?.clientHeight || !mapEl.value?.clientWidth) {
    requestAnimationFrame(() => fitAll())
    return
  }
  map.resize()
  if (points.value.length === 1) {
    const c = points.value[0]
    map.flyTo({ center: [c.longitude, c.latitude], zoom: 14, duration: prefersReducedMotion() ? 0 : 900 })
    return
  }
  const bounds = new LngLatBounds()
  points.value.forEach((c) => bounds.extend([c.longitude, c.latitude]))
  map.fitBounds(bounds, {
    padding: { top: 70, bottom: 90, left: window.innerWidth >= 1024 ? 320 : 60, right: 70 },
    maxZoom: 14,
    duration: prefersReducedMotion() ? 0 : 1100,
  })
}

const zoomBy = (dir) => {
  if (!map) return
  map.easeTo({ zoom: map.getZoom() + dir, duration: prefersReducedMotion() ? 0 : 260 })
}

const openComplex = (c) => {
  router.push({ name: 'complex-detail', params: { id: c.id }, state: { summary: c } })
}

onMounted(async () => {
  initMap()
  await nextTick()
  setTimeout(() => map?.resize(), 80)
  if (typeof ResizeObserver !== 'undefined' && mapEl.value) {
    resizeObserver = new ResizeObserver(() => map?.resize())
    resizeObserver.observe(mapEl.value)
  }
  load()
})

watch(
  () => props.filters,
  () => load(),
  { deep: true }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  markers.forEach(({ marker }) => marker.remove())
  markers = []
  map?.remove()
  map = null
})
</script>

<style scoped>
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #6366f1;
  animation: live-pulse 1.1s ease-in-out infinite;
}
@keyframes live-pulse {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

/* Маркеры ЖК.
   ВАЖНО №1: корневой .cm-marker позиционирует maplibre (position: absolute + inline transform),
   поэтому мы НЕ трогаем у него position/transform — только внутреннюю обёртку.
   ВАЖНО №2: подпись вынесена из потока (position: absolute), иначе она расширяет коробку
   элемента и точка «уезжает» от реальной координаты на полширины подписи. */
:deep(.cm-marker) {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
:deep(.cm-marker__inner) {
  position: relative;
  display: inline-flex;
  align-items: center;
  animation: cm-drop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i, 0) * 42ms);
}
@keyframes cm-drop {
  from {
    opacity: 0;
    transform: translateY(-14px) scale(0.7);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
:deep(.cm-marker__dot) {
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: 2.5px solid #fff;
  box-shadow: 0 6px 14px -4px rgba(79, 70, 229, 0.75);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
:deep(.cm-marker:hover .cm-marker__dot) {
  transform: scale(1.25);
}
:deep(.cm-marker.is-active .cm-marker__dot) {
  transform: scale(1.4);
  box-shadow: 0 0 0 7px rgba(99, 102, 241, 0.22), 0 8px 18px -4px rgba(79, 70, 229, 0.85);
}
:deep(.cm-marker__label) {
  position: absolute;
  left: calc(100% + 7px);
  top: 50%;
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 700;
  color: #1e293b;
  background: rgba(255, 255, 255, 0.94);
  padding: 3px 9px;
  border-radius: 9999px;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.14);
  opacity: 0;
  transform: translateY(-50%) translateX(-5px);
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}
:deep(.cm-marker:hover .cm-marker__label),
:deep(.cm-marker.is-active .cm-marker__label) {
  opacity: 1;
  transform: translateY(-50%);
}

/* Контролы maplibre под наш стиль */
:deep(.maplibregl-ctrl-group) {
  border-radius: 0.85rem;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
}
:deep(.maplibregl-ctrl-attrib) {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.76);
}
:deep(.maplibregl-canvas) {
  cursor: crosshair;
}

/* Карточка ЖК */
.cm-card-enter-active,
.cm-card-leave-active {
  transition: opacity 0.28s ease, transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.cm-card-enter-from,
.cm-card-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}
</style>
