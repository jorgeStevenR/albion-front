import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { GuildService } from '../../../core/services/guild.service';
import { GuildTransaction } from '../../../core/models/guild.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-guild-transactions',
  standalone: true,
  imports: [
    DatePipe,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    CurrencySilverPipe,
    MatTableModule,
    MatChipsModule,
  ],
  templateUrl: './guild-transactions.component.html',
  styleUrl: './guild-transactions.component.scss',
})
export class GuildTransactionsComponent implements OnInit {
  private readonly guildService = inject(GuildService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  transactions: GuildTransaction[] = [];

  ngOnInit(): void {
    this.guildService.getTransactions().pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (data) => (this.transactions = data),
    });
  }

  typeLabel(type: string): string {
    return type === 'SALE' ? 'Venta' : 'Reparto';
  }
}
