<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h3 class="text-xl font-extrabold tracking-tight text-slate-900">Отложенные задачи</h3>
        <p class="mt-0.5 text-sm text-slate-500">Все запланированные и выполненные операции, отсортированные по сроку выполнения</p>
      </div>
      <button class="btn btn-ghost" :disabled="loading" @click="loadTasks">
        <AppIcon name="rotate" :size="15" />
        Обновить
      </button>
    </div>

    <div v-if="loading && !tasks.length" class="grid gap-4">
      <div v-for="i in 3" :key="i" class="h-28 rounded-2xl bg-slate-100/80 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-3xl bg-rose-50 px-5 py-8 text-center ring-1 ring-rose-200">
      <AppIcon name="alert" :size="28" />
      <p class="mt-3 text-sm font-semibold text-rose-600">{{ error }}</p>
      <button class="btn btn-primary mt-4" @click="loadTasks">Попробовать снова</button>
    </div>

    <div v-else-if="!tasks.length" class="rounded-3xl bg-white/85 px-5 py-12 text-center ring-1 ring-slate-200/70">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
        <AppIcon name="clock" :size="28" />
      </div>
      <h4 class="mt-4 text-base font-bold text-slate-800">Задач пока нет</h4>
      <p class="mt-1 text-sm text-slate-500">Запланируйте изменение цен через «Матрицу цен».</p>
    </div>

    <div v-else class="overflow-hidden rounded-3xl bg-white/90 ring-1 ring-slate-200/70 shadow-sm backdrop-blur">
      <div class="divide-y divide-slate-100">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="group relative transition-all duration-200 hover:bg-slate-50/70"
        >
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-5">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-black text-slate-600" :class="typeMeta(task.type).chip">
              <AppIcon :name="typeMeta(task.type).icon" :size="18" />
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-extrabold text-slate-800">{{ typeMeta(task.type).label }}</span>
                <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="statusMeta(task.status).chip">
                  {{ statusMeta(task.status).label }}
                </span>
                <span v-if="task.publishNews" class="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                  <AppIcon name="sparkles" :size="12" /> с публикацией
                </span>
              </div>
              <p class="mt-0.5 text-xs text-slate-400">ID {{ task.id }} · deadline {{ formatDateTime(task.deadline) }}</p>
            </div>

            <div class="text-right">
              <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Исполнение</p>
              <p class="text-sm font-black tabular-nums text-slate-700">{{ formatDateTime(task.deadline) }}</p>
            </div>

            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <button class="icon-btn" title="Редактировать" @click.stop="openEdit(task)">
                <AppIcon name="edit" :size="15" stroke="#6366f1" />
              </button>
              <button class="icon-btn" title="Удалить" @click.stop="askDelete(task)">
                <AppIcon name="trash" :size="15" stroke="#e11d48" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit task modal -->
    <BaseModal :open="!!editing" title="Редактирование задачи" :subtitle="'ID: ' + (editing?.id ?? '')" width="xl" @close="closeEdit">
      <div v-if="editing" class="space-y-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Дата и время выполнения</label>
            <input v-model="form.deadline" type="datetime-local" class="field" required />
          </div>
          <div>
            <label class="label">Дата начала публикации</label>
            <input v-model="form.publishStartDate" type="date" class="field" />
          </div>
          <div>
            <label class="label">Жилой комплекс</label>
            <select v-model.number="form.complexId" class="field" @change="onComplexChange">
              <option v-for="c in complexes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Корпус</label>
            <select v-model.number="form.buildingId" class="field" @change="onBuildingChange">
              <option :value="null">— Весь комплекс —</option>
              <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Секция</label>
            <select v-model.number="form.entranceId" class="field">
              <option :value="null">— Все секции —</option>
              <option v-for="e in entrances" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Тип изменения</label>
            <select v-model="form.typeChange" class="field">
              <option value="ABSOLUTE_PRICE">Установить цену за м²</option>
              <option value="FIXED_PER_SQM">Сумма к м²</option>
              <option value="PERCENT">Процент</option>
            </select>
          </div>
          <div>
            <label class="label">Значение</label>
            <input v-model.number="form.value" type="number" step="any" min="0.01" class="field" />
          </div>
          <div>
            <label class="label">Направление</label>
            <select v-model="form.arithmeticalOperation" class="field">
              <option :value="true">Увеличить / наценка</option>
              <option :value="false">Уменьшить / скидка</option>
            </select>
          </div>
          <div class="flex items-center gap-3 rounded-2xl bg-indigo-50/60 p-3">
            <input id="task-publish-news" v-model="form.publishNews" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <label for="task-publish-news" class="text-sm font-bold text-indigo-800">Опубликовать после выполнения</label>
          </div>
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

    <!-- Delete task confirm -->
    <BaseModal :open="!!deleteTarget" title="Удалить задачу?" width="sm" @close="deleteTarget = null">
      <p class="text-sm text-slate-600">Задача <b>#{{ deleteTarget?.id }}</b> будет удалена. Действие необратимо.</p>
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
import { manageApi, complexApi, publisherApi } from '@/api'
import { useUiStore } from '@/stores/uiStore'

const ui = useUiStore()
const tasks = ref([])
const loading = ref(false)
const error = ref('')

const editing = ref(null)
const form = ref({})
const complexes = ref([])
const buildings = ref([])
const entrances = ref([])
const saving = ref(false)
const editError = ref('')
const deleteTarget = ref(null)
const busy = ref(false)
const deleteError = ref('')

const TYPE_META = {
  CHANGE_PRICE: { label: 'Изменение цен', icon: 'stats', chip: 'bg-violet-50 text-violet-700' },
  NEWS: { label: 'Новости', icon: 'sparkles', chip: 'bg-sky-50 text-sky-700' },
  START_OF_SALES: { label: 'Старт продаж', icon: 'building', chip: 'bg-emerald-50 text-emerald-700' },
}

