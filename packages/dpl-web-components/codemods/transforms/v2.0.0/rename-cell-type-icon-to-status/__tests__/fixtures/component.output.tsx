import type { Cell, Row } from '@designsystem/dpl-web-components';

// Single cell variable — should be migrated
const warningCell: Cell = {
  type: 'status',
  value: { icon: 'warning-circle', text: 'warning-circle', color: 'gray' },
  displayValue: 'Warning',
  columnId: 'state',
};

// Array of rows with mixed cell types — only 'icon' should change
const rows: Row[] = [
  {
    cells: [
      { type: 'status', value: { icon: 'check-circle', text: 'check-circle', color: 'gray' }, displayValue: 'Active', columnId: 'status' },
      { type: 'text', value: 'Alice', displayValue: 'Alice', columnId: 'name' },
      { type: 'number', value: '42', displayValue: '42', columnId: 'count' },
    ],
  },
  {
    cells: [
      { type: 'status', value: { icon: 'error-circle', text: 'error-circle', color: 'gray' }, displayValue: 'Error', columnId: 'status' },
      { type: 'text', value: 'Bob', displayValue: 'Bob', columnId: 'name' },
      { type: 'number', value: '7', displayValue: '7', columnId: 'count' },
    ],
  },
];

// Expression-container variant — should be migrated
const cell2 = { type: "status", value: { icon: 'info', text: 'info', color: 'gray' }, displayValue: 'Info', columnId: 'note' };
