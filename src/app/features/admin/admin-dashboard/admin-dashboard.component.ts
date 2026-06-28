import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { GuildService } from '../../../core/services/guild.service';
import { GuildStats } from '../../../core/models/guild.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    StatCardComponent,
    LoadingSpinnerComponent,
    CurrencySilverPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly guildService = inject(GuildService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  stats: GuildStats | null = null;

  ngOnInit(): void {
    this.guildService.getStats().pipe(
      catchError(() => of(null)),
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe((stats) => {
      this.stats = stats;
    });
  }

  getChartPercent(value: number, field: 'salesIncome' | 'avalonCount'): number {
    if (!this.stats?.weeklyStats.length) return 0;
    const max = Math.max(...this.stats.weeklyStats.map((w) => Number(w[field])), 1);
    return (Number(value) / max) * 100;
  }
}
