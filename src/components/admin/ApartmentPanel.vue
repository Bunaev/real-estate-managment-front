<template>
  <section class="space-y-5">
    <!-- Head -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h3 class="text-xl font-extrabold tracking-tight text-slate-900">Квартиры</h3>
        <p class="mt-0.5 text-sm text-slate-500">Выберите комплекс, корпус и секцию — затем редактируйте, импортируйте или экспортируйте квартиры</p>
      </div>
      <button class="btn btn-primary" :disabled="!complexes.length" @click="openPriceMatrix">
        <AppIcon name="grid" :size="15" /> Матрица цен
      </button>
    </div>

    <!-- Pickers -->
    <div class="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur sm:p-6">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Жилой комплекс</label>
          <select v-model="complexId" class="field">
            <option v-for="c in complexes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Корпус</label>
          <select v-model="buildingId" class="field" :disabled="!buildings.length">
            <option v-for="b in buildings" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Секция</label>
          <select v-model="entranceId" class="field" :disabled="!entrances.length">
            <option v-for="e in entrances" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Contextual action strip -->
    <div class="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-600/20 sm:p-6">
      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-bold uppercase tracking-widest text-white/70">Выбранная секция</p>
        <p class="mt-1 truncate text-base font-extrabold">{{ entranceName || 'Секция не выбрана' }}</p>
        <p class="mt-0.5 truncate text-xs text-white/75">{{ [selectedComplexName, selectedBuildingName].filter(Boolean).join(' · ') || 'Выберите комплекс, корпус и секцию выше' }}</p>
        <p class="mt-1 text-xs text-white/80">Квартир в секции: <b class="tabular-nums text-white">{{ total }}</b></p>
      </div>
      <div v-if="entranceId" class="flex shrink-0 flex-wrap items-center gap-2">
        <button class="btn !bg-white !text-indigo-700 hover:!bg-indigo-50" @click="openImport">
          <AppIcon name="upload" :size="15" /> Импорт квартир (xlsx)
        </button>
          <button
              class="btn !bg-white !text-indigo-700 transition-all duration-200 hover:!bg-indigo-50"
              :class="sectionHasMissingPlans ? 'opacity-100' : 'pointer-events-none opacity-30'"
              :disabled="!sectionHasMissingPlans"
              @click="openPlanUpload"
            >
            <AppIcon name="image" :size="15" /> Планировки (zip)
          </button>
        <button class="btn !bg-white !text-indigo-700 hover:!bg-indigo-50" @click="exportCurrent">
          <AppIcon name="download" :size="15" /> Экспорт в Excel
        </button>
      </div>
    </div>

    <!-- Справка по формату файла -->
    <ImportExportHelp />

    <!-- Count / page size -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-slate-500">Показано <b class="text-slate-800">{{ apartments.length }}</b> из <b class="tabular-nums text-slate-800">{{ total }}</b></p>
      <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
        На странице
        <select v-model.number="pageSize" class="field !w-auto !py-2">
          <option v-for="s in [10, 20, 50]" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>

    <!-- Import modal -->
    <BaseModal :open="importOpen" title="Импорт квартир из Excel" :subtitle="'В секцию: ' + entranceName" width="md" @close="importOpen = false">
      <div class="space-y-4">
        <label class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40">
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <AppIcon name="upload" :size="22" />
          </span>
          <span v-if="!importFile" class="text-sm font-semibold text-slate-500">Нажмите, чтобы выбрать файл .xlsx</span>
          <span v-else class="text-sm font-bold text-indigo-700">{{ importFile.name }}</span>
          <span class="text-xs text-slate-400">Формат файла должен соответствовать шаблону экспорта</span>
          <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFilePick" />
        </label>
        <p v-if="formError" class="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">{{ formError }}</p>
        <ImportExportHelp />
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="importOpen = false">Отмена</button>
        <button class="btn btn-primary" :disabled="!importFile || uploading" @click="doImport">
          <span v-if="uploading" class="loading-dot" />
          <AppIcon v-else name="upload" :size="15" />
          Загрузить
        </button>
      </template>
    </BaseModal>

    <!-- List -->
    <p v-if="loadingApartments" class="py-8 text-center text-sm text-slate-400">Загружаем квартиры…</p>
    <div v-else-if="!entranceId" class="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-400">Выберите комплекс, корпус и секцию</div>

    <div v-else class="overflow-hidden rounded-2xl bg-white/85 ring-1 ring-slate-200/70 backdrop-blur">
      <div v-if="!apartments.length" class="px-5 py-10 text-center text-sm text-slate-400">В секции нет квартир — загрузите их из Excel</div>
      <div v-else class="divide-y divide-slate-100">
        <div v-for="a in apartments" :key="a.id" class="px-4 py-3 transition hover:bg-slate-50/70 sm:px-5">
          <div class="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2" @click="toggleRow(a.id)">
            <span class="w-9 shrink-0 text-sm font-black text-slate-300">№{{ a.number }}</span>
            <span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" :class="typeChip(a.type)">{{ apartmentTypeLabel(a.type) }}</span>
            <span class="min-w-0 flex-1 text-xs text-slate-500">
              {{ a.floor }} эт. · {{ formatArea(a.area) }} · {{ formatMoney(a.price) }}
              <span class="mx-1 text-slate-300">|</span>
              балкон: {{ a.hasBalcony ? 'есть' : 'нет' }} · {{ bathroomLabel(a.bathroomType) }}
            </span>
            <span
              v-if="quartersOf(a)"
              class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold tabular-nums text-slate-500"
              title="Срок сдачи корпуса / выдача ключей"
            >
              {{ quartersOf(a) }}
            </span>
            <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="statusChip(a.status)">{{ statusLabel(a.status) }}</span>
            <div class="flex items-center gap-1">
              <button class="icon-btn" title="Изменить" @click.stop="openEdit(a)">
                <AppIcon name="edit" :size="15" stroke="#6366f1" />
              </button>
              <button class="icon-btn" title="Удалить" @click.stop="askDelete(a)">
                <AppIcon name="trash" :size="15" stroke="#e11d48" />
              </button>
              <span class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition" :class="expandedId === a.id ? 'rotate-180 text-indigo-600' : ''">
                <AppIcon name="chevronDown" :size="15" />
              </span>
            </div>
          </div>

          <!-- Состав площадей -->
          <div v-if="hasAreas(a)" class="mt-2.5 pl-11">
            <ApartmentRooms :apartment="a" />
          </div>

          <!-- Карточка квартиры -->
          <div class="expander" :class="expandedId === a.id && expandOpen ? 'open' : ''">
            <div class="overflow-hidden">
              <div class="pt-3">
                <ApartmentCard
                  :apartment="a"
                  :quarters="quartersOf(a)"
                  :building-name="a.entrance?.building?.name || ''"
                  :entrance-name="a.entrance?.name || ''"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PaginationBar v-if="totalPages > 1" :current-page="page" :total-pages="totalPages" @page-change="onPage" />

          <!-- Edit apartment -->
      <BaseModal :open="!!editing" title="Редактирование квартиры" :subtitle="'№' + (editing?.number ?? '')" width="xl" @close="closeEdit">
        <div v-if="editing" class="space-y-6">
          <!-- Hero -->
          <div class="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/20 sm:p-6">
            <div class="dot-grid-light pointer-events-none absolute inset-0 opacity-30" />
            <div class="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-widest text-white/50">Редактирование квартиры</p>
                <p class="mt-1 text-2xl font-black tracking-tight">Квартира №{{ editForm.number || '…' }}</p>
                <p class="mt-1 text-xs text-slate-300">{{ [selectedComplexName, selectedBuildingName, entranceName].filter(Boolean).join(' · ') || 'Адрес не выбран' }}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <span class="rounded-full px-3 py-1.5 text-[11px] font-bold" :class="statusChip(editForm.status)">{{ statusLabel(editForm.status) }}</span>
                <span class="rounded-full px-3 py-1.5 text-[11px] font-bold" :class="typeChip(editForm.type)">{{ apartmentTypeLabel(editForm.type) }}</span>
              </div>
            </div>
          </div>

          <!-- Основное + цена -->
          <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section class="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70">
              <h4 class="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-slate-400">
                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><AppIcon name="apartment" :size="14" /></span>
                Основное
              </h4>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="label">Номер <span class="text-rose-500">*</span></label>
                  <input v-model.number="editForm.number" type="number" min="1" max="9999" class="field" />
                </div>
                <div>
                  <label class="label">Этаж <span class="text-rose-500">*</span></label>
                  <input v-model.number="editForm.floor" type="number" min="1" max="200" class="field" />
                </div>
                <div>
                  <label class="label">Тип <span class="text-rose-500">*</span></label>
                  <select v-model="editForm.type" class="field">
                    <option v-for="t in APARTMENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">Статус <span class="text-rose-500">*</span></label>
                  <select v-model="editForm.status" class="field">
                    <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">Санузел <span class="text-rose-500">*</span></label>
                  <select v-model="editForm.bathroomType" class="field">
                    <option v-for="b in BATHROOMS" :key="b.value" :value="b.value">{{ b.label }}</option>
                  </select>
                </div>
                <div>
                  <label class="label">Балкон <span class="text-rose-500">*</span></label>
                  <select v-model="editForm.hasBalcony" class="field">
                    <option :value="true">Есть</option>
                    <option :value="false">Нет</option>
                  </select>
                </div>
              </div>
            </section>

            <section class="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70">
              <h4 class="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-slate-400">
                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><AppIcon name="rub" :size="14" /></span>
                Цена
              </h4>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label class="label">Цена, ₽ <span class="text-rose-500">*</span></label>
                  <input v-model.number="editForm.price" type="number" step="10000" min="0" class="field" placeholder="Например, 6 500 000" />
                </div>
                <div class="sm:col-span-2">
                  <label class="label">Цена за м² <span class="text-xs font-semibold normal-case text-slate-400">· можно не заполнять — посчитается из цены и площади</span></label>
                  <input v-model.number="editForm.pricePerSquareMeter" type="number" step="100" min="0" class="field" placeholder="Оставьте пустым для авторасчёта" />
                </div>
              </div>
            </section>
          </div>

          <!-- Площади -->
          <section class="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70">
            <h4 class="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-slate-400">
              <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><AppIcon name="area" :size="14" /></span>
              Площади, м²
            </h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label class="label">Общая <span class="text-xs font-semibold normal-case text-slate-400">· необязательно</span></label>
                <input v-model.number="editForm.area" type="number" step="0.1" min="0" class="field" placeholder="Авторасчёт" />
              </div>
              <div>
                <label class="label">Кухня <span class="text-xs font-semibold normal-case text-slate-400">· необязательно</span></label>
                <input v-model.number="editForm.kitchenArea" type="number" step="0.1" min="0" class="field" placeholder="Для студии оставьте пустым" />
              </div>
              <div>
                <label class="label">Коридор <span class="text-rose-500">*</span></label>
                <input v-model.number="editForm.hallwayArea" type="number" step="0.1" min="0" class="field" />
              </div>
              <div>
                <label class="label">Санузел <span class="text-rose-500">*</span></label>
                <input v-model.number="editForm.bathroomArea" type="number" step="0.1" min="0" class="field" />
              </div>
              <div>
                <label class="label">Комнаты <span class="text-rose-500">*</span></label>
                <input v-model.number="editForm.roomsArea" type="number" step="0.1" min="0" class="field" />
              </div>
            </div>
          </section>

          <!-- Планировки -->
          <section class="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70">
            <h4 class="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-slate-400">
              <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><AppIcon name="image" :size="14" /></span>
              Рендеры планировок
            </h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200/70">
                <div class="border-b border-slate-200/70 px-4 py-3">
                  <p class="text-sm font-extrabold text-slate-700">Планировка квартиры</p>
                  <p class="text-xs text-slate-400">Файл: <code class="font-mono">{номер}.jpg</code></p>
                </div>
                <div class="relative flex h-40 items-center justify-center bg-white/80 p-3">
                  <img v-if="!removePlan && planPreviewUrl" :src="planPreviewUrl" class="max-h-full max-w-full rounded-xl object-contain ring-1 ring-slate-200" alt="Новая планировка" />
                  <img v-else-if="!removePlan && editForm.planKey" :src="publicFileUrl(editForm.planKey)" class="max-h-full max-w-full rounded-xl object-contain ring-1 ring-slate-200" alt="Планировка квартиры" />
                  <span v-else-if="removePlan" class="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">Будет удалена</span>
                  <span v-else class="text-xs font-semibold text-slate-400">Нет планировки</span>
                  <span v-if="planFile" class="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">новый файл</span>
                </div>
                <div class="flex items-center gap-2 px-4 py-3">
                  <input ref="planFileInput" type="file" accept="image/*" class="hidden" @change="onPlanFilePick" />
                  <button v-if="!removePlan" class="btn btn-ghost !px-3 !py-2 text-xs" @click="planFileInput?.click()"><AppIcon name="upload" :size="13" /> Заменить</button>
                  <button v-if="removePlan" class="btn btn-ghost !px-3 !py-2 text-xs" @click="keepPlanRender"><AppIcon name="rotate" :size="13" /> Вернуть</button>
                  <button v-if="editForm.planKey || planFile" class="btn !px-3 !py-2 text-xs" :class="removePlan ? 'btn-danger' : 'btn-ghost !text-rose-600'" @click="removePlanRender"><AppIcon name="trash" :size="13" /> Удалить</button>
                  <span v-if="planFile" class="ml-auto min-w-0 truncate text-[11px] font-semibold text-slate-500">{{ planFile.name }}</span>
                </div>
              </div>

              <div class="overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200/70">
                <div class="border-b border-slate-200/70 px-4 py-3">
                  <p class="text-sm font-extrabold text-slate-700">План секции</p>
                  <p class="text-xs text-slate-400">Файл: <code class="font-mono">{номер}-entrance.jpg</code></p>
                </div>
                <div class="relative flex h-40 items-center justify-center bg-white/80 p-3">
                  <img v-if="!removeEntrancePlan && entrancePlanPreviewUrl" :src="entrancePlanPreviewUrl" class="max-h-full max-w-full rounded-xl object-contain ring-1 ring-slate-200" alt="Новый план секции" />
                  <img v-else-if="!removeEntrancePlan && editForm.entrancePlanKey" :src="publicFileUrl(editForm.entrancePlanKey)" class="max-h-full max-w-full rounded-xl object-contain ring-1 ring-slate-200" alt="План секции" />
                  <span v-else-if="removeEntrancePlan" class="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">Будет удалён</span>
                  <span v-else class="text-xs font-semibold text-slate-400">Нет плана секции</span>
                  <span v-if="entrancePlanFile" class="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">новый файл</span>
                </div>
                <div class="flex items-center gap-2 px-4 py-3">
                  <input ref="entrancePlanFileInput" type="file" accept="image/*" class="hidden" @change="onEntrancePlanFilePick" />
                  <button v-if="!removeEntrancePlan" class="btn btn-ghost !px-3 !py-2 text-xs" @click="entrancePlanFileInput?.click()"><AppIcon name="upload" :size="13" /> Заменить</button>
                  <button v-if="removeEntrancePlan" class="btn btn-ghost !px-3 !py-2 text-xs" @click="keepEntrancePlanRender"><AppIcon name="rotate" :size="13" /> Вернуть</button>
                  <button v-if="editForm.entrancePlanKey || entrancePlanFile" class="btn !px-3 !py-2 text-xs" :class="removeEntrancePlan ? 'btn-danger' : 'btn-ghost !text-rose-600'" @click="removeEntrancePlanRender"><AppIcon name="trash" :size="13" /> Удалить</button>
                  <span v-if="entrancePlanFile" class="ml-auto min-w-0 truncate text-[11px] font-semibold text-slate-500">{{ entrancePlanFile.name }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Заметки -->
          <section class="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-slate-200/70">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-slate-400">
              <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><AppIcon name="edit" :size="14" /></span>
              Заметки
            </h4>
            <textarea v-model="editForm.notes" rows="3" maxlength="255" class="field resize-none" placeholder="Например: продаётся с мебелью, вид во двор, возможно торг…"></textarea>
            <div class="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Необязательное поле</span>
              <span class="tabular-nums">{{ (editForm.notes || '').length }}/255</span>
            </div>
          </section>

          <p v-if="formError" class="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-600">{{ formError }}</p>
        </div>
        <template #footer>
          <button class="btn btn-ghost" :disabled="saving" @click="closeEdit">Отмена</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveEdit">
            <span v-if="saving" class="loading-dot" /> Сохранить изменения
          </button>
        </template>
      </BaseModal>

    <!-- Delete apartment confirm -->
    <BaseModal :open="!!deleteTarget" title="Удалить квартиру?" width="sm" @close="deleteTarget = null">
      <p class="text-sm text-slate-600">Квартира <b>№{{ deleteTarget?.number }}</b> будет удалена. Действие необратимо.</p>
      <template #footer>
        <button class="btn btn-ghost" @click="deleteTarget = null">Отмена</button>
        <button class="btn btn-danger" :disabled="busy" @click="doDelete">
          <AppIcon name="trash" :size="15" /> Удалить
        </button>
      </template>
    </BaseModal>
  <!-- Price matrix modal -->
  <PriceMatrixModal
    :open="priceMatrixOpen"
    :complexes="complexes"
    :buildings="buildings"
    :entrances="entrances"
    :initial="{ complexId: complexId, buildingId: buildingId, entranceId: entranceId }"
    @close="priceMatrixOpen = false"
    @applied="onPriceMatrixApplied"
  />
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import AppIcon from '@/components/AppIcon.vue'
import ApartmentRooms from '@/components/ApartmentRooms.vue'
import ApartmentCard from '@/components/ApartmentCard.vue'
import ImportExportHelp from '@/components/ImportExportHelp.vue'
import PriceMatrixModal from '@/components/admin/PriceMatrixModal.vue'
import { manageApi, complexApi, publicFileUrl } from '@/api'
import { useUiStore } from '@/stores/uiStore'
import { APARTMENT_TYPES, STATUSES, apartmentTypeLabel, statusLabel, bathroomLabel, formatQuarter } from '@/utils/format.js'

const props = defineProps({
  action: { type: String, default: '' },
  chosen: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['handled'])

const ui = useUiStore()
const BATHROOMS = [
  { value: 'COMBINED', label: 'Совмещённый' },
  { value: 'SEPARATE', label: 'Раздельный' },
]

const complexes = ref([])
const buildings = ref([])
const entrances = ref([])
const apartments = ref([])
const total = ref(0)
const totalPages = ref(0)
const page = ref(0)
const loadingApartments = ref(false)
const busy = ref(false)
const saving = ref(false)
const uploading = ref(false)

const complexId = ref(null)
const buildingId = ref(null)
const entranceId = ref(null)

const importOpen = ref(false)
const priceMatrixOpen = ref(false)
const importFile = ref(null)
const fileInput = ref(null)
const formError = ref('')
const editing = ref(null)
const editForm = ref({})
const deleteTarget = ref(null)
const sectionHasMissingPlans = ref(false)
/* Рендеры в модалке редактирования */
const planFileInput = ref(null)
const entrancePlanFileInput = ref(null)
const planFile = ref(null)
const entrancePlanFile = ref(null)
const removePlan = ref(false)
const removeEntrancePlan = ref(false)
const planPreviewUrl = ref('')
const entrancePlanPreviewUrl = ref('')

const entranceName = computed(() => entrances.value.find((e) => e.id === entranceId.value)?.name || '')
const selectedComplexName = computed(() => complexes.value.find((c) => c.id === complexId.value)?.name || '')
const selectedBuildingName = computed(() => buildings.value.find((b) => b.id === buildingId.value)?.name || '')
const pageSize = ref(20)

const typeChip = (t) =>
  ({ STUDIO: 'bg-sky-50 text-sky-700', ONE_ROOM: 'bg-indigo-50 text-indigo-700', TWO_ROOM: 'bg-violet-50 text-violet-700', THREE_ROOM: 'bg-fuchsia-50 text-fuchsia-700', FOUR_ROOM: 'bg-pink-50 text-pink-700' }[t] || 'bg-slate-100 text-slate-600')
const statusChip = (s) =>
  ({ AVAILABLE: 'bg-emerald-50 text-emerald-700', RESERVED: 'bg-amber-50 text-amber-700', SOLD: 'bg-rose-50 text-rose-700' }[s] || 'bg-slate-100 text-slate-600')
const formatMoney = (v) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Number(v) || 0) + ' ₽'
const formatArea = (v) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(v) || 0) + ' м²'

