/* Утилиты форматирования. Здесь только то, что реально импортируется компонентами. */

const TYPE_LABELS = {
    STUDIO: 'Студия',
    ONE_ROOM: '1-к',
    TWO_ROOM_EURO: '2Е',
    TWO_ROOM: '2-к',
    THREE_ROOM_EURO: '3Е',
    THREE_ROOM: '3-к',
    FOUR_ROOM_EURO: '4Е',
}

export function apartmentTypeLabel(type) { return TYPE_LABELS[type] || type }
export const APARTMENT_TYPES = Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))

const STATUS_LABELS = { AVAILABLE: 'Свободна', RESERVED: 'Забронирована', SOLD: 'Продана' }
export function statusLabel(status) { return STATUS_LABELS[status] || status }
export const STATUSES = Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))

const BATHROOM_LABELS = { COMBINED: 'Совмещённый', SEPARATE: 'Раздельный' }
export function bathroomLabel(type) { return BATHROOM_LABELS[type] || type }

/** «пешком N мин» от расстояния в метрах (скорость 5 км/ч ≈ 83 м/мин). */
export function walkTimeText(meters) {
    if (!meters) return ''
    const min = Math.round(Number(meters) / 83)
    if (min < 1) return 'пешком 1 мин'
    return `пешком ${min} мин`
}

/**
 * Время в пути по трём видам транспорта.
 * Скорости: пешком ≈ 5 км/ч (83.3 м/мин), транспорт ≈ 20 км/ч (333.3 м/мин),
 * автомобиль ≈ 40 км/ч (666.7 м/мин). Возвращает минуты (округлённо).
 */
export function transportMinutes(meters) {
    const d = Number(meters) || 0
    const min = (speedMetersPerMin) => (d <= 0 ? 0 : Math.max(1, Math.round(d / speedMetersPerMin)))
    return {
        walk: min(5000 / 60),
        bus: min(20000 / 60),
        car: min(40000 / 60),
    }
}

export function formatMeters(meters) {
    const n = Number(meters) || 0
    return n >= 1000 ? (n / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' км' : n + ' м'
}

export function formatDate(iso) {
    if (!iso) return null
    const src = String(iso).length <= 10 ? String(iso) + 'T00:00:00' : String(iso)
    const d = new Date(src)
    if (Number.isNaN(d.getTime())) return String(iso)
    return d.toLocaleDateString('ru-RU')
}

/** Квартал из даты: 2027-01-01 → «1 кв. 2027». */
export function formatQuarter(iso) {
    if (!iso) return null
    const src = String(iso).length <= 10 ? String(iso) + 'T00:00:00' : String(iso)
    const d = new Date(src)
    if (Number.isNaN(d.getTime())) return null
    return `${Math.floor(d.getMonth() / 3) + 1} кв. ${d.getFullYear()}`
}

/* Названия связанных сущностей: карточка каталога отдаёт `*Name`,
   детальная страница — короткие `developer/location/district`.
   Помощники покрывают оба варианта, пока имена не унифицированы на бэке. */
export const complexDeveloper = (c) => c?.developerName ?? c?.developer ?? ''
export const complexLocation = (c) => c?.locationName ?? c?.location ?? ''
export const complexDistrict = (c) => c?.districtName ?? c?.district ?? ''
export const complexAddressLine = (c) =>
    [complexLocation(c), complexDistrict(c), c?.address].filter(Boolean).join(', ')

export function complexGradient(id) {
    const h1 = ((id * 47) % 360)
    const h2 = ((id * 83 + 60) % 360)
    return 'linear-gradient(135deg, hsl(' + h1 + ', 60%, 45%), hsl(' + h2 + ', 55%, 35%))'
}

export function firstLetter(name) {
    if (!name) return '?'
    return name.trim()[0].toUpperCase()
}

export function pluralize(n, forms) {
    const abs = Math.abs(Number(n) || 0)
    const n10 = abs % 10
    const n100 = abs % 100
    if (n10 === 1 && n100 !== 11) return forms[0]
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1]
    return forms[2]
}
