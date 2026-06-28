import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { CreateLoanRequest, Loan, LoanStatus } from '../models/loan.model';

interface MoneyRequestApi {
  id: number;
  playerId: number;
  playerName: string;
  type: 'WITHDRAWAL' | 'LOAN';
  amount: number;
  reason: string;
  status: LoanStatus;
  reviewedByName?: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Loan[]> {
    return this.api.get<MoneyRequestApi[]>('/money-requests/loans').pipe(
      map((rows) => rows.map((r) => this.toLoan(r))),
    );
  }

  getMyLoans(): Observable<Loan[]> {
    return this.api.get<MoneyRequestApi[]>('/money-requests/loans/mine').pipe(
      map((rows) => rows.map((r) => this.toLoan(r))),
    );
  }

  getActiveLoans(): Observable<Loan[]> {
    return this.getMyLoans().pipe(
      map((loans) => loans.filter((l) => l.status === 'ACTIVE' || l.status === 'APPROVED')),
    );
  }

  create(request: CreateLoanRequest): Observable<Loan> {
    return this.api.post<MoneyRequestApi>('/money-requests/loans', request).pipe(
      map((r) => this.toLoan(r)),
    );
  }

  updateStatus(id: number, status: LoanStatus): Observable<Loan> {
    return this.api.post<MoneyRequestApi>(`/money-requests/${id}/review`, { status }).pipe(
      map((r) => this.toLoan(r)),
    );
  }

  private toLoan(r: MoneyRequestApi): Loan {
    return {
      id: r.id,
      playerId: r.playerId,
      playerName: r.playerName,
      amount: Number(r.amount),
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      reviewedByName: r.reviewedByName,
      reviewedAt: r.reviewedAt,
    };
  }
}
