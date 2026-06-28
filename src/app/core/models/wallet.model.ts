import { Distribution } from './avalon.model';

export interface BalanceResponse {
  playerId: number;
  albionName: string;
  walletBalance: number;
  distributions: Distribution[];
}

export type TransactionType = 'REWARD' | 'WITHDRAWAL' | 'LOAN' | 'PURCHASE';

export interface WalletTransaction {
  id: number;
  date: string;
  type: TransactionType;
  description: string;
  amount: number;
}

export interface WeeklyBalance {
  week: string;
  earnings: number;
  expenses: number;
  finalBalance: number;
}
