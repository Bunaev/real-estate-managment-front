<template>
  <div ref="wrapRef" class="relative w-full">
    <!-- Поле поиска: без подсветки-рамки при фокусе -->
    <div class="group flex items-center rounded-2xl bg-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-200/80 transition-all duration-300 hover:shadow-xl hover:ring-slate-300">
      <span class="pointer-events-none absolute left-4 flex h-10 w-10 items-center justify-center">
        <AppIcon name="search" :size="20" stroke="#6366f1" />
      </span>

      <input
        ref="inputEl"
        v-model="query"
        type="text"
        :placeholder="placeholder"
        autocomplete="off"
        spellcheck="false"
        aria-label="Поиск"
        class="w-full bg-transparent py-4 pl-14 pr-24 text-[15px] font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
        @input="onInput"
        @focus="onFocus"
        @blur="hideSoon"
        @keydown="onKeydown"
      />

      <div class="absolute right-2 flex items-center gap-1.5 pr-1">
        <span v-if="searching" class="loading-dot mr-1" aria-hidden="true" />
        <button
          v-if="query.length > 0"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          :aria-label="'Очистить: ' + query"
          @mousedown.prevent
          @click="clearQuery"
        >
          <AppIcon name="close" :size="16" />
        </button>
        <button
          class="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 px-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:brightness-110 active:scale-95"
          @mousedown.prevent
          @click="searchNow"
        >
          <span class="hidden sm:inline">Найти</span>
          <AppIcon name="arrow-right" :size="15" :stroke-width="2.4" />
        </button>
      </div>
    </div>

    <!-- Подсказки: непрозрачные, вне перекрывающих контейнеров (body) -->
    <Teleport to="body">
      <Transition name="pop">
        <div
          v-if="showSuggestions && suggestions.length > 0"
          class="fixed z-[110] max-h-[22rem] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xl shadow-slate-950/25"
          :style="panelStyle"
          @mousedown.prevent
        >
          <div
            v-for="(item, index) in suggestions"
            :key="item.entityId + '-' + item.entityType"
            :class="[
              'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition',
              index === activeIndex ? 'bg-indigo-50' : 'hover:bg-slate-50',
            ]"
            @mousedown.prevent="selectSuggestion(item)"
            @mouseenter="activeIndex = index"
          >
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" :class="index === activeIndex ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'">
              <AppIcon :name="entityIconName(item.entityType)" :size="17" />
            </span>
            <span class="flex-1 truncate text-sm font-semibold text-slate-800">{{ item.text }}</span>
            <span class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">{{ entityTypeLabel(item.entityType) }}</span>
          </div>
          <p class="border-t border-slate-100 px-3 pb-1 pt-2 text-[11px] text-slate-400">Enter — выбрать · Esc — закрыть</p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { complexApi } from '@/api'
import AppIcon from '@/components/AppIcon.vue'

const router = useRouter()
const props = defineProps({
  placeholder: { type: String, default: 'Поиск ЖК, района, станции метро или застройщика…' },
  autoNavigate: { type: Boolean, default: true },
})
const emit = defineEmits(['select', 'apply-filter'])

const wrapRef = ref(null)
const inputEl = ref(null)
const query = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)
const searching = ref(false)
const activeIndex = ref(-1)
const panelPos = ref({ top: 0, left: 0, width: 0 })
let debounceTimer = null
let hideTimer = null

const panelStyle = computed(() => ({
  top: panelPos.value.top + 'px',
  left: panelPos.value.left + 'px',
  width: panelPos.value.width + 'px',
}))

const entityTypeLabel = (t) =>
  ({ ЖК: 'Жилой комплекс', Локация: 'Локация', Район: 'Район', Застройщик: 'Застройщик', Метро: 'Метро' }[t] || t)
const entityIconName = (t) =>
  ({ ЖК: 'building', Локация: 'location', Район: 'location', Застройщик: 'developer', Метро: 'metro' }[t] || 'search')

const measurePanel = () => {
  const el = wrapRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  panelPos.value = { top: rect.bottom + 8, left: rect.left, width: rect.width }
}

const showPanel = () => {
  measurePanel()
  nextTick(() => {
    showSuggestions.value = suggestions.value.length > 0
    activeIndex.value = suggestions.value.length ? 0 : -1
  })
}

const onFocus = () => {
  if (suggestions.value.length) showPanel()
}
const hideSoon = () => {
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    showSuggestions.value = false
    activeIndex.value = -1
  }, 180)
}

const onInput = () => {
  clearTimeout(debounceTimer)
  clearTimeout(hideTimer)
  if (query.value.trim().length < 2) {
    suggestions.value = []
    showSuggestions.value = false
    searching.value = false
    activeIndex.value = -1
    return
  }
  searching.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const res = await complexApi.getSuggestions(query.value.trim(), 7)
      suggestions.value = res.data || []
      if (suggestions.value.length) showPanel()
      else showSuggestions.value = false
    } catch (e) {
      suggestions.value = []
      showSuggestions.value = false
      activeIndex.value = -1
    } finally {
      searching.value = false
    }
  }, 260)
}

const onKeydown = (event) => {
  if (!showSuggestions.value || !suggestions.value.length) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % suggestions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + suggestions.value.length) % suggestions.value.length
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const item = suggestions.value[activeIndex >= 0 ? activeIndex : 0]
    if (item) selectSuggestion(item)
  } else if (event.key === 'Escape') {
    showSuggestions.value = false
    activeIndex.value = -1
  }
}

const selectSuggestion = (item) => {
  query.value = item.text || ''
  suggestions.value = []
  showSuggestions.value = false
  activeIndex.value = -1
  emit('select', item)
  if (props.autoNavigate && item.entityType === 'ЖК' && item.entityId) {
    router.push('/complex/' + item.entityId)
  } else if (item.entityType !== 'ЖК') {
    emit('apply-filter', item)
  }
}

const clearQuery = () => {
  query.value = ''
  suggestions.value = []
  showSuggestions.value = false
  activeIndex.value = -1
  nextTick(() => inputEl.value?.focus())
}

const searchNow = () => {
  if (query.value.trim().length < 2) return
  clearTimeout(debounceTimer)
  searching.value = true
  complexApi
    .getSuggestions(query.value.trim(), 7)
    .then((res) => {
      suggestions.value = res.data || []
      if (suggestions.value.length === 1) {
        selectSuggestion(suggestions.value[0])
        return
      }
      if (suggestions.value.length) showPanel()
      else showSuggestions.value = false
    })
    .catch(() => {})
    .finally(() => {
      searching.value = false
    })
}

const onViewportChange = () => {
  if (showSuggestions.value && suggestions.value.length) measurePanel()
}

onMounted(() => {
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
})
onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  clearTimeout(hideTimer)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})
</script>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.99);
}

.loading-dot {
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  border: 2px solid #e0e7ff;
  border-top-color: #6366f1;
  animation: lspin 0.7s linear infinite;
}
@keyframes lspin {
  to {
    transform: rotate(360deg);
  }
}
</style>
