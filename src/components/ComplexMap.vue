<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Map as MlMap, Marker, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Пропсы: координаты ЖК
const props = defineProps({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    default: ''
  }
})

const mapContainer = ref(null)
let map = null
let marker = null

const initMap = () => {
  if (!mapContainer.value) return

  // Создаем карту
  map = new MlMap({
    container: mapContainer.value,
    style: 'https://tiles.openfreemap.org/styles/liberty', // Бесплатный стиль OpenFreeMap
    center: [props.longitude, props.latitude], // ВАЖНО: сначала долгота, потом широта!
    zoom: 14,
    attributionControl: false // Можно отключить, но лучше оставить для соответствия лицензии
  })

  // Добавляем контролы (зум, компас)
  map.addControl(new NavigationControl(), 'top-right')

  // Добавляем маркер после загрузки карты
  map.on('load', () => {
    // Создаем кастомный маркер с HTML
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.innerHTML = `
      <div style="
        background: #0f3460;
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        cursor: pointer;
      ">
        🏢 ${props.name}
      </div>
    `

    // Создаем маркер
    marker = new Marker({ element: el })
        .setLngLat([props.longitude, props.latitude])
        .addTo(map)
  })
}

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})

// Если координаты изменятся (например, при переключении между ЖК)
watch(() => [props.latitude, props.longitude], ([newLat, newLng]) => {
  if (map && marker) {
    map.flyTo({ center: [newLng, newLat], zoom: 14 })
    marker.setLngLat([newLng, newLat])
  }
})
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.map-container {
  width: 100%;
  height: 100%;
}
</style>