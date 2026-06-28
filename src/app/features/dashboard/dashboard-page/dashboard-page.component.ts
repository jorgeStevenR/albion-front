import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AuthService } from '../../../core/auth/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AvalonService } from '../../../core/services/avalon.service';
import { PlayerService } from '../../../core/services/player.service';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Distribution } from '../../../core/models/avalon.model';
import { BalanceResponse } from '../../../core/models/wallet.model';
import { AvalonRun } from '../../../core/models/avalon.model';
import { Player } from '../../../core/models/player.model';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { finishLoading } from '../../../shared/utils/loading.util';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    PageHeaderComponent,
    StatCardComponent,
    LoadingSpinnerComponent,
    CurrencySilverPipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly walletService = inject(WalletService);
  private readonly avalonService = inject(AvalonService);
  private readonly playerService = inject(PlayerService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  balance = 0;
  weeklyEarnings = 0;
  avalonCount = 0;
  memberCount = 0;
  weeklyChart: { week: string; amount: number }[] = [];
  participationChart: { label: string; count: number }[] = [];
  openAvalons: AvalonRun[] = [];

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.loading = false;
      return;
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const emptyBalance: BalanceResponse = {
      playerId: user.playerId,
      albionName: user.albionName,
      walletBalance: 0,
      distributions: [],
    };

    const requests = {
      balance: this.walletService.getPlayerBalance(user.playerId).pipe(
        catchError(() => of(emptyBalance)),
      ),
      avalons: this.avalonService.getAll().pipe(catchError(() => of([] as AvalonRun[]))),
      ...(this.auth.isAdmin()
        ? { players: this.playerService.getAll().pipe(catchError(() => of([] as Player[]))) }
        : {}),
    };

    forkJoin(requests).subscribe({
      next: (result) => {
        const balance = result.balance;
        const avalons = result.avalons;
        const players = ('players' in result ? result.players : []) as Player[];
        this.applyData(
          balance.walletBalance,
          balance.distributions,
          weekAgo,
          avalons.length,
          players.filter((p) => p.active).length,
          avalons.filter((a) => a.status === 'OPEN' && a.registrationsOpen !== false),
        );
      },
      error: () => this.finishLoading(),
    });
  }

  private applyData(
    walletBalance: number,
    distributions: Distribution[],
    weekAgo: Date,
    avalonCount: number,
    memberCount: number,
    openAvalons: AvalonRun[],
  ): void {
    this.balance = walletBalance;
    this.weeklyEarnings = distributions
      .filter((d) => new Date(d.createdAt) >= weekAgo)
      .reduce((sum, d) => sum + d.amount, 0);
    this.avalonCount = avalonCount;
    this.memberCount = memberCount;
    this.openAvalons = openAvalons.sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : new Date(a.date).getTime();
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : new Date(b.date).getTime();
      return ta - tb;
    });
    this.buildCharts(distributions);
    this.finishLoading();
  }

  private finishLoading(): void {
    finishLoading(this.cdr, () => (this.loading = false));
  }

  private buildCharts(distributions: Distribution[]): void {
    const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    const amounts = [0, 0, 0, 0];

    distributions.forEach((d) => {
      const idx = Math.min(3, Math.floor((Date.now() - new Date(d.createdAt).getTime()) / (7 * 86400000)));
      amounts[3 - idx] += d.amount;
    });

    this.weeklyChart = weeks.map((week, i) => ({ week, amount: amounts[i] }));
    this.participationChart = [
      { label: 'Avalonianas', count: this.avalonCount },
      { label: 'Recompensas', count: distributions.length },
      { label: 'Este mes', count: distributions.filter((d) => new Date(d.createdAt) > new Date(Date.now() - 30 * 86400000)).length },
    ];
  }

  getChartPercent(amount: number): number {
    const max = Math.max(...this.weeklyChart.map((w) => w.amount), 1);
    return (amount / max) * 100;
  }
}
