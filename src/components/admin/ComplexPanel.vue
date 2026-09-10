<template>
  <section class="space-y-6">
    <!-- Head -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-xl font-extrabold tracking-tight text-slate-900">Жилые комплексы</h3>
        <p class="mt-0.5 text-sm text-slate-500">Создание и редактирование объектов каталога</p>
      </div>
      <button class="btn btn-primary" @click="openMaster()">
        <AppIcon name="plus" :size="16" :stroke-width="2.6" />
        Создать ЖК
      </button>
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
      <AppIcon name="search" :size="16" stroke="#94a3b8" class="absolute left-4 top-1/2 -translate-y-1/2" />
      <input v-model="search" type="text" class="field !rounded-full !py-3 !pl-11" placeholder="Поиск по названию, застройщику, району…" />
    </div>

    <!-- State -->
    <p v-if="loading" class="py-10 text-center text-sm font-medium text-slate-400">Загружаем комплексы…</p>
    <div v-else-if="error" class="rounded-2xl bg-rose-50 px-5 py-6 text-center text-sm font-semibold text-rose-600">{{ error }}</div>

    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div v-if="!filtered.length" class="col-span-full rounded-3xl border border-dashed border-slate-300 px-5 py-14 text-center text-sm text-slate-400">Ничего не найдено</div>

      <div
        v-for="c in filtered"
        :key="c.id"
        class="flex flex-col overflow-hidden rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur transition hover:shadow-lg hover:ring-indigo-200"
      >
        <div class="flex items-center gap-4">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-lg" :style="{ background: gradientFor(c.id) }">
            {{ firstLetter(c.name) }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-base font-extrabold tracking-tight text-slate-900">{{ c.name }}</p>
            <p class="mt-0.5 truncate text-xs text-slate-500">{{ [c.developer, c.location, c.district].filter(Boolean).join(' · ') }}</p>
          </div>
          <span class="hidden shrink-0 flex-col items-end text-right sm:flex">
            <b class="text-lg font-black tabular-nums text-indigo-600">{{ c.countApartment || 0 }}</b>
            <span class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">квартир</span>
          </span>
        </div>

        <div class="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
          <div class="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span class="inline-flex items-center gap-1.5"><AppIcon name="building" :size="14" stroke="#818cf8" />{{ c.countBuildings || 0 }}</span>
            <span class="inline-flex items-center gap-1.5"><AppIcon name="door" :size="14" stroke="#818cf8" />{{ c.countEntrance || 0 }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="btn-sm btn-sm-primary" @click="emit('openTab', 'buildings', { complexId: c.id })">
              <AppIcon name="floor" :size="14" /> Корпуса
            </button>
            <button class="btn-sm" title="Редактировать (мастер)" @click="openMaster(c.id)">
              <AppIcon name="edit" :size="14" />
            </button>
            <button class="btn-sm btn-sm-danger" title="Удалить ЖК" @click="askDelete(c)">
              <AppIcon name="trash" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ МАСТЕР: создание / редактирование ЖК ============ -->
    <BaseModal
      :open="masterOpen"
      :title="editingId ? 'Редактирование ЖК' : 'Создание ЖК — мастер'"
      :subtitle="editingId ? 'Можно менять всё, включая метро, корпуса и секции' : 'Название, район, застройщик, метро и корпуса — за один раз'"
      width="xl"
      @close="closeMaster"
    >
      <!-- 1. Основные данные -->
      <h4 class="section-title">1 · Основные данные</h4>
      <div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="label">Название ЖК *</label>
          <input v-model="master.name" type="text" class="field" placeholder="Например: «Невский парк»" />
        </div>
        <div>
          <label class="label">Адрес *</label>
          <input v-model="master.address" type="text" class="field" placeholder="ул. Невская, 1" />
        </div>
        <div>
          <label class="label">Локация *</label>
          <select v-model="master.locationId" class="field" @change="onLocationChange">
            <option :value="null" disabled>Выберите локацию</option>
            <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Район *</label>
          <select v-model="master.districtId" class="field" :disabled="!master.locationId">
            <option :value="null" disabled>{{ districts.length ? 'Выберите район' : 'Сначала выберите локацию' }}</option>
            <option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label class="label">Застройщик *</label>
          <select v-model="master.developerId" class="field">
            <option :value="null" disabled>Выберите застройщика</option>
            <option v-for="d in developers" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
        </div>
      </div>

      <!-- 2. Рендер и точка на карте -->
      <h4 class="section-title mt-7">2 · Рендер и точка на карте</h4>
      <div class="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- Изображение-рендер -->
        <div>
          <label class="label">Рендер ЖК {{ editingId ? '' : '*' }}</label>
          <div
            role="button"
            tabindex="0"
            class="group relative flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-2 text-center transition"
            :class="dragOver ? 'border-indigo-400 bg-indigo-50/70' : 'border-slate-300 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40'"
            @click="fileInput?.click()"
            @keydown.enter.prevent="fileInput?.click()"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop"
          >
            <img
              v-if="previewUrl"
              :src="previewUrl"
              alt="Превью рендера"
              class="h-full w-full rounded-xl object-cover ring-1 ring-slate-900/10"
              style="box-shadow: inset 0 1px 12px rgba(15, 23, 42, 0.18)"
              @error="previewUrl = null"
            />
            <span v-else class="flex flex-col items-center gap-2 px-4">
              <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-500 ring-1 ring-slate-200">
                <AppIcon name="image" :size="20" />
              </span>
              <span class="text-xs font-bold text-slate-600">Перетащите картинку сюда или нажмите</span>
              <span class="text-[11px] text-slate-400">JPG, PNG или WebP · до 8 МБ</span>
            </span>
            <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFilePicked" />
          </div>
          <div class="mt-2 flex items-center justify-between gap-2 text-[11px]">
            <span class="min-w-0 truncate text-slate-400">{{ imageHint }}</span>
            <button v-if="previewUrl && renderFile" type="button" class="shrink-0 font-bold text-rose-500 transition hover:text-rose-600" @click="clearImage">
              Убрать файл
            </button>
          </div>
        </div>

        <!-- Точка на карте -->
        <div>
          <label class="label">Координаты ЖК {{ editingId ? '' : '*' }}</label>
          <MapPicker :latitude="master.latitude" :longitude="master.longitude" height="11rem" @change="onPointChange" />
          <div class="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label class="label">Широта</label>
              <input :value="master.latitude ?? ''" type="number" step="0.000001" class="field !py-2 !text-xs tabular-nums" placeholder="59.844421" @input="onCoordInput('latitude', $event.target.value)" />
            </div>
            <div>
              <label class="label">Долгота</label>
              <input :value="master.longitude ?? ''" type="number" step="0.000001" class="field !py-2 !text-xs tabular-nums" placeholder="30.340486" @input="onCoordInput('longitude', $event.target.value)" />
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Метро -->
      <h4 class="section-title mt-7">3 · Станции метро и расстояние</h4>
      <div class="mt-3 space-y-2.5">
        <div v-for="(row, ri) in master.metro" :key="ri" class="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70">
          <select v-model="row.metroStationId" class="field flex-1 !mb-0 min-w-40" :aria-label="'Станция ' + (ri + 1)">
            <option :value="null" disabled>Станция</option>
            <option v-for="m in metroStations" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
          <input v-model.number="row.distance" type="number" min="0" step="50" class="field !mb-0 w-36" placeholder="Расстояние, м" :aria-label="'Расстояние ' + (ri + 1)" />
          <button class="icon-btn icon-danger" :aria-label="'Удалить метро ' + (ri + 1)" @click="master.metro.splice(ri, 1)">
            <AppIcon name="close" :size="14" />
          </button>
        </div>
        <p v-if="!master.metro.length" class="text-xs text-slate-400">Метро не указано — можно добавить ниже</p>
        <button class="btn btn-ghost !py-2 !text-xs" @click="master.metro.push({ metroStationId: null, distance: null })">
          <AppIcon name="plus" :size="14" /> Добавить станцию метро
        </button>
      </div>

      <!-- 4. Корпуса и секции -->
      <h4 class="section-title mt-7">4 · Корпуса и секции</h4>
      <div class="mt-3 space-y-4">
        <div v-for="(b, bi) in master.buildings" :key="bi" class="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-extrabold uppercase tracking-wide text-slate-500">Корпус {{ bi + 1 }}</span>
            <button v-if="master.buildings.length > 1 || bi > 0" class="icon-btn icon-danger" :aria-label="'Удалить корпус ' + (bi + 1)" @click="master.buildings.splice(bi, 1)">
              <AppIcon name="trash" :size="14" />
            </button>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label class="label">Название корпуса *</label>
              <input v-model="b.name" type="text" class="field" placeholder="Например: «Корпус 1»" />
            </div>
            <div>
              <label class="label">Дата сдачи *</label>
              <input v-model="b.completionDate" type="date" class="field" />
            </div>
            <div>
              <label class="label">Дата выдачи ключей *</label>
              <input v-model="b.keyHandoverDate" type="date" class="field" />
            </div>
          </div>

          <div class="mt-4 rounded-2xl bg-slate-50 p-3">
            <p class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              <AppIcon name="door" :size="14" /> Секции (парадные)
            </p>
            <div class="space-y-2">
              <div v-for="(en, ei) in b.entrances" :key="ei" class="flex flex-wrap items-center gap-2">
                <input v-model="en.name" type="text" class="field !mb-0 min-w-36 flex-1" :placeholder="'Секция ' + (ei + 1) + ' — название'" :aria-label="'Секция ' + (ei + 1)" />
                <input v-model.number="en.maxFloor" type="number" min="1" class="field !mb-0 w-28" placeholder="Этажей" :aria-label="'Этажей в секции ' + (ei + 1)" />
                <button class="icon-btn icon-danger" :aria-label="'Удалить секцию ' + (ei + 1)" @click="b.entrances.splice(ei, 1)">
                  <AppIcon name="close" :size="14" />
                </button>
              </div>
            </div>
            <button class="btn btn-ghost mt-2.5 !py-2 !text-xs" @click="b.entrances.push({ name: '', maxFloor: null })">
              <AppIcon name="plus" :size="14" /> Добавить секцию
            </button>
          </div>
        </div>

        <button class="btn btn-ghost" @click="master.buildings.push(emptyBuilding())">
          <AppIcon name="plus" :size="15" /> Добавить корпус
        </button>
      </div>

      <p v-if="formError" class="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{{ formError }}</p>

      <template #footer>
        <button class="btn btn-ghost" @click="closeMaster">Отмена</button>
        <button class="btn btn-primary" :disabled="saving" @click="saveMaster">
          <span v-if="saving" class="loading-dot" />
          {{ saving ? (uploadPercent ? 'Отправка ' + uploadPercent + '%' : 'Сохраняем…') : (editingId ? 'Сохранить изменения' : 'Создать ЖК') }}
        </button>
      </template>
    </BaseModal>

    <!-- Delete confirm -->
    <BaseModal :open="!!deleteTarget" title="Удалить жилой комплекс?" width="sm" @close="deleteTarget = null">
      <p class="text-sm leading-relaxed text-slate-600">Комплекс <b>{{ deleteTarget?.name }}</b> будет удалён вместе с корпусами, секциями и квартирами. Действие необратимо.</p>
      <template #footer>
        <button class="btn btn-ghost" @click="deleteTarget = null">Отмена</button>
        <button class="btn btn-danger" :disabled="busy" @click="doDelete"><AppIcon name="trash" :size="15" /> Удалить</button>
      </template>
    </BaseModal>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/AppIcon.vue'
// Мини-карта выбора точки грузится лениво вместе с maplibre-gl
const MapPicker = defineAsyncComponent(() => import('@/components/MapPicker.vue'))
import { manageApi, referenceApi, complexApi, renderCoverUrl } from '@/api'
import { useUiStore } from '@/stores/uiStore'
import { complexGradient, firstLetter } from '@/utils/format.js'

const props = defineProps({
  action: { type: String, default: '' },
  chosen: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['handled', 'openTab'])

const ui = useUiStore()

const complexes = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const busy = ref(false)
const saving = ref(false)

const locations = ref([])
const developers = ref([])
const districts = ref([])
const metroStations = ref([])

const masterOpen = ref(false)
const editingId = ref(null)
const formError = ref('')
const master = ref(emptyMaster())
const deleteTarget = ref(null)

/* --- рендер и карта --- */
const IMAGE_MAX = 8 * 1024 * 1024
const fileInput = ref(null)
const renderFile = ref(null)
const previewUrl = ref(null)
const existingRenderUrl = ref(null)
const dragOver = ref(false)
const uploadPercent = ref(0)
let previewObjectUrl = null

const imageHint = computed(() => {
  if (renderFile.value) return `${renderFile.value.name} · ${(renderFile.value.size / 1024 / 1024).toFixed(2)} МБ`
  if (editingId.value && previewUrl.value) return 'Текущий рендер. Оставьте без файла, чтобы не менять'
  return editingId.value ? 'Новый рендер не выбран' : 'Для нового ЖК рендер обязателен'
})

const releasePreview = () => {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl)
    previewObjectUrl = null
  }
}

const setImageFile = (file) => {
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ui.toast('Нужен файл изображения: JPG, PNG или WebP', 'error')
    return
  }
  if (file.size > IMAGE_MAX) {
    ui.toast('Файл больше 8 МБ — выберите изображение поменьше', 'error')
    return
  }
  releasePreview()
  renderFile.value = file
  previewObjectUrl = URL.createObjectURL(file)
  previewUrl.value = previewObjectUrl
}
const onFilePicked = (e) => {
  setImageFile(e.target.files?.[0])
  if (fileInput.value) fileInput.value.value = ''
}
const onDrop = (e) => {
  dragOver.value = false
  setImageFile(e.dataTransfer?.files?.[0])
}
const clearImage = () => {
  releasePreview()
  renderFile.value = null
  previewUrl.value = editingId.value ? existingRenderUrl.value : null
}

