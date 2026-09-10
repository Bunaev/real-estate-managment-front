import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useComplexStore = defineStore('complex', () => {
    const complexes = ref([])
    const total = ref(0)
    const totalPages = ref(0)
    const currentPage = ref(0)
    const loading = ref(false)
    const error = ref(null)

    const fetchComplexes = async (filters = {}, page = 0, size = 9) => {
        loading.value = true
        error.value = null
        currentPage.value = page

        try {
            const params = { page, size, ...filters }
            const response = await api.get('/complexes', { params })
            complexes.value = response.data.content || []
            total.value = response.data.totalElements || 0
            const sz = response.data.size || size
            totalPages.value = Math.ceil(total.value / sz) || 1
        } catch (err) {
            error.value = err.message
            console.error('Ошибка загрузки ЖК:', err)
        } finally {
            loading.value = false
        }
    }

    return { complexes, total, totalPages, currentPage, loading, error, fetchComplexes }
})