<!-- Публичный список квартир ЖК: фильтры → FilterDTO на бэкенд -->
<template>
  <div class="space-y-5">
    <!-- Filters card -->
    <section class="rounded-3xl bg-white/85 p-5 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-900">
          <AppIcon name="apartment" :size="18" stroke="#6366f1" />
          Фильтр квартир
        </h3>
        <div class="flex items-center gap-2">
          <span v-if="activeCount" class="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600">активных: {{ activeCount }}</span>
          <button class="btn btn-ghost !px-3 !py-1.5 !text-xs" @click="resetFilters">
            <AppIcon name="rotate" :size="13" /> Сбросить
          </button>
        </div>
      </div>

      <!-- Row 1: корпус / секция / сортировка -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label class="label">Корпус</label>
          <select v-model="filters.buildingId" class="field" :disabled="!buildings.length" @change="filters.entranceId = null">
            <option :value="null">Все корпуса</option>
            <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Секция</label>
          <select v-model="filters.entranceId" class="field" :disabled="!availableEntrances.length">
            <option :value="null">Все секции</option>
            <option v-for="e in availableEntrances" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Сортировка</label>
          <div class="flex gap-2">
            <select v-model="sortField" class="field flex-1">
              <option value="price">По цене</option>
              <option value="area">По площади</option>
              <option value="floor">По этажу</option>
              <option value="number">По номеру</option>
              <option value="status">По статусу</option>
            </select>
            <button
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
              :aria-label="sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'"
              :title="sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'"
              @click="toggleDir"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" :class="sortDir === 'desc' ? 'rotate-180' : ''">
                <path d="M12 5v14M6 13l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Row 2: чипы-фильтры -->
      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label class="label">Тип квартиры</label>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="t in APARTMENT_TYPES" :key="t.value" class="chip" :class="filters.types.includes(t.value) ? 'chip-on' : ''" @click="toggleType(t.value)">
              {{ t.label }}
            </button>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="label">Статус</label>
            <div class="flex flex-wrap gap-1.5">
              <button class="chip" :class="filters.status == null ? 'chip-on' : ''" @click="filters.status = null">Любой</button>
              <button v-for="s in STATUSES" :key="s.value" class="chip" :class="filters.status === s.value ? 'chip-on' : ''" @click="toggleStatus(s.value)">{{ s.label }}</button>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label class="label">Санузел</label>
              <div class="flex flex-wrap gap-1.5">
                <button class="chip" :class="filters.bathroomType == null ? 'chip-on' : ''" @click="filters.bathroomType = null">Любой</button>
                <button v-for="b in BATHROOMS" :key="b.value" class="chip" :class="filters.bathroomType === b.value ? 'chip-on' : ''" @click="filters.bathroomType = b.value">{{ b.label }}</button>
              </div>
            </div>
            <div>
              <label class="label">Балкон</label>
              <div class="flex flex-wrap gap-1.5">
                <button class="chip" :class="filters.hasBalcony == null ? 'chip-on' : ''" @click="filters.hasBalcony = null">Любой</button>
                <button class="chip" :class="filters.hasBalcony === true ? 'chip-on' : ''" @click="filters.hasBalcony = true">Есть</button>
                <button class="chip" :class="filters.hasBalcony === false ? 'chip-on' : ''" @click="filters.hasBalcony = false">Нет</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Row 3: диапазоны -->
      <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RangeField label="Этаж" :from="filters.floorFrom" :to="filters.floorTo" from-ph="от" to-ph="до" @from="filters.floorFrom = $event" @to="filters.floorTo = $event" />
        <RangeField label="Площадь, м²" :from="filters.areaFrom" :to="filters.areaTo" from-ph="от" to-ph="до" @from="filters.areaFrom = $event" @to="filters.areaTo = $event" />
        <RangeField label="Цена, ₽" :from="filters.priceFrom" :to="filters.priceTo" from-ph="от" to-ph="до" @from="filters.priceFrom = $event" @to="filters.priceTo = $event" />
      </div>

      <!-- Apply -->
      <div class="mt-5 flex justify-end border-t border-slate-100 pt-4">
        <button class="btn btn-primary" :disabled="loading" @click="apply">
          <span v-if="loading" class="loading-dot" />
          <AppIcon v-else name="search" :size="15" />
          Показать квартиры
        </button>
      </div>
    </section>

    <!-- Count line -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-slate-500">
        Показано <b class="text-slate-800">{{ apartments.length }}</b> из <b class="tabular-nums text-slate-800">{{ total }}</b> квартир
        <span v-if="loading" class="ml-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500"><span class="live-dot" /> загружаем…</span>
      </p>
      <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
        На странице
        <select v-model.number="pageSize" class="field !w-auto !py-2">
          <option v-for="s in [20, 50, 100]" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>

    <!-- States -->
    <div v-if="error" class="rounded-2xl bg-rose-50 px-5 py-8 text-center text-sm font-semibold text-rose-600">
      {{ error }}
      <button class="btn btn-ghost mx-auto mt-3 block" @click="apply">Повторить</button>
    </div>
    <div v-else-if="!apartments.length && !loading" class="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-5 py-12 text-center">
      <p class="text-sm font-medium text-slate-400">Квартиры не найдены — попробуйте смягчить фильтры</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-hidden rounded-3xl bg-white/90 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/60 backdrop-blur">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th class="px-4 py-3">№</th>
              <th class="px-3 py-3">Корпус · секция</th>
              <th class="px-3 py-3">Тип</th>
              <th class="px-3 py-3 text-center">Этаж</th>
              <th class="px-3 py-3 text-center">Площадь</th>
              <th class="px-3 py-3 text-right">Цена</th>
              <th class="px-3 py-3 text-center">Балкон</th>
              <th class="px-4 py-3 text-center">Статус</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="a in apartments" :key="a.id" :class="rowClass(a.status)">
              <td class="px-4 py-3 text-base font-black text-slate-400">№{{ a.number }}</td>
              <td class="px-3 py-3 text-xs text-slate-500">
                <span class="font-semibold text-slate-700">{{ a.entrance?.building?.name || '' }}</span>
                <span v-if="a.entrance"> · {{ a.entrance.name }}</span>
              </td>
              <td class="px-3 py-3">
                <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="typeChip(a.type)">{{ apartmentTypeLabel(a.type) }}</span>
              </td>
              <td class="px-3 py-3 text-center tabular-nums">{{ a.floor }}</td>
              <td class="px-3 py-3 text-center tabular-nums">{{ formatArea(a.area) }}</td>
              <td class="px-3 py-3 text-right font-bold tabular-nums text-slate-900">{{ formatMoney(a.price) }}</td>
              <td class="px-3 py-3 text-center text-xs">
                <span v-if="a.hasBalcony" class="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 13l4 4L19 7" /></svg>есть
                </span>
                <span v-else class="font-semibold text-slate-300">—</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="statusChip(a.status)">{{ statusLabel(a.status) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6">
      <PaginationBar :current-page="page" :total-pages="totalPages" @page-change="changePage" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import RangeField from '@/components/RangeField.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import { apartmentApi } from '@/api'
import { APARTMENT_TYPES, STATUSES, apartmentTypeLabel, statusLabel } from '@/utils/format.js'

const props = defineProps({
  complexId: { type: [String, Number], required: true },
  buildings: { type: Array, default: () => [] },
})

const BATHROOMS = [
  { value: 'COMBINED', label: 'Совмещённый' },
  { value: 'SEPARATE', label: 'Раздельный' },
]

const filters = reactive({
  buildingId: null,
  entranceId: null,
  types: [],
  status: null,
  bathroomType: null,
  hasBalcony: null,
  floorFrom: null,
  floorTo: null,
  areaFrom: null,
  areaTo: null,
  priceFrom: null,
  priceTo: null,
})
const sortField = ref('price')
const sortDir = ref('asc')
const page = ref(0)
const pageSize = ref(20)

const apartments = ref([])
const total = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')

const availableEntrances = computed(() => {
  const b = props.buildings.find((x) => x.id === filters.buildingId)
  return b?.entrances || []
})

const activeCount = computed(() => {
  const f = filters
  return [
    f.buildingId != null,
    f.entranceId != null,
    f.types.length > 0,
    f.status != null,
    f.bathroomType != null,
    f.hasBalcony != null,
    f.floorFrom != null,
    f.floorTo != null,
    f.areaFrom != null,
    f.areaTo != null,
    f.priceFrom != null,
    f.priceTo != null,
  ].filter(Boolean).length
})

const toggleType = (v) => {
  const i = filters.types.indexOf(v)
  if (i >= 0) filters.types.splice(i, 1)
  else filters.types.push(v)
}
const toggleStatus = (v) => {
  filters.status = filters.status === v ? null : v
}
const toggleDir = () => {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  load()
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const params = { residentialComplexId: props.complexId }
    if (filters.buildingId) params.buildingId = filters.buildingId
    if (filters.entranceId) params.entranceId = filters.entranceId
    if (filters.status) params.status = filters.status
    if (filters.bathroomType) params.bathroomType = filters.bathroomType
    if (filters.hasBalcony != null) params.hasBalcony = filters.hasBalcony
    if (filters.types.length) params.types = filters.types
    ;['floor', 'area', 'price'].forEach((k) => {
      if (filters[k + 'From'] != null) params[k + 'From'] = filters[k + 'From']
      if (filters[k + 'To'] != null) params[k + 'To'] = filters[k + 'To']
    })
    params.sort = sortField.value + ',' + sortDir.value

    const res = await apartmentApi.filter(params, page.value, pageSize.value)
    const data = res.data
    apartments.value = data.content || []
    total.value = data.totalElements || 0
    totalPages.value = Math.max(1, data.totalPages || 1)
    page.value = data.number || 0
  } catch (e) {
    error.value = e.message
    apartments.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

const apply = () => {
  page.value = 0
  load()
}
const resetFilters = () => {
  Object.assign(filters, {
    buildingId: null,
    entranceId: null,
    types: [],
    status: null,
    bathroomType: null,
    hasBalcony: null,
    floorFrom: null,
    floorTo: null,
    areaFrom: null,
    areaTo: null,
    priceFrom: null,
    priceTo: null,
  })
  apply()
}
const changePage = (p) => {
  page.value = p
  load()
}

/* Открытие страницы ЖК — сразу показываем все квартиры комплекса (фильтры пустые) */
onMounted(load)

watch(pageSize, () => {
  page.value = 0
  load()
})

const formatMoney = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(v) || 0) + ' ₽'
const formatArea = (v) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(v) || 0) + ' м²'
const typeChip = (t) =>
  ({ STUDIO: 'bg-sky-50 text-sky-700', ONE_ROOM: 'bg-indigo-50 text-indigo-700', TWO_ROOM: 'bg-violet-50 text-violet-700', THREE_ROOM: 'bg-fuchsia-50 text-fuchsia-700', FOUR_ROOM: 'bg-pink-50 text-pink-700' }[t] || 'bg-slate-100 text-slate-600')
const statusChip = (s) =>
  ({ AVAILABLE: 'bg-emerald-50 text-emerald-700', RESERVED: 'bg-amber-50 text-amber-700', SOLD: 'bg-rose-50 text-rose-700' }[s] || 'bg-slate-100 text-slate-600')

/* Подсветка строк по статусу: свободные — обычные, забронированные — светло-серые,
   проданные — тёмно-серые. Текст остаётся тёмным и читаемым на любом фоне. */
const rowClass = (s) => {
  if (s === 'RESERVED') return 'bg-slate-100 transition-colors hover:bg-slate-200'
  if (s === 'SOLD') return 'bg-slate-300 transition-colors hover:bg-slate-400/60'
  return 'transition-colors hover:bg-indigo-50/50'
}
</script>

<style scoped>
.label {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}
.chip:hover {
  border-color: #c7d2fe;
  color: #4338ca;
  transform: translateY(-1px);
}
.chip-on {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 6px 14px -6px rgba(79, 70, 229, 0.65);
}
.live-dot {
  width: 7px;
  height: 7px;
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
.loading-dot {
  width: 13px;
  height: 13px;
  border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
