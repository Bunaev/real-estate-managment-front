import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 25000,
  // ВАЖНО: Content-Type здесь не задаём. Иначе axios превращает FormData в JSON
  // (transformRequest конвертирует FormData при JSON-заголовке) и multipart ломается.
  // Для обычных объектов axios сам ставит application/json, для FormData — multipart + boundary.
  paramsSerializer: {
    serialize: (params) => {
      const search = new URLSearchParams()
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null && v !== '') search.append(key, v)
          })
        } else {
          search.append(key, value)
        }
      })
      return search.toString()
    },
  },
})

const httpErrorText = {
  400: 'Некорректные данные запроса',
  401: 'Требуется авторизация',
  403: 'Доступ запрещён',
  404: 'Запись не найдена',
  409: 'Конфликт с текущими данными',
  422: 'Данные не прошли проверку',
  500: 'Ошибка сервера',
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data
    let message
    if (typeof data === 'string' && data) message = data
    else if (data?.message) message = data.message
    else if (data?.error) message = data.error
    else if (error.response?.status && httpErrorText[error.response.status]) message = httpErrorText[error.response.status]
    else message = error.message || 'Сервер временно недоступен'
    return Promise.reject(new Error(message))
  }
)

/* ---------------- Каталог: ЖК ---------------- */
export const complexApi = {
  getComplexes: (params = {}, page = 0, size = 9) => api.get('/complexes', { params: { page, size, ...params } }),
  getComplex: (id) => api.get('/complexes/' + id),
  getSuggestions: (query, limit = 7) => api.get('/complexes/suggest', { params: { q: query, limit } }),
  getDocumentPath: (id) => api.get('/complexes/documents/' + id),
  getPresentation: (id) => api.get('/complexes/presentation/' + id),
  getPresentationFolder: (id) => api.get('/complexes/presentation-folder/' + id),
}

/* ---------------- Каталог: квартиры (FilterDTO) ---------------- */
export const apartmentApi = {
  filter: (filters = {}, page = 0, size = 20) =>
    api.get('/apartments/filter', { params: { page, size, ...filters } }),
}

/* Публичное файловое хранилище (MinIO). В DTO приходит только ключ (keyRenderPath). */
const PUBLIC_STORAGE_BASE = (import.meta.env.VITE_PUBLIC_STORAGE_URL || 'http://localhost:9000/rem-public').replace(/\/+$/, '')

/** Ссылка на публичный файл по ключу из DTO (keyRenderPath и т.п.). */
export function publicFileUrl(key) {
  if (!key) return null
  return `${PUBLIC_STORAGE_BASE}/${String(key).replace(/^\/+/, '')}`
}

/** Список объектов в публичном бакете MinIO через S3 ListObjectsV2 (дельimeter=/). */
export async function listMinioObjects(prefix = '') {
  const normalized = prefix.replace(/^\/+/, '')
  const url = `${PUBLIC_STORAGE_BASE}?list-type=2&prefix=${encodeURIComponent(normalized)}&delimiter=/`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  let res
  try {
    res = await fetch(url, { signal: controller.signal })
  } catch (e) {
    clearTimeout(timer)
    throw new Error('Не удалось подключиться к MinIO. Проверьте CORS и доступ к ListBucket.')
  }
  clearTimeout(timer)

  if (!res.ok) throw new Error('Не удалось получить список файлов')

  const xml = await res.text()
  const doc = new DOMParser().parseFromString(xml, 'application/xml')

  const folders = Array.from(doc.getElementsByTagName('Prefix'))
    .map((el) => el.textContent || '')
    .filter(Boolean)
    .filter((p) => p !== normalized)
    .map((p) => ({
      name: p.replace(/\/+$/, '').split('/').filter(Boolean).pop() || p,
      path: p,
    }))

  const files = Array.from(doc.getElementsByTagName('Contents'))
    .map((el) => {
      const key = el.getElementsByTagName('Key')[0]?.textContent || ''
      const size = Number(el.getElementsByTagName('Size')[0]?.textContent || 0)
      if (!key || key.endsWith('/')) return null
      return {
        key,
        name: key.split('/').filter(Boolean).pop() || key,
        size,
        url: publicFileUrl(key),
      }
    })
    .filter(Boolean)

  return { folders, files }
}

/* ---------------- Управление ---------------- */
/* DTO + картинка рендера уходят одним multipart-запросом (части `dto` и `file`):
   бэкенд ожидает @RequestPart("dto") / @RequestPart("file"). */
const buildComplexForm = (dto, file) => {
  const form = new FormData()
  form.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }))
  if (file) form.append('file', file)
  return form
}

