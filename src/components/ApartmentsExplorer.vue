<!-- Публичный список квартир ЖК: фильтры → FilterDTO, сортировка по заголовкам,
     раскрывающаяся карточка квартиры с планировками -->
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

      <!-- Row 1: корпус / секция -->
      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
        <span class="ml-2 text-xs text-slate-400">сортировка: {{ sortLabel }}</span>
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
        <table class="w-full min-w-[1150px] text-left text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50/70">
              <SortHeader label="№" field="number" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <th scope="col" class="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Корпус · секция</th>
              <SortHeader label="Тип" field="type" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <SortHeader label="Этаж" field="floor" align="center" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <SortHeader label="Площадь" field="area" align="center" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <SortHeader label="Кухня" field="kitchenArea" align="center" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <SortHeader label="Комнаты" field="roomsArea" align="center" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <SortHeader label="Санузел, м²" field="bathroomArea" align="center" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <SortHeader label="Коридор" field="hallwayArea" align="center" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <SortHeader label="Цена" field="price" align="right" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <SortHeader label="Балкон" field="hasBalcony" align="center" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <SortHeader label="Статус" field="status" align="center" :sort-field="sortField" :sort-dir="sortDir" @sort="setSort" />
              <th scope="col" class="w-12 px-3 py-3 pr-5" />
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="a in apartments" :key="a.id">
              <tr
                class="cursor-pointer transition-colors"
                :class="[rowClass(a.status), expandedId === a.id ? 'bg-indigo-50/60' : '']"
                @click="toggleRow(a.id)"
              >
                <td class="px-4 py-3 text-base font-black text-slate-400">№{{ a.number }}</td>
                <td class="px-3 py-3 text-xs text-slate-500">
                  <span class="font-semibold text-slate-700">{{ a.entrance?.building?.name || '' }}</span>
                  <span v-if="a.entrance"> · {{ a.entrance.name }}</span>
                  <span v-if="quartersOf(a)" class="mt-0.5 block text-[10px] font-semibold text-slate-400" title="Срок сдачи корпуса / выдача ключей">
                    {{ quartersOf(a) }}
                  </span>
                </td>
                <td class="px-3 py-3">
                  <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="typeChip(a.type)">{{ apartmentTypeLabel(a.type) }}</span>
                </td>
                <td class="px-3 py-3 text-center tabular-nums">{{ a.floor }}</td>
                <td class="px-3 py-3 text-center tabular-nums">{{ fmtArea(a.area) }}</td>
                <td class="px-3 py-3 text-center">
                  <span v-if="a.kitchenArea" class="tabular-nums text-slate-600">{{ fmtArea(a.kitchenArea) }}</span>
                  <span v-else class="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600" title="У студии кухня объединена с комнатой">в комнате</span>
                </td>
                <td class="px-3 py-3 text-center tabular-nums text-slate-600">{{ fmtArea(a.roomsArea) }}</td>
                <td class="px-3 py-3 text-center tabular-nums text-slate-600">{{ fmtArea(a.bathroomArea) }}</td>
                <td class="px-3 py-3 text-center tabular-nums text-slate-600">{{ fmtArea(a.hallwayArea) }}</td>
                <td class="px-3 py-3 text-right font-bold tabular-nums text-slate-900">{{ formatMoney(a.price) }}</td>
                <td class="px-3 py-3 text-center text-xs">
                  <span v-if="a.hasBalcony" class="inline-flex items-center gap-1 font-semibold text-emerald-600">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 13l4 4L19 7" /></svg>есть
                  </span>
                  <span v-else class="font-semibold text-slate-300">—</span>
                </td>
                <td class="px-3 py-3 text-center">
                  <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="statusChip(a.status)">{{ statusLabel(a.status) }}</span>
                </td>
                <td class="px-3 py-3 pr-5 text-center">
                  <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200 transition" :class="expandedId === a.id ? 'rotate-180 text-indigo-600' : ''">
                    <AppIcon name="chevronDown" :size="14" />
                  </span>
                </td>
              </tr>

              <!-- Раскрывающаяся карточка квартиры -->
              <tr v-if="expandedId === a.id">
                <td colspan="13" class="bg-slate-50/70 p-0">
                  <div class="expander" :class="expandOpen ? 'open' : ''">
                    <div class="overflow-hidden">
                      <div class="px-3 pb-4 pt-3 sm:px-4">
                        <ApartmentCard
                          :apartment="a"
                          :quarters="quartersOf(a)"
                          :building-name="a.entrance?.building?.name || ''"
                          :entrance-name="a.entrance?.name || ''"
                        />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="totalPages > 1" class="mt-6">
      <PaginationBar :current-page="page" :total-pages="totalPages" @page-change="changePage" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import RangeField from '@/components/RangeField.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import SortHeader from '@/components/SortHeader.vue'
