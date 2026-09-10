<template>
  <section class="space-y-5">
    <!-- Head -->
    <div>
      <h3 class="text-xl font-extrabold tracking-tight text-slate-900">Квартиры</h3>
      <p class="mt-0.5 text-sm text-slate-500">Выберите комплекс, корпус и секцию — затем редактируйте, импортируйте или экспортируйте квартиры</p>
    </div>

    <!-- Pickers -->
    <div class="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur sm:p-6">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Жилой комплекс</label>
          <select v-model="complexId" class="field">
            <option v-for="c in complexes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Корпус</label>
          <select v-model="buildingId" class="field" :disabled="!buildings.length">
            <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Секция</label>
          <select v-model="entranceId" class="field" :disabled="!entrances.length">
            <option v-for="e in entrances" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Contextual action strip -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-600/20 sm:p-6">
      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-bold uppercase tracking-widest text-white/70">Выбранная секция</p>
        <p class="mt-1 truncate text-base font-extrabold">{{ entranceName || 'Секция не выбрана' }}</p>
        <p class="mt-0.5 truncate text-xs text-white/75">{{ [selectedComplexName, selectedBuildingName].filter(Boolean).join(' · ') || 'Выберите комплекс, корпус и секцию выше' }}</p>
        <p class="mt-1 text-xs text-white/80">Квартир в секции: <b class="tabular-nums text-white">{{ total }}</b></p>
      </div>
      <div v-if="entranceId" class="flex shrink-0 flex-wrap items-center gap-2">
        <button class="btn !bg-white/15 !text-white ring-1 ring-white/25 backdrop-blur hover:!bg-white/25" @click="openImport">
          <AppIcon name="upload" :size="15" /> Импорт квартир (xlsx)
        </button>
        <button class="btn !bg-white !text-indigo-700 hover:!bg-indigo-50" @click="exportCurrent">
          <AppIcon name="download" :size="15" /> Экспорт в Excel
        </button>
      </div>
    </div>

    <!-- Count / page size -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-slate-500">Показано <b class="text-slate-800">{{ apartments.length }}</b> из <b class="tabular-nums text-slate-800">{{ total }}</b></p>
      <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
        На странице
        <select v-model.number="pageSize" class="field !w-auto !py-2">
          <option v-for="s in [10, 20, 50]" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>

    <!-- Import modal -->
    <BaseModal :open="importOpen" title="Импорт квартир из Excel" :subtitle="'В секцию: ' + entranceName" width="md" @close="importOpen = false">
      <div class="space-y-4">
        <label class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40">
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <AppIcon name="upload" :size="22" />
          </span>
          <span v-if="!importFile" class="text-sm font-semibold text-slate-500">Нажмите, чтобы выбрать файл .xlsx</span>
          <span v-else class="text-sm font-bold text-indigo-700">{{ importFile.name }}</span>
          <span class="text-xs text-slate-400">Формат файла должен соответствовать шаблону экспорта</span>
          <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFilePick" />
        </label>
        <p v-if="formError" class="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">{{ formError }}</p>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="importOpen = false">Отмена</button>
        <button class="btn btn-primary" :disabled="!importFile || uploading" @click="doImport">
          <span v-if="uploading" class="loading-dot" />
          <AppIcon v-else name="upload" :size="15" />
          Загрузить
        </button>
      </template>
    </BaseModal>

    <!-- List -->
    <p v-if="loadingApartments" class="py-8 text-center text-sm text-slate-400">Загружаем квартиры…</p>
    <div v-else-if="!entranceId" class="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-400">Выберите комплекс, корпус и секцию</div>

    <div v-else class="overflow-hidden rounded-2xl bg-white/85 ring-1 ring-slate-200/70 backdrop-blur">
      <div v-if="!apartments.length" class="px-5 py-10 text-center text-sm text-slate-400">В секции нет квартир — загрузите их из Excel</div>
      <div v-else class="divide-y divide-slate-100">
        <div v-for="a in apartments" :key="a.id" class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition hover:bg-slate-50/70 sm:px-5">
          <span class="w-9 shrink-0 text-sm font-black text-slate-300">№{{ a.number }}</span>
          <span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" :class="typeChip(a.type)">{{ apartmentTypeLabel(a.type) }}</span>
          <span class="min-w-0 flex-1 text-xs text-slate-500">
            {{ a.floor }} эт. · {{ formatArea(a.area) }} · {{ formatMoney(a.price) }}
            <span class="mx-1 text-slate-300">|</span>
            балкон: {{ a.hasBalcony ? 'есть' : 'нет' }} · {{ bathroomLabel(a.bathroomType) }}
          </span>
          <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="statusChip(a.status)">{{ statusLabel(a.status) }}</span>
          <div class="flex items-center gap-1">
            <button class="icon-btn" title="Изменить" @click="openEdit(a)">
              <AppIcon name="edit" :size="15" stroke="#6366f1" />
            </button>
            <button class="icon-btn" title="Удалить" @click="askDelete(a)">
              <AppIcon name="trash" :size="15" stroke="#e11d48" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <PaginationBar v-if="totalPages > 1" :current-page="page" :total-pages="totalPages" @page-change="onPage" />

    <!-- Edit apartment -->
    <BaseModal :open="!!editing" title="Изменить квартиру" :subtitle="'№' + (editing?.number ?? '')" width="lg" @close="editing = null">
      <div v-if="editing" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="label">Номер</label>
          <input v-model.number="editForm.number" type="number" min="1" class="field" />
        </div>
        <div>
          <label class="label">Этаж</label>
          <input v-model.number="editForm.floor" type="number" min="1" class="field" />
        </div>
        <div>
          <label class="label">Площадь, м²</label>
          <input v-model.number="editForm.area" type="number" step="0.1" class="field" />
        </div>
        <div>
          <label class="label">Цена, ₽</label>
          <input v-model.number="editForm.price" type="number" step="10000" class="field" />
        </div>
        <div>
          <label class="label">Тип</label>
          <select v-model="editForm.type" class="field">
            <option v-for="t in APARTMENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div>
          <label class="label">Статус</label>
          <select v-model="editForm.status" class="field">
            <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div>
          <label class="label">Санузел</label>
          <select v-model="editForm.bathroomType" class="field">
            <option v-for="b in BATHROOMS" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
        </div>
        <div>
          <label class="label">Балкон</label>
          <select v-model="editForm.hasBalcony" class="field">
            <option :value="true">Есть</option>
            <option :value="false">Нет</option>
          </select>
        </div>
        <p v-if="formError" class="col-span-full rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">{{ formError }}</p>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="editing = null">Отмена</button>
        <button class="btn btn-primary" :disabled="saving" @click="saveEdit">
          <span v-if="saving" class="loading-dot" /> Сохранить
        </button>
      </template>
    </BaseModal>

    <!-- Delete apartment confirm -->
    <BaseModal :open="!!deleteTarget" title="Удалить квартиру?" width="sm" @close="deleteTarget = null">
      <p class="text-sm text-slate-600">Квартира <b>№{{ deleteTarget?.number }}</b> будет удалена. Действие необратимо.</p>
      <template #footer>
        <button class="btn btn-ghost" @click="deleteTarget = null">Отмена</button>
        <button class="btn btn-danger" :disabled="busy" @click="doDelete">
          <AppIcon name="trash" :size="15" /> Удалить
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import AppIcon from '@/components/AppIcon.vue'
import { manageApi, complexApi } from '@/api'
import { useUiStore } from '@/stores/uiStore'
import { APARTMENT_TYPES, STATUSES, apartmentTypeLabel, statusLabel, bathroomLabel } from '@/utils/format.js'