const loadComplexes = async () => {
  try {
    const res = await complexApi.getComplexes({}, 0, 100)
    complexes.value = res.data.content || []
    if (!complexId.value && complexes.value.length) {
      const prefer = complexes.value.find((c) => c.id === props.chosen?.complexId)
      complexId.value = prefer ? prefer.id : complexes.value[0].id
    }
  } catch (e) {
    ui.toast(e.message, 'error')
  }
}
const loadBuildings = async () => {
  if (!complexId.value) return
  try {
    const res = await manageApi.getBuildings(complexId.value)
    buildings.value = res.data || []
    const prefer = props.chosen?.buildingId && buildings.value.find((b) => b.id === props.chosen.buildingId)
    buildingId.value = prefer ? prefer.id : buildings.value[0]?.id ?? null
  } catch {
    buildings.value = []
    buildingId.value = null
  }
}
const loadEntrances = async () => {
  if (!buildingId.value) return
  try {
    const res = await manageApi.getEntrances(buildingId.value)
    entrances.value = res.data || []
    const prefer = props.chosen?.entranceId && entrances.value.find((e) => e.id === props.chosen.entranceId)
    entranceId.value = prefer ? prefer.id : entrances.value[0]?.id ?? null
  } catch {
    entrances.value = []
    entranceId.value = null
  }
}
const loadApartments = async () => {
  if (!complexId.value) return
  loadingApartments.value = true
  try {
    // FilterDTO: комплекс + корпус + секция — иначе список игнорирует переключатели
    const params = { residentialComplexId: complexId.value }
    if (buildingId.value) params.buildingId = buildingId.value
    if (entranceId.value) params.entranceId = entranceId.value
    const res = await manageApi.getApartments(params, page.value, pageSize.value)
    apartments.value = res.data.content || []
    total.value = res.data.totalElements || 0
    totalPages.value = Math.max(1, res.data.totalPages || 1)
  } catch (e) {
    apartments.value = []
    ui.toast(e.message, 'error')
  } finally {
    loadingApartments.value = false
  }
}

