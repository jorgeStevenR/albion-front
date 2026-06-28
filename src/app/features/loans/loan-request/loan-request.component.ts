import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Loan } from '../../../core/models/loan.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-loan-request',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    PageHeaderComponent,
    CurrencySilverPipe,
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './loan-request.component.html',
  styleUrl: './loan-request.component.scss',
})
export class LoanRequestComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly loanService = inject(LoanService);
  private readonly notification = inject(NotificationService);
  readonly isAdmin = inject(AuthService).isAdmin();

  myLoans: Loan[] = [];
  allLoans: Loan[] = [];
  activeLoans: Loan[] = [];

  form = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loanService.getMyLoans().subscribe({
      next: (data) => {
        this.myLoans = data;
        this.activeLoans = data.filter((l) => l.status === 'ACTIVE' || l.status === 'APPROVED');
      },
    });
    if (this.isAdmin) {
      this.loanService.getAll().subscribe({
        next: (data) => (this.allLoans = data),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loanService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.notification.success('Solicitud de préstamo enviada');
        this.form.reset({ amount: 0, reason: '' });
        this.load();
      },
    });
  }

  approve(id: number): void {
    this.loanService.updateStatus(id, 'ACTIVE').subscribe({
      next: () => {
        this.notification.success('Préstamo aprobado');
        this.load();
      },
    });
  }

  reject(id: number): void {
    this.loanService.updateStatus(id, 'REJECTED').subscribe({
      next: () => {
        this.notification.info('Préstamo rechazado');
        this.load();
      },
    });
  }
}
