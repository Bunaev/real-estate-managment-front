export function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(price) + ' ₽'
}

export function formatArea(area) {
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(area) + ' м²'
}

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

export function metersToWalkMinutes(meters) {
    if (!meters) return ''
    const min = Math.round(meters / 83)
    if (min < 1) return 'рядом'
    return min + ' мин'
}

export function walkTimeText(meters) {
    const min = Number(metersToWalkMinutes(meters).replace(' мин', '')) || 0
    if (!meters) return ''
    if (min <= 0) return 'пешком 1 мин'
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

export function formatMoney(value) {
    return new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(Number(value) || 0) + ' ₽'
}