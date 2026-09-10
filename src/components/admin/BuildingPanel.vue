<template>
  <section class="space-y-6">
    <!-- Head -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-xl font-extrabold tracking-tight text-slate-900">Корпуса и секции</h3>
        <p class="mt-0.5 text-sm text-slate-500">Добавляйте корпуса и секции, работайте с квартирами секции</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button class="btn btn-ghost" :disabled="!complexId || loadingBuildings" @click="openBuildingModal">
          <AppIcon name="floor" :size="15" /> Добавить корпус
        </button>
        <button class="btn btn-primary" :disabled="!complexId || !buildings.length" @click="openEntranceModal()">
          <AppIcon name="entrance" :size="15" /> Добавить секцию
        </button>
      </div>
    </div>

    <!-- Complex picker -->
    <div class="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur sm:p-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-64 flex-1">
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Жилой комплекс</label>
          <select v-model="complexId" class="field">
            <option v-for="c in complexes" :key="c.id" :value="c.id">{{ c.name }} — {{ c.developer }}</option>
          </select>
        </div>
        <div class="pb-1">
          <p class="text-sm font-semibold text-slate-600">Корпусов: <b class="text-indigo-600">{{ buildings.length }}</b></p>
          <p class="mt-0.5 text-xs text-slate-400">Все корпуса и секции комплекса</p>
        </div>
      </div>
    </div>

    <!-- Hidden file input for import -->
    <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFilePicked" />

    <!-- States -->
    <p v-if="loadingComplexes" class="py-8 text-center text-sm text-slate-400">Загружаем комплексы…</p>
    <div v-else-if="!complexes.length" class="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-5 py-12 text-center">
      <p class="text-sm text-slate-500">Сначала создайте жилой комплекс</p>
      <button class="btn btn-primary mt-4" @click="emit('openTab', 'complexes', {})">Перейти к ЖК</button>
    </div>

    <template v-else>
      <p v-if="loadingBuildings" class="py-8 text-center text-sm text-slate-400">Загружаем корпуса…</p>
      <div v-else-if="!buildings.length" class="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-5 py-12 text-center">
        <p class="text-sm text-slate-500">В этом комплексе пока нет корпусов</p>
        <button class="btn btn-primary mt-4" @click="openBuildingModal"><AppIcon name="plus" :size="15" /> Добавить первый корпус</button>
      </div>

      <div v-else class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div v-for="(b, bi) in buildings" :key="b.id" class="flex flex-col rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition hover:shadow-lg hover:ring-indigo-200 sm:p-6">
          <!-- building header -->
          <div class="flex items-center gap-3.5">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-base font-black text-white shadow-md shadow-indigo-600/25">{{ bi + 1 }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-extrabold tracking-tight text-slate-900">{{ b.name }}</p>
              <p class="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                <span class="inline-flex items-center gap-1"><AppIcon name="calendar" :size="12" /> сдача {{ b.completionDate || '—' }}</span>
                <span class="inline-flex items-center gap-1"><AppIcon name="calendar" :size="12" /> ключи {{ b.keyHandoverDate || '—' }}</span>
              </p>
            </div>
            <button class="btn-sm" title="Добавить секцию в этот корпус" @click="openEntranceModal(b.id)">
              <AppIcon name="plus" :size="13" :stroke-width="2.6" /> Секция
            </button>
          </div>

          <!-- entrance rows -->
          <div class="mt-5 flex-1 space-y-2.5">
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Секции: {{ b.entrances?.length || 0 }}</p>
            <div v-if="b.entrances?.length" class="space-y-2">
              <div v-for="e in b.entrances" :key="e.id" class="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5 transition hover:border-indigo-200">
                <AppIcon name="entrance" :size="16" stroke="#6366f1" />
                <span class="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{{ e.name }}</span>
                <span class="hidden text-xs text-slate-400 sm:inline">ID {{ e.id }}</span>
                <button class="btn-sm btn-sm-light" title="Открыть квартиры секции" @click="goFlats(b.id, e.id)">
                  <AppIcon name="apartment" :size="13" /> Квартиры
                </button>
                <button class="btn-sm btn-sm-light" :disabled="busyEntrance === e.id" title="Загрузить квартиры из Excel" @click="askImport(e)">
                  <span v-if="busyEntrance === e.id" class="loading-dot-sm" />
                  <AppIcon v-else name="upload" :size="13" /> Импорт
                </button>
                <button class="btn-sm btn-sm-light" :disabled="busyEntrance === e.id" title="Выгрузить квартиры в Excel" @click="exportEntrance(e)">
                  <AppIcon name="download" :size="13" /> Экспорт
                </button>
              </div>
            </div>
            <p v-else class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-400">Секций пока нет — добавьте первую</p>
          </div>
        </div>
      </div>

      <p class="text-xs text-slate-400">💡 Импорт/экспорт квартир работает по секции: файл должен соответствовать шаблону выгрузки (xlsx).</p>
    </template>

    <!-- Building modal -->
    <BaseModal :open="buildingModal" title="Новый корпус" :subtitle="'В комплекс: ' + currentComplexName" width="md" @close="buildingModal = false">
      <div class="space-y-4">
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Название корпуса *</label>
          <input v-model="buildingForm.name" type="text" class="field" placeholder="Например: «Корпус 4»" />
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Дата сдачи *</label>
            <input v-model="buildingForm.completionDate" type="date" class="field" />
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Выдача ключей *</label>
            <input v-model="buildingForm.keyHandoverDate" type="date" class="field" />
          </div>
        </div>
        <p v-if="formError" class="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{{ formError }}</p>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="buildingModal = false">Отмена</button>
        <button class="btn btn-primary" :disabled="saving" @click="saveBuilding"><span v-if="saving" class="loading-dot" /> Создать корпус</button>
      </template>
    </BaseModal>

    <!-- Entrance modal -->
    <BaseModal :open="entranceModal" title="Новая секция (парадная)" subtitle="Секция добавляется в выбранный корпус" width="md" @close="entranceModal = false">
      <div class="space-y-4">
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Корпус *</label>
          <select v-model="entranceForm.buildingId" class="field">
            <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Название секции *</label>
          <input v-model="entranceForm.name" type="text" class="field" placeholder="Например: «Секция 3»" />
        </div>
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Макс. этажей *</label>
          <input v-model.number="entranceForm.maxFloor" type="number" min="1" class="field" placeholder="Например: 16" />
        </div>
        <p v-if="formError" class="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{{ formError }}</p>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="entranceModal = false">Отмена</button>
        <button class="btn btn-primary" :disabled="saving" @click="saveEntrance"><span v-if="saving" class="loading-dot" /> Создать секцию</button>
      </template>
    </BaseModal>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/AppIcon.vue'
