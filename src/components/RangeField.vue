<!-- Пара полей "от — до" для числовых фильтров -->
<template>
  <div>
    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{{ label }}</label>
    <div class="field-group">
      <input
        class="field"
        type="number"
        inputmode="decimal"
        step="any"
        :placeholder="fromPh"
        :value="from ?? ''"
        aria-label="от"
        @input="emit('from', toNum($event.target.value))"
      />
      <span class="dash">—</span>
      <input
        class="field"
        type="number"
        inputmode="decimal"
        step="any"
        :placeholder="toPh"
        :value="to ?? ''"
        aria-label="до"
        @input="emit('to', toNum($event.target.value))"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  from: { type: [Number, String], default: null },
  to: { type: [Number, String], default: null },
  fromPh: { type: String, default: 'от' },
  toPh: { type: String, default: 'до' },
})
const emit = defineEmits(['from', 'to'])

const toNum = (raw) => (raw === '' || raw === null || raw === undefined ? null : Number(raw))
</script>
