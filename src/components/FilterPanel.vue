<!-- Панель фильтров каталога ЖК -->
<template>
  <div
    class="overflow-hidden rounded-3xl bg-white/80 shadow-lg shadow-slate-900/5 ring-1 backdrop-blur transition-all duration-300"
    :class="filtersActive > 0 ? 'ring-indigo-200/80' : 'ring-slate-200/70'"
  >
    <!-- Toggle header -->
    <button
      class="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50/60"
      :aria-expanded="isOpen"
      @click="isOpen = !isOpen"
    >
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-indigo-600">
        <AppIcon name="filter" :size="18" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-sm font-bold text-slate-800">Фильтры</span>
        <span class="block truncate text-xs text-slate-400">
          <template v-if="filtersActive > 0">выбрано параметров: {{ filtersActive }}</template>
          <template v-else>локация, метро, этаж, площадь и цена</template>
        </span>
      </span>

      <span
        v-if="filtersActive > 0"
        class="shrink-0 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
      >{{ filtersActive }}</span>

      <button
        v-if="filtersActive > 0"
        class="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800"
        @click.stop="emit('reset')"
      >
        Сбросить
      </button>

      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 text-slate-400 transition-transform duration-300"
        :class="isOpen ? 'rotate-180' : ''"
      >
        <AppIcon name="chevronDown" :size="16" />
      </span>
    </button>

    <!-- Body -->
    <Transition name="panel">
      <div v-if="isOpen" class="border-t border-slate-100 px-5 pb-6 pt-5 sm:px-6">
        <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <!-- Left column: selects -->
          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Локация</label>
                <select class="field" :value="filters.locationId ?? ''" @change="onLocation($event.target.value)">
                  <option value="">Все локации</option>
                  <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Район</label>
                <select class="field" :value="filters.districtId ?? ''" :disabled="!filters.locationId" @change="setNum('districtId', $event.target.value)">
                  <option value="">Все районы</option>
                  <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Застройщики</label>
              <div v-if="developers.length" class="flex max-h-32 flex-wrap content-start gap-1.5 overflow-y-auto pr-1">
                <button
                  v-for="dev in developers"
                  :key="dev.id"
                  class="chip"
                  :class="isDeveloperOn(dev.id) ? 'chip-on' : ''"
                  @click="toggleInArray('developerIds', dev.id)"
                >
                  {{ dev.name }}
                </button>
              </div>
              <p v-else class="text-sm text-slate-400">{{ loadingReferences ? 'Загружаем застройщиков…' : 'Список пуст' }}</p>
            </div>

            <!-- Ranged numeric inputs -->
            <div class="space-y-4">
              <RangeField label="Этаж" :from="filters.floorFrom" :to="filters.floorTo" from-ph="от" to-ph="до" @from="(v) => setNum('floorFrom', v)" @to="(v) => setNum('floorTo', v)" />
              <RangeField label="Площадь, м²" :from="filters.areaFrom" :to="filters.areaTo" from-ph="от" to-ph="до" @from="(v) => setNum('areaFrom', v)" @to="(v) => setNum('areaTo', v)" />
              <RangeField label="Цена, ₽" :from="filters.priceFrom" :to="filters.priceTo" from-ph="от" to-ph="до" @from="(v) => setNum('priceFrom', v)" @to="(v) => setNum('priceTo', v)" />
            </div>
          </div>

          <!-- Right column -->
          <div class="space-y-5">
            <div>
              <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Станции метро</label>
              <div v-if="metroStations.length" class="flex max-h-36 flex-wrap content-start gap-1.5 overflow-y-auto pr-1">
                <button
                  v-for="m in metroStations"
                  :key="m.id"
                  class="chip"
                  :class="isMetroOn(m.id) ? 'chip-on' : ''"
                  :title="m.name + ' — ' + stationLineTitle(m.name)"
                  @click="toggleInArray('metroStationIds', m.id)"
                >
                  <span class="chip-dot" :style="stationDotStyle(m.name)" />
                  {{ m.name }}
                </button>
              </div>
              <p v-else class="text-sm text-slate-400">{{ loadingReferences ? 'Загружаем станции…' : 'Станции недоступны' }}</p>
            </div>

            <div>
              <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Тип квартиры</label>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="t in APARTMENT_TYPES" :key="t.value" class="chip" :class="isTypeOn(t.value) ? 'chip-on' : ''" @click="toggleInArray('types', t.value)">
                  {{ t.label }}
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Статус</label>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="s in STATUSES"
                    :key="s.value"
                    class="chip"
                    :class="filters.status === s.value ? 'chip-on' : ''"
                    @click="toggleScalar('status', s.value)"
                  >
                    {{ s.label }}
                  </button>
                </div>
              </div>
              <div>
                <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Санузел</label>
                <div class="flex flex-wrap gap-1.5">
                  <button v-for="b in BATHROOMS" :key="b.value" class="chip" :class="filters.bathroomType === b.value ? 'chip-on' : ''" @click="toggleScalar('bathroomType', b.value)">
                    {{ b.label }}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">Балкон</label>
              <div class="flex flex-wrap gap-1.5">
                <button class="chip" :class="filters.hasBalcony == null ? 'chip-on' : ''" @click="set('hasBalcony', null)">Любой</button>
                <button class="chip" :class="filters.hasBalcony === true ? 'chip-on' : ''" @click="set('hasBalcony', true)">Есть</button>
                <button class="chip" :class="filters.hasBalcony === false ? 'chip-on' : ''" @click="set('hasBalcony', false)">Нет</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="mt-6 flex flex-col-reverse items-stretch gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <button class="btn btn-ghost" @click="resetAll">
            <AppIcon name="rotate" :size="15" />
            Сбросить всё
          </button>
          <button class="btn btn-primary !px-6" @click="apply">
            <AppIcon name="check" :size="16" :stroke-width="2.6" />
            Применить фильтры
            <span v-if="filtersActive > 0" class="rounded-full bg-white/25 px-2 py-0.5 text-xs">{{ filtersActive }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import RangeField from './RangeField.vue'
import { APARTMENT_TYPES, STATUSES } from '@/utils/format.js'
import { stationDotStyle, stationLineTitle } from '@/utils/metroLines.js'

const props = defineProps({
  filters: { type: Object, required: true },
  loadingReferences: { type: Boolean, default: false },
  locations: { type: Array, default: () => [] },
  districts: { type: Array, default: () => [] },
  developers: { type: Array, default: () => [] },
  metroStations: { type: Array, default: () => [] },
})
const emit = defineEmits(['update', 'apply', 'reset'])

const isOpen = ref(false)
const BATHROOMS = [
  { value: 'COMBINED', label: 'Совмещённый' },
  { value: 'SEPARATE', label: 'Раздельный' },
]

const filtersActive = computed(() => {
  const f = props.filters || {}
  return [
    f.locationId != null,
    f.districtId != null,
    (f.developerIds || []).length > 0,
    (f.metroStationIds || []).length > 0,
    f.floorFrom != null,
    f.floorTo != null,
    f.areaFrom != null,
    f.areaTo != null,
    f.priceFrom != null,
    f.priceTo != null,
    f.hasBalcony != null,
    (f.types || []).length > 0,
    f.status != null,
    f.bathroomType != null,
  ].filter(Boolean).length
})

const isMetroOn = (id) => (props.filters.metroStationIds || []).includes(id)
const isTypeOn = (value) => (props.filters.types || []).includes(value)
const isDeveloperOn = (id) => (props.filters.developerIds || []).includes(id)

/* helpers: filters is the parent's reactive object, shared by reference */
const set = (key, value) => {
  props.filters[key] = value
}
const setNum = (key, raw) => {
  props.filters[key] = raw === '' || raw === null || raw === undefined ? null : Number(raw)
}
const onLocation = (raw) => {
  setNum('locationId', raw)
  props.filters.districtId = null
}
const toggleInArray = (key, value) => {
  const arr = Array.isArray(props.filters[key]) ? [...props.filters[key]] : []
  const idx = arr.indexOf(value)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(value)
  props.filters[key] = arr
}
const toggleScalar = (key, value) => {
  props.filters[key] = props.filters[key] === value ? null : value
}

const apply = () => {
  isOpen.value = false
  emit('apply')
}
const resetAll = () => {
  emit('reset')
}
</script>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
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
.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex: none;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
