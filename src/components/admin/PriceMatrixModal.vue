<template>
  <BaseModal
    :open="open"
    title=""
    ariaLabel="Матрица цен"
    hide-close
    width="xl"
    @close="onClose"
  >
    <!-- ============ РЕЗУЛЬТАТ ПОСЛЕ ПРИМЕНЕНИЯ ============ -->
      <div v-if="completed" class="matrix-bg space-y-4" :style="matrixBgStyle">
        <div class="relative overflow-hidden rounded-3xl bg-emerald-900 p-5 text-white sm:p-6">
          <div class="dot-grid-light pointer-events-none absolute inset-0 opacity-30" />
          <div class="pointer-events-none absolute -right-6 -top-8 h-40 w-40 rounded-full" style="background: rgba(16, 185, 129, 0.35); filter: blur(28px)" />
          <div class="relative z-10">
            <p class="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
              <AppIcon name="check" :size="14" /> Готово
            </p>
            <h4 class="mt-1 text-xl font-black tracking-tight">Цены обновлены</h4>
            <p class="mt-1 text-xs text-emerald-100/80">
              Изменения затронули <b class="text-white">{{ results.length }}</b> {{ plural(results.length) }} со статусом «Свободна».
            </p>
          </div>
        </div>

        <div class="overflow-hidden rounded-3xl bg-white/90 ring-1 ring-slate-200/70">
          <button type="button" class="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50" @click="resultOpen = !resultOpen">
            <span class="flex items-center gap-3">
              <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <AppIcon name="rows" :size="18" />
              </span>
              <span>
                <span class="block text-base font-bold text-slate-800">Изменения по квартирам</span>
                <span class="mt-0.5 block text-xs text-slate-400">Нажмите, чтобы посмотреть {{ results.length }} {{ plural(results.length) }}</span>
              </span>
            </span>
            <span class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition" :class="resultOpen ? 'rotate-180 text-indigo-600' : ' '">
              <AppIcon name="chevronDown" :size="16" />
            </span>
          </button>

          <Transition name="preview">
            <div v-if="resultOpen" class="max-h-96 overflow-y-auto border-t border-slate-100">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th class="px-4 py-2.5 text-left">Квартира</th>
                    <th class="px-4 py-2.5 text-right">Старая цена</th>
                    <th class="px-2 py-2.5"></th>
                    <th class="px-4 py-2.5 text-right">Новая цена</th>
                    <th class="px-4 py-2.5 text-right">Разница</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(r, i) in results" :key="r.numberApartment || r.number || i" class="transition hover:bg-slate-50/70">
                    <td class="px-4 py-2.5 font-bold text-slate-700">№ {{ r.numberApartment || r.number || '—' }}</td>
                    <td class="px-4 py-2.5 text-right tabular-nums text-slate-500">{{ formatMoney(r.oldPrice) }}</td>
                    <td class="px-2 py-2.5 text-center"><AppIcon name="arrow-right" :size="16" :stroke="diffColor(r)" /></td>
                    <td class="px-4 py-2.5 text-right tabular-nums text-slate-800">{{ formatMoney(r.newPrice) }}</td>
                    <td class="px-4 py-2.5 text-right tabular-nums font-bold" :class="diffTextClass(r)">{{ formatSignedMoney(rowDiff(r)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Transition>
        </div>
      </div>

    <!-- ============ МАСТЕР ============ -->
    <div v-else class="matrix-bg space-y-4" :style="matrixBgStyle">
        <div class="hero-complex relative overflow-hidden rounded-3xl py-3 text-center" :style="heroStyle">
          <div class="dot-grid-light pointer-events-none absolute inset-0 opacity-20" />
          <h4 class="hero-title text-2xl font-black text-gradient relative z-10">Матрица цен</h4>
          <p class="mt-0.5 text-xs text-slate-300 relative z-10">настройте правила изменения цены</p>
        </div>





      <!-- Stepper -->
      <div class="flex items-center gap-2">
        <template v-for="(s, i) in steps" :key="s.key">
          <button
            v-if="i > 0"
            type="button"
            class="h-1.5 flex-1 rounded-full transition-all duration-300"
            :class="i < step ? 'bg-indigo-500' : 'bg-slate-200'"
          />
          <button
            type="button"
            class="group flex flex-col items-center gap-1"
            :class="i + 1 <= step ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'"
            :disabled="i + 1 > step"
            @click="goStep(i + 1)"
          >
              <span
                class="step-dot flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black transition-all duration-300"
                :class="i + 1 === step
                  ? 'step-dot-active bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30'
                  : (i + 1 < step ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 ring-1 ring-slate-200')"
              >
              <AppIcon v-if="i + 1 < step" name="check" :size="15" />
              <span v-else>{{ i + 1 }}</span>
            </span>
            <span class="text-[10px] font-bold uppercase tracking-wide" :class="i + 1 <= step ? 'text-indigo-600' : 'text-slate-400'">{{ s.title }}</span>
          </button>
        </template>
      </div>

      <!-- Step content -->
      <Transition name="step" mode="out-in">
        <div :key="step" class="rounded-3xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/70">
          <!-- Шаг 1: область -->
          <template v-if="step === 1">
            <h4 class="text-sm font-extrabold text-slate-700">Шаг 1: Выберите объект для изменения цен</h4>

            <div class="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                v-for="option in scopeOptions"
                :key="option.key"
                type="button"
                class="scope-card group flex w-full flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-all duration-300"
                :class="scope === option.key
                  ? 'border-transparent bg-gradient-to-br from-indigo-50 to-violet-50 ring-2 ring-indigo-500/80 shadow-md shadow-indigo-500/10'
                  : 'border-slate-200/80 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-md'"
                @click="scope = option.key"
              >
                <span class="flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300" :class="scope === option.key ? 'scale-110 bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'">
                  <AppIcon :name="option.icon" :size="17" />
                </span>
                <span class="mt-1 text-[13px] font-extrabold text-slate-800">{{ option.title }}</span>
                <span class="mt-0.5 text-[10px] leading-snug text-slate-400">{{ option.desc }}</span>
              </button>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-3">
                <div>
                  <label class="label">Жилой комплекс</label>
                  <select v-model="selectedComplexId" class="field !py-2 !text-xs" :class="{ 'field-error': scopeErrors.complex }" @change="onComplexChange">
                    <option v-for="c in complexes" :key="c.id" :value="c.id">{{ c.name }}</option>
                  </select>
                  <p v-if="scopeErrors.complex" class="mt-1 text-xs font-semibold text-rose-600">{{ scopeErrors.complex }}</p>
                </div>
                <div>
                  <label class="label">Корпус</label>
                  <select v-model="selectedBuildingId" class="field !py-2 !text-xs" :class="{ 'field-error': scopeErrors.building }" :disabled="scope === 'complex'" @change="onBuildingChange">
                    <option :value="null" disabled>{{ scope === 'complex' ? 'Весь комплекс' : 'Выберите корпус' }}</option>
                    <option v-for="b in scopeBuildings" :key="b.id" :value="b.id">{{ b.name }}</option>
                  </select>
                  <p v-if="scopeErrors.building" class="mt-1 text-xs font-semibold text-rose-600">{{ scopeErrors.building }}</p>
                </div>
                <div>
                  <label class="label">Секция</label>
                  <select v-model="selectedEntranceId" class="field !py-2 !text-xs" :class="{ 'field-error': scopeErrors.entrance }" :disabled="scope !== 'entrance'" @change="onEntranceChange">
                    <option :value="null" disabled>{{ scope === 'entrance' ? 'Выберите секцию' : 'Все секции' }}</option>
                    <option v-for="e in scopeEntrances" :key="e.id" :value="e.id">{{ e.name }}</option>
                  </select>
                  <p v-if="scopeErrors.entrance" class="mt-1 text-xs font-semibold text-rose-600">{{ scopeErrors.entrance }}</p>
                </div>
              </div>
            </template>

          <!-- Шаг 2: типы -->
          <template v-else-if="step === 2">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-extrabold text-slate-700">Шаг 2: Выберите типы квартир</h4>
                <div class="flex items-center gap-2">
                  <button class="btn btn-ghost !px-3 !py-1.5 !text-xs" :disabled="allTypesSelected" @click="selectAllTypes">Все</button>
                  <button class="btn btn-ghost !px-3 !py-1.5 !text-xs" :disabled="!selectedTypes.length" @click="clearTypes">Сбросить</button>
                </div>
              </div>

            <div class="mt-3 flex flex-wrap gap-2.5">
              <button
                v-for="t in APARTMENT_TYPES"
                :key="t.value"
                type="button"
                class="type-chip flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-200"
                :class="selectedTypes.includes(t.value)
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25 ring-1 ring-indigo-500/40 scale-105'
                  : 'bg-white text-slate-500 ring-1 ring-slate-200/80 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-700 hover:shadow-md'"
                @click="toggleType(t.value)"
              >
                <AppIcon v-if="selectedTypes.includes(t.value)" name="check" :size="14" />
                {{ t.label }}
              </button>
            </div>
            <p v-if="!selectedTypes.length" class="mt-2 text-xs font-semibold text-rose-500">Выберите хотя бы один тип квартир.</p>
          </template>

          <!-- Шаг 3: расчёт -->
          <template v-else>
              <h4 class="text-sm font-extrabold text-slate-700">Шаг 3: Настройте расчёт цены</h4>

                <div class="mt-2 grid grid-cols-3 gap-1">
              <button
                v-for="m in methods"
                :key="m.key"
                type="button"
                    class="flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all duration-200"
                :class="method === m.key
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-white text-slate-500 ring-1 ring-slate-200/80 hover:bg-slate-100 hover:text-slate-700'"
@click="setMethod(m.key)"
                >
                  <AppIcon :name="m.icon" :size="14" />

                  <span>{{ m.title }}</span>
</button>




            </div>

              <div class="mt-2 flex flex-wrap items-center gap-2">
                <div v-if="method !== 'ABSOLUTE_PRICE'" class="flex overflow-hidden rounded-lg ring-1 ring-slate-200 bg-white">
                  <button type="button" class="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold transition-all" :class="operation ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'" @click="operation = true; confirming = false">
                    <AppIcon name="plus" :size="12" /> Увеличить
                  </button>
                  <button type="button" class="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold transition-all" :class="!operation ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'" @click="operation = false; confirming = false">
                    <AppIcon name="minus" :size="12" /> Уменьшить
                  </button>
                </div>
                <div class="relative">
                  <span v-if="valuePrefix" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{{ valuePrefix }}</span>
                  <input
                    :id="'matrix-value-' + method"
                    v-model="valueText"
                    type="number"
                    class="field !w-44 !py-1.5 tabular-nums"
                    :class="[method === 'PERCENT' ? '!pr-8' : '!pl-8 !pr-8', { 'field-error': calcError }]"
                    step="any"
                    min="0.01"
                    :placeholder="valuePlaceholder"
                    @input="confirming = false"
                    @wheel="$event.preventDefault()"
                    @keydown.up="$event.preventDefault()"
                    @keydown.down="$event.preventDefault()"
                    @keyup.enter="openConfirm"
                  />
                  <span v-if="method === 'PERCENT'" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
                <span class="text-[11px] leading-tight text-slate-400">{{ valueHint }}</span>
                  <p v-if="calcError" class="mt-1 text-xs font-semibold text-rose-600">{{ calcError }}</p>
              </div>
          </template>

          <p v-if="error" class="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">{{ error }}</p>
        </div>
      </Transition>

      <!-- Предпросмотр: по умолчанию только количество -->
      <div class="overflow-hidden rounded-2xl bg-white/90 ring-1 ring-slate-200/70">
        <button type="button" class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50" @click="previewOpen = !previewOpen">
          <span class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <AppIcon name="apartment" :size="17" />
            </span>
            <span>
              <span class="block text-sm font-bold text-slate-700">Список квартир</span>
              <span class="mt-0.5 block text-xs text-slate-400">
                <span v-if="previewLoading">Загружаем…</span>
                <span v-else-if="!previewTotal">Нет свободных квартир под выбранные условия</span>
                <span v-else>Подходит {{ previewTotal }} {{ plural(previewTotal) }} · нажмите, чтобы посмотреть</span>
              </span>
            </span>
          </span>
          <span class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition" :class="previewOpen ? 'rotate-180 text-indigo-600' : ''">
            <AppIcon name="chevronDown" :size="16" />
          </span>
        </button>

        <Transition name="preview">
          <div v-if="previewOpen && previewApartments.length" class="max-h-72 overflow-y-auto border-t border-slate-100">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th class="px-4 py-2.5 text-left">Квартира</th>
                  <th class="px-4 py-2.5 text-left">Тип</th>
                  <th class="px-4 py-2.5 text-right">Площадь</th>
                  <th class="px-4 py-2.5 text-right">Текущая цена</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="a in previewApartments" :key="a.id" class="transition hover:bg-slate-50/70">
                  <td class="px-4 py-2.5 font-bold text-slate-700">№ {{ a.number }}</td>
                  <td class="px-4 py-2.5 text-slate-500">{{ apartmentTypeLabel(a.type) }}</td>
                  <td class="px-4 py-2.5 text-right tabular-nums text-slate-500">{{ formatArea(a.area) }}</td>
                  <td class="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800">{{ formatMoney(a.price) }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="previewTotal > previewApartments.length" class="px-4 py-3 text-xs text-slate-400">
              Показаны первые {{ previewApartments.length }}. Изменения применятся ко всем подходящим квартирам.
            </p>
          </div>
        </Transition>
      </div>

      <div class="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-3.5">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AppIcon name="alert" :size="15" />
        </span>
        <p class="text-xs leading-relaxed text-amber-900/80">
          <b class="text-amber-900">Важно:</b> изменяются только квартиры со статусом «Свободна». Для остальных — индивидуальное редактирование.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <template v-if="completed">
        <button class="btn btn-primary" @click="onClose">
          <AppIcon name="check" :size="15" /> Закрыть
        </button>
      </template>
      <template v-else>
        <button class="btn btn-ghost" :disabled="loading" @click="onClose">Отмена</button>
        <button v-if="step > 1" class="btn btn-ghost" :disabled="loading" @click="prevStep">
          <AppIcon name="arrow-left" :size="15" /> Назад
        </button>
        <button v-if="step < 3" class="btn btn-primary" :disabled="!canNext || loading" @click="nextStep">
            Далее <AppIcon name="arrow-right" :size="15" />
          </button>
          <button v-if="step === 3" class="btn btn-schedule" :disabled="!canApply || loading" @click="openSchedule">
            <AppIcon name="clock" :size="15" /> Запланировать задачу
          </button>
          <button v-if="step === 3" class="btn btn-primary" :disabled="!canApply || loading" @click="openConfirm">
            <AppIcon name="check" :size="15" /> Применить
          </button>
      </template>
    </template>

    <!-- ============ ВСПЛЫВАЮЩЕЕ ПОДТВЕРЖДЕНИЕ ============ -->
    <BaseModal
      :open="confirmOpen"
      title="Подтверждение изменений"
      subtitle="Последний шаг — проверьте и подтвердите"
      width="md"
      @close="confirmOpen = false"
    >
      <div class="space-y-4">
        <div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
          <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Область</p>
          <p class="mt-1 text-sm font-extrabold text-slate-800">{{ scopeSummary }}</p>
        </div>

        <div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
          <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Типы квартир</p>
          <p class="mt-1 text-sm font-extrabold text-slate-800">{{ selectedTypesText }}</p>
        </div>

        <div class="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4 ring-1 ring-indigo-200/70">
          <p class="text-[11px] font-bold uppercase tracking-wide text-indigo-400">Что будет сделано</p>
          <p class="mt-1 text-base font-black text-indigo-900">{{ actionSummary }}</p>
        </div>

        <div class="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <AppIcon name="info" :size="18" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-indigo-900">Будет изменено</p>
            <p class="mt-0.5 text-xs text-indigo-900/80">
              {{ previewTotal }} {{ plural(previewTotal) }} свободных квартир. Это массовое изменение, откат вручную не предусмотрен.
            </p>
          </div>
        </div>

        <p v-if="confirmError" class="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{{ confirmError }}</p>
      </div>
      <template #footer>
        <button class="btn btn-ghost" :disabled="loading" @click="confirmOpen = false">Вернуться</button>
        <button class="btn btn-primary" :disabled="loading" @click="doApply">
          <span v-if="loading" class="loading-dot" />
          <AppIcon v-else name="check" :size="15" />
          {{ loading ? 'Применяем…' : 'Подтвердить и изменить' }}
        </button>
      </template>
    </BaseModal>
<!-- ============ ПУБЛИКАЦИЯ ПОСЛЕ МГНОВЕННОГО ПРИМЕНЕНИЯ ============ -->
      <BaseModal
        :open="applyPublishOpen"
        title="Опубликовать событие?"
        subtitle="Показать новость об изменении цен на главной странице?"
        width="sm"
        @close="applyPublishOpen = false"
      >
        <div class="space-y-4">
          <div class="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <AppIcon name="sparkles" :size="18" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-emerald-900">Публикация новости</p>
              <p class="mt-0.5 text-xs leading-relaxed text-emerald-900/80">
                {{ immediateEventContent }}
              </p>
            </div>
          </div>
<div class="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
              <p class="text-[11px] font-bold uppercase tracking-wide text-indigo-500">Публикация</p>
              <p class="mt-1 text-sm leading-relaxed text-indigo-900">Событие будет опубликовано сразу после изменения цен: старт — сегодня, окончание — через 3 дня.</p>
            </div>

          <p v-if="applyPublishError" class="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{{ applyPublishError }}</p>
        </div>
        <template #footer>
          <button class="btn btn-ghost" :disabled="loading" @click="applyPublishOpen = false">Назад</button>
          <button class="btn btn-ghost" :disabled="loading" @click="sendImmediatePublish(false)">Нет</button>
          <button class="btn btn-schedule" :disabled="loading" @click="sendImmediatePublish(true)">
            <span v-if="loading" class="loading-dot" />
            <AppIcon v-else name="check" :size="15" />
            {{ loading ? 'Публикуем…' : 'Да, опубликовать' }}
          </button>
        </template>
      </BaseModal>
<!-- ============ ПЛАНИРОВАНИЕ ЗАДАЧИ ============ -->
      <BaseModal
        :open="scheduleOpen"
        title="Запланировать задачу"
        subtitle="Укажите дату и время автоматического изменения цен"
        width="md"
        @close="scheduleOpen = false"
      >
        <div class="space-y-4">
          <div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Область</p>
            <p class="mt-1 text-sm font-extrabold text-slate-800">{{ scopeSummary }}</p>
          </div>

          <div class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Типы квартир</p>
            <p class="mt-1 text-sm font-extrabold text-slate-800">{{ selectedTypesText }}</p>
          </div>

          <div class="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ring-1 ring-emerald-200/70">
            <p class="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Действие</p>
            <p class="mt-1 text-base font-black text-emerald-900">{{ actionSummary }}</p>
          </div>

          <div class="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <AppIcon name="info" :size="18" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-indigo-900">Будет изменено</p>
              <p class="mt-0.5 text-xs text-indigo-900/80">
                {{ previewTotal }} {{ plural(previewTotal) }} свободных квартир. Задача выполнится автоматически в выбранное время.
              </p>
            </div>
          </div>

          <div>
            <label for="schedule-deadline" class="label">Дата и время выполнения</label>
            <input
              id="schedule-deadline"
              v-model="scheduleDeadline"
              type="datetime-local"
              class="field"
              :min="scheduleMin"
              required
            />
          </div>

          <p v-if="scheduleError" class="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{{ scheduleError }}</p>
        </div>
        <template #footer>
          <button class="btn btn-ghost" :disabled="scheduleLoading" @click="closeSchedule">Отмена</button>
          <button class="btn btn-primary" :disabled="scheduleLoading" @click="confirmScheduleDraft">
            <AppIcon name="clock" :size="15" /> Запланировать
          </button>
        </template>
      </BaseModal>

      <!-- ============ ОПРОС ПРО ПУБЛИКАЦИЮ ============ -->
      <BaseModal
        :open="publishOpen"
        title="Опубликовать событие?"
        subtitle="Создать новость о запланированном изменении цен?"
        width="sm"
        @close="publishOpen = false"
      >
        <div class="space-y-4">
          <div class="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <AppIcon name="sparkles" :size="18" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-emerald-900">Публикация новости</p>
              <p class="mt-0.5 text-xs leading-relaxed text-emerald-900/80">
                Если подтвердить, после выполнения задачи на сайте появится событие об изменении цен.
              </p>
            </div>
          </div>
<div class="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
            <p class="text-[11px] font-bold uppercase tracking-wide text-indigo-500">Когда опубликовать?</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200"
                :class="publishMode === 'now' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-700'"
                @click="publishMode = 'now'; publishError = ''"
              >
                Сразу (с сегодняшнего дня)
              </button>
              <button
                type="button"
                class="rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200"
                :class="publishMode === 'later' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-700'"
                @click="publishMode = 'later'; publishError = ''"
              >
                Отложить
              </button>
            </div>
            <div v-if="publishMode === 'later'" class="mt-3">
              <label for="publish-date" class="label">Дата начала публикации</label>
              <input
                id="publish-date"
                v-model="publishStartDate"
                type="date"
                class="field"
                :min="schedulePublishMinDate" :max="schedulePublishMaxDate"
              />
            </div>
          </div>

          <p v-if="publishError" class="rounded-xl bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">{{ publishError }}</p>
        </div>
        <template #footer>
          <button class="btn btn-ghost" :disabled="scheduleLoading" @click="publishOpen = false">Назад</button>
          <button class="btn btn-ghost" :disabled="scheduleLoading" @click="sendScheduledTask(false)">Нет</button>
          <button class="btn btn-schedule" :disabled="scheduleLoading" @click="sendScheduledTask(true)">
            <span v-if="scheduleLoading" class="loading-dot" />
            <AppIcon v-else name="check" :size="15" />
            {{ scheduleLoading ? 'Отправляем…' : 'Да, опубликовать' }}
          </button>
        </template>
      </BaseModal>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/AppIcon.vue'
import { manageApi, publisherApi, publicFileUrl } from '@/api'
import { useUiStore } from '@/stores/uiStore'
import { APARTMENT_TYPES, apartmentTypeLabel } from '@/utils/format.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  complexes: { type: Array, default: () => [] },
  buildings: { type: Array, default: () => [] },
  entrances: { type: Array, default: () => [] },
  initial: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['close', 'applied'])

const ui = useUiStore()

const steps = [
  { key: 'area', title: 'Область' },
  { key: 'types', title: 'Типы' },
  { key: 'calc', title: 'Расчёт' },
]

const scopeOptions = [
  { key: 'complex', title: 'Весь ЖК', desc: 'Все свободные квартиры жилого комплекса', icon: 'building' },
  { key: 'building', title: 'Корпус', desc: 'Все свободные квартиры одного корпуса', icon: 'floor' },
  { key: 'entrance', title: 'Секция', desc: 'Свободные квартиры конкретной секции', icon: 'door' },
]

const methods = [
  { key: 'ABSOLUTE_PRICE', title: 'Установить за м²', desc: 'Задать одинаковую цену за метр', icon: 'rub' },
  { key: 'FIXED_PER_SQM', title: 'Сумма к м²', desc: 'Прибавить или вычесть сумму за метр', icon: 'plus' },
  { key: 'PERCENT', title: 'Процент', desc: 'Увеличить или уменьшить цену на процент', icon: 'stats' },
]

const step = ref(1)
const scope = ref('complex')
const selectedComplexId = ref(null)
const selectedBuildingId = ref(null)
const selectedEntranceId = ref(null)
const scopeBuildings = ref([])
const scopeEntrances = ref([])
const selectedTypes = ref(APARTMENT_TYPES.map((t) => t.value))
const method = ref('FIXED_PER_SQM')
const valueText = ref('')
const operation = ref(true)
const confirming = ref(false)
const confirmOpen = ref(false)
const confirmError = ref('')
const scheduleOpen = ref(false)
const scheduleDeadline = ref('')
const scheduleMin = ref('')
const scheduleLoading = ref(false)
const scheduleError = ref('')
const publishOpen = ref(false)
const publishError = ref('')
const applyPublishOpen = ref(false)
const applyPublishError = ref('')
const applyPublishMode = ref('now')
const applyPublishStartDate = ref('')
const publishMode = ref('now')
const publishStartDate = ref('')
const completed = ref(false)
const loading = ref(false)
const error = ref('')

const previewApartments = ref([])
const previewTotal = ref(0)
const previewLoading = ref(false)
const previewOpen = ref(false)

const results = ref([])
const resultOpen = ref(false)

const allTypesSelected = computed(() => selectedTypes.value.length === APARTMENT_TYPES.length)
const selectedTypesText = computed(() =>
  allTypesSelected.value
    ? 'Все типы'
    : selectedTypes.value.map(apartmentTypeLabel).join(', ')
)

const currentComplexName = computed(() => props.complexes.find((c) => c.id === selectedComplexId.value)?.name || '')
const currentComplex = computed(() => props.complexes.find((c) => c.id === selectedComplexId.value) || {})
const complexRenderUrl = computed(() => publicFileUrl(currentComplex.value?.keyRenderPath))
const matrixBgStyle = computed(() => {
  const img = complexRenderUrl.value
  if (!img) return {}
  return {
    backgroundImage: 'linear-gradient(to bottom, rgba(248,250,252,0.99) 0%, rgba(248,250,252,0.96) 35%, rgba(248,250,252,0.9) 65%, rgba(248,250,252,0.78) 100%), url("' + img + '")',
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
  }
})
const heroStyle = computed(() => {
  const img = complexRenderUrl.value
  if (!img) return {}
  return {
    backgroundImage: 'linear-gradient(to right, rgba(15,23,42,0.94) 0%, rgba(15,23,42,0.88) 55%, rgba(15,23,42,0.35) 100%), url("' + img + '")',
    backgroundSize: 'cover',
    backgroundPosition: 'right center',
  }
})
const currentBuildingName = computed(() => scopeBuildings.value.find((b) => b.id === selectedBuildingId.value)?.name || '')
const currentEntranceName = computed(() => scopeEntrances.value.find((e) => e.id === selectedEntranceId.value)?.name || '')

const scopeSummary = computed(() => {
  if (scope.value === 'entrance') return `Секция «${currentEntranceName.value}» · ${currentBuildingName.value} · ${currentComplexName.value}`
  if (scope.value === 'building') return `Корпус «${currentBuildingName.value}» · ${currentComplexName.value}`
  return `Весь ЖК «${currentComplexName.value}»`
})

const methodLabel = computed(() => methods.find((m) => m.key === method.value)?.title || method.value)

const actionSummary = computed(() => {
  const v = String(valueText.value ?? '').trim()
  if (method.value === 'ABSOLUTE_PRICE') return `Установить цену ${v} ₽/м²`
  if (method.value === 'PERCENT') return `${operation.value ? 'Увеличить' : 'Уменьшить'} цену на ${v} %`
  return `${operation.value ? 'Прибавить' : 'Вычесть'} ${v} ₽/м²`
})
const changeNewsSummary = computed(() => {
  const v = String(valueText.value ?? '').trim()
  if (method.value === 'ABSOLUTE_PRICE') return `цена установлена ${v} ₽/м²`
  if (method.value === 'PERCENT') return operation.value ? `цена выросла на ${v} %` : `скидка ${v} %`
  return operation.value ? `цена выросла на ${v} ₽/м²` : `скидка ${v} ₽/м²`
})

const scopeNewsText = computed(() => {
  if (scope.value === 'entrance') return `в секции «${currentEntranceName.value}» корпуса «${currentBuildingName.value}» ЖК «${currentComplexName.value}»`
  if (scope.value === 'building') return `в корпусе «${currentBuildingName.value}» ЖК «${currentComplexName.value}»`
  return `в ЖК «${currentComplexName.value}»`
})

const immediateEventContent = computed(() => {
  const complexName = currentComplexName.value || 'ЖК'
  return `В ЖК «${complexName}» произошло изменение цен: ${changeNewsSummary.value} ${scopeNewsText.value}.`
})

const valueLabel = computed(() => {
  if (method.value === 'ABSOLUTE_PRICE') return 'Новая цена за м², ₽'
  if (method.value === 'PERCENT') return operation.value ? 'Процент наценки, %' : 'Процент скидки, %'
  return operation.value ? 'Сумма к цене за м², ₽' : 'Сумма вычета из цены за м², ₽'
})

const valuePrefix = computed(() => method.value === 'PERCENT' ? '' : '₽')
const valuePlaceholder = computed(() => ({
  ABSOLUTE_PRICE: 'Например, 180000',
  FIXED_PER_SQM: 'Например, 5000',
  PERCENT: 'Например, 5',
}[method.value] || '0'))

const valueHint = computed(() => {
  if (method.value === 'ABSOLUTE_PRICE') return 'После применения у выбранных квартир будет одинаковая цена за м².'
  if (method.value === 'PERCENT') return `Цена будет ${operation.value ? 'увеличена' : 'уменьшена'} на указанный процент.`
  return `К цене за м² будет ${operation.value ? 'прибавлена' : 'вычтена'} указанная сумма.`
})

const scopeErrors = computed(() => {
  const errors = {}
  if (!selectedComplexId.value) errors.complex = 'Выберите жилой комплекс.'
  if (scope.value !== 'complex' && !selectedBuildingId.value) errors.building = 'Выберите корпус.'
  if (scope.value === 'entrance' && !selectedEntranceId.value) errors.entrance = 'Выберите секцию.'
  return errors
})

const calcError = computed(() => {
  if (step.value !== 3) return ''
  const v = String(valueText.value ?? '').trim()
  if (v === '') return 'Укажите значение для расчёта.'
  const num = Number(v)
  if (!Number.isFinite(num) || num <= 0) return 'Значение должно быть положительным числом.'
  if (previewLoading.value) return 'Подождите, загружается список квартир.'
  if (!previewTotal.value) return 'Нет свободных квартир под выбранные условия.'
  return ''
})

const canNext = computed(() => {
  if (step.value === 1) {
    if (!selectedComplexId.value) return false
    if (scope.value === 'building' && !selectedBuildingId.value) return false
    if (scope.value === 'entrance' && (!selectedBuildingId.value || !selectedEntranceId.value)) return false
    return true
  }
  if (step.value === 2) return selectedTypes.value.length > 0
  return true
})

const canApply = computed(() => {
  if (!canNext.value) return false
  const v = String(valueText.value ?? '').trim()
  if (v === '') return false
  const num = Number(v)
  return Number.isFinite(num) && num > 0 && !previewLoading.value && previewTotal.value > 0
})

const totalOld = computed(() => results.value.reduce((sum, r) => sum + Number(r.oldPrice || 0), 0))
const totalNew = computed(() => results.value.reduce((sum, r) => sum + Number(r.newPrice || 0), 0))
const totalDiff = computed(() => results.value.reduce((sum, r) => sum + rowDiff(r), 0))

function normalizeResult(r) {
  const oldPrice = r.oldPrice ?? r.old_price ?? r.old ?? r.previousPrice
  const newPrice = r.newPrice ?? r.new_price ?? r.new ?? r.currentPrice
  const diff = r.diff ?? r.difference ?? r.delta
  return {
    numberApartment: r.numberApartment ?? r.number ?? r.flatNumber,
    oldPrice,
    newPrice,
    diff: diff !== undefined && diff !== null ? diff : (Number(newPrice || 0) - Number(oldPrice || 0)),
  }
}

function rowDiff(r) {
  return Number(r.diff ?? (Number(r.newPrice || 0) - Number(r.oldPrice || 0)))
}
function diffColor(r) {
  return rowDiff(r) >= 0 ? '#10b981' : '#e11d48'
}

function diffTextClass(r) {
  return rowDiff(r) >= 0 ? 'text-emerald-600' : 'text-rose-600'
}

function formatMoney(v) {
  const n = Number(v || 0)
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₽'
}

function formatSignedMoney(v) {
  const n = Number(v || 0)
  const sign = n > 0 ? '+' : ''
  return sign + formatMoney(n)
}

function formatArea(v) {
  const n = Number(v || 0)
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n) + ' м²'
}

function plural(n) {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return 'квартир'
  if (last > 1 && last < 5) return 'квартиры'
  if (last === 1) return 'квартира'
  return 'квартир'
}

const buildFilter = () => {
  const filter = {
    residentialComplexId: selectedComplexId.value,
    status: 'AVAILABLE',
    types: selectedTypes.value.slice(),
  }
  if (scope.value === 'building' || scope.value === 'entrance') filter.buildingId = selectedBuildingId.value
  if (scope.value === 'entrance') filter.entranceId = selectedEntranceId.value
  return filter
}

const loadScopeEntrances = async () => {
  const buildingId = selectedBuildingId.value
  if (!buildingId) {
    scopeEntrances.value = []
    selectedEntranceId.value = null
    return
  }
  try {
    const res = await manageApi.getEntrances(buildingId)
    if (selectedBuildingId.value !== buildingId) return
    scopeEntrances.value = res.data || []
  } catch {
    if (selectedBuildingId.value !== buildingId) return
    scopeEntrances.value = []
  }
  if (!scopeEntrances.value.some((e) => e.id === selectedEntranceId.value)) selectedEntranceId.value = null
}

const loadScopeBuildings = async () => {
  const complexId = selectedComplexId.value
  if (!complexId) {
    scopeBuildings.value = []
    scopeEntrances.value = []
    selectedBuildingId.value = null
    selectedEntranceId.value = null
    return
  }
  try {
    const res = await manageApi.getBuildings(complexId)
    if (selectedComplexId.value !== complexId) return
    scopeBuildings.value = res.data || []
  } catch {
    if (selectedComplexId.value !== complexId) return
    scopeBuildings.value = []
  }
  if (!scopeBuildings.value.some((b) => b.id === selectedBuildingId.value)) selectedBuildingId.value = null
  await loadScopeEntrances()
}

const loadPreview = async () => {
  if (!props.open) return
  if (!selectedComplexId.value || !selectedTypes.value.length) {
    previewApartments.value = []
    previewTotal.value = 0
    return
  }
  previewLoading.value = true
  try {
    const res = await manageApi.getApartments(buildFilter(), 0, 200)
    if (!props.open) return
    previewApartments.value = res.data?.content || []
    previewTotal.value = res.data?.totalElements || previewApartments.value.length
  } catch {
    if (!props.open) return
    previewApartments.value = []
    previewTotal.value = 0
  } finally {
    previewLoading.value = false
  }
}

const resetForm = () => {
  const initial = props.initial || {}
  step.value = 1
  scope.value = initial.entranceId ? 'entrance' : (initial.buildingId ? 'building' : 'complex')
  selectedComplexId.value = initial.complexId || (props.complexes[0]?.id ?? null)
  selectedBuildingId.value = initial.buildingId || null
  selectedEntranceId.value = initial.entranceId || null
  scopeBuildings.value = props.buildings.slice()
  scopeEntrances.value = props.entrances.slice()
  selectedTypes.value = APARTMENT_TYPES.map((t) => t.value)
  method.value = 'FIXED_PER_SQM'
  valueText.value = ''
  operation.value = true
  confirming.value = false
  confirmOpen.value = false
  confirmError.value = ''
scheduleOpen.value = false
    scheduleDeadline.value = ''
    scheduleMin.value = ''
    scheduleLoading.value = false
    scheduleError.value = ''
    publishOpen.value = false
    publishError.value = ''
applyPublishOpen.value = false
    applyPublishError.value = ''
applyPublishMode.value = 'now'
    applyPublishStartDate.value = ''
    publishMode.value = 'now'
    publishStartDate.value = ''
  completed.value = false
  loading.value = false
  error.value = ''
  results.value = []
resultOpen.value = false
  previewApartments.value = []
  previewTotal.value = 0
  previewOpen.value = false

  if (selectedComplexId.value) void loadScopeBuildings()
  void loadPreview()
}

watch(() => props.open, (v) => {
  if (v) resetForm()
})

watch([scope, selectedComplexId, selectedBuildingId, selectedEntranceId, selectedTypes], () => {
  if (!props.open) return
  previewOpen.value = false
  void loadPreview()
})

watch(scope, (v) => {
  if (v === 'complex') {
    selectedBuildingId.value = null
    selectedEntranceId.value = null
  } else if (v === 'building') {
    if (!scopeBuildings.value.some((b) => b.id === selectedBuildingId.value)) selectedBuildingId.value = null
    selectedEntranceId.value = null
  } else if (v === 'entrance') {
    if (!scopeBuildings.value.some((b) => b.id === selectedBuildingId.value)) selectedBuildingId.value = null
    if (!scopeEntrances.value.some((e) => e.id === selectedEntranceId.value)) selectedEntranceId.value = null
  }
})

const onComplexChange = () => {
  scopeBuildings.value = []
  scopeEntrances.value = []
  selectedBuildingId.value = null
  selectedEntranceId.value = null
  void loadScopeBuildings()
}

const onBuildingChange = () => {
  scopeEntrances.value = []
  selectedEntranceId.value = null
  void loadScopeEntrances()
}

const onEntranceChange = () => {}

const setMethod = (key) => {
  method.value = key
}

const toggleType = (v) => {
  if (selectedTypes.value.includes(v)) {
    selectedTypes.value = selectedTypes.value.filter((x) => x !== v)
  } else {
    selectedTypes.value = [...selectedTypes.value, v]
  }
}

const selectAllTypes = () => {
  selectedTypes.value = APARTMENT_TYPES.map((t) => t.value)
}

const clearTypes = () => {
  selectedTypes.value = []
}

const goStep = (s) => {
  if (s > step.value) return
  error.value = ''
  step.value = s
}

const nextStep = () => {
  error.value = ''
  if (step.value === 1) {
    if (!selectedComplexId.value) return error.value = 'Выберите жилой комплекс.'
    if (scope.value === 'building' && !selectedBuildingId.value) return error.value = 'Выберите корпус.'
    if (scope.value === 'entrance' && (!selectedBuildingId.value || !selectedEntranceId.value)) return error.value = 'Выберите корпус и секцию.'
    step.value = 2
  } else if (step.value === 2) {
    if (!selectedTypes.value.length) return error.value = 'Выберите хотя бы один тип квартир.'
    step.value = 3
  }
}

const prevStep = () => {
  if (step.value > 1) step.value -= 1
  error.value = ''
}

const openConfirm = () => {
  error.value = ''
  confirmError.value = ''
  if (previewLoading.value) {
    error.value = 'Подождите, загружается список квартир.'
    return
  }
  if (!previewTotal.value) {
    error.value = 'Под выбранные условия нет свободных квартир.'
    return
  }
  confirmOpen.value = true
}

const doApply = async () => {
  confirmError.value = ''
  loading.value = true
  try {
    const res = await manageApi.priceMatrix(buildFilter(), method.value, Number(String(valueText.value ?? '').trim()), operation.value)
    const data = Array.isArray(res.data) ? res.data : []
    results.value = data.map(normalizeResult)
    confirmOpen.value = false
    applyPublishError.value = ""
applyPublishMode.value = 'now'
      applyPublishStartDate.value = todayIso
    applyPublishOpen.value = true
    completed.value = true
    ui.toast(`Цены обновлены: ${data.length} ${plural(data.length)}`)
    emit('applied', { count: data.length, results: results.value })
  } catch (e) {
    confirmError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    loading.value = false
  }
}
const toDateInputValue = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const todayIso = toDateInputValue(new Date())
const schedulePublishMinDate = computed(() => todayIso)
const schedulePublishMaxDate = computed(() => {
    if (!scheduleDeadline.value) return todayIso
    const date = new Date(scheduleDeadline.value)
    if (Number.isNaN(date.getTime())) return todayIso
    return toDateInputValue(date)
  })

const sendImmediatePublish = async (publish) => {
  if (!publish) {
    applyPublishOpen.value = false
    applyPublishError.value = ""
    onClose()
    return
  }
  applyPublishError.value = ""
  loading.value = true
  try {
    const start = new Date(todayIso + "T00:00:00")
    const end = new Date(start)
    end.setDate(end.getDate() + 3)
    await publisherApi.createEvent({
      type: "NEWS",
      content: immediateEventContent.value,
      startEventDate: todayIso,
      endEventDate: toDateInputValue(end),
      eventPictureKey: currentComplex.value?.keyRenderPath || null,
    })
    applyPublishOpen.value = false
    ui.toast("Событие опубликовано.")
    onClose()
  } catch (e) {
    applyPublishError.value = e.message
    ui.toast(e.message, "error")
  } finally {
    loading.value = false
  }
}
const toDateTimeLocalValue = (date) => {
  const offset = date.getTimezoneOffset()
  const localTime = new Date(date.getTime() - offset * 60000)
  return localTime.toISOString().slice(0, 16)
}

const defaultScheduleDeadline = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
  return toDateTimeLocalValue(d)
}

const openSchedule = () => {
  error.value = ''
  scheduleError.value = ''
  publishError.value = ''
  if (previewLoading.value) {
    error.value = 'Подождите, загружается список квартир.'
    return
  }
  if (!previewTotal.value) {
    error.value = 'Под выбранные условия нет свободных квартир.'
    return
  }
  scheduleMin.value = toDateTimeLocalValue(new Date())
  scheduleDeadline.value = defaultScheduleDeadline()
  scheduleOpen.value = true
}

const closeSchedule = () => {
  scheduleOpen.value = false
  publishOpen.value = false
  scheduleLoading.value = false
  scheduleError.value = ''
  publishError.value = ''
publishMode.value = 'now'
    publishStartDate.value = ''
}

const confirmScheduleDraft = () => {
  scheduleError.value = ''
  publishError.value = ''
  if (!scheduleDeadline.value) {
    scheduleError.value = 'Выберите дату и время выполнения.'
    return
  }
  const deadline = new Date(scheduleDeadline.value)
  if (isNaN(deadline.getTime()) || deadline <= new Date()) {
    scheduleError.value = 'Дата выполнения должна быть в будущем.'
    return
  }
  publishMode.value = 'now'
  publishStartDate.value = toDateInputValue(new Date(scheduleDeadline.value))
  publishOpen.value = true
}

function formatRuDate(value) {
  if (!value) return ''
  const parts = String(value).slice(0, 10).split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return String(value)
  const [y, m, d] = parts
  return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
}

const sendScheduledTask = async (publish) => {
  const deadlineDate = toDateInputValue(new Date(scheduleDeadline.value))
  let startDate = deadlineDate

  if (publish) {
    // Немедленная публикация: старт публикации = сегодня, окончание = deadline (задаст бэкенд).
    // Отложенная публикация: старт задаёт пользователь, но не позже deadline.
    startDate = publishMode.value === "later" ? publishStartDate.value : todayIso

    if (!startDate) {
      publishError.value = "Выберите дату начала публикации."
      return
    }
    if (startDate < todayIso) {
      publishError.value = "Дата начала публикации не может быть в прошлом."
      return
    }
    if (startDate > deadlineDate) {
      publishError.value = "Дата начала публикации не может быть позже даты выполнения задачи."
      return
    }
  }

  scheduleLoading.value = true
  publishError.value = ""
  try {
    await manageApi.schedulePriceChange({
      type: 'CHANGE_PRICE',
      deadLine: scheduleDeadline.value.length === 16 ? scheduleDeadline.value + ":00" : scheduleDeadline.value,
      publishNews: publish,
      publishStartDate: startDate,
      filter: buildFilter(),
      typeChange: method.value,
      value: Number(String(valueText.value ?? "").trim()),
      arithmeticalOperation: operation.value,
    })
    scheduleOpen.value = false
    publishOpen.value = false

    const executionDate = formatRuDate(scheduleDeadline.value)
    let message = `Задача будет исполнена ${executionDate}.`
    if (publish) {
      const publicationDate = formatRuDate(startDate)
      message += ` Публикация на главной начнётся ${publicationDate}.`
    }
    ui.toast(message)
    emit("applied", { scheduled: true, publishNews: publish, publishStartDate: publish ? startDate : null })
    onClose()
  } catch (e) {
    publishError.value = e.message
    ui.toast(e.message, "error")
  } finally {
    scheduleLoading.value = false
  }
}
const onClose = () => {
  confirmOpen.value = false
  loading.value = false
  error.value = ''
scheduleOpen.value = false
  publishOpen.value = false
  scheduleLoading.value = false
  scheduleError.value = ''
  publishError.value = ''
applyPublishOpen.value = false
    applyPublishError.value = ''
applyPublishMode.value = 'now'
    applyPublishStartDate.value = ''
    publishMode.value = 'now'
    publishStartDate.value = ''
  emit('close')
}
</script>

<style scoped>
.label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}
.field-error {
  border-color: #f43f5e !important;
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.14) !important;
}
.btn-schedule {
  background-image: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  box-shadow: 0 10px 22px -10px rgba(5, 150, 105, 0.7);
}
.btn-schedule:hover {
  filter: brightness(1.06);
  box-shadow: 0 16px 28px -12px rgba(5, 150, 105, 0.75);
  transform: translateY(-1px);
}
.btn-schedule:disabled {
  filter: grayscale(0.2) brightness(0.92);
  box-shadow: none;
  transform: none;
  cursor: not-allowed;
}
.matrix-bg {
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 55%, #f8fafc 100%);
  border-radius: 1rem;
  padding: 0.75rem;
}
.hero-title {
  text-shadow: 0 2px 12px rgba(15, 23, 42, 0.55);
}
.loading-dot {
  width: 13px;
  height: 13px;
  border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.step-dot-active {
  animation: step-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes step-pop {
  0% {
    transform: scale(0.8);
  }
  45% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1.1);
  }
}

/* Шаги */
.step-enter-active,
.step-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateX(22px) scale(0.98);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-14px) scale(0.98);
}

/* Предпросмотр */
.preview-enter-active,
.preview-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.preview-enter-from,
.preview-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
