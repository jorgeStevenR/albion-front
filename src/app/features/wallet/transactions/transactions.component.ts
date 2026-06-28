import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { GuildService } from '../../../core/services/guild.service';
import { GuildStats, GuildTransaction } from '../../../core/models/guild.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    DatePipe,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatCardComponent,
    CurrencySilverPipe,
    MatTableModule,
    MatChipsModule,
    MatTabsModule,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit {
  private readonly guildService = inject(GuildService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  transactions: GuildTransaction[] = [];
  stats: GuildStats | null = null;
  displayedColumns = ['date', 'type', 'description', 'amount'];

  ngOnInit(): void {
    forkJoin({
      transactions: this.guildService.getTransactions(),
      stats: this.guildService.getStats(),
    }).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: ({ transactions, stats }) => {
        this.transactions = transactions;
        this.stats = stats;
      },
    });
  }

  get weeklyIncome(): number {
    return Number(this.stats?.weeklySalesIncome) || 0;
  }

  get weeklyPayouts(): number {
    return Number(this.stats?.weeklyMemberEarnings) || 0;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      SALE: 'Ingreso (venta)',
      DISTRIBUTION: 'Pago jugador',
    };
    return labels[type] ?? type;
  }

  getTypeClass(type: string): string {
    return `type-${type.toLowerCase()}`;
  }
}
