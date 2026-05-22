import type { Cell, Row } from '@designsystem/dpl-web-components';

// Single cell variable — should be migrated
const warningCell: Cell = {
  type: 'icon',
  value: 'warning-circle',
  displayValue: 'Warning',
  columnId: 'state',
};

// Array of rows with mixed cell types — only 'icon' should change
const rows: Row[] = [
  {
    cells: [
      { type: 'icon', value: 'check-circle', displayValue: 'Active', columnId: 'status' },
      { type: 'text', value: 'Alice', displayValue: 'Alice', columnId: 'name' },
      { type: 'number', value: '42', displayValue: '42', columnId: 'count' },
    ],
  },
  {
    cells: [
      { type: 'icon', value: 'error-circle', displayValue: 'Error', columnId: 'status' },
      { type: 'text', value: 'Bob', displayValue: 'Bob', columnId: 'name' },
      { type: 'number', value: '7', displayValue: '7', columnId: 'count' },
    ],
  },
];

// Expression-container variant — should be migrated
const cell2 = { type: "icon", value: 'info', displayValue: 'Info', columnId: 'note' };
