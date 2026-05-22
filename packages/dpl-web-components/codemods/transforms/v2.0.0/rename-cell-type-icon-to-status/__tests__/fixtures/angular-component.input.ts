import { Component, OnInit } from '@angular/core';
import type { Row } from '@designsystem/dpl-web-components';

@Component({
  selector: 'app-user-table',
  templateUrl: './user-table.component.html',
})
export class UserTableComponent implements OnInit {
  columns = ['status', 'name', 'score'];

  // Class property rows — should migrate
  rows: Row[] = [
    {
      cells: [
        { type: 'icon', value: 'check-circle', displayValue: 'Active', columnId: 'status' },
        { type: 'text', value: 'Alice', displayValue: 'Alice', columnId: 'name' },
        { type: 'number', value: '95', displayValue: '95', columnId: 'score' },
      ],
    },
    {
      cells: [
        { type: 'icon', value: 'error-circle', displayValue: 'Inactive', columnId: 'status' },
        { type: 'text', value: 'Bob', displayValue: 'Bob', columnId: 'name' },
        { type: 'number', value: '72', displayValue: '72', columnId: 'score' },
      ],
    },
  ];

  ngOnInit(): void {
    // Rows built in a lifecycle hook — should migrate
    this.rows = [
      {
        cells: [
          { type: 'icon', value: 'warning', displayValue: 'Warning', columnId: 'status' },
          { type: 'text', value: 'Charlie', displayValue: 'Charlie', columnId: 'name' },
          { type: 'number', value: '50', displayValue: '50', columnId: 'score' },
        ],
      },
    ];
  }

  // Method returning a cell — should migrate
  buildStatusCell(isActive: boolean) {
    return {
      type: 'icon' as const,
      value: isActive ? 'check' : 'error',
      displayValue: isActive ? 'Active' : 'Inactive',
      columnId: 'status',
    };
  }
}