import ApartmentCard from '@/components/ApartmentCard.vue'
import { apartmentApi, manageApi } from '@/api'
import { APARTMENT_TYPES, STATUSES, apartmentTypeLabel, statusLabel, formatQuarter } from '@/utils/format.js'

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
const expandedId = ref(null)
const expandOpen = ref(false)

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

const SORT_LABELS = {
  number: 'номеру',
  type: 'типу',
  floor: 'этажу',
  area: 'площади',
  kitchenArea: 'площади кухни',
  roomsArea: 'площади комнат',
  bathroomArea: 'площади санузла',
  hallwayArea: 'площади коридора',
  price: 'цене',
  hasBalcony: 'балкону',
  status: 'статусу',
}
const sortLabel = computed(() => `${SORT_LABELS[sortField.value] || sortField.value} ${sortDir.value === 'asc' ? '↑' : '↓'}`)

const setSort = (field) => {
  if (sortField.value === field) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    sortField.value = field
    sortDir.value = 'asc'
  }
  apply()
}

const toggleType = (v) => {
  const i = filters.types.indexOf(v)
  if (i >= 0) filters.types.splice(i, 1)
  else filters.types.push(v)
}
const toggleStatus = (v) => {
  filters.status = filters.status === v ? null : v
}

const toggleRow = (id) => {
  if (expandedId.value === id) {
    expandOpen.value = false
    setTimeout(() => {
      if (expandedId.value === id) expandedId.value = null
    }, 280)
  } else {
    expandedId.value = id
  }
}
watch(expandedId, async (v) => {
  if (v === null) return
  expandOpen.value = false
  await nextTick()
  requestAnimationFrame(() => (expandOpen.value = true))
})

/* Сроки сдачи/ключей по секциям */
const buildingMeta = ref({})
const loadBuildingMeta = async () => {
  try {
    const res = await manageApi.getComplexEdit(props.complexId)
    const map = {}
    ;(res.data?.buildings || []).forEach((b) => {
      ;(b.entrances || []).forEach((e) => {
        map[e.id] = { completion: b.completionDate, handover: b.keyHandoverDate }
      })
    })
    buildingMeta.value = map
  } catch {
    buildingMeta.value = {}
  }
}
const quartersOf = (a) => {
  const meta = buildingMeta.value[a?.entrance?.id]
  if (!meta) return null
  const parts = [formatQuarter(meta.completion), formatQuarter(meta.handover)].filter(Boolean)
  return parts.length ? parts.join(' / ') : null
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
  expandedId.value = null
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
  expandedId.value = null
  page.value = p
  load()
}

watch(pageSize, () => {
  expandedId.value = null
  page.value = 0
  load()
})

/* Открытие страницы ЖК — сразу показываем все квартиры комплекса (фильтры пустые) */
onMounted(() => {
  loadBuildingMeta()
  load()
})

const formatMoney = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(v) || 0) + ' ₽'
const fmtArea = (v) => (v ? Number(v).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' м²' : '—')
const typeChip = (t) =>
  ({ STUDIO: 'bg-sky-50 text-sky-700', ONE_ROOM: 'bg-indigo-50 text-indigo-700', TWO_ROOM: 'bg-violet-50 text-violet-700', THREE_ROOM: 'bg-fuchsia-50 text-fuchsia-700', FOUR_ROOM: 'bg-pink-50 text-pink-700' }[t] || 'bg-slate-100 text-slate-600')
const statusChip = (s) =>
  ({ AVAILABLE: 'bg-emerald-50 text-emerald-700', RESERVED: 'bg-amber-50 text-amber-700', SOLD: 'bg-rose-50 text-rose-700' }[s] || 'bg-slate-100 text-slate-600')

const rowClass = (s) => {
  if (s === 'RESERVED') return 'bg-slate-100 hover:bg-slate-200'
  if (s === 'SOLD') return 'bg-slate-300 hover:bg-slate-400/60'
  return 'hover:bg-indigo-50/50'
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

/* Плавное раскрытие карточки квартиры */
.expander {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.expander.open {
  grid-template-rows: 1fr;
}
</style>