/* Сроки сдачи/ключей кварталами: берём из edit-DTO (в квартире дат нет) */
const buildingMeta = ref({})
const loadBuildingMeta = async () => {
  if (!complexId.value) return
  try {
    const res = await manageApi.getComplexEdit(complexId.value)
    const map = {}
    ;(res.data?.buildings || []).forEach((b) => {
      ;(b.entrances || []).forEach((e) => {
        map[e.id] = { completion: b.completionDate, handover: b.keyHandoverDate }
      })
    })
    buildingMeta.value = map
  } catch {
    buildingMeta.value = {}
  }
}
const quartersOf = (a) => {
  const meta = buildingMeta.value[a?.entrance?.id]
  if (!meta) return null
  const parts = [formatQuarter(meta.completion), formatQuarter(meta.handover)].filter(Boolean)
  return parts.length ? parts.join(' / ') : null
}

/* Разворачивание карточки квартиры */
const expandedId = ref(null)
const expandOpen = ref(false)
const toggleRow = (id) => {
  if (expandedId.value === id) {
    expandOpen.value = false
    setTimeout(() => {
      if (expandedId.value === id) expandedId.value = null
    }, 280)
  } else {
    expandedId.value = id
  }
}
watch(expandedId, async (v) => {
  if (v === null) return
  expandOpen.value = false
  await nextTick()
  requestAnimationFrame(() => (expandOpen.value = true))
})
const hasAreas = (a) => a?.kitchenArea != null || a?.roomsArea != null || a?.bathroomArea != null || a?.hallwayArea != null

