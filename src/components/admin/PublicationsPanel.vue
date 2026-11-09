<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h3 class="text-xl font-extrabold tracking-tight text-slate-900">Публикации</h3>
        <p class="mt-0.5 text-sm text-slate-500">Все события на главной странице, включая запланированные и архивные</p>
      </div>
      <button class="btn btn-ghost" :disabled="loading" @click="loadEvents">
        <AppIcon name="rotate" :size="15" />
        Обновить
      </button>
    </div>

    <div v-if="loading && !events.length" class="grid gap-4">
      <div v-for="i in 3" :key="i" class="h-32 rounded-2xl bg-slate-100/80 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-3xl bg-rose-50 px-5 py-8 text-center ring-1 ring-rose-200">
      <AppIcon name="alert" :size="28" />
      <p class="mt-3 text-sm font-semibold text-rose-600">{{ error }}</p>
      <button class="btn btn-primary mt-4" @click="loadEvents">Попробовать снова</button>
    </div>

    <div v-else-if="!events.length" class="rounded-3xl bg-white/85 px-5 py-12 text-center ring-1 ring-slate-200/70">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-400">
        <AppIcon name="sparkles" :size="28" />
      </div>
      <h4 class="mt-4 text-base font-bold text-slate-800">Публикаций пока нет</h4>
      <p class="mt-1 text-sm text-slate-500">Создайте публикацию через «Матрицу цен» или прямой эндпоинт.</p>
    </div>

    <div v-else class="overflow-hidden rounded-3xl bg-white/90 ring-1 ring-slate-200/70 shadow-sm backdrop-blur">
      <div class="divide-y divide-slate-100">
        <div
          v-for="event in events"
          :key="event.id"
          class="group transition-all duration-200 hover:bg-slate-50/70"
        >
          <div class="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-4 sm:px-5">
            <div class="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
              <img
                v-if="event.eventPictureKey"
                :src="publicFileUrl(event.eventPictureKey)"
                alt=""
                class="h-full w-full object-cover"
                loading="lazy"
              />
              <div v-else class="flex h-full w-full items-center justify-center">
                <AppIcon name="image" :size="20" stroke="#94a3b8" />
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-extrabold text-slate-800">{{ typeMeta(event.type).label }}</span>
                <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="statusMeta(event.status).chip">
                  {{ statusMeta(event.status).label }}
                </span>
                <span v-if="event.taskId" class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600">
                  задача #{{ event.taskId }}
                </span>
              </div>

              <p class="mt-1 text-sm leading-relaxed text-slate-600">{{ event.eventContent || '—' }}</p>

              <p class="mt-1 text-xs text-slate-400">
                ID {{ event.id }}
                <span v-if="event.targetName"> · {{ event.targetName }}</span>
                <span v-if="event.startPublishEvent || event.endPublishEvent">
                  · {{ formatDate(event.startPublishEvent) }} – {{ formatDate(event.endPublishEvent) }}
                </span>
              </p>
            </div>

            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <button class="icon-btn" title="Редактировать" @click.stop="openEdit(event)">
                <AppIcon name="edit" :size="15" stroke="#6366f1" />
              </button>
              <button class="icon-btn" title="Удалить" @click.stop="askDelete(event)">
                <AppIcon name="trash" :size="15" stroke="#e11d48" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit modal -->
    <BaseModal :open="!!editing" title="Редактирование публикации" :subtitle="'ID: ' + (editing?.id ?? '')" width="lg" @close="closeEdit">
      <div v-if="editing" class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Тип</label>
            <select v-model="form.type" class="field">
              <option v-for="(meta, key) in TYPE_META" :key="key" :value="key">{{ meta.label }}</option>
            </select>
          </div>
          <div>
            <label class="label">Статус</label>
            <select v-model="form.status" class="field">
              <option v-for="(meta, key) in STATUS_META" :key="key" :value="key">{{ meta.label }}</option>
            </select>
          </div>
          <div>
            <label class="label">Название объекта</label>
            <input v-model="form.targetName" type="text" class="field" placeholder="ЖК, корпус...">
          </div>
          <div>
            <label class="label">Ключ картинки</label>
            <input v-model="form.eventPictureKey" type="text" class="field" placeholder="complexes/1/photo.jpg">
          </div>
          <div>
            <label class="label">Дата начала</label>
            <input v-model="form.startEventDate" type="date" class="field">
          </div>
          <div>
            <label class="label">Дата окончания</label>
            <input v-model="form.endEventDate" type="date" class="field">
          </div>
          <div>
            <label class="label">Дата события</label>
            <input v-model="form.eventDate" type="date" class="field">
          </div>
          <div>
            <label class="label">ID задачи</label>
            <input v-model.number="form.taskId" type="number" min="0" class="field">
          </div>
        </div>
        <div>
          <label class="label">Текст публикации</label>
          <textarea v-model="form.content" rows="4" class="field resize-y"></textarea>
        </div>

        <p v-if="editError" class="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{{ editError }}</p>
      </div>
      <template #footer>
        <button class="btn btn-ghost" :disabled="saving" @click="closeEdit">Отмена</button>
        <button class="btn btn-primary" :disabled="saving" @click="saveEdit">
          <span v-if="saving" class="loading-dot" />
          {{ saving ? 'Сохраняем…' : 'Сохранить' }}
        </button>
      </template>
    </BaseModal>

    <!-- Delete confirm -->
    <BaseModal :open="!!deleteTarget" title="Удалить публикацию?" width="sm" @close="deleteTarget = null">
      <p class="text-sm text-slate-600">Публикация <b>#{{ deleteTarget?.id }}</b> будет удалена. Действие необратимо.</p>
      <p v-if="deleteError" class="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{{ deleteError }}</p>
      <template #footer>
        <button class="btn btn-ghost" :disabled="busy" @click="deleteTarget = null">Отмена</button>
        <button class="btn btn-danger" :disabled="busy" @click="doDelete">
          <span v-if="busy" class="loading-dot" />
          {{ busy ? 'Удаляем…' : 'Удалить' }}
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/AppIcon.vue'
import { publisherApi, publicFileUrl } from '@/api'
import { useUiStore } from '@/stores/uiStore'

