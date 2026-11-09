<template>
  <div class="home-events-slider relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 shadow-2xl shadow-slate-950/40 ring-1 ring-inset ring-white/10 backdrop-blur-xl">
    <Transition name="event" mode="out-in">
      <div
        :key="current.id"
        class="relative flex min-h-[270px] flex-col justify-end overflow-hidden p-6 sm:min-h-[320px] sm:p-7 lg:min-h-[340px] lg:p-8"
      >
        <!-- Фон: картинка / градиент / декор -->
        <img
          v-if="current.image"
          :src="current.image"
          :alt="current.title"
          class="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div class="absolute inset-0" :class="current.overlayClass" />
        <div class="dot-grid-light pointer-events-none absolute inset-0 opacity-25" />

        <!-- Контент -->
        <div class="relative z-10">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-lg backdrop-blur-md">
              <AppIcon :name="current.icon" :size="13" />
              {{ current.badge }}
            </span>
            <span
              v-if="current.dateRange"
              class="inline-flex items-center gap-1 rounded-full bg-slate-950/35 px-3 py-1.5 text-[11px] font-bold text-white/90 backdrop-blur-md"
            >
              <AppIcon name="calendar" :size="12" />
              {{ current.dateRange }}
            </span>
          </div>

          <h3 class="mt-4 max-w-md text-2xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-[1.7rem]">
            {{ current.title }}
          </h3>
          <p class="mt-2 max-w-md text-sm leading-relaxed text-white/85 drop-shadow">
            {{ current.content }}
          </p>
        </div>
      </div>
    </Transition>

      <!-- Ручное управление -->
      <div class="relative z-20 flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/25 px-4 py-3 backdrop-blur-md">
        <div class="flex items-center gap-2">
          <button
            class="home-slider-arrow"
            type="button"
            aria-label="Предыдущее событие"
            @click="prev"
          >
            <AppIcon name="arrow-left" :size="16" />
          </button>
          <button
            class="home-slider-arrow"
            type="button"
            aria-label="Следующее событие"
            @click="next"
          >
            <AppIcon name="arrow-right" :size="16" />
          </button>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            v-for="(slide, i) in slides"
            :key="slide.id"
            type="button"
            class="home-slider-dot"
            :class="{ 'home-slider-dot-active': i === currentIndex }"
            :aria-label="'Слайд ' + (i + 1)"
            :aria-current="i === currentIndex ? 'true' : undefined"
            @click="goTo(i)"
          />
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { publicFileUrl } from '@/api'

const props = defineProps({
  events: { type: Array, default: () => [] },
})

const AUTOPLAY_MS = 3800

const PLACEHOLDERS = [
  {
    id: 'placeholder-1',
    type: 'PLACEHOLDER',
    eventContent: 'Лучшие предложения по новостройкам собираем для вас каждый день — актуальные цены и выгодные условия.',
    startPublishEvent: null,
    endPublishEvent: null,
    eventPictureKey: null,
  },
  {
    id: 'placeholder-2',
    type: 'PLACEHOLDER',
    eventContent: 'Квартиры с отделкой, панорамными окнами и удобными планировками — находите свой идеальный вариант.',
    startPublishEvent: null,
    endPublishEvent: null,
    eventPictureKey: null,
  },
  {
    id: 'placeholder-3',
    type: 'PLACEHOLDER',
    eventContent: 'Следите за стартами продаж и изменениями цен: мы публикуем главные события рынка недвижимости.',
    startPublishEvent: null,
    endPublishEvent: null,
    eventPictureKey: null,
  },
]

const META = {
  NEWS: { badge: 'Новость', icon: 'sparkles', overlayClass: 'event-overlay-news' },
  CHANGE_PRICE: { badge: 'Изменение цен', icon: 'stats', overlayClass: 'event-overlay-price' },
  START_OF_SALES: { badge: 'Старт продаж', icon: 'building', overlayClass: 'event-overlay-sales' },
  PLACEHOLDER: { badge: 'Актуальное', icon: 'sparkles', overlayClass: 'event-overlay-placeholder' },
}

