import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AuthService } from '../../../core/auth/auth.service';
import { AvalonService } from '../../../core/services/avalon.service';
import { AvalonRun } from '../../../core/models/avalon.model';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-caller-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    StatCardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './caller-dashboard.component.html',
  styleUrl: './caller-dashboard.component.scss',
})
export class CallerDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly avalonService = inject(AvalonService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  callerName = '';
  myOpenPings = 0;
  activeAvalons = 0;
  finishedAvalons = 0;
  myAvalons: AvalonRun[] = [];
  manageableAvalons: AvalonRun[] = [];

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.loading = false;
      return;
    }

    this.callerName = user.albionName;
    this.avalonService.getAll().pipe(
      catchError(() => of([] as AvalonRun[])),
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (avalons) => {
        const mine = avalons.filter((a) => a.createdByPlayerId === user.playerId);
        this.myOpenPings = mine.filter((a) => a.status === 'OPEN').length;
        this.activeAvalons = avalons.filter((a) => a.status === 'OPEN').length;
        this.finishedAvalons = avalons.filter((a) => a.status === 'FINISHED').length;
        this.myAvalons = mine
          .filter((a) => a.status === 'OPEN' || a.status === 'FINISHED')
          .sort((a, b) => this.avalonTime(b) - this.avalonTime(a));
        this.manageableAvalons = avalons
          .filter((a) => a.status === 'OPEN' || a.status === 'FINISHED')
          .sort((a, b) => this.avalonTime(b) - this.avalonTime(a))
          .slice(0, 8);
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
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return new Date(ava.date).toLocaleDateString('es-ES');
  }

  statusLabel(status: AvalonRun['status']): string {
    const labels: Record<AvalonRun['status'], string> = {
      OPEN: 'Abierta',
      FINISHED: 'Terminada',
      CLOSED: 'Cerrada',
    };
    return labels[status] ?? status;
  }

  goToCreate(): void {
    this.router.navigate(['/avalons/create']);
  }

  goToPenalties(): void {
    this.router.navigate(['/caller/penalties']);
  }
}
