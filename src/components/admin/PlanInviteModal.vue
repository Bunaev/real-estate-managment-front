<template>
  <BaseModal :open="ui.planInviteOpen" title="Квартиры загружены" subtitle="Остался последний шаг — планировки" width="md" @close="ui.closePlanInvite()">
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-1">
      <div class="rounded-[calc(1.5rem-4px)] bg-white/95 px-6 py-8 text-center">
        <div class="dot-grid pointer-events-none absolute inset-0 opacity-30" />

        <div class="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/30">
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
          <span class="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-indigo-600 shadow-lg ring-1 ring-indigo-100">
            <AppIcon name="upload" :size="14" />
          </span>
        </div>

        <h4 class="relative mt-5 text-2xl font-black tracking-tight text-slate-900">
          Догрузить планировки?
        </h4>
        <p class="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          В секции <b class="font-bold text-slate-700">{{ context?.entranceName || '…' }}</b> готово
          <b class="font-black text-indigo-600"> {{ apartmentCount }}</b>
          {{ pluralApartment }} без планировок. Загрузите zip-архив с файлами
          <code class="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-indigo-700">{номер}.jpg</code> и
          <code class="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-indigo-700">{номер}-entrance.jpg</code> прямо сейчас.
        </p>

        <div class="relative mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
          <button class="btn btn-ghost" @click="ui.closePlanInvite()">
            Не сейчас
          </button>
          <button class="btn btn-primary !px-6" @click="ui.openPlanUpload()">
            <AppIcon name="upload" :size="16" />
            Загрузить планировки
          </button>
        </div>

        <p class="relative mt-4 text-xs text-slate-400">
          Можно закрыть окно — кнопка «Догрузить планировки» появится в шапке.
        </p>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useUiStore } from '@/stores/uiStore'

const ui = useUiStore()

const context = computed(() => ui.pendingPlanUpload)
const apartmentCount = computed(() => context.value?.apartments?.length || 0)
const pluralApartment = computed(() => {
  const n = apartmentCount.value
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return 'квартира'
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return 'квартиры'
  return 'квартир'
})
</script>