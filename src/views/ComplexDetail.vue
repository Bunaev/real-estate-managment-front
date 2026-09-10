<!-- Публичная страница ЖК: обзор + список квартир с фильтрами (FilterDTO) -->
<template>
  <div class="space-y-6">
    <!-- Top bar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <button class="btn btn-ghost !py-2.5" @click="goBack">
        <AppIcon name="arrow-left" :size="16" />
        <span class="hidden sm:inline">В каталог</span>
      </button>
      <span v-if="loading && hero" class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600">
        <span class="live-dot" /> загружаем данные…
      </span>
    </div>

    <!-- SKELETON -->
    <template v-if="!hero && loading">
      <div class="overflow-hidden rounded-[2rem]"><div class="skeleton h-60 w-full sm:h-64" /></div>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div v-for="i in 3" :key="'sk-' + i" class="rounded-3xl bg-white/80 p-6 ring-1 ring-slate-200/60">
          <div class="skeleton h-8 w-20 rounded-xl" /><div class="skeleton mt-3 h-4 w-28 rounded-lg" />
        </div>
      </div>
      <div class="rounded-3xl bg-white/80 p-6 ring-1 ring-slate-200/60"><div class="skeleton h-5 w-48 rounded-lg" /><div class="skeleton mt-4 h-4 w-full rounded-md" /><div class="skeleton mt-3 h-4 w-2/3 rounded-md" /></div>
    </template>

    <!-- ERROR -->
    <div v-else-if="!hero && error" class="flex flex-col items-center rounded-3xl bg-white/80 px-6 py-16 text-center shadow-lg shadow-slate-900/5 ring-1 ring-red-100 backdrop-blur">
      <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500"><AppIcon name="alert" :size="30" /></span>
      <h3 class="mt-4 text-lg font-bold text-slate-900">Комплекс не найден</h3>
      <p class="mt-1 max-w-md text-sm text-slate-500">{{ error }}</p>
      <button class="btn btn-primary mt-6" @click="load"><AppIcon name="rotate" :size="15" /> Попробовать снова</button>
    </div>

    <!-- CONTENT -->
    <template v-else-if="hero">
      <!-- HERO -->
      <section class="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-slate-900/20" :style="{ background: gradient }">
        <div class="dot-grid-light absolute inset-0 opacity-40" />
        <div class="pointer-events-none absolute -right-10 -top-16 select-none text-[15rem] font-black leading-none text-white/10">{{ firstLetter(hero.name) }}</div>

        <!-- Рендер ЖК, проявляется справа красивым градиентом -->
        <img
          v-show="renderOk"
          :src="renderSrc"
          :alt="hero.name"
          class="hero-render pointer-events-none absolute inset-y-0 right-0 hidden h-full w-full max-w-[64%] object-cover lg:block"
          @load="renderOk = true"
          @error="renderOk = false"
        />
        <!-- затемнение слева для читаемости текста -->
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/35 via-slate-950/5 to-transparent" />

        <div class="relative z-10 px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur">
            <AppIcon name="building" :size="13" /> Жилой комплекс
          </span>
          <h1 class="mt-4 max-w-4xl text-3xl font-black tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">{{ hero.name }}</h1>
          <p class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-white/85 sm:text-base">
            <span class="inline-flex items-center gap-1.5"><AppIcon name="location" :size="15" /> {{ addressLine }}</span>
            <span v-if="hero.developer" class="inline-flex items-center gap-1.5"><AppIcon name="developer" :size="15" /> {{ hero.developer }}</span>
          </p>

          <div class="mt-7 grid max-w-2xl grid-cols-3 gap-3">
            <div v-for="s in visibleStats" :key="s.key" class="rounded-2xl bg-white/12 px-4 py-3.5 backdrop-blur-md ring-1 ring-white/20">
              <div class="flex items-center gap-2 text-2xl font-black tabular-nums text-white sm:text-3xl">
                <AppIcon :name="s.icon" :size="17" :stroke-width="2.2" /> {{ formatNum(s.value) }}
              </div>
              <div class="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/70 sm:text-xs">{{ s.label }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabs -->
      <div class="flex w-fit gap-1.5 rounded-2xl bg-white/85 p-1.5 shadow-sm ring-1 ring-slate-200/60 backdrop-blur">
        <button
          class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200"
          :class="tab === 'flats' ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'"
          @click="tab = 'flats'"
        >
          <AppIcon name="apartment" :size="15" :stroke="tab === 'flats' ? '#fff' : '#64748b'" />
          Квартиры
          <span class="rounded-full bg-white/20 px-1.5 text-[11px]">{{ flatsHint }}</span>
        </button>
        <button
          class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200"
          :class="tab === 'about' ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'"
          @click="tab = 'about'"
        >
          <AppIcon name="building" :size="15" :stroke="tab === 'about' ? '#fff' : '#64748b'" />
          О комплексе
        </button>
      </div>

      <!-- Квартиры (по умолчанию) -->
      <div v-show="tab === 'flats'" class="pt-1">
        <ApartmentsExplorer :complex-id="id" :buildings="complex?.buildings || []" />
      </div>

      <!-- О комплексе -->
      <div v-show="tab === 'about'" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <section class="rounded-3xl bg-white/85 p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/60 backdrop-blur sm:p-7">
            <h2 class="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
              <AppIcon name="sparkles" :size="18" stroke="#6366f1" /> О комплексе
            </h2>
            <dl class="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <div v-for="row in infoRows" :key="row.key" class="flex items-start gap-3">
                <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" :class="row.bg"><AppIcon :name="row.icon" :size="17" :stroke="row.color" /></span>
                <div><dt class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ row.label }}</dt><dd class="mt-0.5 font-semibold text-slate-800">{{ row.value || '—' }}</dd></div>
              </div>
            </dl>
          </section>

          <section v-if="complex" class="rounded-3xl bg-white/85 p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/60 backdrop-blur sm:p-7">
            <h2 class="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
              <AppIcon name="floor" :size="18" stroke="#6366f1" />
              Корпуса и секции
              <span class="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600">{{ (complex.buildings || []).length }}</span>
            </h2>

            <div v-if="complex.buildings?.length" class="mt-5 space-y-3">
              <div v-for="(b, bi) in complex.buildings" :key="b.id" class="overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-50/50 transition hover:border-indigo-200">
                <button class="flex w-full items-center gap-3 px-5 py-4 text-left" :aria-expanded="isOpen(bi)" @click="toggle(bi)">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-md" :style="{ background: cardGradient(bi) }">{{ bi + 1 }}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-bold text-slate-800">{{ b.name }}</span>
                    <span class="text-xs text-slate-500">{{ b.entrances?.length || 0 }} секций</span>
                  </span>
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm transition-transform duration-300" :class="isOpen(bi) ? 'rotate-180' : ''">
                    <AppIcon name="chevronDown" :size="16" />
                  </span>
                </button>
                <Transition name="panel">
                  <div v-if="isOpen(bi)" class="border-t border-slate-200/70 px-5 py-4">
                    <div class="flex flex-wrap gap-2">
                      <span v-for="(ent, ei) in b.entrances || []" :key="ent.id" class="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80">
                        <AppIcon name="door" :size="15" stroke="#818cf8" />
                        {{ ent.name || 'Секция ' + (ei + 1) }}
                      </span>
                      <p v-if="!(b.entrances || []).length" class="text-sm text-slate-400">Секции не добавлены</p>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
            <p v-else class="mt-4 text-sm text-slate-400">Информация о корпусах пока не добавлена.</p>
          </section>
        </div>

        <aside class="space-y-6">
          <section v-if="metroList.length" class="rounded-3xl bg-white/85 p-6 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/60 backdrop-blur sm:p-7">
            <h2 class="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
              <AppIcon name="metro" :size="18" stroke="#e11d48" /> Метро
            </h2>
            <p class="mt-1 text-xs text-slate-400">Оценочное время в пути от комплекса: пешком ~5 км/ч · транспорт ~20 км/ч · машина ~40 км/ч</p>
            <ul class="mt-4 space-y-2.5">
              <li v-for="m in metroList" :key="m.stationName" class="rounded-2xl bg-slate-50 px-4 py-3">
                <div class="flex items-center gap-3">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/60" :style="stationDotStyle(m.stationName)" :title="stationLineTitle(m.stationName)" />
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-bold text-slate-800">{{ m.stationName }}</span>
                    <span class="text-xs text-slate-400">{{ formatMeters(m.distance) }}</span>
                  </span>
                </div>
                <div class="mt-2"><MetroTimes :meters="m.distance" /></div>
              </li>
            </ul>
          </section>

          <section class="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-600/25">
            <h2 class="text-sm font-extrabold uppercase tracking-widest text-white/80">Быстрые факты</h2>
            <ul class="mt-4 space-y-3 text-sm">
              <li v-if="metroList.length" class="flex items-center justify-between gap-2"><span class="text-white/75">Ближайшее метро</span><b>{{ nearestWalk }}</b></li>
              <li class="flex items-center justify-between gap-2"><span class="text-white/75">Корпусов</span><b class="tabular-nums">{{ counts.buildings ?? '—' }}</b></li>
              <li class="flex items-center justify-between gap-2"><span class="text-white/75">Секций</span><b class="tabular-nums">{{ counts.entrances ?? '—' }}</b></li>
              <li v-if="counts.apartments != null" class="flex items-center justify-between gap-2"><span class="text-white/75">Квартир в комплексе</span><b class="tabular-nums">{{ formatNum(counts.apartments) }}</b></li>
            </ul>
            <button class="btn mt-5 w-full !bg-white !text-indigo-700 hover:!bg-indigo-50" @click="tab = 'flats'">
              <AppIcon name="apartment" :size="15" /> Смотреть квартиры
            </button>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { complexApi, renderCoverUrl } from '@/api'
