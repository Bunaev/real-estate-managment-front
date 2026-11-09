import { defineStore } from 'pinia'
import { ref } from 'vue'
import { manageApi } from '@/api'

export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])
  let seq = 0

  const dismiss = (id) => {
    const i = toasts.value.findIndex((t) => t.id === id)
    if (i > -1) toasts.value.splice(i, 1)
  }

  const toast = (message, type = 'success', duration = 3800) => {
    const id = ++seq
    toasts.value.push({ id, message, type })
    setTimeout(() => dismiss(id), duration)
    return id
  }

  /* ---------- Планировки: приглашение после импорта + глобальное окно ---------- */
  /** Контекст `{ entranceId, entranceName, apartments }` для догрузки планировок */
  const pendingPlanUpload = ref(null)
  const planInviteOpen = ref(false)
  const planUploadOpen = ref(false)
const missingPlansSummary = ref([])
  const missingPlansLoading = ref(false)

  /** Показать красивое приглашение и запомнить контекст (если закроют — останется кнопка в шапке) */
  const offerPlanUpload = (context) => {
    pendingPlanUpload.value = context
    planInviteOpen.value = true
    refreshMissingPlansSummary()
  }

  /** Открыть непосредственно окно загрузки планировок (из приглашения или из шапки) */
  const openPlanUpload = (context) => {
    if (context) pendingPlanUpload.value = context
    planInviteOpen.value = false
    planUploadOpen.value = true
  }

  const closePlanInvite = () => {
    planInviteOpen.value = false
    // pendingPlanUpload не чистим: кнопка «Догрузить планировки» остаётся в шапке
  }

  const closePlanUpload = () => {
    planUploadOpen.value = false
    // Если пользователь закрыл окно без загрузки — pending тоже сохраняем
  }

  /** Вызывать после фактической загрузки/отмены выполненного сценария */
  const completePlanUpload = () => {
    planInviteOpen.value = false
    planUploadOpen.value = false
    pendingPlanUpload.value = null
    refreshMissingPlansSummary()
  }

  const clearPendingPlanUpload = () => {
    pendingPlanUpload.value = null
  }
const refreshMissingPlansSummary = async () => {
    missingPlansLoading.value = true
    try {
      const res = await manageApi.getMissingPlansSummary()
      missingPlansSummary.value = res.data || []
    } catch {
      // При сетевой/серверной ошибке не прячем уже известные незагруженные планировки:
      // уведомление должно исчезать только когда бэкенд подтвердил, что всё загружено.
    } finally {
      missingPlansLoading.value = false
    }
  }

  return {
    toasts,
    toast,
    dismiss,
    pendingPlanUpload,
    planInviteOpen,
    planUploadOpen,
    missingPlansSummary,
    missingPlansLoading,
    offerPlanUpload,
    openPlanUpload,
    closePlanInvite,
    closePlanUpload,
    completePlanUpload,
    clearPendingPlanUpload,
    refreshMissingPlansSummary,
  }
})
