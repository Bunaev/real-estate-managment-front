<template>
  <div class="space-y-6">
    <!-- Head -->
    <div class="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20 sm:p-8">
      <div class="dot-grid-light absolute inset-0 opacity-40" />
      <div class="hero-orb right-[-4rem] top-[-5rem] h-64 w-64" style="background: rgba(99, 102, 241, 0.45)" />
      <div class="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300">
            <AppIcon name="sparkles" :size="14" /> Панель управления
          </p>
          <h1 class="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Real Estate Management</h1>
          <p class="mt-1 max-w-xl text-sm text-slate-400">Управляйте недвижимостью, задачами и публикациями в одном месте.</p>
        </div>
        <RouterLink to="/" class="btn !bg-white/10 !text-white ring-1 ring-white/20 backdrop-blur hover:!bg-white/20">
          <AppIcon name="arrow-left" :size="15" />
          Открыть каталог
        </RouterLink>
      </div>
    </div>

    <!-- Main navigation cards -->
    <div class="grid gap-3 sm:grid-cols-3">
      <button
        v-for="section in sections"
        :key="section.key"
        type="button"
        class="group relative w-full rounded-2xl border px-3.5 py-3 text-left transition-all duration-300"
        :class="activeSection === section.key
          ? 'border-transparent bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]'
          : 'border-slate-200/80 bg-white/95 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-md'"
        :aria-current="activeSection === section.key ? 'page' : undefined"
        @click="openSection(section)"
      >
        <span class="pointer-events-none absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300"
          :class="activeSection === section.key ? 'bg-white/25 text-white' : 'opacity-0 scale-0'">
          <AppIcon name="check" :size="10" />
        </span>

        <span class="flex min-w-0 flex-col gap-1.5">
          <span class="flex items-center gap-2.5">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300"
              :class="activeSection === section.key ? 'bg-white/20 scale-110' : 'bg-indigo-50 text-indigo-600'">
              <AppIcon :name="section.icon" :size="20" :stroke="activeSection === section.key ? '#fff' : '#6366f1'" />
            </span>
            <span class="min-w-0 flex-1 truncate text-[15px] font-black tracking-tight">{{ section.label }}</span>
          </span>
          <span class="block text-[11px] leading-snug opacity-75">{{ section.hint }}</span>
        </span>
      </button>
    </div>

    <!-- Secondary realty navigation -->
    <Transition name="subnav">
      <nav v-if="activeSection === 'realty'" class="flex flex-wrap gap-1.5 rounded-2xl bg-white/85 p-1.5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
        <button
          v-for="item in realtyItems"
          :key="item.key"
          type="button"
          class="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200"
          :class="activeTab === item.key
            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25'
            : 'text-slate-500 hover:bg-indigo-50/50 hover:text-indigo-700'"
          :aria-current="activeTab === item.key ? 'page' : undefined"
          @click="setTab(item.key)"
        >
          <AppIcon :name="item.icon" :size="15" :stroke="activeTab === item.key ? '#fff' : '#64748b'" />
          {{ item.label }}
        </button>
      </nav>
    </Transition>

    <!-- Content -->
    <div key="panel-wrap">
      <Transition name="panel" mode="out-in">
        <component
          :is="currentPanel"
          :key="activeTab"
          :action="pendingAction"
          :chosen="chosen"
          @handled="clearAction"
          @open-tab="openTab"
        />
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import ComplexPanel from '@/components/admin/ComplexPanel.vue'
import BuildingPanel from '@/components/admin/BuildingPanel.vue'
import ApartmentPanel from '@/components/admin/ApartmentPanel.vue'
import ReferencePanel from '@/components/admin/ReferencePanel.vue'
import TasksPanel from '@/components/admin/TasksPanel.vue'
import PublicationsPanel from '@/components/admin/PublicationsPanel.vue'

const route = useRoute()
const router = useRouter()

const realtyItems = [
  { key: 'complexes', label: 'Жилые комплексы', icon: 'building' },
  { key: 'buildings', label: 'Корпуса и секции', icon: 'floor' },
  { key: 'apartments', label: 'Квартиры', icon: 'apartment' },
  { key: 'references', label: 'Справочники', icon: 'developer' },
]

const sections = [
  { key: 'realty', label: 'Недвижимость', icon: 'building', hint: 'ЖК, корпуса, квартиры, справочники' },
  { key: 'tasks', label: 'Задачи', icon: 'calendar', hint: 'Отложенные операции и их статусы' },
  { key: 'publications', label: 'Публикации', icon: 'sparkles', hint: 'События на главной странице' },
]

const realtyKeys = realtyItems.map((item) => item.key)

const panels = {
  complexes: ComplexPanel,
  buildings: BuildingPanel,
  apartments: ApartmentPanel,
  references: ReferencePanel,
  tasks: TasksPanel,
  publications: PublicationsPanel,
}

const activeTab = ref('complexes')
const pendingAction = ref('')
const chosen = ref({ complexId: null, buildingId: null, entranceId: null })

const currentPanel = computed(() => panels[activeTab.value] || ComplexPanel)

const activeSection = computed(() => {
  if (realtyKeys.includes(activeTab.value)) return 'realty'
  if (activeTab.value === 'tasks') return 'tasks'
  if (activeTab.value === 'publications') return 'publications'
  return 'realty'
})

const syncFromRoute = () => {
  const tab = route.query.tab
  if (tab && panels[tab]) activeTab.value = tab
  pendingAction.value = typeof route.query.action === 'string' ? route.query.action : ''
  chosen.value = {
    complexId: route.query.complexId ? Number(route.query.complexId) : chosen.value.complexId,
    buildingId: route.query.buildingId ? Number(route.query.buildingId) : chosen.value.buildingId,
    entranceId: route.query.entranceId ? Number(route.query.entranceId) : chosen.value.entranceId,
  }
}

watch(
  () => route.query,
  () => syncFromRoute(),
  { immediate: true }
)

const openSection = (section) => {
  if (section.key === 'realty') {
    if (!realtyKeys.includes(activeTab.value)) {
      setTab('complexes')
    }
    return
  }
  setTab(section.key)
}

const setTab = (key) => {
  if (key === activeTab.value) return
  router.push({ path: '/admin', query: { tab: key } })
}

const clearAction = () => {
  if (route.query.action) {
    router.replace({ path: '/admin', query: { tab: activeTab.value } })
  }
  pendingAction.value = ''
}

const openTab = (tab, ctx = {}) => {
  chosen.value = {
    complexId: ctx.complexId ?? chosen.value.complexId,
    buildingId: ctx.buildingId ?? chosen.value.buildingId,
    entranceId: ctx.entranceId ?? chosen.value.entranceId,
  }
  if (panels[tab]) {
    router.push({ path: '/admin', query: { tab } })
  }
}
</script>

<style scoped>
.hero-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(60px);
  pointer-events: none;
}

.subnav-enter-active,
.subnav-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.subnav-enter-from,
.subnav-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.panel-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