import AppIcon from '@/components/AppIcon.vue'
import ApartmentsExplorer from '@/components/ApartmentsExplorer.vue'
import MetroTimes from '@/components/MetroTimes.vue'
import { complexGradient, firstLetter, walkTimeText, formatMeters } from '@/utils/format.js'
import { stationDotStyle, stationLineTitle } from '@/utils/metroLines.js'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)

const tab = ref('flats')
const complex = ref(null)
const summary = ref(null)
const loading = ref(true)
const error = ref(null)
const renderOk = ref(false)

const renderSrc = computed(() => renderCoverUrl(id.value))

const readSummary = () => {
  try {
    const s = window.history?.state?.summary
    if (s && Number(s.id) === Number(id.value)) summary.value = s
  } catch {
    summary.value = null
  }
}

const hero = computed(() => complex.value || summary.value)
const gradient = computed(() => complexGradient(Number(id.value) || hero.value?.id || 1))

const addressLine = computed(() =>
  [hero.value?.location, hero.value?.district, hero.value?.address].filter(Boolean).join(', ')
)

const infoRows = computed(() => [
  { key: 'dev', label: 'Застройщик', icon: 'developer', value: hero.value?.developer, bg: 'bg-indigo-50 text-indigo-600', color: '#4f46e5' },
  { key: 'loc', label: 'Локация', icon: 'location', value: hero.value?.location, bg: 'bg-sky-50 text-sky-600', color: '#0284c7' },
  { key: 'dist', label: 'Район', icon: 'map', value: hero.value?.district, bg: 'bg-violet-50 text-violet-600', color: '#7c3aed' },
  { key: 'addr', label: 'Адрес', icon: 'apartment', value: hero.value?.address, bg: 'bg-emerald-50 text-emerald-600', color: '#059669' },
])

