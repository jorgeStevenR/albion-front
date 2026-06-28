import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AuthService } from '../../../core/auth/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AvalonService } from '../../../core/services/avalon.service';
import { AvalonRun, Distribution } from '../../../core/models/avalon.model';
import { BalanceResponse } from '../../../core/models/wallet.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-player-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    PageHeaderComponent,
    StatCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CurrencySilverPipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './player-dashboard.component.html',
  styleUrl: './player-dashboard.component.scss',
})
export class PlayerDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly walletService = inject(WalletService);
  private readonly avalonService = inject(AvalonService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  playerName = '';
  balance = 0;
  totalEarned = 0;
  weeklyEarnings = 0;
  avalonParticipations = 0;
  openAvalons: AvalonRun[] = [];
  recentDistributions: Distribution[] = [];

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.loading = false;
      return;
    }

    this.playerName = user.albionName;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const emptyBalance: BalanceResponse = {
      playerId: user.playerId,
      albionName: user.albionName,
      walletBalance: 0,
      distributions: [],
    };

    forkJoin({
      balance: this.walletService.getPlayerBalance(user.playerId).pipe(
        catchError(() => of(emptyBalance)),
      ),
      avalons: this.avalonService.getAll().pipe(catchError(() => of([] as AvalonRun[]))),
    }).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: ({ balance, avalons }) => {
        const distributions = balance.distributions ?? [];
        this.balance = Number(balance.walletBalance) || 0;
        this.totalEarned = distributions.reduce((s, d) => s + Number(d.amount), 0);
        this.weeklyEarnings = distributions
          .filter((d) => new Date(d.createdAt) >= weekAgo)
          .reduce((s, d) => s + Number(d.amount), 0);
        this.avalonParticipations = new Set(distributions.map((d) => d.avalonId)).size;
        this.recentDistributions = [...distributions]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        this.openAvalons = avalons
          .filter((a) => a.status === 'OPEN' && a.registrationsOpen !== false)
          .sort((a, b) => this.avalonTime(a) - this.avalonTime(b));
      },
    });
  }

  private avalonTime(a: AvalonRun): number {
    return a.scheduledAt
      ? new Date(a.scheduledAt).getTime()
      : new Date(a.date).getTime();
  }

  formatAvalonWhen(ava: AvalonRun): string {
    if (ava.scheduledAt) {
      return new Date(ava.scheduledAt).toLocaleString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return new Date(ava.date).toLocaleDateString('es-ES');
  }

  goToAvalons(): void {
    this.router.navigate(['/avalons']);
  }
}