const onPointChange = ({ latitude, longitude }) => {
  master.value.latitude = latitude
  master.value.longitude = longitude
}
const onCoordInput = (key, raw) => {
  const n = raw === '' || raw === null || raw === undefined ? null : Number(raw)
  master.value[key] = n === null || Number.isNaN(n) ? null : n
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return complexes.value
  return complexes.value.filter((c) => `${c.name} ${c.developer} ${c.location} ${c.district}`.toLowerCase().includes(q))
})

const gradientFor = (id) => complexGradient(id)

function emptyBuilding() {
  return { id: null, name: '', completionDate: '', keyHandoverDate: '', entrances: [] }
}
function emptyMaster() {
  return {
    name: '',
    address: '',
    locationId: null,
    districtId: null,
    developerId: null,
    latitude: null,
    longitude: null,
    metro: [],
    buildings: [emptyBuilding()],
  }
}

const loadAll = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await complexApi.getComplexes({}, 0, 100)
    complexes.value = res.data.content || []
  } catch (e) {
    error.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    loading.value = false
  }
}

const loadReferences = async () => {
  try {
    const [loc, dev, m] = await Promise.all([referenceApi.getLocations(), referenceApi.getDevelopers(), referenceApi.getMetroStations()])
    locations.value = loc.data || []
    developers.value = dev.data || []
    metroStations.value = m.data || []
  } catch (e) {
    ui.toast('Не удалось загрузить справочники: ' + e.message, 'error')
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
  } catch {
    districts.value = []
  }
}

