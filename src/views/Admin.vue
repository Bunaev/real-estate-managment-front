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
          <p class="mt-1 max-w-xl text-sm text-slate-400">Управляйте жилыми комплексами, корпусами, секциями, квартирами и справочниками — всё в одном месте.</p>
        </div>
        <RouterLink to="/" class="btn !bg-white/10 !text-white ring-1 ring-white/20 backdrop-blur hover:!bg-white/20">
          <AppIcon name="arrow-left" :size="15" />
          Открыть каталог
        </RouterLink>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-1.5 rounded-2xl bg-white/80 p-1.5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200"
        :class="activeTab === t.key ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'"
        :aria-current="activeTab === t.key ? 'page' : undefined"
        @click="setTab(t.key)"
      >
        <AppIcon :name="t.icon" :size="16" :stroke="activeTab === t.key ? '#fff' : '#64748b'" />
        {{ t.label }}
      </button>
    </div>

    <!-- Panel -->
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

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'complexes', label: 'Жилые комплексы', icon: 'building' },
  { key: 'buildings', label: 'Корпуса и секции', icon: 'floor' },
  { key: 'apartments', label: 'Квартиры', icon: 'apartment' },
  { key: 'references', label: 'Справочники', icon: 'developer' },
]

const panels = {
  complexes: ComplexPanel,
  buildings: BuildingPanel,
  apartments: ApartmentPanel,
  references: ReferencePanel,
}

const activeTab = ref('complexes')
const pendingAction = ref('')
const chosen = ref({ complexId: null, buildingId: null, entranceId: null })

const currentPanel = computed(() => panels[activeTab.value] || ComplexPanel)

const syncFromRoute = () => {
  const tab = route.query.tab
  if (tab && panels[tab]) activeTab.value = tab
  pendingAction.value = typeof route.query.action === 'string' ? route.query.action : ''
}

watch(
  () => route.query,
  () => syncFromRoute(),
  { immediate: true }
)

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
