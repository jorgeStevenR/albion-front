import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { WithdrawalService } from '../../../core/services/withdrawal.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WithdrawalRequest } from '../../../core/models/withdrawal.model';
import { Loan } from '../../../core/models/loan.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-withdrawal-request',
  standalone: true,
  imports: [
    DatePipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CurrencySilverPipe,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './withdrawal-request.component.html',
  styleUrl: './withdrawal-request.component.scss',
})
export class WithdrawalRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly withdrawalService = inject(WithdrawalService);
  private readonly loanService = inject(LoanService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  myRequests: WithdrawalRequest[] = [];
  allRequests: WithdrawalRequest[] = [];
  myLoans: Loan[] = [];
  allLoans: Loan[] = [];
  adminTabIndex = 0;

  adminColumns = ['playerName', 'amount', 'reason', 'date', 'status', 'actions'];
  historyColumns = ['playerName', 'amount', 'reason', 'date', 'status', 'reviewedBy'];

  withdrawalForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
  });

  loanForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
  });

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  get pendingWithdrawals(): WithdrawalRequest[] {
    return this.allRequests.filter((r) => r.status === 'PENDING');
  }

  get pendingLoans(): Loan[] {
    return this.allLoans.filter((r) => r.status === 'PENDING');
  }

  get pendingCount(): number {
    return this.pendingWithdrawals.length + this.pendingLoans.length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    if (this.isAdmin) {
      forkJoin({
        all: this.withdrawalService.getAll(),
        allLoans: this.loanService.getAll(),
      }).pipe(
        finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
      ).subscribe({
        next: ({ all, allLoans }) => {
          this.allRequests = all;
          this.allLoans = allLoans;
        },
      });
      return;
    }

    forkJoin({
      mine: this.withdrawalService.getMyRequests(),
      myLoans: this.loanService.getMyLoans(),
    }).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: ({ mine, myLoans }) => {
        this.myRequests = mine;
        this.myLoans = myLoans;
      },
    });
  }

  submitWithdrawal(): void {
    if (this.withdrawalForm.invalid) {
      this.withdrawalForm.markAllAsTouched();
      return;
    }
    this.withdrawalService.create(this.withdrawalForm.getRawValue()).subscribe({
      next: () => {
        this.notification.success('Solicitud de adelanto enviada');
        this.withdrawalForm.reset({ amount: 0, reason: '' });
        this.load();
      },
    });
  }

  submitLoan(): void {
    if (this.loanForm.invalid) {
      this.loanForm.markAllAsTouched();
      return;
    }
    this.loanService.create(this.loanForm.getRawValue()).subscribe({
      next: () => {
        this.notification.success('Solicitud de préstamo enviada');
        this.loanForm.reset({ amount: 0, reason: '' });
        this.load();
      },
    });
  }

  approveWithdrawal(id: number): void {
    this.withdrawalService.updateStatus(id, 'APPROVED').subscribe({
      next: () => {
        this.notification.success('Adelanto aprobado');
        this.load();
      },
    });
  }

  rejectWithdrawal(id: number): void {
    this.withdrawalService.updateStatus(id, 'REJECTED').subscribe({
      next: () => {
        this.notification.info('Adelanto rechazado');
        this.load();
      },
    });
  }

  approveLoan(id: number): void {
    this.loanService.updateStatus(id, 'ACTIVE').subscribe({
      next: () => {
        this.notification.success('Préstamo aprobado');
        this.load();
      },
    });
  }

  rejectLoan(id: number): void {
    this.loanService.updateStatus(id, 'REJECTED').subscribe({
      next: () => {
        this.notification.info('Préstamo rechazado');
        this.load();
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      APPROVED: 'Aprobado',
      REJECTED: 'Rechazado',
      PAID: 'Pagado',
      ACTIVE: 'Activo',
    };
    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }
}
