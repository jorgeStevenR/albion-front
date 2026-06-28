import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PenaltyService } from '../../../core/services/penalty.service';
import { PlayerService } from '../../../core/services/player.service';
import { AvalonService } from '../../../core/services/avalon.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AvalonPenalty, PenaltyAppeal } from '../../../core/models/penalty.model';
import { AvalonRun } from '../../../core/models/avalon.model';
import { Player } from '../../../core/models/player.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-penalties',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CurrencySilverPipe,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './admin-penalties.component.html',
  styleUrl: './admin-penalties.component.scss',
})
export class AdminPenaltiesComponent implements OnInit {
  private readonly penaltyService = inject(PenaltyService);
  private readonly playerService = inject(PlayerService);
  private readonly avalonService = inject(AvalonService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  penalties: AvalonPenalty[] = [];
  appeals: PenaltyAppeal[] = [];
  players: Player[] = [];
  avalons: AvalonRun[] = [];
  reviewingAppealId: number | null = null;

  form = this.fb.nonNullable.group({
    avalonId: [0, Validators.required],
    playerId: [0, Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    direction: ['DEBIT' as 'DEBIT' | 'CREDIT', Validators.required],
    reason: ['', Validators.required],
  });

  reviewForm = this.fb.nonNullable.group({
    reviewNotes: [''],
  });

  ngOnInit(): void {
    this.load();
    this.playerService.getAll().subscribe({
      next: (p) => (this.players = p.filter((pl) => pl.active)),
    });
    this.avalonService.getAll().subscribe({
      next: (a) => (this.avalons = a),
    });
  }

  load(): void {
    this.loading = true;
    forkJoin({
      penalties: this.penaltyService.allPenalties(),
      appeals: this.penaltyService.allAppeals(),
    }).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: ({ penalties, appeals }) => {
        this.penalties = penalties;
        this.appeals = appeals;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.getRawValue();
    this.penaltyService.createAdminManual(val).subscribe({
      next: () => {
        this.notification.success('Multa creada');
        this.form.reset({ avalonId: 0, playerId: 0, amount: 0, direction: 'DEBIT', reason: '' });
        this.load();
      },
    });
  }

  startReview(appealId: number): void {
    this.reviewingAppealId = appealId;
    this.reviewForm.reset({ reviewNotes: '' });
  }

  review(decision: 'APPROVED' | 'REJECTED'): void {
    if (!this.reviewingAppealId) return;
    this.penaltyService.reviewAppeal(this.reviewingAppealId, {
      decision,
      reviewNotes: this.reviewForm.getRawValue().reviewNotes,
    }).subscribe({
      next: () => {
        this.notification.success(decision === 'APPROVED' ? 'Apelación aprobada' : 'Apelación rechazada');
        this.reviewingAppealId = null;
        this.load();
      },
    });
  }

  directionLabel(direction: string): string {
    return direction === 'DEBIT' ? 'Descuento' : 'Abono';
  }

  appealStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
    };
    return labels[status] ?? status;
  }
}
