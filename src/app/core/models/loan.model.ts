export type LoanStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'PAID';

export interface Loan {
  id: number;
  playerId: number;
  playerName: string;
  amount: number;
  reason: string;
  status: LoanStatus;
  pendingQuota?: number;
  dueDate?: string;
  createdAt: string;
  reviewedByName?: string;
  reviewedAt?: string;
}

export interface CreateLoanRequest {
  amount: number;
  reason: string;
}