const counts = computed(() => {
  const buildingsArr = complex.value?.buildings || []
  const entrances = buildingsArr.reduce((sum, b) => sum + (b.entrances?.length || 0), 0)
  return {
    buildings: complex.value?.countBuildings ?? (buildingsArr.length ? buildingsArr.length : summary.value?.countBuildings ?? null),
    entrances: complex.value?.countEntrance ?? (entrances ? entrances : summary.value?.countEntrance ?? null),
    apartments: complex.value?.countApartment ?? summary.value?.countApartment ?? null,
  }
})

const flatsHint = computed(() => (counts.value.apartments != null ? formatNum(counts.value.apartments) : '…'))

const visibleStats = computed(() => {
  const items = []
  if (counts.value.buildings != null) items.push({ key: 'buildings', value: counts.value.buildings, label: 'корпусов', icon: 'building' })
  if (counts.value.entrances != null) items.push({ key: 'entrances', value: counts.value.entrances, label: 'секций', icon: 'entrance' })
  if (counts.value.apartments != null) items.push({ key: 'apartments', value: counts.value.apartments, label: 'квартир', icon: 'apartment' })
  return items
})

const metroList = computed(() => {
  const source = complex.value?.metroDistances?.length ? complex.value.metroDistances : summary.value?.metroDistances || []
  return [...source].sort((a, b) => (a.distance || 0) - (b.distance || 0))
})
const nearestWalk = computed(() => (metroList.value.length ? walkTimeText(metroList.value[0].distance) : '—'))

const opened = ref(new Set())
const isOpen = (i) => opened.value.has(i)
const toggle = (i) => {
  const s = new Set(opened.value)
  if (s.has(i)) s.delete(i)
  else s.add(i)
  opened.value = s
}

const cardGradient = (i) => complexGradient(Number(id.value) * 7 + i + 1)
const formatNum = (n) => (n == null ? '—' : Number(n).toLocaleString('ru-RU'))

const load = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await complexApi.getComplex(id.value)
    complex.value = res.data
    if (res.data?.name) document.title = `${res.data.name} · REM`
  } catch (err) {
    error.value = err.message
    console.error('Ошибка загрузки ЖК:', err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1 && window.history.state?.back) router.back()
  else router.push('/')
}

onMounted(() => {
  readSummary()
  load()
})
</script>

<style scoped>
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

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Плавное проявление рендера в шапке: слева прозрачно, справа непрозрачно */
.hero-render {
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.55) 30%, #000 55%);
  mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.55) 30%, #000 55%);
  opacity: 0.96;
}
</style>
