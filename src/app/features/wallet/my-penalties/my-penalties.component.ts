import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { PenaltyService } from '../../../core/services/penalty.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AvalonPenalty, PenaltyAppeal } from '../../../core/models/penalty.model';
import { finishLoading } from '../../../shared/utils/loading.util';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-my-penalties',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    CurrencySilverPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatTabsModule,
  ],
  templateUrl: './my-penalties.component.html',
  styleUrl: './my-penalties.component.scss',
})
export class MyPenaltiesComponent implements OnInit {
  private readonly penaltyService = inject(PenaltyService);
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  submitting = false;
  canReview = false;
  penalties: AvalonPenalty[] = [];
  appeals: PenaltyAppeal[] = [];
  pendingAppeals: PenaltyAppeal[] = [];
  appealingPenaltyId: number | null = null;
  reviewingAppealId: number | null = null;

  appealForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(10)]],
  });

  reviewForm = this.fb.nonNullable.group({
    reviewNotes: [''],
  });

  ngOnInit(): void {
    this.canReview = this.auth.isOfficerOrAdmin();
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      penalties: this.penaltyService.myPenalties(),
      appeals: this.penaltyService.myAppeals(),
      pending: this.penaltyService.pendingAppeals(),
    }).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: ({ penalties, appeals, pending }) => {
        this.penalties = penalties.filter((p) => p.direction === 'DEBIT');
        this.appeals = appeals;
        this.pendingAppeals = pending;
        this.canReview = pending.length > 0 || this.auth.isOfficerOrAdmin();
      },
    });
  }

  startAppeal(penaltyId: number): void {
    this.appealingPenaltyId = penaltyId;
    this.appealForm.reset({ reason: '' });
  }

  cancelAppeal(): void {
    this.appealingPenaltyId = null;
  }

  submitAppeal(): void {
    if (!this.appealingPenaltyId || this.appealForm.invalid) return;
    this.submitting = true;
    this.penaltyService.submitAppeal(this.appealingPenaltyId, this.appealForm.getRawValue()).pipe(
      finalize(() => (this.submitting = false)),
    ).subscribe({
      next: () => {
        this.notification.success('Apelación enviada');
        this.appealingPenaltyId = null;
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
    this.submitting = true;
    this.penaltyService.reviewAppeal(this.reviewingAppealId, {
      decision,
      reviewNotes: this.reviewForm.controls.reviewNotes.value,
    }).pipe(
      finalize(() => (this.submitting = false)),
    ).subscribe({
      next: () => {
        this.notification.success(decision === 'APPROVED' ? 'Apelación aprobada — multa revertida' : 'Apelación rechazada');
        this.reviewingAppealId = null;
        this.load();
      },
    });
  }

  canAppeal(p: AvalonPenalty): boolean {
    return p.direction === 'DEBIT'
      && p.status !== 'REVERSED'
      && !p.hasAppeal;
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
