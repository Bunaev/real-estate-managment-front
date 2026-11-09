<!-- Внутренний видеоплеер для файлов ЖК -->
<template>
  <Teleport to="body">
    <Transition name="vp">
      <div v-if="open && file" class="fixed inset-0 z-[130] flex flex-col bg-slate-950/92 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Видеоплеер" @click.self="close">
        <!-- header -->
        <div class="flex shrink-0 items-center gap-3 px-4 py-3 text-white sm:px-6">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur">
            <AppIcon name="video" :size="18" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-extrabold sm:text-base">{{ file.name }}</p>
            <p class="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-white/40">
              <span>Видео</span>
              <span class="h-0.5 w-0.5 rounded-full bg-white/30" />
              <span>{{ formatSize(file.size) }}</span>
            </p>
          </div>
          <a
            :href="file.url"
            :download="file.name"
            target="_blank"
            rel="noopener"
            class="hidden h-10 items-center gap-2 rounded-xl bg-white/10 px-3.5 text-xs font-bold text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20 sm:inline-flex"
          >
            <AppIcon name="download" :size="14" />
            Скачать
          </a>
          <button
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20"
            aria-label="Закрыть"
            @click="close"
          >
            <AppIcon name="close" :size="18" />
          </button>
        </div>

        <!-- video stage -->
        <div class="flex min-h-0 flex-1 items-center justify-center px-2 pb-2 sm:px-6 sm:pb-6">
          <div class="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-black shadow-2xl shadow-black/50 ring-1 ring-white/15">
            <video
              :key="file.url"
              :src="file.url"
              controls
              autoplay
              playsinline
              controlslist="nodownload"
              class="mx-auto block max-h-[76vh] w-full bg-black"
              @error="videoError = true"
            ></video>

            <div v-if="videoError" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 px-6 text-center backdrop-blur-sm">
              <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/70 ring-1 ring-white/15">
                <AppIcon name="alert" :size="24" />
              </span>
              <p class="text-sm font-bold text-white">Не удалось воспроизвести видео</p>
              <p class="max-w-sm text-xs leading-relaxed text-white/50">
                Похоже, формат или кодек не поддерживается браузером. Попробуйте MP4 (H.264) или WebM.
              </p>
              <a
                :href="file.url"
                :download="file.name"
                target="_blank"
                rel="noopener"
                class="btn mt-1 !bg-white !text-slate-900 hover:!bg-slate-100"
              >
                <AppIcon name="download" :size="14" />
                Скачать файл
              </a>
            </div>
          </div>
        </div>

        <!-- footer hint -->
        <div class="flex shrink-0 items-center justify-center gap-4 border-t border-white/10 px-4 py-3 text-[11px] font-medium text-white/35 sm:px-6">
          <span class="hidden sm:inline">Esc — закрыть</span>
          <span class="hidden sm:inline">·</span>
          <a :href="file.url" :download="file.name" class="inline-flex items-center gap-1.5 transition hover:text-white/70 sm:hidden">
            <AppIcon name="download" :size="13" />
            Скачать
          </a>
          <span>Внутренний плеер платформы</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  file: { type: Object, default: null }, // { url, name, size }
})
const emit = defineEmits(['close'])

const videoError = ref(false)

const formatSize = (v) => {
  if (!v) return '—'
  const n = Number(v)
  if (n < 1024) return n + ' Б'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' КБ'
  return (n / 1024 / 1024).toFixed(1) + ' МБ'
}

const close = () => emit('close')

const onKey = (e) => {
  if (!props.open) return
  if (e.key === 'Escape') {
    // Перехватываем раньше BaseModal, чтобы Esc закрывал только плеер
    e.stopPropagation()
    close()
  }
}

watch(
  () => [props.open, props.file?.url],
  () => {
    if (props.open) {
      videoError.value = false
      document.addEventListener('keydown', onKey, true)
      document.body.style.overflow = 'hidden'
    } else {
      videoError.value = false
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = ''
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey, true)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.vp-enter-active,
.vp-leave-active {
  transition: opacity 0.22s ease;
}
.vp-enter-active > div,
.vp-leave-active > div {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
}
.vp-enter-from,
.vp-leave-to {
  opacity: 0;
}
.vp-enter-from > div,
.vp-leave-to > div {
  transform: scale(0.97) translateY(12px);
  opacity: 0;
}
</style>