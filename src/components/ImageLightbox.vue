<!-- Полноэкранный просмотр изображений (планировки) с переключением и зумом -->
<template>
  <Teleport to="body">
    <Transition name="lb">
      <div v-if="open" class="fixed inset-0 z-[140] flex flex-col bg-slate-950/92 backdrop-blur-md" role="dialog" aria-modal="true" @click.self="close">
        <!-- header -->
        <div class="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white sm:px-6">
          <div class="min-w-0">
            <p class="truncate text-sm font-bold sm:text-base">{{ current?.caption }}</p>
            <p v-if="images.length > 1" class="text-[11px] text-white/50">{{ idx + 1 }} из {{ images.length }}</p>
          </div>
          <button class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20" aria-label="Закрыть" @click="close">
            <AppIcon name="close" :size="18" />
          </button>
        </div>

        <!-- image -->
        <div class="relative min-h-0 flex-1 overflow-auto px-3 pb-3 sm:px-6" @click.self="close">
          <img
            v-if="current"
            :src="current.url"
            :alt="current.caption"
            class="mx-auto block rounded-2xl bg-white shadow-2xl transition-transform duration-300"
            :class="zoomed ? 'max-w-none w-[160%] cursor-zoom-out sm:w-[130%]' : 'max-h-full cursor-zoom-in'"
            @click="zoomed = !zoomed"
          />
        </div>

        <!-- footer -->
        <div class="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-[11px] text-white/60 sm:px-6">
          <p class="hidden sm:block">Клик по картинке — увеличить · ←/→ — переключить · Esc — закрыть</p>
          <div v-if="images.length > 1" class="flex items-center gap-2">
            <button class="flex h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3 font-bold text-white transition hover:bg-white/20 disabled:opacity-40" :disabled="idx === 0" @click="go(-1)">
              <AppIcon name="arrow-left" :size="14" /> Назад
            </button>
            <button class="flex h-9 items-center gap-1.5 rounded-xl bg-white/10 px-3 font-bold text-white transition hover:bg-white/20 disabled:opacity-40" :disabled="idx === images.length - 1" @click="go(1)">
              Вперёд <AppIcon name="arrow-right" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  images: { type: Array, default: () => [] }, // [{ url, caption }]
  startIndex: { type: Number, default: 0 },
})
const emit = defineEmits(['close'])

const idx = ref(props.startIndex)
const zoomed = ref(false)
const current = computed(() => props.images[idx.value] || null)

const close = () => emit('close')
const go = (step) => {
  zoomed.value = false
  idx.value = Math.min(props.images.length - 1, Math.max(0, idx.value + step))
}

const onKey = (e) => {
  if (!props.open) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
}

watch(
  () => props.open,
  (v) => {
    if (v) {
      idx.value = props.startIndex
      zoomed.value = false
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }
)
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.22s ease;
}
.lb-enter-active img,
.lb-leave-active img {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
}
.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}
.lb-enter-from img {
  transform: scale(0.96);
  opacity: 0;
}
</style>
