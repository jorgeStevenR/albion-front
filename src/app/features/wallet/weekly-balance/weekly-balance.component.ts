import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AuthService } from '../../../core/auth/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { WeeklyBalance } from '../../../core/models/wallet.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-weekly-balance',
  standalone: true,
  imports: [
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CurrencySilverPipe,
    MatTableModule,
    MatCardModule,
  ],
  templateUrl: './weekly-balance.component.html',
  styleUrl: './weekly-balance.component.scss',
})
export class WeeklyBalanceComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly walletService = inject(WalletService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  weeks: WeeklyBalance[] = [];
  displayedColumns = ['week', 'earnings', 'expenses', 'finalBalance'];

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      finishLoading(this.cdr, () => (this.loading = false));
      return;
    }

    this.walletService.getPlayerBalance(user.playerId).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (data) => {
        const weekMap = new Map<string, { earnings: number; expenses: number }>();

        for (let i = 0; i < 8; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i * 7);
          const key = `Semana ${this.getWeekNumber(d)}`;
          weekMap.set(key, { earnings: 0, expenses: 0 });
        }

        (data.distributions ?? []).forEach((dist) => {
          const d = new Date(dist.createdAt);
          const key = `Semana ${this.getWeekNumber(d)}`;
          const entry = weekMap.get(key);
          if (entry) {
            entry.earnings += Number(dist.amount);
          }
        });

        let runningBalance = 0;
        this.weeks = [...weekMap.entries()]
          .reverse()
          .map(([week, { earnings, expenses }]) => {
            runningBalance += earnings - expenses;
            return { week, earnings, expenses, finalBalance: runningBalance };
          });
      },
    });
  }

  private getWeekNumber(date: Date): string {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
    return String(Math.ceil((days + start.getDay() + 1) / 7));
  }
}