watch(complexId, async () => {
  page.value = 0
  await Promise.all([loadBuildings(), loadBuildingMeta()])
})
watch(buildingId, async () => {
  page.value = 0
  await loadEntrances()
})
watch(entranceId, async () => {
  page.value = 0
  await loadApartments()
await loadPlanAvailability()
})
watch(pageSize, () => {
  page.value = 0
  loadApartments()
})
watch(() => props.chosen?.complexId, (v) => {
    if (v && v !== complexId.value) complexId.value = v
  })
  watch(() => props.chosen?.buildingId, (v) => {
    if (v && buildings.value.some((b) => b.id === v)) buildingId.value = v
  })
  watch(() => props.chosen?.entranceId, (v) => {
    if (v && entrances.value.some((e) => e.id === v)) entranceId.value = v
  })

const onPage = (p) => {
  page.value = p
  loadApartments()
}

const openPriceMatrix = () => {
  priceMatrixOpen.value = true
}
const onPriceMatrixApplied = async () => {
  if (entranceId.value) await loadApartments()
}

const openImport = () => {
  formError.value = ''
  importFile.value = null
  importOpen.value = true
}
const onFilePick = (e) => {
  importFile.value = e.target.files?.[0] || null
}
const doImport = async () => {
  if (!importFile.value) return
  if (!entranceId.value) {
    formError.value = 'Сначала выберите секцию'
    return
  }
  uploading.value = true
  formError.value = ''
  try {
    const res = await manageApi.importApartments(entranceId.value, importFile.value)
    ui.toast(res.data || 'Файл загружен')
    importOpen.value = false
      await preparePlanUpload()
    await loadApartments()
  } catch (e) {
    formError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
const collectPlanCandidates = async () => {
    if (!entranceId.value) return { entranceId: null, entranceName: '', complexId: null, buildingId: null, complexName: '', buildingName: '', apartments: [] }
    try {
      const params = { residentialComplexId: complexId.value, entranceId: entranceId.value }
      if (buildingId.value) params.buildingId = buildingId.value
      const res = await manageApi.getApartments(params, 0, 1000)
      const items = res.data?.content || res.data || []
      const candidates = items.filter((a) => !a.planKey || !a.entrancePlanKey)
      return { entranceId: entranceId.value, entranceName: entranceName.value, complexId: complexId.value, buildingId: buildingId.value, complexName: selectedComplexName.value, buildingName: selectedBuildingName.value, apartments: candidates }
    } catch {
      return { entranceId: entranceId.value, entranceName: entranceName.value, complexId: complexId.value, buildingId: buildingId.value, complexName: selectedComplexName.value, buildingName: selectedBuildingName.value, apartments: [] }
    }
  }
const loadPlanAvailability = async () => {
    const ctx = await collectPlanCandidates()
    sectionHasMissingPlans.value = (ctx.apartments?.length || 0) > 0
  }

  const preparePlanUpload = async () => {
    const ctx = await collectPlanCandidates()
    if (ctx.apartments?.length) ui.offerPlanUpload(ctx)
  }

  const openPlanUpload = async () => {
    ui.openPlanUpload(await collectPlanCandidates())
  }

const exportCurrent = () => {
  if (!entranceId.value) {
    ui.toast('Сначала выберите секцию для выгрузки', 'error')
    return
  }
  const a = document.createElement('a')
  a.href = manageApi.exportApartmentsUrl(entranceId.value)
  a.download = 'apartments-sekciya-' + entranceId.value + '.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  ui.toast('Выгрузка файла началась')
}

const revokePlanPreview = () => {
  if (planPreviewUrl.value) URL.revokeObjectURL(planPreviewUrl.value)
  planPreviewUrl.value = ''
}
const revokeEntrancePlanPreview = () => {
  if (entrancePlanPreviewUrl.value) URL.revokeObjectURL(entrancePlanPreviewUrl.value)
  entrancePlanPreviewUrl.value = ''
}
const closeEdit = () => {
  revokePlanPreview()
  revokeEntrancePlanPreview()
  planFile.value = null
  entrancePlanFile.value = null
  removePlan.value = false
  removeEntrancePlan.value = false
  editing.value = null
}
const openEdit = (a) => {
  editForm.value = {
    id: a.id,
    number: a.number,
    floor: a.floor,
    area: a.area ?? null,
    kitchenArea: a.kitchenArea ?? null,
    hallwayArea: a.hallwayArea ?? null,
    bathroomArea: a.bathroomArea ?? null,
    roomsArea: a.roomsArea ?? null,
    price: a.price ?? null,
    pricePerSquareMeter: a.pricePerSquareMeter ?? null,
    type: a.type,
    bathroomType: a.bathroomType,
    hasBalcony: a.hasBalcony,
    status: a.status,
    notes: a.notes ?? '',
    planKey: a.planKey ?? '',
    entrancePlanKey: a.entrancePlanKey ?? '',
  }
  planFile.value = null
  entrancePlanFile.value = null
  removePlan.value = false
  removeEntrancePlan.value = false
  revokePlanPreview()
  revokeEntrancePlanPreview()
  formError.value = ''
  editing.value = a
}

const onPlanFilePick = (e) => {
  const file = e.target.files?.[0] || null
  revokePlanPreview()
  if (file) planPreviewUrl.value = URL.createObjectURL(file)
  planFile.value = file
  removePlan.value = false
}
const onEntrancePlanFilePick = (e) => {
  const file = e.target.files?.[0] || null
  revokeEntrancePlanPreview()
  if (file) entrancePlanPreviewUrl.value = URL.createObjectURL(file)
  entrancePlanFile.value = file
  removeEntrancePlan.value = false
}
const removePlanRender = () => {
  planFile.value = null
  revokePlanPreview()
  removePlan.value = true
  if (planFileInput.value) planFileInput.value.value = ''
}
const removeEntrancePlanRender = () => {
  entrancePlanFile.value = null
  revokeEntrancePlanPreview()
  removeEntrancePlan.value = true
  if (entrancePlanFileInput.value) entrancePlanFileInput.value.value = ''
}
const keepPlanRender = () => {
  removePlan.value = false
}
const keepEntrancePlanRender = () => {
  removeEntrancePlan.value = false
}

const saveEdit = async () => {
  saving.value = true
  formError.value = ''

  const required = [
    ['number', 'Номер квартиры'],
    ['floor', 'Этаж'],
    ['price', 'Цена'],
    ['type', 'Тип квартиры'],
    ['bathroomType', 'Тип санузла'],
    ['hasBalcony', 'Наличие балкона'],
    ['status', 'Статус'],
    ['hallwayArea', 'Площадь коридора'],
    ['bathroomArea', 'Площадь санузла'],
    ['roomsArea', 'Площадь комнат'],
  ]
  for (const [key, label] of required) {
    const v = editForm.value[key]
    if (v === '' || v === null || v === undefined) {
      formError.value = 'Заполните поле: ' + label
      saving.value = false
      return
    }
  }
  if ((editForm.value.notes || '').length > 255) {
    formError.value = 'Заметки не должны быть длиннее 255 символов'
    saving.value = false
    return
  }

  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
  const dto = {
    id: editForm.value.id,
    number: Number(editForm.value.number),
    floor: Number(editForm.value.floor),
    area: num(editForm.value.area),
    kitchenArea: num(editForm.value.kitchenArea),
    hallwayArea: Number(editForm.value.hallwayArea),
    bathroomArea: Number(editForm.value.bathroomArea),
    roomsArea: Number(editForm.value.roomsArea),
    price: Number(editForm.value.price),
    pricePerSquareMeter: num(editForm.value.pricePerSquareMeter),
    type: editForm.value.type,
    bathroomType: editForm.value.bathroomType,
    hasBalcony: editForm.value.hasBalcony,
    status: editForm.value.status,
    notes: (editForm.value.notes || '').trim(),
    planKey: removePlan.value ? null : (editForm.value.planKey || null),
    entrancePlanKey: removeEntrancePlan.value ? null : (editForm.value.entrancePlanKey || null),
  }

  const plan = removePlan.value ? null : planFile.value
  const entrancePlan = removeEntrancePlan.value ? null : entrancePlanFile.value

  try {
    await manageApi.updateApartment(dto.id, dto, plan, entrancePlan)
    ui.toast('Квартира обновлена')
    closeEdit()
    await loadApartments()
    await loadPlanAvailability()
    await ui.refreshMissingPlansSummary()
  } catch (e) {
    formError.value = e.message
    ui.toast(e.message, 'error')
  } finally {
    saving.value = false
  }
}
const askDelete = (a) => {
  deleteTarget.value = a
}
const doDelete = async () => {
  busy.value = true
  try {
    await manageApi.deleteApartment(deleteTarget.value.id)
    ui.toast('Квартира №' + deleteTarget.value.number + ' удалена')
    deleteTarget.value = null
    await loadApartments()
  } catch (e) {
    ui.toast(e.message, 'error')
  } finally {
    busy.value = false
  }
}

watch(
  () => props.action,
  (a) => {
    if (!a) return
    if (a === 'import') {
      openImport()
    } else if (a === 'export') {
      exportCurrent()
      } else if (a === 'price-matrix') {
        openPriceMatrix()
      }
    emit('handled')
  },
  { immediate: true }
)

onMounted(() => {
  loadComplexes()
})
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
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  width: 2rem;
  border-radius: 0.6rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
  cursor: pointer;
}
.icon-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
.btn-danger {
  background: #e11d48;
  color: #fff;
  box-shadow: 0 10px 20px -8px rgba(225, 29, 72, 0.6);
}
.btn-danger:hover {
  filter: brightness(1.08);
}
.loading-dot {
  width: 13px;
  height: 13px;
  border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
/* Плавное раскрытие карточки квартиры */
.expander {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}
.expander.open {
  grid-template-rows: 1fr;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
