<!-- Универсальная SVG-иконка (feather-подобная) -->
<template>
  <svg :viewBox="iconData.viewBox" :width="size" :height="size" fill="none" :stroke="stroke" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <template v-for="(p, i) in iconData.paths" :key="i">
      <path v-if="!p.type || p.type === 'path'" :d="p.d || p.data" :fill="p.fill || 'none'" :stroke="p.stroke || stroke" :stroke-width="p.strokeWidth || strokeWidth" />
      <circle v-else-if="p.type === 'circle'" :cx="p.cx" :cy="p.cy" :r="p.r" :fill="p.fill || 'none'" :stroke="p.stroke || stroke" />
      <line v-else-if="p.type === 'line'" :x1="p.x1" :y1="p.y1" :x2="p.x2" :y2="p.y2" :stroke="p.stroke || stroke" :stroke-width="p.strokeWidth || strokeWidth" />
      <rect v-else-if="p.type === 'rect'" :x="p.x" :y="p.y" :width="p.width" :height="p.height" :rx="p.rx || 0" :ry="p.ry || 0" :fill="p.fill || 'none'" :stroke="p.stroke || stroke" />
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [String, Number], default: 22 },
  stroke: { type: String, default: 'currentColor' },
  strokeWidth: { type: Number, default: 2 },
})