const onLocationChange = async () => {
  master.value.districtId = null
  await loadDistricts(master.value.locationId)
}

const openMaster = async (id = null) => {
  releasePreview()
  master.value = emptyMaster()
  formError.value = ''
  editingId.value = id
  renderFile.value = null
  previewUrl.value = null
  existingRenderUrl.value = null
  dragOver.value = false
  uploadPercent.value = 0
  if (!locations.value.length) await loadReferences()

  if (id) {
    try {
      // edit-DTO не содержит координат — берём их из детальной карточки
      const [editRes, detailRes] = await Promise.all([manageApi.getComplexEdit(id), complexApi.getComplex(id)])
      const d = editRes.data
      const det = detailRes.data || {}
      master.value = {
        name: d.name || '',
        address: d.address || '',
        locationId: d.locationId ?? null,
        districtId: d.districtId ?? null,
        developerId: d.developerId ?? null,
        latitude: det.latitude ?? null,
        longitude: det.longitude ?? null,
        metro: (d.metroDistances || []).map((m) => ({ metroStationId: m.metroStationId, distance: m.distance })),
        buildings:
          d.buildings && d.buildings.length
            ? d.buildings.map((b) => ({
                id: b.id,
                name: b.name || '',
                completionDate: b.completionDate || '',
                keyHandoverDate: b.keyHandoverDate || '',
                entrances: (b.entrances || []).map((e) => ({ id: e.id, name: e.name || '', maxFloor: e.maxFloor ?? null })),
              }))
            : [emptyBuilding()],
      }
      existingRenderUrl.value = `${renderCoverUrl(id)}?v=${Date.now()}`
      previewUrl.value = existingRenderUrl.value
      if (d.locationId) await loadDistricts(d.locationId)
    } catch (e) {
      ui.toast('Не удалось загрузить данные ЖК: ' + e.message, 'error')
      return
    }
  } else {
    districts.value = []
  }
  masterOpen.value = true
}