const STATUS_META = {
  PLANNED: { label: 'Запланирована', chip: 'bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Выполнена', chip: 'bg-emerald-50 text-emerald-700' },
  CANCELED: { label: 'Отменена', chip: 'bg-slate-100 text-slate-500' },
  ERROR: { label: 'Ошибка', chip: 'bg-rose-50 text-rose-600' },
}

const typeMeta = (type) => TYPE_META[type] || { label: type || 'Задача', icon: 'clock', chip: 'bg-slate-100 text-slate-600' }
const statusMeta = (status) => STATUS_META[status] || { label: status || '—', chip: 'bg-slate-100 text-slate-500' }

function formatDateTime(value) {
  if (!value) return '—'
  const text = String(value)
  const datePart = text.slice(0, 10).split('-')
  const timePart = text.length > 10 ? text.slice(11, 16) : ''
  if (datePart.length !== 3) return text
  const [y, m, d] = datePart.map(Number)
  const date = new Date(y, m - 1, d)
  const dateLabel = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  return timePart ? `${dateLabel}, ${timePart}` : dateLabel
}

const toDateTimeLocal = (value) => {
  if (!value) return ''
  return String(value).slice(0, 16).replace(' ', 'T')
}

const loadComplexes = async () => {
  try {
    const res = await complexApi.getComplexes({}, 0, 100)
    complexes.value = res.data?.content || []
  } catch {
    complexes.value = []
  }
}

const loadBuildings = async (complexId) => {
  buildings.value = []
  entrances.value = []
  form.value.buildingId = null
  form.value.entranceId = null
  if (!complexId) return
  try {
    const res = await manageApi.getBuildings(complexId)
    buildings.value = res.data || []
  } catch {
    buildings.value = []
  }
}

const loadEntrances = async (buildingId) => {
  entrances.value = []
  form.value.entranceId = null
  if (!buildingId) return
  try {
    const res = await manageApi.getEntrances(buildingId)
    entrances.value = res.data || []
  } catch {
    entrances.value = []
  }
}

const onComplexChange = () => void loadBuildings(form.value.complexId)
const onBuildingChange = () => void loadEntrances(form.value.buildingId)

const openEdit = async (task) => {
  editError.value = ''
  editing.value = task

  let payload = {}
  try {
    payload = JSON.parse(task.payload || '{}')
  } catch {
    payload = {}
  }

  const filter = payload.filterDTO || {}


  form.value = {
    deadline: toDateTimeLocal(task.deadline),
    publishStartDate: task.publishStartDate || (task.deadline || '').slice(0, 10),
    publishNews: !!task.publishNews,
    complexId: filter.residentialComplexId || null,
    buildingId: filter.buildingId || null,
    entranceId: filter.entranceId || null,
    typeChange: payload.typeChange || 'FIXED_PER_SQM',
    value: payload.value || '',
    arithmeticalOperation: payload.arithmeticalOperation !== undefined ? !!payload.arithmeticalOperation : true,
  }

  if (task.publishNews) {
    try {
      const res = await publisherApi.getAllEvents()
      const linked = (res.data || []).find((e) => e.taskId === task.id)
      if (linked?.startPublishEvent) form.value.publishStartDate = String(linked.startPublishEvent).slice(0, 10)
    } catch {
      // если публикация не найдена, оставляем deadline как запасной вариант
    }
  }
  await loadComplexes()
  if (form.value.complexId) await loadBuildings(form.value.complexId)
  if (form.value.buildingId) await loadEntrances(form.value.buildingId)
}

const closeEdit = () => {
  editing.value = null
  form.value = {}
  buildings.value = []
  entrances.value = []
  editError.value = ''
}

const saveEdit = async () => {
  editError.value = ''
  const deadline = form.value.deadline
  if (!deadline) {
    editError.value = 'Укажите дату и время выполнения.'
    return
  }
  if (new Date(deadline) <= new Date()) {
    editError.value = 'Дата выполнения должна быть в будущем.'
    return
  }

  let payload = {}
  try {
    payload = JSON.parse(editing.value.payload || '{}')
  } catch {
    payload = {}
  }

  const originalFilter = payload.filterDTO || {}
  const filter = {
    ...originalFilter,
    residentialComplexId: form.value.complexId,
    buildingId: form.value.buildingId,
    entranceId: form.value.entranceId,
  }

  saving.value = true
  try {
    await manageApi.updateSchedulePriceChange(editing.value.id, {
      type: editing.value.type || 'CHANGE_PRICE',
      deadLine: deadline.length === 16 ? deadline + ':00' : deadline,
      publishNews: form.value.publishNews,
      publishStartDate: form.value.publishStartDate || deadline.slice(0, 10),
      filter,
      typeChange: form.value.typeChange,
      value: Number(form.value.value),
      arithmeticalOperation: form.value.arithmeticalOperation,
    })
    ui.toast('Задача обновлена')
    closeEdit()
    await loadTasks()
  } catch (e) {
    editError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    saving.value = false
  }
}

const askDelete = (task) => {
  deleteError.value = ''
  deleteTarget.value = task
}

const doDelete = async () => {
  deleteError.value = ''
  busy.value = true
  try {
    await manageApi.deleteScheduledTask(deleteTarget.value.id)
    ui.toast('Задача удалена')
    deleteTarget.value = null
    await loadTasks()
  } catch (e) {
    deleteError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    busy.value = false
  }
}

const loadTasks = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await manageApi.getAllScheduledTasks()
    tasks.value = res.data || []
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadTasks)
</script>