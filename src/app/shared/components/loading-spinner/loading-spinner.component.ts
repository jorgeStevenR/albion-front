import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-container" [class.overlay]="overlay">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      @if (message) {
        <p>{{ message }}</p>
      }
    </div>
  `,
  styles: `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      color: var(--text-secondary);

      &.overlay {
        position: absolute;
        inset: 0;
        background: rgba(10, 12, 18, 0.7);
        z-index: 10;
        backdrop-filter: blur(2px);
      }

      p {
        margin: 0;
        font-size: 0.9rem;
      }
    }
  `,
})
export class LoadingSpinnerComponent {
  @Input() message = '';
  @Input() diameter = 48;
  @Input() overlay = false;
}
