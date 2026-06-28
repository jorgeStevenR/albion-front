import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AuthService } from '../../../core/auth/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { GuildService } from '../../../core/services/guild.service';
import { AvalonService } from '../../../core/services/avalon.service';
import { AvalonRun } from '../../../core/models/avalon.model';
import { GuildStats, GuildTransaction } from '../../../core/models/guild.model';
import { BalanceResponse } from '../../../core/models/wallet.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-my-wallet',
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
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
  ],
  templateUrl: './my-wallet.component.html',
  styleUrl: './my-wallet.component.scss',
})
export class MyWalletComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly walletService = inject(WalletService);
  private readonly guildService = inject(GuildService);
  private readonly avalonService = inject(AvalonService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  balance = 0;
  totalEarned = 0;
  totalSpent = 0;
  playerName = '';
  readonly isGuildView = inject(AuthService).hasRole('ADMIN', 'CALLER', 'OFFICER');
  guildStats: GuildStats | null = null;
  completedAvalons: AvalonRun[] = [];
  payments: GuildTransaction[] = [];

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.finishLoading();
      return;
    }

    if (this.isGuildView) {
      forkJoin({
        wallet: this.walletService.getPlayerBalance(user.playerId),
        stats: this.guildService.getStats(),
        avalons: this.avalonService.getAll(),
        transactions: this.guildService.getTransactions(),
      }).pipe(
        finalize(() => this.finishLoading()),
      ).subscribe({
        next: ({ wallet, stats, avalons, transactions }) => {
          this.applyWallet(wallet);
          this.guildStats = stats;
          this.completedAvalons = avalons
            .filter((a) => a.status === 'FINISHED' || a.status === 'CLOSED')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          this.payments = transactions.filter((t) => t.type === 'DISTRIBUTION');
        },
      });
      return;
    }

    this.walletService.getPlayerBalance(user.playerId).pipe(
      finalize(() => this.finishLoading()),
    ).subscribe({
      next: (wallet) => this.applyWallet(wallet),
    });
  }

  private applyWallet(wallet: BalanceResponse): void {
    this.balance = Number(wallet.walletBalance) || 0;
    this.playerName = wallet.albionName;
    const distributions = wallet.distributions ?? [];
    this.totalEarned = distributions.reduce((s, d) => s + Number(d.amount), 0);
    this.totalSpent = Math.max(0, this.totalEarned - this.balance);
  }

  get treasuryBalance(): number {
    return Number(this.guildStats?.treasuryBalance) || 0;
  }

  avalonStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      OPEN: 'Abierta',
      FINISHED: 'Terminada — vendiendo loot',
      CLOSED: 'Cerrada',
    };
    return labels[status] ?? status;
  }

  private finishLoading(): void {
    finishLoading(this.cdr, () => (this.loading = false));
  }
}