export const manageApi = {
  // ЖК
  createComplex: (dto, file, onUploadProgress) =>
    api.post('/complexes', buildComplexForm(dto, file), {
      timeout: 120000,
      onUploadProgress,
    }),
  updateComplex: (id, dto, file, onUploadProgress) =>
    // PUT без id в пути: id передаётся внутри части dto
    api.put('/complexes', buildComplexForm({ ...dto, id: dto?.id ?? id }, file), {
      timeout: 120000,
      onUploadProgress,
    }),
  deleteComplex: (id) => api.delete('/complexes/' + id),
  getComplexEdit: (id) => api.get('/complexes/' + id + '/edit'),
uploadComplexDocuments: (path, files) => {
      const form = new FormData()
      ;(files || []).forEach((f) => form.append('files', f))
      return api.put('/complexes/documents', form, { params: { path }, timeout: 120000 })
    },
    uploadComplexPresentation: (path, file) => {
      const form = new FormData()
      form.append('file', file)
      return api.put('/complexes/presentation', form, { params: { path }, timeout: 120000 })
    },
    deleteComplexDocument: (key) => api.delete('/complexes/documents', { params: { key } }),
    deleteComplexPresentation: (key) => api.delete('/complexes/presentation', { params: { key } }),

  // Корпуса
  getBuildings: (complexId) => api.get('/buildings/by-complex/' + complexId),
  createBuilding: (complexId, data) => api.post('/buildings', data, { params: { residentialComplexId: complexId } }),

  // Секции
  getEntrances: (buildingId) => api.get('/entrances/by-building/' + buildingId),
  createEntrance: (buildingId, data) => api.post('/entrances', data, { params: { buildingId } }),
getMissingPlansSummary: () => api.get('/apartments/missing-plans-summary'),

  // Квартиры (FilterDTO: residentialComplexId / buildingId / entranceId / status / types / диапазоны)
  getApartments: (params = {}, page = 0, size = 20) => api.get('/apartments/filter', { params: { page, size, ...params } }),
  updateApartment: (id, data, planFile = null, entrancePlanFile = null) => {
      const form = new FormData()
      form.append('dto', new Blob([JSON.stringify(data)], { type: 'application/json' }))
      if (planFile) form.append('planFile', planFile)
      if (entrancePlanFile) form.append('entrancePlanFile', entrancePlanFile)
      return api.put('/apartments/' + id, form, { timeout: 120000 })
    },
  deleteApartment: (id) => api.delete('/apartments/' + id),
    priceMatrix: (filter, type, value, operation) => {
      const form = new FormData()
      form.append('filter', new Blob([JSON.stringify(filter)], { type: 'application/json' }))
      form.append('type', new Blob([JSON.stringify(type)], { type: 'application/json' }))
      form.append('value', new Blob([JSON.stringify(value)], { type: 'application/json' }))
      form.append('operation', new Blob([JSON.stringify(operation)], { type: 'application/json' }))
      return api.put('/apartments/price-matrix', form, { timeout: 120000 })
    },
schedulePriceChange: (data) => api.post('/scheduled-tasks/price-change', { ...data, type: 'CHANGE_PRICE' }, { timeout: 120000 }),
  getAllScheduledTasks: () => api.get('/scheduled-tasks'),
  updateSchedulePriceChange: (id, data) => api.put(`/scheduled-tasks/price-change/${id}`, { ...data, type: 'CHANGE_PRICE' }, { timeout: 120000 }),
  deleteScheduledTask: (id) => api.delete(`/scheduled-tasks/${id}`),
  importApartments: (entranceId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/import-apartments', form, { params: { entranceId } }) // axios сам подставит multipart boundary
  },
/** Загрузка планировок zip-архивом: облегчённый список квартир как JSON-часть + файл */
    importApartmentRenders: (apartments, file) => {
      const form = new FormData()
      form.append('apartments', new Blob([JSON.stringify(apartments)], { type: 'application/json' }), 'apartments.json')
      form.append('file', file)
      return api.post('/import-apartments-renders', form, { timeout: 120000 }) // axios сам подставит multipart boundary
    },
  exportApartmentsUrl: (entranceId) => `${api.defaults.baseURL}/export-apartments/${entranceId}`,
}

/* ---------------- Публикация событий ---------------- */
export const publisherApi = {
  getEvents: () => api.get('/publisher'),
    getAllEvents: () => api.get('/publisher/all'),
    updateEvent: (id, event) => api.put(`/publisher/${id}`, event),
    deleteEvent: (id) => api.delete(`/publisher/${id}`),
  createEvent: (event) => api.post('/publisher', event),
}

/* ---------------- Справочники ---------------- */
export const referenceApi = {
  getLocations: () => api.get('/locations'),
  getDistrictsByLocation: (locationId) => api.get('/districts/by-location/' + locationId),
  getDevelopers: () => api.get('/developers'),
  getMetroStations: () => api.get('/metro-stations'),
  createLocation: (name) => api.post('/locations', null, { params: { name } }),
  createDeveloper: (name) => api.post('/developers', null, { params: { name } }),
  createMetroStation: (name) => api.post('/metro-stations', null, { params: { name } }),
  createDistrict: (name, locationId) => api.post('/districts', null, { params: { name, locationId } }),
}

export default api
