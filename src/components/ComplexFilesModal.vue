<!-- Проводник файлов ЖК: общий для каталога и админки -->
<template>
  <BaseModal
    :open="props.open"
    :title="complexName"
    :subtitle="breadcrumbText || 'Файлы ЖК'"
    width="lg"
    @close="close"
  >
    <div class="space-y-4">
      <!-- Презентация (admin) -->
      <section v-if="mode === 'admin'" class="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <AppIcon name="file" :size="18" />
            </span>
            <div>
              <p class="text-sm font-extrabold text-slate-800">Презентация ЖК</p>
              <p class="text-xs text-slate-400">{{ presentationUrl ? 'Презентация загружена' : 'Презентация не загружена' }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-ghost !px-3 !py-2 text-xs" :disabled="presentationUploading" @click="presentationInput?.click()">
              <AppIcon name="upload" :size="13" />
              {{ presentationUrl ? 'Заменить' : 'Загрузить' }}
            </button>
            <button v-if="presentationUrl" class="btn !px-3 !py-2 text-xs !text-rose-600" :disabled="presentationUploading" @click="deletePresentation">
              <AppIcon name="trash" :size="13" /> Удалить
            </button>
            <input ref="presentationInput" type="file" accept=".pdf,.ppt,.pptx,.zip" class="hidden" @change="onPresentationPick" />
          </div>
        </div>
        <p v-if="presentationError" class="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{{ presentationError }}</p>
      </section>

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <button class="btn btn-ghost !px-3 !py-2 text-xs" :disabled="!history.length || loading" @click="goBack">
            <AppIcon name="arrow-left" :size="13" /> Назад
          </button>
          <nav aria-label="Навигация по папкам" class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] text-slate-500">
            <template v-for="(item, i) in breadcrumbItems" :key="item.path">
              <button
                v-if="i < breadcrumbItems.length - 1"
                class="whitespace-nowrap rounded-md px-1.5 py-0.5 font-bold text-slate-500 transition hover:bg-white hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="loading"
                :title="`Перейти в «${item.name}»`"
                @click="goToBreadcrumb(item)"
              >
                {{ item.name }}
              </button>
              <span
                v-else
                class="whitespace-nowrap rounded-md bg-white px-1.5 py-0.5 font-black text-slate-700 shadow-sm ring-1 ring-slate-200"
              >
                {{ item.name }}
              </span>
              <AppIcon
                v-if="i < breadcrumbItems.length - 1"
                name="chevronDown"
                :size="11"
                stroke="#94a3b8"
                class="-rotate-90"
              />
            </template>
          </nav>
        </div>
        <button class="btn btn-ghost !px-3 !py-2 text-xs" @click="close">
          <AppIcon name="close" :size="13" /> Закрыть
        </button>
      </div>

      <!-- Upload documents (admin) -->
      <div v-if="mode === 'admin'" class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
        <div>
          <p class="text-sm font-bold text-slate-600">Загрузить файлы в текущую папку</p>
          <p class="text-xs text-slate-400">Документы, изображения и видео — можно выбрать сразу несколько</p>
        </div>
        <div class="flex flex-wrap gap-2">
            <button class="btn btn-ghost !px-3 !py-2 text-xs" :disabled="creatingFolder || loading || !currentPath" @click="startCreateFolder">
              <AppIcon name="folder" :size="13" /> Новая папка
            </button>
            <button class="btn btn-primary !px-3 !py-2 text-xs" :disabled="documentsUploading || loading || !currentPath" @click="documentsInput?.click()">
          <AppIcon name="upload" :size="13" /> Выбрать файлы
        </button>
</div>
        <input ref="documentsInput" type="file" multiple class="hidden" @change="onDocumentsPick" />
      </div>
