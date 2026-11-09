<template>
  <BaseModal
    :open="ui.planUploadOpen"
    title="Загрузка планировок"
    :subtitle="context?.entranceName ? 'Секция: ' + context.entranceName : 'Выберите zip-архив с планировками'"
    width="lg"
    @close="handleClose"
  >
    <div class="space-y-5">
      <!-- Выбор zip -->
      <div
        role="button"
        tabindex="0"
        class="group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed px-6 py-9 text-center transition"
        :class="dragOver ? 'border-indigo-400 bg-indigo-50/70' : 'border-slate-300 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40'"
        @click="fileInput?.click()"
        @keydown.enter.prevent="fileInput?.click()"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <span class="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/70 to-transparent" />
        <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-lg shadow-indigo-600/10 ring-1 ring-slate-200 transition-transform duration-300 group-hover:-translate-y-0.5">
          <AppIcon name="upload" :size="22" />
        </span>
        <span v-if="!zipFile" class="text-sm font-bold text-slate-600">Нажмите, чтобы выбрать zip-архив</span>
        <span v-else class="max-w-full truncate text-sm font-black text-indigo-700">{{ zipFile.name }}</span>
        <span class="text-xs text-slate-400">Файлы внутри: <code>{номер}.jpg</code> и <code>{номер}-entrance.jpg</code></span>
        <input ref="fileInput" type="file" accept=".zip,application/zip" class="hidden" @change="onFilePick" />
      </div>

      <!-- Справка по неймингу -->
      <div class="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70 sm:flex-row sm:items-start sm:gap-4">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <AppIcon name="info" :size="17" />
        </span>
        <div class="min-w-0 flex-1 space-y-1 text-xs leading-relaxed text-slate-500">
          <p class="font-bold uppercase tracking-widest text-slate-400">Правила именования файлов</p>
          <p>
            Внутри архива <b class="text-slate-700">не должно быть папок и лишних файлов</b>. Имя каждого файла строится по номеру квартиры:
          </p>
          <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div class="rounded-xl bg-white px-3 py-2 font-mono text-[11px] text-indigo-700 ring-1 ring-indigo-100">
              <span class="font-bold">{номер квартиры}.jpg</span> — основная планировка квартиры
            </div>
            <div class="rounded-xl bg-white px-3 py-2 font-mono text-[11px] text-indigo-700 ring-1 ring-indigo-100">
              <span class="font-bold">{номер квартиры}-entrance.jpg</span> — план секции с расположением квартиры
            </div>
          </div>
<p class="mt-1.5 text-[11px] text-slate-400">
                Пример: для квартиры №12 в архиве должны лежать <code class="font-mono text-indigo-600">12.jpg</code> и <code class="font-mono text-indigo-600">12-entrance.jpg</code>.
              </p>
        </div>
      </div>

      <!-- Список квартир -->
      <div class="overflow-hidden rounded-2xl ring-1 ring-slate-200/80">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 bg-slate-50/80 px-4 py-3.5 text-left transition hover:bg-slate-100/70"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          <span class="flex items-center gap-2.5 text-sm font-bold text-slate-700">
            <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-indigo-600 ring-1 ring-indigo-100">
              <AppIcon name="apartment" :size="15" />
            </span>
            Квартиры для загрузки
            <span class="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-black text-indigo-600">{{ candidates.length }}</span>
          </span>
          <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-slate-200 transition-transform duration-300" :class="expanded ? 'rotate-180' : ''">
            <AppIcon name="chevronDown" :size="15" />
          </span>
        </button>

        <Transition name="drop">
          <div v-show="expanded" class="max-h-64 overflow-y-auto border-t border-slate-100 bg-white">
            <p v-if="!candidates.length" class="px-4 py-6 text-center text-xs font-medium text-slate-400">
              Нет квартир без планировок
            </p>
            <TransitionGroup v-else name="status-list" tag="div" class="divide-y divide-slate-100">
              <div
                v-for="a in candidates"
                :key="a.id"
                class="flex items-center gap-3 px-4 py-2.5 transition-colors"
                :class="resultOf(a.id) ? 'bg-slate-50/50' : 'hover:bg-slate-50/70'"
              >
                <span class="w-12 shrink-0 text-sm font-black tabular-nums text-slate-400">№{{ a.number }}</span>
                <span class="min-w-0 flex-1 truncate text-xs text-slate-500">
                  <span v-if="a.type" class="mr-2 rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">{{ apartmentTypeLabel(a.type) }}</span>
                  <span v-if="a.floor">{{ a.floor }} эт.</span>
                  <span v-if="a.area"> · {{ Number(a.area).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) }} м²</span>
                </span>

                <span v-if="uploading" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <span class="loading-dot-sm" /> загрузка…
                </span>
                <span v-else-if="resultOf(a.id)" class="inline-flex items-center gap-1.5" :title="resultOf(a.id)?.message">
                  <span class="flex h-7 w-7 items-center justify-center rounded-full" :class="statusClass(resultOf(a.id).status)">
                    <svg
                      v-if="resultOf(a.id).status === 'OK'"
                      viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                    ><path d="M5 13l4 4L19 7" /></svg>
                    <svg
                      v-else-if="resultOf(a.id).status === 'PARTIAL'"
                      viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
                    ><path d="M12 8v5M12 16.5v.5" /></svg>
                    <svg
                      v-else
                      viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"
                    ><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17.5v.5" /></svg>
                  </span>
                  <span class="hidden text-[11px] font-bold sm:inline" :class="statusTextClass(resultOf(a.id).status)">
                    {{ statusLabel(resultOf(a.id).status) }}
                  </span>
                </span>
                <span v-else class="text-xs font-semibold text-slate-300">ожидает</span>
              </div>
            </TransitionGroup>
          </div>
        </Transition>
      </div>

      <!-- Результат -->
      <div v-if="summary" class="flex flex-wrap items-center gap-2">
        <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Всего: {{ summary.total }}</span>
        <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">✓ {{ summary.success }}</span>
        <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100">● {{ summary.partial }}</span>
        <span class="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-100">✕ {{ summary.notFound + summary.error }}</span>
      </div>

      <p v-if="error" class="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{{ error }}</p>
    </div>

    <template #footer>
      <button class="btn btn-ghost" :disabled="uploading" @click="handleClose">
        {{ results ? 'Закрыть' : 'Отмена' }}
      </button>
      <button v-if="!results" class="btn btn-primary" :disabled="!zipFile || uploading || !candidates.length" @click="doUpload">
        <span v-if="uploading" class="loading-dot" />
        <AppIcon v-else name="upload" :size="15" />
        {{ uploading ? 'Загружаем…' : 'Загрузить' }}
      </button>
      <button v-else class="btn btn-primary" @click="ui.completePlanUpload()">
        <AppIcon name="check" :size="15" />
        Готово
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useUiStore } from '@/stores/uiStore'
import { manageApi } from '@/api'
import { apartmentTypeLabel } from '@/utils/format.js'

