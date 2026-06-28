import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { CreateWithdrawalRequest, WithdrawalRequest, WithdrawalStatus } from '../models/withdrawal.model';

interface MoneyRequestApi {
  id: number;
  playerId: number;
  playerName: string;
  type: 'WITHDRAWAL' | 'LOAN';
  amount: number;
  reason: string;
  status: WithdrawalStatus;
  reviewedByName?: string;
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class WithdrawalService {
  private readonly api = inject(ApiService);

  getAll(): Observable<WithdrawalRequest[]> {
    return this.api.get<MoneyRequestApi[]>('/money-requests/withdrawals').pipe(
      map((rows) => rows.map((r) => this.toWithdrawal(r))),
    );
  }

  getMyRequests(): Observable<WithdrawalRequest[]> {
    return this.api.get<MoneyRequestApi[]>('/money-requests/withdrawals/mine').pipe(
      map((rows) => rows.map((r) => this.toWithdrawal(r))),
    );
  }

  create(request: CreateWithdrawalRequest): Observable<WithdrawalRequest> {
    return this.api.post<MoneyRequestApi>('/money-requests/withdrawals', request).pipe(
      map((r) => this.toWithdrawal(r)),
    );
  }

  updateStatus(id: number, status: WithdrawalStatus): Observable<WithdrawalRequest> {
    return this.api.post<MoneyRequestApi>(`/money-requests/${id}/review`, { status }).pipe(
      map((r) => this.toWithdrawal(r)),
    );
  }

  private toWithdrawal(r: MoneyRequestApi): WithdrawalRequest {
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