const closeMaster = () => {
  masterOpen.value = false
  editingId.value = null
  formError.value = ''
  releasePreview()
  renderFile.value = null
  previewUrl.value = null
}

onBeforeUnmount(releasePreview)

const buildPayload = () => {
  const m = master.value
  if (!m.name.trim() || !m.address.trim() || !m.districtId || !m.developerId) {
    formError.value = 'Заполните название, адрес, район и застройщика'
    return null
  }
  if (m.latitude == null || m.longitude == null || Number.isNaN(Number(m.latitude)) || Number.isNaN(Number(m.longitude))) {
    formError.value = 'Укажите точку ЖК на карте — иначе объект не появится на карте города'
    return null
  }
  if (Number(m.latitude) < -90 || Number(m.latitude) > 90 || Number(m.longitude) < -180 || Number(m.longitude) > 180) {
    formError.value = 'Координаты вне допустимых значений (широта ±90, долгота ±180)'
    return null
  }
  if (!editingId.value && !renderFile.value) {
    formError.value = 'Прикрепите рендер ЖК — сервер сохраняет картинку вместе с объектом'
    return null
  }
  const metroStationsOut = m.metro
    .filter((r) => r.metroStationId && r.distance != null)
    .map((r) => ({ metroStationId: Number(r.metroStationId), distance: Number(r.distance) }))

  const buildings = []
  for (const b of m.buildings) {
    if (!b.name.trim()) continue
    if (!b.completionDate || !b.keyHandoverDate) {
      formError.value = 'Для каждого корпуса укажите даты сдачи и выдачи ключей'
      return null
    }
    const entrances = []
    for (const en of b.entrances) {
      if (!en.name.trim()) continue
      if (en.maxFloor == null || en.maxFloor < 1) {
        formError.value = `Для секции «${en.name}» укажите количество этажей`
        return null
      }
      entrances.push({ id: en.id ?? null, name: en.name.trim(), maxFloor: Number(en.maxFloor) })
    }
    buildings.push({
      id: b.id ?? null,
      name: b.name.trim(),
      completionDate: b.completionDate,
      keyHandoverDate: b.keyHandoverDate,
      entrances,
    })
  }
  if (!buildings.length) {
    formError.value = 'Добавьте хотя бы один корпус'
    return null
  }
  return {
    id: editingId.value ? Number(editingId.value) : undefined,
    name: m.name.trim(),
    address: m.address.trim(),
    districtId: Number(m.districtId),
    developerId: Number(m.developerId),
    latitude: Number(m.latitude),
    longitude: Number(m.longitude),
    metroStations: metroStationsOut,
    buildings,
  }
}

