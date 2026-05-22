<script setup lang="ts">
import type { Row } from '@designsystem/dpl-web-components';

const columns = ['status', 'name'];

// Rows defined in <script setup> — should migrate
const rows: Row[] = [
  {
    cells: [
      { type: 'status', value: { icon: 'check', text: 'check', color: 'gray' }, displayValue: 'OK', columnId: 'status' },
      { type: 'text', value: 'Alice', displayValue: 'Alice', columnId: 'name' },
    ],
  },
  {
    cells: [
      { type: 'status', value: { icon: 'error', text: 'error', color: 'gray' }, displayValue: 'Error', columnId: 'status' },
      { type: 'text', value: 'Bob', displayValue: 'Bob', columnId: 'name' },
    ],
  },
];
</script>

<template>
  <!-- Bound via variable — [rows] unchanged, but script above is migrated -->
  <dpl-table :columns="columns" :rows="rows" />

  <!-- Inline binding — should migrate -->
  <dpl-table
    :rows="[{ cells: [{ type: 'status', value: { icon: 'ok', text: 'ok', color: 'gray' }, displayValue: 'OK', columnId: 'state' }] }]"
  />
</template>
