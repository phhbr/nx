import React from 'react';
import type { Row } from '@designsystem/dpl-web-components';

// Rows defined outside JSX — should migrate
const rows: Row[] = [
  {
    cells: [
      { type: 'status', value: { icon: 'check-circle', text: 'check-circle', color: 'gray' }, displayValue: 'Active', columnId: 'status' },
      { type: 'text', value: 'Alice', displayValue: 'Alice', columnId: 'name' },
    ],
  },
  {
    cells: [
      { type: 'status', value: { icon: 'error-circle', text: 'error-circle', color: 'gray' }, displayValue: 'Error', columnId: 'status' },
      { type: 'text', value: 'Bob', displayValue: 'Bob', columnId: 'name' },
    ],
  },
];

// Inline rows prop in JSX — should migrate
function StatusTable() {
  return (
    <dpl-table
      columns={['status', 'name']}
      rows={[
        {
          cells: [
            { type: 'status', value: { icon: 'warning', text: 'warning', color: 'gray' }, displayValue: 'Warning', columnId: 'status' },
            { type: 'text', value: 'Charlie', displayValue: 'Charlie', columnId: 'name' },
          ],
        },
      ]}
    />
  );
}

// Hook-based — rows built in useState — should migrate
function DynamicTable() {
  const [tableRows, setTableRows] = React.useState<Row[]>([
    { cells: [{ type: 'status', value: { icon: 'ok', text: 'ok', color: 'gray' }, displayValue: 'OK', columnId: 'state' }] },
  ]);

  const addRow = () =>
    setTableRows((prev) => [
      ...prev,
      { cells: [{ type: 'status', value: { icon: 'pending', text: 'pending', color: 'gray' }, displayValue: 'Pending', columnId: 'state' }] },
    ]);

  return <dpl-table rows={tableRows} />;
}

export { StatusTable, DynamicTable, rows };