const saveMaster = async () => {
  const payload = buildPayload()
  if (!payload) return
  saving.value = true
  formError.value = ''
  uploadPercent.value = 0
  const onProgress = (e) => {
    if (e?.total) uploadPercent.value = Math.round((e.loaded / e.total) * 100)
  }
  try {
    if (editingId.value) {
      await manageApi.updateComplex(editingId.value, payload, renderFile.value, onProgress)
      ui.toast('Жилой комплекс обновлён')
    } else {
      await manageApi.createComplex(payload, renderFile.value, onProgress)
      ui.toast('Жилой комплекс создан')
    }
    closeMaster()
    await loadAll()
  } catch (e) {
    const msg = e.message || 'Не удалось сохранить'
    formError.value = /multipart|not supported/i.test(msg)
      ? `Сервер не принял multipart-запрос: «${msg}». Контроллеру нужны @RequestPart("dto") и @RequestPart("file") вместо @RequestBody.`
      : msg
    ui.toast(formError.value, 'error')
  } finally {
    saving.value = false
    uploadPercent.value = 0
  }
}

const askDelete = (c) => {
  deleteTarget.value = c
}
const doDelete = async () => {
  busy.value = true
  try {
    await manageApi.deleteComplex(deleteTarget.value.id)
    ui.toast('ЖК «' + deleteTarget.value.name + '» удалён')
    deleteTarget.value = null
    await loadAll()
  } catch (e) {
    ui.toast(e.message, 'error')
  } finally {
    busy.value = false
  }
}