<div v-if="creatingFolder" class="mt-3 flex flex-wrap items-center gap-2">
          <input
            v-model="newFolderName"
            type="text"
            class="field min-w-0 flex-1 !py-2 text-sm"
            placeholder="Название новой папки"
            @keyup.enter="createFolder"
            @keyup.esc="cancelCreateFolder"
          />
          <button class="btn btn-primary !px-3 !py-2 text-xs" :disabled="!newFolderName.trim()" @click="createFolder">
            <AppIcon name="check" :size="13" /> Создать
          </button>
          <button class="btn btn-ghost !px-3 !py-2 text-xs" @click="cancelCreateFolder">Отмена</button>
        </div>
        <p v-if="creatingFolder" class="mt-1.5 text-[11px] text-slate-400">Файлы появятся в этой папке после загрузки</p>

      <p v-if="documentsError" class="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">{{ documentsError }}</p>

      <!-- Content -->
      <div v-if="loading" class="flex flex-col items-center gap-3 py-12 text-slate-400">
        <span class="loading-dot !border-slate-300 !border-t-indigo-600" />
        <span class="text-sm font-semibold">Загружаем файлы…</span>
      </div>

      <div v-else-if="loadError" class="rounded-2xl bg-rose-50 px-5 py-8 text-center">
        <p class="text-sm font-semibold text-rose-600">{{ loadError }}</p>
        <button class="btn btn-ghost mx-auto mt-3 !py-2 text-xs" @click="reload">Повторить</button>
      </div>

      <div v-else-if="!folders.length && !files.length" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-10 text-center">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-200">
          <AppIcon name="folder" :size="24" />
        </span>
        <p class="mt-3 text-sm font-bold text-slate-500">В этой папке пока пусто</p>
        <p v-if="mode === 'admin'" class="mt-1 text-xs text-slate-400">Загрузите файлы — они появятся здесь</p>
      </div>

      <div v-else class="grid gap-2">
        <!-- Папки -->
        <button
          v-for="folder in folders"
          :key="folder.path"
          class="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-md"
          @click="openFolder(folder.path)"
        >
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 ring-1 ring-amber-200/60 transition-transform duration-300 group-hover:scale-105">
            <AppIcon name="folder" :size="18" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-bold text-slate-700">{{ folder.name }}</span>
            <span class="text-xs text-slate-400">Папка</span>
          </span>
          <AppIcon name="arrow-right" :size="15" stroke="#94a3b8" />
        </button>

        <!-- Файлы -->
        <div
          v-for="file in files"
          :key="file.key"
          class="group flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-md"
            :class="isVideoFile(file.name) ? 'cursor-pointer hover:bg-indigo-50/60' : ''"
            @click="isVideoFile(file.name) && openVideo(file)"
        >
            <span class="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-500 ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-105">
              <img
                v-if="isImageFile(file.name)"
                :src="file.url"
                :alt="file.name"
                class="h-full w-full object-cover"
                loading="lazy"
              />
              <span v-else-if="isVideoFile(file.name)" class="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 text-white">
                  <AppIcon name="video" :size="20" stroke="rgba(255,255,255,0.9)" />
                  <span class="absolute bottom-1 left-1 rounded-md bg-black/40 px-1 py-0.5 text-[7px] font-black leading-none tracking-wider text-white/90 backdrop-blur-sm">
                    {{ extensionLabel(file.name) }}
                  </span>
                  <span class="absolute inset-0 flex items-center justify-center">
                    <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/25">
                      <AppIcon name="play" :size="13" />
                    </span>
                  </span>
                </span>
                <span v-else-if="isPdfFile(file.name)" class="flex h-full w-full flex-col items-center justify-center bg-rose-50 text-rose-600">
                <span class="text-[9px] font-black leading-none">PDF</span>
              </span>
              <span v-else-if="isArchiveFile(file.name)" class="flex h-full w-full flex-col items-center justify-center bg-amber-50 text-amber-600">
                <span class="text-[9px] font-black leading-none">ZIP</span>
              </span>
              <span v-else class="flex h-full w-full flex-col items-center justify-center">
                <AppIcon name="file" :size="18" />
                <span class="mt-0.5 max-w-full truncate px-1 text-[7px] font-black leading-none text-slate-500">{{ extensionLabel(file.name) }}</span>
              </span>
            </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-slate-700">{{ file.name }}</p>
            <p class="text-xs text-slate-400">{{ fileSubtitle(file) }}</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="icon-btn" title="Скачать" @click.stop="downloadFile(file)">
              <AppIcon name="download" :size="15" stroke="#0d9488" />
            </button>
            <button v-if="mode === 'admin'" class="icon-btn" title="Удалить" @click.stop="deleteFile(file)">
              <AppIcon name="trash" :size="15" stroke="#e11d48" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
