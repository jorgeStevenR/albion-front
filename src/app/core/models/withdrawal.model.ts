export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface WithdrawalRequest {
  id: number;
  playerId: number;
  playerName: string;
  amount: number;
  reason: string;
  status: WithdrawalStatus;
  createdAt: string;
  reviewedByName?: string;
  reviewedAt?: string;
}

export interface CreateWithdrawalRequest {
  amount: number;
  reason: string;
}