const DEFAULT_META = META.NEWS

const currentIndex = ref(0)

const slides = computed(() => {
  const source = props.events && props.events.length ? props.events : PLACEHOLDERS
  return source.map((item, index) => {
    const type = item.type || 'NEWS'
    const meta = META[type] || DEFAULT_META
    const title = item.title || {
      NEWS: 'Новости компании',
      CHANGE_PRICE: 'Изменение цен в жилом комплексе',
      START_OF_SALES: 'Старт продаж',
      PLACEHOLDER: [
        'Только здесь лучшие цены',
        'Новостройки для вашей жизни',
        'Главные события рынка',
      ][index % 3] || 'Актуальное',
    }[type] || item.eventContent

    return {
      id: item.id || item.type || `slide-${index}`,
      image: publicFileUrl(item.eventPictureKey) || '',
      overlayClass: meta.overlayClass,
      badge: meta.badge,
      icon: meta.icon,
      title,
      content: item.eventContent || '',
      dateRange: formatRange(item.startPublishEvent, item.endPublishEvent),
    }
  })
})

const current = computed(() => slides.value[Math.min(currentIndex.value, slides.value.length - 1)] || slides.value[0] || {})

function formatDate(value) {
  if (!value) return ''
  const text = String(value).slice(0, 10)
  const parts = text.split('-').map(Number)
  const date = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatRange(start, end) {
  const s = formatDate(start)
  const e = formatDate(end)
  if (s && e) return `${s} – ${e}`
  if (s) return `с ${s}`
  return ''
}

let timer = null

function stopTimer() {
  if (timer) clearInterval(timer)
  timer = null
}

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (slides.value.length > 1) next()
  }, AUTOPLAY_MS)
}

function next() {
  if (!slides.value.length) return
  currentIndex.value = (currentIndex.value + 1) % slides.value.length
  startTimer()
}

function prev() {
  if (!slides.value.length) return
  currentIndex.value = (currentIndex.value - 1 + slides.value.length) % slides.value.length
  startTimer()
}

function goTo(i) {
  if (i === currentIndex.value) {
    startTimer()
    return
  }
  currentIndex.value = i
  startTimer()
}

watch(
  () => slides.value.length,
  () => {
    if (currentIndex.value >= slides.value.length) currentIndex.value = 0
    startTimer()
  }
)

onMounted(() => {
  if (slides.value.length > 1) startTimer()
})
onBeforeUnmount(stopTimer)
</script>

<style scoped>
.home-events-slider {
  min-height: 290px;
}

.home-slider-arrow {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  backdrop-filter: blur(12px);
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.home-slider-arrow:hover {
  background: rgba(99, 102, 241, 0.65);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 24px -8px rgba(99, 102, 241, 0.8);
  transform: translateY(-1px) scale(1.06);
}

.home-slider-dot {
  height: 0.45rem;
  width: 0.45rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.45);
  transition: width 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
}
.home-slider-dot-active {
  width: 1.4rem;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.25);
}

.event-overlay-news {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.18) 0%, rgba(30, 27, 75, 0.82) 78%, rgba(49, 46, 129, 0.96) 100%);
}
.event-overlay-price {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.18) 0%, rgba(112, 26, 117, 0.78) 74%, rgba(88, 28, 135, 0.95) 100%);
}
.event-overlay-sales {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.16) 0%, rgba(6, 78, 59, 0.78) 72%, rgba(6, 95, 70, 0.94) 100%);
}
.event-overlay-placeholder {
  background:
    radial-gradient(circle at 20% 0%, rgba(99, 102, 241, 0.55) 0%, transparent 45%),
    radial-gradient(circle at 90% 20%, rgba(236, 72, 153, 0.42) 0%, transparent 45%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.82) 100%);
}

.event-enter-active,
.event-leave-active {
  transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.event-enter-from {
  opacity: 0;
  transform: translateX(42px) scale(0.985);
}
.event-leave-to {
  opacity: 0;
  transform: translateX(-42px) scale(0.985);
}
</style>
