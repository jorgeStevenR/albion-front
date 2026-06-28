import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AuthService } from '../../../core/auth/auth.service';
import { WalletService } from '../../../core/services/wallet.service';
import { BalanceResponse } from '../../../core/models/wallet.model';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-my-wallet',
  standalone: true,
  imports: [
    PageHeaderComponent,
    StatCardComponent,
    LoadingSpinnerComponent,
    MatCardModule,
  ],
  templateUrl: './my-wallet.component.html',
  styleUrl: './my-wallet.component.scss',
})
export class MyWalletComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly walletService = inject(WalletService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  balance = 0;
  totalEarned = 0;
  totalSpent = 0;
  playerName = '';

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.finishLoading();
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

  private finishLoading(): void {
    finishLoading(this.cdr, () => (this.loading = false));
  }
}