import { manageApi, complexApi } from '@/api'
import { useUiStore } from '@/stores/uiStore'

const props = defineProps({
  action: { type: String, default: '' },
  chosen: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['handled', 'openTab'])

const ui = useUiStore()

const complexes = ref([])
const buildings = ref([])
const complexId = ref(null)
const loadingComplexes = ref(true)
const loadingBuildings = ref(false)
const saving = ref(false)
const busyEntrance = ref(null)
const formError = ref('')

const buildingModal = ref(false)
const entranceModal = ref(false)
const buildingForm = ref({ name: '', completionDate: '', keyHandoverDate: '' })
const entranceForm = ref({ buildingId: null, name: '', maxFloor: null })

const fileInput = ref(null)
let importEntrance = null

const currentComplexName = computed(() => complexes.value.find((c) => c.id === complexId.value)?.name || '')

const loadComplexes = async () => {
  loadingComplexes.value = true
  try {
    const res = await complexApi.getComplexes({}, 0, 100)
    complexes.value = res.data.content || []
    if (!complexId.value && complexes.value.length) {
      const prefer = complexes.value.find((c) => c.id === props.chosen?.complexId)
      complexId.value = prefer ? prefer.id : complexes.value[0].id
    }
  } catch (e) {
    ui.toast(e.message, 'error')
  } finally {
    loadingComplexes.value = false
  }
}

const loadBuildings = async () => {
  if (!complexId.value) return
  loadingBuildings.value = true
  try {
    const res = await manageApi.getBuildings(complexId.value)
    buildings.value = res.data || []
  } catch (e) {
    buildings.value = []
    ui.toast(e.message, 'error')
  } finally {
    loadingBuildings.value = false
  }
}

watch(complexId, () => loadBuildings())
watch(
  () => props.chosen?.complexId,
  (v) => {
    if (v && v !== complexId.value) complexId.value = v
  }
)

const openBuildingModal = () => {
  buildingForm.value = { name: '', completionDate: '', keyHandoverDate: '' }
  formError.value = ''
  buildingModal.value = true
}
const saveBuilding = async () => {
  if (!buildingForm.value.name.trim()) {
    formError.value = 'Укажите название корпуса'
    return
  }
  if (!buildingForm.value.completionDate || !buildingForm.value.keyHandoverDate) {
    formError.value = 'Укажите обе даты (сдача и выдача ключей)'
    return
  }
  saving.value = true
  formError.value = ''
  const payload = {
    name: buildingForm.value.name.trim(),
    completionDate: buildingForm.value.completionDate,
    keyHandoverDate: buildingForm.value.keyHandoverDate,
  }
  try {
    await manageApi.createBuilding(complexId.value, payload)
    ui.toast('Корпус добавлен')
    buildingModal.value = false
    await loadBuildings()
  } catch (e) {
    formError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

const openEntranceModal = (buildingId) => {
  entranceForm.value = {
    buildingId: buildingId || buildings.value[0]?.id || null,
    name: '',
    maxFloor: null,
  }
  formError.value = ''
  entranceModal.value = true
}
const saveEntrance = async () => {
  if (!entranceForm.value.buildingId) {
    formError.value = 'Сначала создайте корпус'
    return
  }
  if (!entranceForm.value.name.trim()) {
    formError.value = 'Укажите название секции'
    return
  }
  if (!entranceForm.value.maxFloor || entranceForm.value.maxFloor < 1) {
    formError.value = 'Укажите максимальный этаж'
    return
  }
  saving.value = true
  formError.value = ''
  const payload = { name: entranceForm.value.name.trim(), maxFloor: entranceForm.value.maxFloor }
  try {
    await manageApi.createEntrance(entranceForm.value.buildingId, payload)
    ui.toast('Секция добавлена')
    entranceModal.value = false
    await loadBuildings()
  } catch (e) {
    formError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

/* --- квартиры секции (контекст) --- */
const goFlats = (buildingId, entranceId) => {
  emit('openTab', 'apartments', { complexId: complexId.value, buildingId, entranceId })
}

const askImport = (e) => {
  importEntrance = e
  if (fileInput.value) fileInput.value.value = ''
  fileInput.value?.click()
}
const onFilePicked = async (ev) => {
  const file = ev.target.files?.[0]
  if (!file || !importEntrance) return
  busyEntrance.value = importEntrance.id
  try {
    const res = await manageApi.importApartments(importEntrance.id, file)
    ui.toast(res.data || 'Квартиры загружены')
  } catch (err) {
    ui.toast(err.message, 'error')
  } finally {
    busyEntrance.value = null
    importEntrance = null
    if (fileInput.value) fileInput.value.value = ''
  }
}

const exportEntrance = (e) => {
  const a = document.createElement('a')
  a.href = manageApi.exportApartmentsUrl(e.id)
  a.download = 'apartments-' + e.id + '.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  ui.toast('Выгрузка «' + e.name + '» началась')
}

watch(
  () => props.action,
  (a, prev) => {
    if (!a || a === prev) return
    if (a === 'create-building') {
      if (complexes.value.length) openBuildingModal()
      else loadComplexes().then(() => openBuildingModal())
    } else if (a === 'create-entrance') {
      const run = async () => {
        if (!complexes.value.length) await loadComplexes()
        if (!buildings.value.length) await loadBuildings()
        openEntranceModal()
      }
      run()
    }
    emit('handled')
  },
  { immediate: true }
)

onMounted(() => {
  loadComplexes()
})
</script>

<style scoped>
.btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 0.65rem;
  padding: 0.4rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
  white-space: nowrap;
}
.btn-sm:hover {
  background: #e0e7ff;
}
.btn-sm-light {
  background: #fff;
  color: #64748b;
  border-color: #e2e8f0;
}
.btn-sm-light:hover {
  background: #f1f5f9;
  color: #1e293b;
}
.loading-dot {
  width: 13px;
  height: 13px;
  border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
.loading-dot-sm {
  width: 12px;
  height: 12px;
  border-radius: 9999px;
  border: 2px solid #e0e7ff;
  border-top-color: #6366f1;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
