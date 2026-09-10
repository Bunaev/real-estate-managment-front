<template>
  <section class="space-y-5">
    <div>
      <h3 class="text-lg font-extrabold tracking-tight text-slate-900">Справочники</h3>
      <p class="text-sm text-slate-500">Локации, застройщики, районы и станции метро</p>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <!-- Локации -->
      <div class="rounded-2xl bg-white/85 p-5 ring-1 ring-slate-200/70 backdrop-blur" :class="focusCard === 'location' ? 'ring-2 ring-indigo-300' : ''">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><AppIcon name="location" :size="18" /></span>
          <h4 class="flex-1 text-sm font-bold text-slate-900">Локации <span class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{{ locations.length }}</span></h4>
        </div>
        <div class="mt-4 flex gap-2">
          <input ref="locationInput" v-model="forms.location" type="text" class="field" placeholder="Название локации" @keydown.enter="addLocation" />
          <button class="btn btn-primary shrink-0 !px-4" :disabled="busy.location" @click="addLocation">
            <AppIcon name="plus" :size="15" />
          </button>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="l in locations" :key="l.id" class="chip">{{ l.name }}</span>
          <p v-if="!locations.length" class="text-xs text-slate-400">Пока пусто</p>
        </div>
      </div>

      <!-- Застройщики -->
      <div class="rounded-2xl bg-white/85 p-5 ring-1 ring-slate-200/70 backdrop-blur" :class="focusCard === 'developer' ? 'ring-2 ring-indigo-300' : ''">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><AppIcon name="developer" :size="18" /></span>
          <h4 class="flex-1 text-sm font-bold text-slate-900">Застройщики <span class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{{ developers.length }}</span></h4>
        </div>
        <div class="mt-4 flex gap-2">
          <input ref="developerInput" v-model="forms.developer" type="text" class="field" placeholder="Название застройщика" @keydown.enter="addDeveloper" />
          <button class="btn btn-primary shrink-0 !px-4" :disabled="busy.developer" @click="addDeveloper">
            <AppIcon name="plus" :size="15" />
          </button>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="d in developers" :key="d.id" class="chip">{{ d.name }}</span>
          <p v-if="!developers.length" class="text-xs text-slate-400">Пока пусто</p>
        </div>
      </div>

      <!-- Районы -->
      <div class="rounded-2xl bg-white/85 p-5 ring-1 ring-slate-200/70 backdrop-blur" :class="focusCard === 'district' ? 'ring-2 ring-indigo-300' : ''">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><AppIcon name="entrance" :size="18" /></span>
          <h4 class="flex-1 text-sm font-bold text-slate-900">Районы</h4>
        </div>
        <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <select v-model="districtLocationId" class="field" @change="loadDistricts">
            <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
          </select>
        </div>
        <div class="mt-2 flex gap-2">
          <input ref="districtInput" v-model="forms.district" type="text" class="field" placeholder="Название района" @keydown.enter="addDistrict" />
          <button class="btn btn-primary shrink-0 !px-4" :disabled="busy.district" @click="addDistrict">
            <AppIcon name="plus" :size="15" />
          </button>
        </div>
        <div class="mt-3 flex flex-wrap gap-1.5">
          <span v-for="d in districts" :key="d.id" class="chip">{{ d.name }}</span>
          <p v-if="!districts.length" class="text-xs text-slate-400">Районов в этой локации нет</p>
        </div>
      </div>

      <!-- Метро -->
      <div class="rounded-2xl bg-white/85 p-5 ring-1 ring-slate-200/70 backdrop-blur" :class="focusCard === 'metro' ? 'ring-2 ring-indigo-300' : ''">
        <div class="flex items-center gap-3">
          <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><AppIcon name="metro" :size="18" /></span>
          <h4 class="flex-1 text-sm font-bold text-slate-900">Станции метро <span class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{{ metro.length }}</span></h4>
        </div>
        <div class="mt-4 flex gap-2">
          <input ref="metroInput" v-model="forms.metro" type="text" class="field" placeholder="Название станции" @keydown.enter="addMetro" />
          <button class="btn btn-primary shrink-0 !px-4" :disabled="busy.metro" @click="addMetro">
            <AppIcon name="plus" :size="15" />
          </button>
        </div>
        <div class="mt-3 flex max-h-40 flex-wrap content-start gap-1.5 overflow-y-auto">
          <span v-for="m in metro" :key="m.id" class="chip">{{ m.name }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { referenceApi } from '@/api'
import { useUiStore } from '@/stores/uiStore'

const props = defineProps({
  action: { type: String, default: '' },
  chosen: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['handled'])

const ui = useUiStore()
const locations = ref([])
const developers = ref([])
const districts = ref([])
const metro = ref([])
const forms = ref({ location: '', developer: '', district: '', metro: '' })
const busy = ref({ location: false, developer: false, district: false, metro: false })
const districtLocationId = ref(null)
const focusCard = ref('')

const locationInput = ref(null)
const developerInput = ref(null)
const districtInput = ref(null)
const metroInput = ref(null)

const loadAll = async () => {
  try {
    const [loc, dev, m] = await Promise.all([referenceApi.getLocations(), referenceApi.getDevelopers(), referenceApi.getMetroStations()])
    locations.value = loc.data || []
    developers.value = dev.data || []
    metro.value = m.data || []
    if (!districtLocationId.value && locations.value.length) {
      districtLocationId.value = locations.value[0].id
      loadDistricts()
    }
  } catch (e) {
    ui.toast(e.message, 'error')
  }
}

const loadDistricts = async () => {
  if (!districtLocationId.value) {
    districts.value = []
    return
  }
  try {
    const res = await referenceApi.getDistrictsByLocation(districtLocationId.value)
    districts.value = res.data || []
  } catch {
    districts.value = []
  }
}

const run = async (key, apiCall, clearValue) => {
  busy.value[key] = true
  try {
    await apiCall()
    ui.toast('Добавлено в справочник')
    clearValue()
    await loadAll()
  } catch (e) {
    ui.toast(e.message, 'error')
  } finally {
    busy.value[key] = false
  }
}

const addLocation = () => {
  const v = forms.value.location.trim()
  if (!v) return
  run('location', () => referenceApi.createLocation(v), () => (forms.value.location = ''))
}
const addDeveloper = () => {
  const v = forms.value.developer.trim()
  if (!v) return
  run('developer', () => referenceApi.createDeveloper(v), () => (forms.value.developer = ''))
}
const addDistrict = () => {
  const v = forms.value.district.trim()
  if (!v) return
  if (!districtLocationId.value) {
    ui.toast('Сначала добавьте локацию', 'error')
    return
  }
  run('district', () => referenceApi.createDistrict(v, districtLocationId.value), () => (forms.value.district = ''))
}
const addMetro = () => {
  const v = forms.value.metro.trim()
  if (!v) return
  run('metro', () => referenceApi.createMetroStation(v), () => (forms.value.metro = ''))
}

watch(
  () => props.action,
  (a) => {
    if (!a) return
    if (['location', 'developer', 'district', 'metro'].includes(a)) {
      focusCard.value = a
      const map = { location: locationInput, developer: developerInput, district: districtInput, metro: metroInput }
      nextTick(() => map[a].value?.focus())
      setTimeout(() => (focusCard.value = ''), 2600)
    }
    emit('handled')
  },
  { immediate: true }
)

onMounted(loadAll)
</script>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.35rem 0.8rem;
  transition: all 0.2s;
}
</style>