const icons = {
  search: { viewBox: '0 0 24 24', paths: [{ d: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z' }, { d: 'm21 21-4.35-4.35' }] },
  home: { viewBox: '0 0 24 24', paths: [{ d: 'm3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2Z' }] },
  building: { viewBox: '0 0 24 24', paths: [{ d: 'M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16' }, { d: 'M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01' }] },
  location: { viewBox: '0 0 24 24', paths: [{ d: 'M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11Z' }, { d: 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' }] },
  metro: { viewBox: '0 0 24 24', paths: [{ d: 'M4 7a8 8 0 0 1 16 0v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7Z' }, { type: 'line', x1: '8', y1: '3', x2: '8', y2: '7' }, { type: 'line', x1: '16', y1: '3', x2: '16', y2: '7' }, { type: 'line', x1: '12', y1: '3', x2: '12', y2: '7' }, { d: 'M8 19l2-4M16 19l-2-4' }] },
  developer: { viewBox: '0 0 24 24', paths: [{ d: 'M3 21h18' }, { d: 'M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16' }, { d: 'M8 7h.01M16 7h.01M8 11h.01M16 11h.01' }] },
  apartment: { viewBox: '0 0 24 24', paths: [{ d: 'M3 21h18M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14' }, { d: 'M9 3v2M15 3v2M8 11h8M8 15h8M8 19h8' }] },
  entrance: { viewBox: '0 0 24 24', paths: [{ d: 'M5 12h14M12 5l-7 7 7 7' }] },
  door: { viewBox: '0 0 24 24', paths: [{ d: 'M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16' }, { d: 'M3 21h18' }, { d: 'M14.6 12.5h.01' }] },
  filter: { viewBox: '0 0 24 24', paths: [{ d: 'M3 5h18l-7 8v5l-4 2v-7L3 5Z' }] },
  'arrow-left': { viewBox: '0 0 24 24', paths: [{ d: 'M19 12H5M11 5l-7 7 7 7' }] },
  'arrow-right': { viewBox: '0 0 24 24', paths: [{ d: 'M5 12h14M13 5l7 7-7 7' }] },
  'arrow-up-right': { viewBox: '0 0 24 24', paths: [{ d: 'M7 17 17 7M9 7h8v8' }] },
  chevronDown: { viewBox: '0 0 24 24', paths: [{ d: 'm6 9 6 6 6-6' }] },
  check: { viewBox: '0 0 24 24', paths: [{ d: 'M5 13l4 4L19 7' }] },
  close: { viewBox: '0 0 24 24', paths: [{ d: 'M6 6l12 12M18 6 6 18' }] },
  menu: { viewBox: '0 0 24 24', paths: [{ type: 'line', x1: '4', y1: '7', x2: '20', y2: '7' }, { type: 'line', x1: '4', y1: '12', x2: '20', y2: '12' }, { type: 'line', x1: '4', y1: '17', x2: '20', y2: '17' }] },
  clock: { viewBox: '0 0 24 24', paths: [{ d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z' }, { d: 'M12 7v5l3 2' }] },
  grid: { viewBox: '0 0 24 24', paths: [{ d: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' }] },
  rows: { viewBox: '0 0 24 24', paths: [{ d: 'M4 5h16M4 12h16M4 19h16' }, { d: 'M8 5v0M8 12v0M8 19v0' }] },
  plus: { viewBox: '0 0 24 24', paths: [{ type: 'line', x1: '12', y1: '5', x2: '12', y2: '19' }, { type: 'line', x1: '5', y1: '12', x2: '19', y2: '12' }] },
  rotate: { viewBox: '0 0 24 24', paths: [{ d: 'M3 12a9 9 0 1 0 3-6.7' }, { d: 'M3 4v5h5' }] },
  alert: { viewBox: '0 0 24 24', paths: [{ d: 'M12 3 2 20h20L12 3Z' }, { d: 'M12 10v4M12 17.5v.5' }] },
  sparkles: { viewBox: '0 0 24 24', paths: [{ d: 'M12 3l1.5 5L18 9l-4.5 1.5L12 16l-1.5-5.5L6 9l5.5-1.5L12 3Z' }, { d: 'M18 17l-.6 2.4L15 20.5l2.4.6.6 2.5.6-2.5 2.4-.6-2.4-1.1-.6-2.4Z' }] },
  stats: { viewBox: '0 0 24 24', paths: [{ d: 'M4 20h16M6 16l3-3 3 3 5-5' }, { d: 'M18 9h-4v4' }] },
  floor: { viewBox: '0 0 24 24', paths: [{ d: 'M3 20h18M4 20V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v16' }, { d: 'M8 8h8M8 12h8M8 16h8' }] },
  rub: { viewBox: '0 0 24 24', paths: [{ d: 'M6 3h8a4 4 0 0 1 0 8H6' }, { d: 'M6 11h8a4 4 0 0 1 0 8H6' }, { d: 'M6 21V3' }] },
  area: { viewBox: '0 0 24 24', paths: [{ d: 'M3 3h18v18H3z' }, { d: 'M3 9h18M9 3v18' }] },
  balcony: { viewBox: '0 0 24 24', paths: [{ d: 'M5 21V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12' }, { d: 'M8 21v-4M16 21v-4M8 7V3M16 7V3' }] },
  edit: { viewBox: '0 0 24 24', paths: [{ d: 'M12 20h9' }, { d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' }] },
  trash: { viewBox: '0 0 24 24', paths: [{ d: 'M3 6h18' }, { d: 'M8 6V4h8v2' }, { d: 'M19 6l-1 14H6L5 6' }, { d: 'M10 11v6M14 11v6' }] },
  download: { viewBox: '0 0 24 24', paths: [{ d: 'M12 3v12' }, { d: 'm7 10 5 5 5-5' }, { d: 'M4 21h16' }] },
  upload: { viewBox: '0 0 24 24', paths: [{ d: 'M12 15V3' }, { d: 'm7 8 5-5 5 5' }, { d: 'M4 21h16' }] },
  calendar: { viewBox: '0 0 24 24', paths: [{ d: 'M8 2v4M16 2v4' }, { d: 'M3 5h18v16H3z' }, { d: 'M3 10h18' }] },
  settings: { viewBox: '0 0 24 24', paths: [{ type: 'circle', cx: '12', cy: '12', r: '3' }, { d: 'M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.9 19a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z' }] },
  map: { viewBox: '0 0 24 24', paths: [{ d: 'M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5Z' }, { d: 'M9 4v13.5M15 6.5V20' }] },
  image: { viewBox: '0 0 24 24', paths: [{ type: 'rect', x: '3', y: '4', width: '18', height: '16', rx: '2.5' }, { type: 'circle', cx: '8.5', cy: '9.5', r: '1.5' }, { d: 'M21 15.5 16.5 11l-6 6-3-3-4.5 4.5' }] },
  crosshair: { viewBox: '0 0 24 24', paths: [{ type: 'circle', cx: '12', cy: '12', r: '8' }, { d: 'M12 2v4M12 18v4M2 12h4M18 12h4' }, { type: 'circle', cx: '12', cy: '12', r: '1.6' }] },
  walk: { viewBox: '0 0 24 24', paths: [{ type: 'circle', cx: '12', cy: '4.5', r: '2' }, { d: 'M12 6.5V11' }, { d: 'M12 11l-3.6 3.4L10 18.5' }, { d: 'M12 11l4.2 2.8' }, { d: 'M12 14.2 11 17.6' }, { d: 'M8.4 13.2l3.4-2.2' }] },
  car: { viewBox: '0 0 24 24', paths: [{ d: 'M5.5 11.5 7.6 8a2 2 0 0 1 1.8-1h5.2a2 2 0 0 1 1.8 1l2.1 3.5' }, { d: 'M3.5 11.5h17v3.4a1.6 1.6 0 0 1-1.6 1.6h-1.2' }, { d: 'M3.5 16.5H5v-5' }, { type: 'circle', cx: '7.6', cy: '16.6', r: '1.6' }, { type: 'circle', cx: '16.4', cy: '16.6', r: '1.6' }] },
  bus: { viewBox: '0 0 24 24', paths: [{ d: 'M5 8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a1 1 0 0 1-1 1h-1.5' }, { d: 'M4 8h16M4 8v8a1 1 0 0 0 1 1h1' }, { d: 'M5 13h14' }, { d: 'M8.2 17.8a1.5 1.5 0 1 1-3 0M18.8 17.8a1.5 1.5 0 1 1-3 0' }, { d: 'M9 6h6' }] },
}

const iconData = computed(() => icons[props.name] || icons.home)
</script>
