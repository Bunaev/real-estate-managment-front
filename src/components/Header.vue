<template>
  <header class="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 text-white shadow-lg shadow-slate-950/20 backdrop-blur-xl">
    <div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <!-- Brand: широкий логотип в естественных пропорциях -->
      <RouterLink to="/" class="group flex items-center gap-3" aria-label="REM — на главную">
        <img src="/logo.png" alt="REM" class="h-8 w-auto drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] transition-transform duration-300 group-hover:scale-[1.03] sm:h-9" />
      </RouterLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
        <RouterLink to="/" custom v-slot="{ href, navigate, isActive }">
          <a
            :href="href"
            @click="navigate"
            :aria-current="isActive ? 'page' : undefined"
            :class="['relative rounded-full px-4 py-2 text-sm font-semibold transition', isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white']"
          >
            Главная
          </a>
        </RouterLink>
        <button
          class="rounded-full px-4 py-2 text-sm font-semibold transition"
          :class="catalogActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'"
          @click="goCatalog"
        >
          Каталог
        </button>
      </nav>

      <!-- Right -->
      <div class="flex items-center gap-2.5">
  <!-- Уведомление о незагруженных планировках рядом с админкой -->
          <div
            v-if="missingSummary"
            class="relative"
            @mouseenter="planPopover = true"
            @mouseleave="planPopover = false"
          >
              <button
                class="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/40 text-amber-300 backdrop-blur transition hover:bg-slate-950/60 hover:text-amber-200"
                aria-label="Есть квартиры без планировок"
              >
                <AppIcon name="alert" :size="16" />
                <span class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-slate-900">
                  {{ missingSummary?.countApartments || 0 }}
                </span>
              </button>

              <Transition name="popover">
                <div v-if="planPopover" class="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-3.5 text-left shadow-xl shadow-slate-950/30 backdrop-blur-xl">
                  <p class="text-[11px] leading-relaxed text-slate-300">
                    В ЖК <b class="text-white">{{ missingSummary?.complexName || '…' }}</b>,
                    корпусе <b class="text-white">{{ missingSummary?.buildingName || '…' }}</b>,
                    секции <b class="text-white">{{ missingSummary?.entranceName || '…' }}</b>
                    есть <b class="text-amber-300">{{ missingSummary?.countApartments || 0 }}</b>
                    незагруженных планировок.
