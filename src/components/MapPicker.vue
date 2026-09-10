<!-- Мини-карта для выбора координат ЖК: клик по карте или перетаскивание метки -->
<template>
  <div class="relative overflow-hidden rounded-2xl ring-1 ring-slate-200" :style="{ height }">
    <div ref="mapEl" class="h-full w-full" />

    <!-- Подсказка -->
    <div class="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-xl bg-white/90 px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
      <span class="flex items-center gap-1.5">
        <AppIcon name="crosshair" :size="13" stroke="#6366f1" />
        Кликните по карте, чтобы поставить метку (её можно перетащить)
      </span>
    </div>

    <!-- Координаты -->
    <div class="absolute right-3 top-3 rounded-xl bg-slate-950/75 px-3 py-2 text-[11px] font-bold tabular-nums text-white shadow-sm backdrop-blur">
      <template v-if="hasPoint">{{ latText }}, {{ lngText }}</template>
      <template v-else>точка не выбрана</template>
    </div>

    <!-- Кнопки -->
    <div class="absolute bottom-3 right-3 flex items-center gap-2">
      <button
        class="mp-btn"
        type="button"
        title="Вернуть карту к центру города"
        @click="flyHome"
      >
        <AppIcon name="location" :size="14" stroke="#475569" />
      </button>
      <button
        v-if="hasPoint"
        class="mp-btn"
        type="button"
        title="Убрать точку"
        @click="clearPoint"
      >
        <AppIcon name="close" :size="14" stroke="#e11d48" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Map as MlMap, Marker, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import AppIcon from '@/components/AppIcon.vue'
import { rasterMapStyle, SPB_CENTER, SPB_ZOOM, prefersReducedMotion } from '@/utils/mapStyle.js'

const props = defineProps({
  latitude: { type: [Number, String], default: null },
  longitude: { type: [Number, String], default: null },
  height: { type: String, default: '15rem' },
  zoom: { type: Number, default: 14 },
})
const emit = defineEmits(['change'])

const mapEl = ref(null)
let map = null
let marker = null
let markerEl = null
let internalUpdate = false

const toNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
const hasPoint = computed(() => toNum(props.latitude) !== null && toNum(props.longitude) !== null)
const latText = computed(() => Number(toNum(props.latitude)).toFixed(5))
const lngText = computed(() => Number(toNum(props.longitude)).toFixed(5))

const centerOf = () => (hasPoint.value ? [toNum(props.longitude), toNum(props.latitude)] : SPB_CENTER)

const buildPin = () => {
  const el = document.createElement('div')
  el.className = 'mp-pin'
  // Обёртка внутри: размеры и анимации только на ней, корень позиционирует maplibre
  el.innerHTML = '<span class="mp-pin__inner"><span class="mp-pin__pulse"></span><span class="mp-pin__dot"></span></span>'
  return el
}

const placeMarker = (lngLat, animate) => {
  if (!marker) {
    markerEl = buildPin()
    marker = new Marker({ element: markerEl, anchor: 'center', draggable: true })
      .setLngLat(lngLat)
      .addTo(map)
    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat()
      internalUpdate = true
      emit('change', { latitude: lat, longitude: lng })
    })
  } else {
    marker.setLngLat(lngLat)
  }
  if (animate && !prefersReducedMotion()) {
    map.flyTo({ center: lngLat, zoom: Math.max(map.getZoom(), 15), duration: 700, essential: true })
  }
}

const removeMarker = () => {
  if (marker) {
    marker.remove()
    marker = null
    markerEl = null
  }
}

const clearPoint = () => {
  removeMarker()
  internalUpdate = true
  emit('change', { latitude: null, longitude: null })
}

const flyHome = () => {
  map?.flyTo({ center: SPB_CENTER, zoom: SPB_ZOOM, duration: prefersReducedMotion() ? 0 : 900 })
}

onMounted(() => {
  map = new MlMap({
    container: mapEl.value,
    style: rasterMapStyle(),
    center: centerOf(),
    zoom: hasPoint.value ? props.zoom : SPB_ZOOM,
    attributionControl: { compact: true },
  })
  map.addControl(new NavigationControl({ showCompass: false }), 'bottom-left')

  map.on('click', (e) => {
    const { lng, lat } = e.lngLat
    placeMarker([lng, lat], false)
    internalUpdate = true
    emit('change', { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) })
  })

  if (hasPoint.value) placeMarker(centerOf(), false)

  // Карта часто монтируется в модалку — подстраиваем размер после отрисовки
  nextTick(() => setTimeout(() => map?.resize(), 60))
})

watch(
  () => [props.latitude, props.longitude],
  async () => {
    if (!map) return
    await nextTick()
    map.resize()
    const lat = toNum(props.latitude)
    const lng = toNum(props.longitude)
    if (lat === null || lng === null) {
      removeMarker()
      return
    }
    const current = marker ? marker.getLngLat() : null
    const same = current && Math.abs(current.lat - lat) < 1e-6 && Math.abs(current.lng - lng) < 1e-6
    if (same) return
    placeMarker([lng, lat], true)
    internalUpdate = false
  }
)

onBeforeUnmount(() => {
  removeMarker()
  map?.remove()
  map = null
})
</script>

<style scoped>
.mp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  width: 2.25rem;
  border-radius: 0.75rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgb(15 23 42 / 0.08);
  transition: all 0.2s;
  cursor: pointer;
}
.mp-btn:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

/* Корень метки позиционирует maplibre — position/transform не переопределяем */
:deep(.mp-pin) {
  cursor: grab;
}
:deep(.mp-pin__inner) {
  position: relative;
  display: block;
  width: 26px;
  height: 26px;
}
:deep(.mp-pin__dot) {
  position: absolute;
  inset: 3px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border: 3px solid #fff;
  box-shadow: 0 6px 16px -4px rgb(79 70 229 / 0.8);
}
:deep(.mp-pin__pulse) {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: rgba(99, 102, 241, 0.35);
  animation: mp-pulse 2.2s ease-out infinite;
}
@keyframes mp-pulse {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }
  100% {
    transform: scale(2.1);
    opacity: 0;
  }
}
:deep(.maplibregl-ctrl-attrib) {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.75);
}
:deep(.maplibregl-ctrl-bottom-left) {
  z-index: 2;
}
</style>
