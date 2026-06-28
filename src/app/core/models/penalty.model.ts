export type PenaltyDirection = 'DEBIT' | 'CREDIT';
export type PenaltyType =
  | 'NO_SHOW_FINE'
  | 'REPLACEMENT_REWARD'
  | 'MASS_FINE'
  | 'MANUAL_FINE'
  | 'MANUAL_REWARD';
export type PenaltyStatus = 'APPLIED' | 'APPEAL_PENDING' | 'REVERSED';
export type AppealStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AvalonPenalty {
  id: number;
  avalonId: number;
  avalonZone: string;
  playerId: number;
  playerName: string;
  amount: number;
  direction: PenaltyDirection;
  type: PenaltyType;
  reason: string;
  status: PenaltyStatus;
  createdById: number;
  createdByName: string;
  relatedPlayerId?: number;
  relatedPlayerName?: string;
  createdAt: string;
  hasAppeal: boolean;
  appealStatus?: string;
}

export interface AvalonDelegate {
  id: number;
  playerId: number;
  playerName: string;
  assignedByName: string;
  createdAt: string;
}

export interface PenaltyAppeal {
  id: number;
  penaltyId: number;
  avalonId: number;
  avalonZone: string;
  playerId: number;
  playerName: string;
  amount: number;
  penaltyReason: string;
  reason: string;
  status: AppealStatus;
  reviewNotes?: string;
  reviewedByName?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface NoShowPenaltyRequest {
  noShowPlayerId: number;
  replacementPlayerId: number;
  amount: number;
  reason?: string;
}

export interface MassFineRequest {
  amount: number;
  reason: string;
}

export interface ManualPenaltyRequest {
  playerId: number;
  amount: number;
  direction: PenaltyDirection;
  reason: string;
}

export interface AdminManualPenaltyRequest extends ManualPenaltyRequest {
  avalonId: number;
}

export interface SubmitAppealRequest {
  reason: string;
}

export interface ReviewAppealRequest {
  decision: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
}
