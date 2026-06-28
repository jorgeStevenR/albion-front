import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CurrencySilverPipe } from '../../pipes/currency-silver.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatIconModule, CurrencySilverPipe],
  template: `
    <div class="stat-card" [class]="'accent-' + accent">
      <div class="stat-icon">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <div class="stat-content">
        <span class="stat-label">{{ label }}</span>
        @if (isCurrency && typeof value === 'number') {
          <span class="stat-value">{{ value | currencySilver }} <small>silver</small></span>
        } @else {
          <span class="stat-value">{{ value }}</span>
        }
        @if (trend) {
          <span class="stat-trend" [class.positive]="trendPositive" [class.negative]="!trendPositive">
            {{ trend }}
          </span>
        }
      </div>
    </div>
  `,
  styles: `
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(212, 175, 55, 0.15);
        color: var(--gold);
      }

      &.accent-green .stat-icon {
        background: rgba(76, 175, 80, 0.15);
        color: var(--silver-green);
      }

      &.accent-blue .stat-icon {
        background: rgba(100, 181, 246, 0.15);
        color: #64b5f6;
      }

      &.accent-purple .stat-icon {
        background: rgba(186, 104, 200, 0.15);
        color: #ba68c8;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .stat-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);

        small {
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--text-secondary);
        }
      }

      .stat-trend {
        font-size: 0.75rem;

        &.positive { color: var(--silver-green); }
        &.negative { color: #ef5350; }
      }
    }
  `,
})
export class StatCardComponent {
  @Input() icon = 'analytics';
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() isCurrency = false;
  @Input() trend = '';
  @Input() trendPositive = true;
  @Input() accent: 'gold' | 'green' | 'blue' | 'purple' = 'gold';
}