const ui = useUiStore()

const context = computed(() => ui.pendingPlanUpload)
const candidates = computed(() => context.value?.apartments || [])

const fileInput = ref(null)
const zipFile = ref(null)
const dragOver = ref(false)
const expanded = ref(true)
const uploading = ref(false)
const error = ref('')
const results = ref(null)
const resultMap = ref({})

watch(
  () => ui.planUploadOpen,
  (open) => {
    if (open) {
      zipFile.value = null
      error.value = ''
      uploading.value = false
      results.value = null
      resultMap.value = {}
      expanded.value = true
    }
  }
)

const resultOf = (id) => resultMap.value[id]
const summary = computed(() => {
  if (!results.value) return null
  const r = results.value
  return {
    total: r.total ?? results.value.length ?? 0,
    success: r.success ?? 0,
    partial: r.partial ?? 0,
    notFound: r.notFound ?? 0,
    error: r.error ?? 0,
  }
})

const onFilePick = (e) => {
  zipFile.value = e.target.files?.[0] || null
}
const onDrop = (e) => {
  dragOver.value = false
  zipFile.value = e.dataTransfer?.files?.[0] || null
}

const doUpload = async () => {
  if (!zipFile.value || !candidates.value.length) return
  uploading.value = true
  error.value = ''
  try {
    const payload = candidates.value.map((a) => ({ id: a.id, number: a.number }))
    const res = await manageApi.importApartmentRenders(payload, zipFile.value)
    const data = res.data
    results.value = {
      total: data?.total ?? (data?.result?.length ?? 0),
      success: data?.success ?? 0,
      error: 0,
    }
    const items = data?.result || []
    resultMap.value = Object.fromEntries(items.map((i) => [i.id, i]))
    results.value.partial = (items || []).filter((i) => i.status === 'PARTIAL').length
    results.value.notFound = (items || []).filter((i) => i.status === 'FILE_NOT_FOUND').length
      results.value.error = (items || []).filter((i) => i.status === 'ERROR').length
    ui.toast('Планировки обработаны')
  } catch (e) {
    error.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    uploading.value = false
  }
}

const statusClass = (status) =>
  ({
    OK: 'bg-emerald-100 text-emerald-600',
    PARTIAL: 'bg-amber-100 text-amber-600',
    FILE_NOT_FOUND: 'bg-rose-100 text-rose-600',
    ERROR: 'bg-rose-100 text-rose-600',
  }[status] || 'bg-slate-100 text-slate-400')

const statusTextClass = (status) =>
  ({
    OK: 'text-emerald-600',
    PARTIAL: 'text-amber-600',
    FILE_NOT_FOUND: 'text-rose-600',
    ERROR: 'text-rose-600',
  }[status] || 'text-slate-400')

const statusLabel = (status) =>
  ({
    OK: 'готово',
    PARTIAL: 'частично',
    FILE_NOT_FOUND: 'не найдено',
    ERROR: 'ошибка',
  }[status] || status)

const handleClose = () => {
  if (results.value) ui.completePlanUpload()
  else ui.closePlanUpload()
}
</script>

<style scoped>
.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1), transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
}
.drop-enter-active .status-list,
.drop-leave-active .status-list {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.status-list-enter-active,
.status-list-leave-active {
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.status-list-enter-from {
  opacity: 0;
  transform: translateX(12px);
}
.status-list-leave-to {
  opacity: 0;
  transform: translateX(-12px);
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
  width: 13px;
  height: 13px;
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