const ui = useUiStore()
const events = ref([])
const loading = ref(false)
const error = ref('')

const editing = ref(null)
const form = ref({})
const saving = ref(false)
const editError = ref('')
const deleteTarget = ref(null)
const busy = ref(false)
const deleteError = ref('')

const TYPE_META = {
  CHANGE_PRICE: { label: 'Изменение цен', icon: 'stats' },
  NEWS: { label: 'Новости', icon: 'sparkles' },
  START_OF_SALES: { label: 'Старт продаж', icon: 'building' },
}

const STATUS_META = {
  SCHEDULED: { label: 'Запланирована', chip: 'bg-amber-50 text-amber-700' },
  PUBLISHED: { label: 'Опубликована', chip: 'bg-emerald-50 text-emerald-700' },
  ARCHIVED: { label: 'Архив', chip: 'bg-slate-100 text-slate-500' },
}

const typeMeta = (type) => TYPE_META[type] || { label: type || 'Публикация', icon: 'sparkles' }
const statusMeta = (status) => STATUS_META[status] || { label: status || '—', chip: 'bg-slate-100 text-slate-500' }

function formatDate(value) {
  if (!value) return '—'
  const text = String(value).slice(0, 10)
  const parts = text.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return text
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

const loadEvents = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await publisherApi.getAllEvents()
    events.value = (res.data || []).slice().sort((a, b) => {
      const left = a.startPublishEvent || a.eventDate || ''
      const right = b.startPublishEvent || b.eventDate || ''
      return left === right ? 0 : (left < right ? 1 : -1)
    })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const openEdit = (event) => {
  editError.value = ''
  editing.value = event
  form.value = {
    type: event.type,
    status: event.status,
    targetName: event.targetName || '',
    content: event.eventContent || '',
    startEventDate: event.startPublishEvent || '',
    endEventDate: event.endPublishEvent || '',
    eventDate: event.eventDate || '',
    eventPictureKey: event.eventPictureKey || '',
    taskId: event.taskId || null,
  }
}

const closeEdit = () => {
  editing.value = null
  form.value = {}
  editError.value = ''
}

const saveEdit = async () => {
  editError.value = ''
  saving.value = true
  try {
    await publisherApi.updateEvent(editing.value.id, {
      type: form.value.type,
      status: form.value.status,
      targetName: form.value.targetName,
      content: form.value.content,
      startEventDate: form.value.startEventDate || null,
      endEventDate: form.value.endEventDate || null,
      eventDate: form.value.eventDate || null,
      eventPictureKey: form.value.eventPictureKey || null,
      taskId: form.value.taskId || null,
    })
    ui.toast('Публикация обновлена')
    closeEdit()
    await loadEvents()
  } catch (e) {
    editError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

const askDelete = (event) => {
  deleteError.value = ''
  deleteTarget.value = event
}

const doDelete = async () => {
  deleteError.value = ''
  busy.value = true
  try {
    await publisherApi.deleteEvent(deleteTarget.value.id)
    ui.toast('Публикация удалена')
    deleteTarget.value = null
    await loadEvents()
  } catch (e) {
    deleteError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    busy.value = false
  }
}

onMounted(loadEvents)
</script>