<!-- Внутренний видеоплеер -->
    <VideoPlayerModal :open="!!activeVideo" :file="activeVideo" @close="activeVideo = null" />
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/AppIcon.vue'
import VideoPlayerModal from '@/components/VideoPlayerModal.vue'
import { complexApi, manageApi, listMinioObjects } from '@/api'

const props = defineProps({
  open: { type: Boolean, default: false },
  complexId: { type: [Number, String], required: true },
  complexName: { type: String, default: '' },
  mode: { type: String, default: 'client' }, // client | admin
})
const emit = defineEmits(['close'])

const basePath = ref('')
const currentPath = ref('')
const history = ref([])
const folders = ref([])
const files = ref([])
const loading = ref(false)
const loadError = ref('')
const breadcrumbText = computed(() => {
  if (!currentPath.value) return 'Файлы ЖК'
  const parts = currentPath.value.split('/').filter(Boolean)
  const docsIndex = parts.findIndex((p) => p === 'documents')
  const relevant = docsIndex >= 0 ? parts.slice(docsIndex + 1) : parts.slice(2)
  return relevant.length ? 'Файлы ЖК / ' + relevant.join(' / ') : 'Файлы ЖК'
})
const breadcrumbItems = computed(() => {
  const root = { name: 'Файлы ЖК', path: basePath.value || '' }
  if (!currentPath.value) return [root]

  const parts = currentPath.value.split('/').filter(Boolean)
  const docsIndex = parts.findIndex((p) => p === 'documents')
  const relevant = docsIndex >= 0 ? parts.slice(docsIndex + 1) : parts.slice(2)

  const items = [root]
  let path = basePath.value || ''
  relevant.forEach((part) => {
    path = path + part + '/'
    items.push({ name: part, path })
  })
  return items
})

const documentsUploading = ref(false)
const documentsError = ref('')
const creatingFolder = ref(false)
const newFolderName = ref('')
const documentsInput = ref(null)
const presentationInput = ref(null)
const presentationUploading = ref(false)
const presentationError = ref('')
const presentationUrl = ref('')
const activeVideo = ref(null)

const formatSize = (v) => {
  if (!v) return '—'
  const n = Number(v)
  if (n < 1024) return n + ' Б'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' КБ'
  return (n / 1024 / 1024).toFixed(1) + ' МБ'
}

const isImageFile = (name) => /\.(jpe?g|png|gif|webp|svg)$/i.test(name || '')
const isPdfFile = (name) => /\.pdf$/i.test(name || '')
const isArchiveFile = (name) => /\.(zip|rar|7z)$/i.test(name || '')
const isVideoFile = (name) => /\.(mp4|webm|ogv|ogg|mov|m4v|mpeg|mpg)$/i.test(name || '')
const fileSubtitle = (file) => (isVideoFile(file.name) ? 'Видео · ' : '') + formatSize(file.size)
const openVideo = (file) => {
  if (isVideoFile(file.name)) activeVideo.value = file
}
const extensionLabel = (name) => {
  const parts = String(name || '').split('.')
  return parts.length > 1 ? parts.pop().toUpperCase().slice(0, 4) : 'FILE'
}

const loadPresentation = async () => {
  presentationError.value = ''
  try {
    const res = await complexApi.getPresentation(props.complexId)
    presentationUrl.value = res.data || ''
  } catch {
    presentationUrl.value = ''
  }
}

const loadFolder = async (path) => {
  loading.value = true
  loadError.value = ''
  try {
    const data = await listMinioObjects(path)
    folders.value = data.folders
    files.value = data.files
    currentPath.value = path
  } catch (e) {
    loadError.value = e.message || 'Не удалось загрузить список файлов'
    folders.value = []
    files.value = []
  } finally {
    loading.value = false
  }
}

const reload = async () => {
  if (!basePath.value) return
  await loadFolder(currentPath.value || basePath.value)
}

