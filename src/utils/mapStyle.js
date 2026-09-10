/** Единый стиль карты для всего приложения (растровые тайлы OSM, слегка приглушённые
 *  под светлый дизайн — без API-ключей и внешних стилей). */

export const SPB_CENTER = [30.315, 59.9386]
export const SPB_ZOOM = 10.5

export function rasterMapStyle() {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap',
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
        paint: {
          'raster-saturation': -0.38,
          'raster-contrast': 0.06,
          'raster-brightness-max': 0.99,
          'raster-brightness-min': 0.04,
        },
      },
    ],
  }
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
