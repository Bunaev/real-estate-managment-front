import { defineStore } from 'pinia'
import { ref } from 'vue'

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

  return { toasts, toast, dismiss }
})
