import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DplButton } from '@designsystem/dpl-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DplButton],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'DPL Angular Demo';
}
