<!-- Главная: hero + поиск + фильтры + каталог ЖК -->
<template>
  <div class="space-y-10">
    <!-- ================= HERO ================= -->
    <section class="relative overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl shadow-slate-900/30">
      <!-- decorative orbs & grid -->
      <div class="hero-orb left-[-6rem] top-[-6rem] h-72 w-72" style="background: rgba(99, 102, 241, 0.5)" />
      <div class="hero-orb bottom-[-8rem] right-[-4rem] h-80 w-80" style="background: rgba(168, 85, 247, 0.35)" />
      <div class="hero-orb left-1/3 top-[-10rem] h-96 w-96" style="background: rgba(14, 165, 233, 0.28)" />
      <div class="dot-grid-light absolute inset-0 opacity-40" />

      <div class="relative z-10 px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
        <span class="fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-200 backdrop-blur">
          <AppIcon name="sparkles" :size="14" />
          Каталог новостроек
        </span>

        <h1 class="fade-up mt-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl" style="animation-delay: 60ms">
          Жилые комплексы
          <span class="text-gradient">для вашей жизни</span>
        </h1>

        <p class="fade-up mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg" style="animation-delay: 120ms">
          Подбирайте квартиры в новостройках по локации, району, застройщику, метро и бюджету —
          вся информация о жилых комплексах в одном месте.
        </p>

        <!-- Search -->
        <div class="fade-up mt-8 max-w-2xl" style="animation-delay: 180ms">
          <SearchBar placeholder="Например: «Московская», «Setl Group» или название ЖК…" @apply-filter="onApplyFilter" />
        </div>

        <!-- Live stats -->
        <div class="fade-up mt-8 flex flex-wrap items-center gap-2.5" style="animation-delay: 240ms">
          <span class="hero-chip"><b class="tabular-nums">{{ store.total }}</b> {{ pluralize(store.total, ['жилой комплекс', 'жилых комплекса', 'жилых комплексов']) }}</span>
          <span v-if="locations.length" class="hero-chip"><b class="tabular-nums">{{ locations.length }}</b> {{ pluralize(locations.length, ['локация', 'локации', 'локаций']) }}</span>
          <span v-if="developers.length" class="hero-chip"><b class="tabular-nums">{{ developers.length }}</b> {{ pluralize(developers.length, ['застройщик', 'застройщика', 'застройщиков']) }}</span>
          <span v-if="metroStations.length" class="hero-chip"><b class="tabular-nums">{{ metroStations.length }}</b> {{ pluralize(metroStations.length, ['станция метро', 'станции метро', 'станций метро']) }}</span>
        </div>
      </div>
    </section>

    <!-- ================= FILTERS + CATALOG ================= -->
    <section id="catalog" class="scroll-mt-24 space-y-6">
      <FilterPanel
        :filters="filters"
        :loading-references="loadingReferences"
        :locations="locations"
        :districts="districts"
        :developers="developers"
        :metro-stations="metroStations"
        @apply="onFilterApply"
        @reset="onFilterReset"
      />

      <!-- Toolbar -->
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight text-slate-900">Каталог ЖК</h2>
          <p class="mt-1 flex items-center gap-2 text-sm text-slate-500">
            Найдено <b class="tabular-nums text-slate-800">{{ store.total }}</b> жилых комплексов
            <span v-if="store.loading && store.complexes.length" class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500">
              <span class="live-dot" /> обновляем…
            </span>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Количество ЖК на странице -->
          <label class="inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 py-1 pl-3 pr-1 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur">
            Показывать по
            <select v-model.number="pageSize" class="cursor-pointer appearance-none rounded-xl bg-slate-50 px-2.5 py-1.5 pr-6 text-xs font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100" :aria-label="'Сколько ЖК на странице'">
              <option v-for="s in [6, 9, 12, 24]" :key="s" :value="s">{{ s }}</option>
            </select>
          </label>

          <!-- View switch -->
          <div class="flex rounded-2xl border border-slate-200/80 bg-white/80 p-1 shadow-sm backdrop-blur" role="group" aria-label="Вид каталога">
            <button
              class="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200"
              :class="viewMode === 'grid' ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25' : 'text-slate-500 hover:text-slate-800'"
              :aria-pressed="viewMode === 'grid'"
              @click="viewMode = 'grid'"
            >
              <AppIcon name="grid" :size="16" :stroke="viewMode === 'grid' ? '#fff' : '#64748b'" />
              <span class="hidden sm:inline">Сетка</span>
            </button>
            <button
              class="flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200"
              :class="viewMode === 'list' ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25' : 'text-slate-500 hover:text-slate-800'"
              :aria-pressed="viewMode === 'list'"
              @click="viewMode = 'list'"
            >
              <AppIcon name="rows" :size="16" :stroke="viewMode === 'list' ? '#fff' : '#64748b'" />
              <span class="hidden sm:inline">Список</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading (initial) -->
      <div v-if="store.loading && !store.complexes.length" class="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard v-for="i in 6" :key="'sk-' + i" />
      </div>

      <!-- Error -->
      <div v-else-if="store.error" class="fade-up flex flex-col items-center rounded-3xl bg-white/80 px-6 py-16 text-center shadow-lg shadow-slate-900/5 ring-1 ring-red-100 backdrop-blur">
        <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AppIcon name="alert" :size="30" />
        </span>
        <h3 class="mt-4 text-lg font-bold text-slate-900">Не удалось загрузить каталог</h3>
        <p class="mt-1 max-w-md text-sm text-slate-500">{{ store.error }}</p>
        <button class="btn btn-primary mt-6" @click="reload">
          <AppIcon name="rotate" :size="15" />
          Попробовать снова
        </button>
      </div>

      <!-- Cards -->
      <transition-group
        v-else-if="store.complexes.length"
        :name="viewMode"
        tag="div"
        :class="viewMode === 'grid' ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-5'"
      >
        <div v-for="(item, index) in store.complexes" :key="item.id" class="fade-up" :class="viewMode === 'grid' ? 'h-full' : ''" :style="{ animationDelay: (index * 45) + 'ms' }">
          <ComplexCard :complex="item" :variant="viewMode" />
        </div>
      </transition-group>

      <!-- Empty -->
      <div v-else class="fade-up flex flex-col items-center rounded-3xl bg-white/80 px-6 py-16 text-center shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/60 backdrop-blur">
        <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
          <AppIcon name="building" :size="30" />
        </span>
        <h3 class="mt-4 text-lg font-bold text-slate-900">Ничего не найдено</h3>
        <p class="mt-1 max-w-md text-sm text-slate-500">Попробуйте изменить или сбросить параметры поиска и фильтров.</p>
        <button v-if="filtersActive" class="btn btn-ghost mt-6" @click="onFilterReset">
          <AppIcon name="rotate" :size="15" />
          Сбросить фильтры
        </button>
      </div>

      <!-- Pagination -->
      <PaginationBar :current-page="store.currentPage" :total-pages="store.totalPages" @page-change="onPageChange" />
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useComplexStore } from '@/stores/complexStore'
import { referenceApi } from '@/api'
import SearchBar from '@/components/SearchBar.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import ComplexCard from '@/components/ComplexCard.vue'
import SkeletonCard from '@/components/SkeletonCard.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import AppIcon from '@/components/AppIcon.vue'
import { pluralize } from '@/utils/format.js'