const open = async () => {
  loading.value = true
  loadError.value = ''
  currentPath.value = ''
  history.value = []
  folders.value = []
  files.value = []
  documentsError.value = ''
    creatingFolder.value = false
    newFolderName.value = ""
    activeVideo.value = null
  try {
    const res = await complexApi.getDocumentPath(props.complexId)
    basePath.value = res.data || ''
    await loadFolder(basePath.value)
  } catch (e) {
    loadError.value = e.message || 'Не удалось получить путь к файлам'
    loading.value = false
  }
  if (props.mode === 'admin') await loadPresentation()
}

watch(
  () => props.open,
  (v) => {
    if (v) open()
    else {
      currentPath.value = ''
      history.value = []
      folders.value = []
      files.value = []
    creatingFolder.value = false
    newFolderName.value = ""
    activeVideo.value = null
      presentationUrl.value = ''
    }
  }
)

const close = () => emit('close')

const openFolder = (path) => {
  history.value.push(currentPath.value)
  loadFolder(path)
}

const goBack = () => {
  const prev = history.value.pop()
  if (prev) loadFolder(prev)
}
const goToBreadcrumb = (item) => {
  if (!item || !item.path || item.path === currentPath.value || loading.value) return
  history.value.push(currentPath.value)
  loadFolder(item.path)
}

const downloadFile = (file) => {
  if (!file.url) return
  const a = document.createElement('a')
  a.href = file.url
  a.download = file.name
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

const startCreateFolder = () => {
  creatingFolder.value = true
  newFolderName.value = ''
}
const cancelCreateFolder = () => {
  creatingFolder.value = false
  newFolderName.value = ''
}
const createFolder = () => {
  const name = (newFolderName.value || '').trim().replace(/[/\\]/g, '_')
  if (!name) return
  const path = `${currentPath.value}${name}/`
  history.value.push(currentPath.value)
  currentPath.value = path
  folders.value = []
  files.value = []
  creatingFolder.value = false
  newFolderName.value = ''
  documentsError.value = ''
}
const onDocumentsPick = async (e) => {
  const selected = Array.from(e.target.files || [])
  if (!selected.length) return
  documentsUploading.value = true
  documentsError.value = ''
  try {
    await manageApi.uploadComplexDocuments(currentPath.value, selected)
    if (documentsInput.value) documentsInput.value.value = ''
    await loadFolder(currentPath.value)
  } catch (err) {
    documentsError.value = err.message
  } finally {
    documentsUploading.value = false
  }
}

const deleteFile = async (file) => {
  if (!window.confirm(`Удалить файл «${file.name}»?`)) return
  try {
    await manageApi.deleteComplexDocument(file.key)
    files.value = files.value.filter((f) => f.key !== file.key)
  } catch (e) {
    documentsError.value = e.message
  }
}

const onPresentationPick = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  presentationUploading.value = true
  presentationError.value = ''
  try {
    const folderRes = await complexApi.getPresentationFolder(props.complexId)
    const path = folderRes.data || ''
    await manageApi.uploadComplexPresentation(path, file)
    if (presentationInput.value) presentationInput.value.value = ''
    await loadPresentation()
  } catch (err) {
    presentationError.value = err.message
  } finally {
    presentationUploading.value = false
  }
}

const keyFromUrl = (url) => {
  const base = (import.meta.env.VITE_PUBLIC_STORAGE_URL || 'http://localhost:9000/rem-public').replace(/\/+$/, '')
  return url?.startsWith(base) ? decodeURIComponent(url.slice(base.length + 1)) : ''
}

const deletePresentation = async () => {
  if (!presentationUrl.value) return
  if (!window.confirm('Удалить презентацию ЖК?')) return
  const key = keyFromUrl(presentationUrl.value)
  if (!key) {
    presentationError.value = 'Не удалось определить ключ презентации'
    return
  }
  presentationUploading.value = true
  presentationError.value = ''
  try {
    await manageApi.deleteComplexPresentation(key)
    presentationUrl.value = ''
  } catch (e) {
    presentationError.value = e.message
  } finally {
    presentationUploading.value = false
  }
}
</script>

<style scoped>
.loading-dot {
  width: 16px;
  height: 16px;
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