<template v-if="ui.missingPlansSummary.length > 1">
                      <br />и ещё в {{ ui.missingPlansSummary.length - 1 }} секциях.
                    </template>
                  </p>
                  <RouterLink
                    :to="planLink"
                    class="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-indigo-200 transition hover:bg-white/15 hover:text-white"
                    @click="planPopover = false"
                  >
                    Перейти
                    <AppIcon name="arrow-right" :size="12" />
                  </RouterLink>
                </div>
              </Transition>
          </div>
        <!-- Вход в панель управления: сразу переход, сдержанный стеклянный акцент -->
        <RouterLink
          to="/admin"
          class="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl bg-white/[0.07] px-4 py-2.5 text-sm font-bold tracking-tight text-slate-100 ring-1 ring-inset ring-white/15 backdrop-blur transition-all duration-300 hover:bg-white/[0.12] hover:text-white hover:ring-indigo-300/40 active:scale-[0.98]"
          :class="isAdmin ? 'bg-white/[0.12] text-white ring-2 ring-indigo-300/40' : ''"
          title="Панель управления: ЖК, корпуса, секции, квартиры и справочники"
        >
          <span class="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <span class="relative flex items-center gap-2.5">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/90" />
            <AppIcon name="settings" :size="16" :stroke-width="2.2" :stroke="isAdmin ? '#ffffff' : '#c7d2fe'" class="transition-transform duration-500 group-hover:rotate-45" />
            <span class="hidden whitespace-nowrap sm:inline">Центр управления</span>
          </span>
        </RouterLink>

        <!-- Date + clock -->
        <div class="hidden items-center gap-3 rounded-full border border-white/15 bg-white/5 py-1.5 pl-3.5 pr-2 lg:flex">
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <AppIcon name="calendar" :size="14" stroke="#94a3b8" />
            <span class="whitespace-nowrap">{{ dateText }}</span>
          </span>
          <span class="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold tabular-nums text-white">
            <AppIcon name="clock" :size="14" stroke="#c7d2fe" />
            {{ time }}
          </span>
        </div>

        <!-- Mobile burger -->
        <button class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10 md:hidden" :aria-expanded="mobileOpen" @click="mobileOpen = !mobileOpen">
          <AppIcon :name="mobileOpen ? 'close' : 'menu'" :size="20" />
        </button>
      </div>
    </div>

    <!-- Mobile menu -->
    <Transition name="pop">
      <div v-if="mobileOpen" class="border-t border-white/10 bg-slate-950/95 px-4 pb-5 pt-2 backdrop-blur-xl md:hidden">
        <nav class="flex flex-col gap-1">
          <RouterLink to="/" class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10" @click="mobileOpen = false">
            <AppIcon name="home" :size="17" /> Главная
          </RouterLink>
          <button class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/10" @click="goCatalogMobile">
            <AppIcon name="grid" :size="17" /> Каталог ЖК
          </button>
          <RouterLink
            to="/admin"
            class="mt-1 flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-3 py-3 text-sm font-bold text-slate-100 ring-1 ring-inset ring-white/15 transition hover:bg-white/[0.12] hover:text-white"
            @click="mobileOpen = false"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
            <AppIcon name="settings" :size="16" :stroke-width="2.2" stroke="#c7d2fe" />
            Центр управления
          </RouterLink>
        </nav>
        <p class="mt-3 flex items-center gap-2 px-3 text-xs font-semibold text-slate-400">
          <AppIcon name="calendar" :size="14" />
          {{ dateText }}
          <span class="text-slate-600">·</span>
          <AppIcon name="clock" :size="14" />
          {{ time }}
        </p>
      </div>
    </Transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useUiStore } from '@/stores/uiStore'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const mobileOpen = ref(false)
const time = ref('')
const dateText = ref('')

const catalogActive = computed(() => route.path.startsWith('/complex'))
const isAdmin = computed(() => route.path.startsWith('/admin'))
const planPopover = ref(false)
  const missingSummary = computed(() => {
    const fromSummary = ui.missingPlansSummary.find((s) => Number(s.countApartments) > 0)
    if (fromSummary) return fromSummary

    // Пока summary с бэка не пришёл или при временной ошибке — не теряем
    // уже известный контекст догрузки планировок (например, после импорта).
    const pending = ui.pendingPlanUpload
    if (pending?.apartments?.length) {
      return {
        complexId: pending.complexId,
        complexName: pending.complexName,
        buildingId: pending.buildingId,
        buildingName: pending.buildingName,
        entranceId: pending.entranceId,
        entranceName: pending.entranceName,
        countApartments: pending.apartments.length,
      }
    }

    return null
  })
  const planLink = computed(() => {
    const ctx = missingSummary.value || ui.pendingPlanUpload
    if (!ctx) return '/admin'
    return {
      path: '/admin',
      query: {
        tab: 'apartments',
        complexId: ctx.complexId || undefined,
        buildingId: ctx.buildingId || undefined,
        entranceId: ctx.entranceId || undefined,
      },
    }
  })

const goCatalog = () => {
  if (route.path === '/' || catalogActive.value) scrollToCatalog()
  else {
    router.push('/')
    setTimeout(scrollToCatalog, 380)
  }
}
const goCatalogMobile = () => {
  mobileOpen.value = false
  goCatalog()
}
const scrollToCatalog = () => {
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
}

let timer
onMounted(() => {
  dateText.value = new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })
  time.value = new Date().toLocaleTimeString('ru-RU')
  timer = setInterval(() => {
    time.value = new Date().toLocaleTimeString('ru-RU')
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
.popover-enter-active,
  .popover-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .popover-enter-from,
  .popover-leave-to {
    opacity: 0;
    transform: translateY(6px) scale(0.97);
  }
</style>