const store = useComplexStore()
const router = useRouter()

const viewMode = ref('grid')
const pageSize = ref(9)

const filters = ref({
  locationId: null,
  districtId: null,
  developerId: null,
  developerIds: [],
  metroStationIds: [],
  floorFrom: null,
  floorTo: null,
  areaFrom: null,
  areaTo: null,
  priceFrom: null,
  priceTo: null,
  hasBalcony: null,
  types: [],
  status: null,
  bathroomType: null,
})

const loadingReferences = ref(false)
const locations = ref([])
const districts = ref([])
const developers = ref([])
const metroStations = ref([])

const filtersActive = computed(() => {
  const f = filters.value
  return [
    f.locationId != null,
    f.districtId != null,
    f.developerId != null,
    f.developerIds.length > 0,
    f.metroStationIds.length > 0,
    f.floorFrom != null,
    f.floorTo != null,
    f.areaFrom != null,
    f.areaTo != null,
    f.priceFrom != null,
    f.priceTo != null,
    f.hasBalcony != null,
    f.types.length > 0,
    f.status != null,
    f.bathroomType != null,
  ].filter(Boolean).length
})

const loadReferences = async () => {
  loadingReferences.value = true
  try {
    const [locRes, devRes, metroRes] = await Promise.all([
      referenceApi.getLocations(),
      referenceApi.getDevelopers(),
      referenceApi.getMetroStations(),
    ])
    locations.value = locRes.data || []
    developers.value = devRes.data || []
    metroStations.value = metroRes.data || []
  } catch (e) {
    console.error('Ошибка загрузки справочников:', e)
  } finally {
    loadingReferences.value = false
  }
}

const loadDistricts = async (locationId) => {
  if (!locationId) {
    districts.value = []
    return
  }
  try {
    const res = await referenceApi.getDistrictsByLocation(locationId)
    districts.value = res.data || []
  } catch (e) {
    console.error(e)
    districts.value = []
  }
}

onMounted(() => {
  loadReferences()
  store.fetchComplexes({}, 0, pageSize.value)
})

watch(
  () => filters.value.locationId,
  (val) => {
    filters.value.districtId = null
    loadDistricts(val)
  }
)

watch(pageSize, () => {
  store.fetchComplexes(filters.value, 0, pageSize.value)
})

const onPageChange = (page) => {
  store.fetchComplexes(filters.value, page, pageSize.value)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const onFilterApply = () => store.fetchComplexes(filters.value, 0, pageSize.value)
const onFilterReset = () => {
  filters.value = {
    locationId: null,
    districtId: null,
    developerId: null,
    developerIds: [],
    metroStationIds: [],
    floorFrom: null,
    floorTo: null,
    areaFrom: null,
    areaTo: null,
    priceFrom: null,
    priceTo: null,
    hasBalcony: null,
    types: [],
    status: null,
    bathroomType: null,
  }
  store.fetchComplexes({}, 0, pageSize.value)
}
const reload = () => {
  loadReferences()
  store.fetchComplexes(filters.value, store.currentPage, pageSize.value)
}

/* Suggestions → filters (entityType from backend) */
const onApplyFilter = (item) => {
  if (!item) return
  const t = item.entityType
  if (t === 'Локация') filters.value.locationId = item.entityId
  else if (t === 'Район') filters.value.districtId = item.entityId
  else if (t === 'Застройщик') filters.value.developerId = item.entityId
  else if (t === 'Метро') filters.value.metroStationIds = [item.entityId]
  else if (t === 'ЖК' && item.entityId) {
    router.push('/complex/' + item.entityId)
    return
  }
  store.fetchComplexes(filters.value, 0, pageSize.value)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.hero-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(70px);
  pointer-events: none;
  animation: hero-drift 14s ease-in-out infinite alternate;
}
@keyframes hero-drift {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(2rem, 1.5rem) scale(1.1);
  }
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.07);
  padding: 0.4rem 0.95rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #cbd5e1;
  backdrop-filter: blur(8px);
}
.hero-chip b {
  color: #fff;
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
</style>
