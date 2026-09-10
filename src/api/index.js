import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 25000,
  headers: { 'Content-Type': 'application/json' },
  // Flatten arrays into repeated query keys (Spring binds `ids=1&ids=2` to List<Integer>),
  // and skip null/undefined/empty values.
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
}

/* ---------------- Каталог: квартиры (FilterDTO) ---------------- */
export const apartmentApi = {
  filter: (filters = {}, page = 0, size = 20) =>
    api.get('/apartments/filter', { params: { page, size, ...filters } }),
}

/* URL картинки-рендера ЖК (GET /complexes/{id}/render) */
export function renderCoverUrl(id) {
  const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
  return `${base}/complexes/${id}/render`
}

/* ---------------- Управление ---------------- */
export const manageApi = {
  // ЖК
  createComplex: (data) => api.post('/complexes', data),
  updateComplex: (id, data) => api.put('/complexes/' + id, data),
  deleteComplex: (id) => api.delete('/complexes/' + id),
  getComplexEdit: (id) => api.get('/complexes/' + id + '/edit'),

  // Корпуса
  getBuildings: (complexId) => api.get('/buildings/by-complex/' + complexId),
  createBuilding: (complexId, data) => api.post('/buildings', data, { params: { residentialComplexId: complexId } }),

  // Секции
  getEntrances: (buildingId) => api.get('/entrances/by-building/' + buildingId),
  createEntrance: (buildingId, data) => api.post('/entrances', data, { params: { buildingId } }),

  // Квартиры
  getApartments: (complexId, page = 0, size = 12) => api.get('/apartments', { params: { complexId, page, size } }),
  updateApartment: (id, data) => api.put('/apartments/' + id, data),
  deleteApartment: (id) => api.delete('/apartments/' + id),
  importApartments: (entranceId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/import-apartments', form, { params: { entranceId } }) // axios сам подставит multipart boundary
  },
  exportApartmentsUrl: (entranceId) => `${api.defaults.baseURL}/export-apartments/${entranceId}`,
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
