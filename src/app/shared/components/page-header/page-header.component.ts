import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p>{{ subtitle }}</p>
        }
      </div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;

      h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      p {
        margin: 0.25rem 0 0;
        color: var(--text-secondary);
      }

      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
    }
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
