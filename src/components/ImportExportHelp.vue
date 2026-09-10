<!-- Справка по формату файла импорта/экспорта квартир -->
<template>
  <div class="text-xs text-slate-500">
    <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>💡 Импорт/экспорт квартир работает по секции: файл должен соответствовать шаблону выгрузки (xlsx).</span>
      <button
        class="inline-flex items-center gap-1 font-bold text-indigo-600 underline decoration-indigo-300 decoration-dotted underline-offset-2 transition hover:text-indigo-700"
        @click="open = true"
      >
        Какой именно формат нужен?
        <AppIcon name="arrow-up-right" :size="12" :stroke-width="2.6" />
      </button>
    </p>

    <BaseModal
      :open="open"
      title="Формат файла квартир (xlsx)"
      subtitle="Лист Apartment · первая строка — заголовки · данные со второй строки"
      width="xl"
      @close="open = false"
    >
      <div class="space-y-5 text-sm text-slate-600">
        <!-- Общие правила -->
        <section class="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
          <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400">Общие правила</h4>
          <ul class="mt-2 space-y-1.5">
            <li>• Только <b>.xlsx</b>. Имя листа — <b>Apartment</b> (принимаются также «квартиры», «апартаменты», «apartments», «apart»).</li>
            <li>• <b>Первая строка</b> — заголовки колонок. Регистр и порядок колонок не важны: сопоставление идёт по названию (или синониму).</li>
            <li>• Должны присутствовать <b>все 9 колонок</b> из таблицы ниже. Лишние колонки игнорируются.</li>
            <li>• Данные — со второй строки. Разбор останавливается на первой строке, где <b>пустая первая ячейка</b>.</li>
            <li>• Формулы и пустые ячейки не поддерживаются — сервер вернёт ошибку «Ячейка пуста».</li>
            <li>• Квартиры привязываются к <b>секции, выбранной в интерфейсе</b>: колонок «корпус»/«секция» в файле нет.</li>
          </ul>
        </section>

        <!-- Таблица колонок -->
        <section>
          <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400">Колонки файла</h4>
          <div class="mt-2 overflow-hidden rounded-2xl ring-1 ring-slate-200">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[42rem] text-left text-xs">
                <thead class="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th class="px-3 py-2.5">Заголовок</th>
                    <th class="px-3 py-2.5">Допустимые синонимы</th>
                    <th class="px-3 py-2.5">Что писать</th>
                    <th class="px-3 py-2.5">Пример</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="col in columns" :key="col.title" class="align-top">
                    <td class="px-3 py-2.5 font-bold text-slate-800">{{ col.title }}</td>
                    <td class="px-3 py-2.5 text-slate-500">{{ col.synonyms }}</td>
                    <td class="px-3 py-2.5 text-slate-600">{{ col.values }}</td>
                    <td class="px-3 py-2.5 font-mono text-[11px] text-indigo-700">{{ col.example }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Значения -->
        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="rounded-2xl bg-indigo-50/60 p-4 ring-1 ring-indigo-100">
            <h4 class="text-xs font-bold uppercase tracking-widest text-indigo-500">Тип квартиры</h4>
            <p class="mt-2 leading-relaxed">
              <code v-for="t in APARTMENT_TYPES" :key="t.value" class="mr-1.5 inline-block rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] text-indigo-700 ring-1 ring-indigo-100">{{ t.value }}</code>
            </p>
            <p class="mt-2 text-slate-500">Можно писать и отображаемое имя, как в выгрузке: «Студия», «1-к», «2Е» и т.д.</p>
          </div>
          <div class="rounded-2xl bg-emerald-50/60 p-4 ring-1 ring-emerald-100">
            <h4 class="text-xs font-bold uppercase tracking-widest text-emerald-600">Статус и санузел</h4>
            <p class="mt-2 leading-relaxed">
              Статус:
              <code v-for="s in STATUSES" :key="s.value" class="mr-1.5 inline-block rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] text-emerald-700 ring-1 ring-emerald-100">{{ s.value }}</code>
            </p>
            <p class="mt-1.5 leading-relaxed">
              Санузел:
              <code class="mr-1.5 inline-block rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] text-emerald-700 ring-1 ring-emerald-100">COMBINED</code>
              <code class="inline-block rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] text-emerald-700 ring-1 ring-emerald-100">SEPARATE</code>
            </p>
            <p class="mt-2 text-slate-500">Как и в выгрузке: «Свободна», «Забронирована», «Продана»; «Совмещённый», «Раздельный».</p>
          </div>
        </section>

        <!-- Числа и булево -->
        <section class="rounded-2xl bg-amber-50/70 p-4 ring-1 ring-amber-100">
          <h4 class="text-xs font-bold uppercase tracking-widest text-amber-600">Числа и «Балкон»</h4>
          <ul class="mt-2 space-y-1.5">
            <li>• Дробные числа: разделитель — точка или запятая (<b>41,8</b> и <b>41.8</b> равнозначны).</li>
            <li>• Целые (№, Этаж): числовая ячейка Excel <b>7</b> или <b>7.0</b> — оба варианта читаются как 7.</li>
            <li>• «Балкон» — логическое значение Excel <b>TRUE</b>/<b>FALSE</b> или текст <b>true</b>/<b>false</b>. Другие варианты («да», «1», «+») будут прочитаны как FALSE.</li>
            <li>• «Цена» и «Цена за м²» — обычные числа без пробелов и знака ₽: <b>8400000</b>, <b>200957.5</b>.</li>
          </ul>
        </section>

        <!-- Пример -->
        <section>
          <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400">Пример листа «Apartment»</h4>
          <div class="mt-2 overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-200">
            <div>№&nbsp;&nbsp;&nbsp;| Тип&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Цена&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Цена за м²&nbsp;| Этаж | Площадь | Балкон | Статус&nbsp;&nbsp;&nbsp;&nbsp;| Тип санузла</div>
            <div class="text-slate-400">12&nbsp;&nbsp;| STUDIO&nbsp;&nbsp;| 8400000&nbsp;&nbsp;| 200957&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 7&nbsp;&nbsp;&nbsp;&nbsp;| 41.8&nbsp;&nbsp;&nbsp;&nbsp;| TRUE&nbsp;&nbsp;&nbsp;| AVAILABLE&nbsp;| COMBINED</div>
            <div class="text-slate-400">13&nbsp;&nbsp;| ONE_ROOM| 7200000&nbsp;&nbsp;| 210526&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 5&nbsp;&nbsp;&nbsp;&nbsp;| 34.2&nbsp;&nbsp;&nbsp;&nbsp;| FALSE&nbsp;&nbsp;| RESERVED&nbsp;&nbsp;| SEPARATE</div>
          </div>
          <p class="mt-2 text-slate-500">Файл выгрузки можно править и загружать обратно — формат тот же.</p>
        </section>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/AppIcon.vue'
import { APARTMENT_TYPES, STATUSES } from '@/utils/format.js'

const open = ref(false)

/* Колонки и синонимы — из @ExcelColumn в Apartment.java */
const columns = [
  { title: '№', synonyms: 'номер, #, №, ном, number, num', values: 'Целое число, ≥ 1', example: '12' },
  { title: 'Тип', synonyms: 'type, тип, тип квартиры, комнаты, количество комнат', values: 'Код типа или название как в выгрузке', example: 'STUDIO' },
  { title: 'Цена', synonyms: 'цена, price, стоимость', values: 'Число, без пробелов и ₽', example: '8400000' },
  { title: 'Цена за м²', synonyms: 'цена за м², цена квм, price per m², PPSM', values: 'Число (если не заполнить — останется пустым)', example: '200957' },
  { title: 'Этаж', synonyms: 'этаж, floor', values: 'Целое число', example: '7' },
  { title: 'Площадь', synonyms: 'area, площадь, s', values: 'Число; запятая или точка', example: '41.8' },
  { title: 'Балкон', synonyms: 'наличие балкона, балкон, hasBalcony', values: 'TRUE / FALSE', example: 'TRUE' },
  { title: 'Статус', synonyms: 'status, статус', values: 'AVAILABLE / RESERVED / SOLD', example: 'AVAILABLE' },
  { title: 'Тип санузла', synonyms: 'тип санузла, санузел, bathroom, bathroomType', values: 'COMBINED / SEPARATE', example: 'COMBINED' },
]
</script>