const props = defineProps({
  action: { type: String, default: '' },
  chosen: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['handled'])

const ui = useUiStore()
const BATHROOMS = [
  { value: 'COMBINED', label: 'Совмещённый' },
  { value: 'SEPARATE', label: 'Раздельный' },
]

const complexes = ref([])
const buildings = ref([])
const entrances = ref([])
const apartments = ref([])
const total = ref(0)
const totalPages = ref(0)
const page = ref(0)
const loadingApartments = ref(false)
const busy = ref(false)
const saving = ref(false)
const uploading = ref(false)

const complexId = ref(null)
const buildingId = ref(null)
const entranceId = ref(null)

const importOpen = ref(false)
const importFile = ref(null)
const fileInput = ref(null)
const formError = ref('')
const editing = ref(null)
const editForm = ref({})
const deleteTarget = ref(null)

const entranceName = computed(() => entrances.value.find((e) => e.id === entranceId.value)?.name || '')
const selectedComplexName = computed(() => complexes.value.find((c) => c.id === complexId.value)?.name || '')
const selectedBuildingName = computed(() => buildings.value.find((b) => b.id === buildingId.value)?.name || '')
const pageSize = ref(20)

const typeChip = (t) =>
  ({ STUDIO: 'bg-sky-50 text-sky-700', ONE_ROOM: 'bg-indigo-50 text-indigo-700', TWO_ROOM: 'bg-violet-50 text-violet-700', THREE_ROOM: 'bg-fuchsia-50 text-fuchsia-700', FOUR_ROOM: 'bg-pink-50 text-pink-700' }[t] || 'bg-slate-100 text-slate-600')
const statusChip = (s) =>
  ({ AVAILABLE: 'bg-emerald-50 text-emerald-700', RESERVED: 'bg-amber-50 text-amber-700', SOLD: 'bg-rose-50 text-rose-700' }[s] || 'bg-slate-100 text-slate-600')
const formatMoney = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(v) || 0) + ' ₽'
const formatArea = (v) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(v) || 0) + ' м²'

