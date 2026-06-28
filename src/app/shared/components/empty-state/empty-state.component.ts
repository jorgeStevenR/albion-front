import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-icon>{{ icon }}</mat-icon>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
      @if (actionLabel) {
        <button mat-flat-button color="primary" type="button" (click)="actionClick.emit()">
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--text-secondary);

      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: var(--gold);
        opacity: 0.6;
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0 0 0.5rem;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 1.5rem;
        max-width: 360px;
      }
    }
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Sin datos';
  @Input() description = 'No hay información para mostrar';
  @Input() actionLabel = '';
  @Output() actionClick = new EventEmitter<void>();
}