/* Действие из шапки «Создать ЖК» */
const tryRunAction = (a) => {
  if (a === 'create-complex') {
    openMaster()
    emit('handled')
  }
}
watch(
  () => props.action,
  (a, prev) => {
    if (a && a !== prev) tryRunAction(a)
  },
  { immediate: true }
)

onMounted(() => {
  loadAll()
  loadReferences()
})
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
.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #4338ca;
}
.section-title::after {
  content: '';
  height: 1px;
  flex: 1;
  background: #e2e8f0;
}
.btn-sm {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 0.65rem;
  padding: 0.45rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}
.btn-sm:hover {
  background: #e0e7ff;
}
.btn-sm-primary {
  background: linear-gradient(135deg, #4f46e5, #6d28d9);
  color: #fff;
  box-shadow: 0 6px 14px -8px rgba(79, 70, 229, 0.55);
}
/* Важно: перекрываем общий .btn-sm:hover (светлый фон), иначе белый текст на светлом */
.btn-sm-primary:hover {
  background: linear-gradient(135deg, #4338ca, #5b21b6);
  color: #fff;
  box-shadow: 0 7px 16px -8px rgba(79, 70, 229, 0.6);
}
.btn-sm-danger {
  background: #fff1f2;
  color: #e11d48;
}
.btn-sm-danger:hover {
  background: #ffe4e6;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.1rem;
  width: 2.1rem;
  border-radius: 0.7rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #64748b;
  transition: all 0.2s;
  cursor: pointer;
}
.icon-btn:hover {
  background: #f1f5f9;
}
.icon-danger:hover {
  background: #fff1f2;
  color: #e11d48;
  border-color: #fecdd3;
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