const loadComplexes = async () => {
  try {
    const res = await complexApi.getComplexes({}, 0, 50)
    complexes.value = res.data.content || []
    if (!complexId.value && complexes.value.length) {
      const prefer = complexes.value.find((c) => c.id === props.chosen?.complexId)
      complexId.value = prefer ? prefer.id : complexes.value[0].id
    }
  } catch (e) {
    ui.toast(e.message, 'error')
  }
}
const loadBuildings = async () => {
  if (!complexId.value) return
  try {
    const res = await manageApi.getBuildings(complexId.value)
    buildings.value = res.data || []
    const prefer = props.chosen?.buildingId && buildings.value.find((b) => b.id === props.chosen.buildingId)
    buildingId.value = prefer ? prefer.id : buildings.value[0]?.id ?? null
  } catch {
    buildings.value = []
    buildingId.value = null
  }
}
const loadEntrances = async () => {
  if (!buildingId.value) return
  try {
    const res = await manageApi.getEntrances(buildingId.value)
    entrances.value = res.data || []
    const prefer = props.chosen?.entranceId && entrances.value.find((e) => e.id === props.chosen.entranceId)
    entranceId.value = prefer ? prefer.id : entrances.value[0]?.id ?? null
  } catch {
    entrances.value = []
    entranceId.value = null
  }
}
const loadApartments = async () => {
  if (!entranceId.value) return
  loadingApartments.value = true
  try {
    const res = await manageApi.getApartments(complexId.value, page.value, pageSize.value)
    apartments.value = res.data.content || []
    total.value = res.data.totalElements || 0
    totalPages.value = Math.max(1, res.data.totalPages || 1)
  } catch (e) {
    apartments.value = []
    ui.toast(e.message, 'error')
  } finally {
    loadingApartments.value = false
  }
}

watch(complexId, async () => {
  page.value = 0
  await loadBuildings()
})
watch(buildingId, async () => {
  page.value = 0
  await loadEntrances()
})
watch(entranceId, async () => {
  page.value = 0
  await loadApartments()
})
watch(pageSize, () => {
  page.value = 0
  loadApartments()
})

const onPage = (p) => {
  page.value = p
  loadApartments()
}

const openImport = () => {
  formError.value = ''
  importFile.value = null
  importOpen.value = true
}
const onFilePick = (e) => {
  importFile.value = e.target.files?.[0] || null
}
const doImport = async () => {
  if (!importFile.value) return
  if (!entranceId.value) {
    formError.value = 'Сначала выберите секцию'
    return
  }
  uploading.value = true
  formError.value = ''
  try {
    const res = await manageApi.importApartments(entranceId.value, importFile.value)
    ui.toast(res.data || 'Файл загружен')
    importOpen.value = false
    await loadApartments()
  } catch (e) {
    formError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const exportCurrent = () => {
  if (!entranceId.value) {
    ui.toast('Сначала выберите секцию для выгрузки', 'error')
    return
  }
  const a = document.createElement('a')
  a.href = manageApi.exportApartmentsUrl(entranceId.value)
  a.download = 'apartments-sekciya-' + entranceId.value + '.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  ui.toast('Выгрузка файла началась')
}

const openEdit = (a) => {
  editForm.value = {
    id: a.id,
    number: a.number,
    floor: a.floor,
    area: a.area,
    price: a.price,
    type: a.type,
    status: a.status,
    bathroomType: a.bathroomType,
    hasBalcony: a.hasBalcony,
  }
  formError.value = ''
  editing.value = a
}
const saveEdit = async () => {
  saving.value = true
  formError.value = ''
  const dto = {
    id: editForm.value.id,
    number: editForm.value.number,
    floor: editForm.value.floor,
    area: editForm.value.area,
    price: editForm.value.price,
    type: editForm.value.type,
    status: editForm.value.status,
    bathroomType: editForm.value.bathroomType,
    hasBalcony: editForm.value.hasBalcony,
  }
  try {
    await manageApi.updateApartment(dto.id, dto)
    ui.toast('Квартира обновлена')
    editing.value = null
    await loadApartments()
  } catch (e) {
    formError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

const askDelete = (a) => {
  deleteTarget.value = a
}
const doDelete = async () => {
  busy.value = true
  try {
    await manageApi.deleteApartment(deleteTarget.value.id)
    ui.toast('Квартира №' + deleteTarget.value.number + ' удалена')
    deleteTarget.value = null
    await loadApartments()
  } catch (e) {
    ui.toast(e.message, 'error')
  } finally {
    busy.value = false
  }
}

watch(
  () => props.action,
  (a) => {
    if (!a) return
    if (a === 'import') {
      openImport()
    } else if (a === 'export') {
      exportCurrent()
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
.label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  width: 2rem;
  border-radius: 0.6rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  cursor: pointer;
}
.icon-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.btn-danger {
  background: #e11d48;
  color: #fff;
  box-shadow: 0 10px 20px -8px rgba(225, 29, 72, 0.6);
}
.btn-danger:hover {
  filter: brightness(1.08);
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
