import React from 'react';
import type { Row } from '@designsystem/dpl-web-components';

// Rows defined outside JSX — should migrate
const rows: Row[] = [
  {
    cells: [
      { type: 'icon', value: 'check-circle', displayValue: 'Active', columnId: 'status' },
      { type: 'text', value: 'Alice', displayValue: 'Alice', columnId: 'name' },
    ],
  },
  {
    cells: [
      { type: 'icon', value: 'error-circle', displayValue: 'Error', columnId: 'status' },
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
            { type: 'icon', value: 'warning', displayValue: 'Warning', columnId: 'status' },
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
    { cells: [{ type: 'icon', value: 'ok', displayValue: 'OK', columnId: 'state' }] },
  ]);

  const addRow = () =>
    setTableRows((prev) => [
      ...prev,
      { cells: [{ type: 'icon', value: 'pending', displayValue: 'Pending', columnId: 'state' }] },
    ]);

  return <dpl-table rows={tableRows} />;
}

export { StatusTable, DynamicTable, rows };
