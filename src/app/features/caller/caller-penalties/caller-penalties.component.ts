import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AvalonService } from '../../../core/services/avalon.service';
import { PenaltyService } from '../../../core/services/penalty.service';
import { PlayerService } from '../../../core/services/player.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AvalonRun } from '../../../core/models/avalon.model';
import { AvalonPenalty, PenaltyDirection } from '../../../core/models/penalty.model';
import { Player } from '../../../core/models/player.model';
import { finishLoading } from '../../../shared/utils/loading.util';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-caller-penalties',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CurrencySilverPipe,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './caller-penalties.component.html',
  styleUrl: './caller-penalties.component.scss',
})
export class CallerPenaltiesComponent implements OnInit {
  private readonly avalonService = inject(AvalonService);
  private readonly penaltyService = inject(PenaltyService);
  private readonly playerService = inject(PlayerService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  loading = true;
  submitting = false;
  avalons: AvalonRun[] = [];
  players: Player[] = [];
  recentPenalties: AvalonPenalty[] = [];

  form = this.fb.nonNullable.group({
    avalonId: [0, Validators.required],
    playerId: [0, Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    direction: ['DEBIT' as PenaltyDirection, Validators.required],
    reason: ['', Validators.required],
  });

  ngOnInit(): void {
    this.playerService.getAll().subscribe({
      next: (p) => (this.players = p.filter((pl) => pl.active)),
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.avalonService.getAll().pipe(
      catchError(() => of([] as AvalonRun[])),
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (avalons) => {
        this.avalons = avalons
          .filter((a) => a.status === 'OPEN' || a.status === 'FINISHED')
          .sort((a, b) => this.avalonTime(b) - this.avalonTime(a));
        this.loadRecentPenalties();
      },
    });
  }

  private loadRecentPenalties(): void {
    const ids = this.avalons.slice(0, 10).map((a) => a.id);
    if (!ids.length) {
      this.recentPenalties = [];
      return;
    }
    forkJoin(ids.map((id) => this.penaltyService.listByAvalon(id).pipe(catchError(() => of([]))))).subscribe({
      next: (groups) => {
        this.recentPenalties = groups
          .flat()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 20);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.getRawValue();
    this.submitting = true;
    this.penaltyService.applyManual(val.avalonId, {
      playerId: val.playerId,
      amount: val.amount,
      direction: val.direction,
      reason: val.reason,
    }).pipe(
      finalize(() => (this.submitting = false)),
    ).subscribe({
      next: () => {
        this.notification.success('Multa aplicada');
        this.form.patchValue({ playerId: 0, amount: 0, reason: '' });
        this.loadRecentPenalties();
      },
    });
  }

  avalonLabel(ava: AvalonRun): string {
    const when = ava.scheduledAt
      ? new Date(ava.scheduledAt).toLocaleDateString('es-ES')
      : new Date(ava.date).toLocaleDateString('es-ES');
    return `${ava.zone} (${when})`;
  }

  directionLabel(direction: string): string {
    return direction === 'DEBIT' ? 'Multa' : 'Abono';
  }

  goToCreate(): void {
    this.router.navigate(['/avalons/create']);
  }

  private avalonTime(a: AvalonRun): number {
    return a.scheduledAt
      ? new Date(a.scheduledAt).getTime()
      : new Date(a.date).getTime();
  }
}
