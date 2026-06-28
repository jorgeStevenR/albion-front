import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AvalonDelegate,
  AdminManualPenaltyRequest,
  AvalonPenalty,
  ManualPenaltyRequest,
  MassFineRequest,
  NoShowPenaltyRequest,
  PenaltyAppeal,
  ReviewAppealRequest,
  SubmitAppealRequest,
} from '../models/penalty.model';

@Injectable({ providedIn: 'root' })
export class PenaltyService {
  private readonly api = inject(ApiService);

  listByAvalon(avalonId: number): Observable<AvalonPenalty[]> {
    return this.api.get<AvalonPenalty[]>(`/avalons/${avalonId}/penalties`);
  }

  canManage(avalonId: number): Observable<{ canManage: boolean }> {
    return this.api.get<{ canManage: boolean }>(`/avalons/${avalonId}/penalties/can-manage`);
  }

  applyNoShow(avalonId: number, request: NoShowPenaltyRequest): Observable<AvalonPenalty[]> {
    return this.api.post<AvalonPenalty[]>(`/avalons/${avalonId}/penalties/no-show`, request);
  }

  applyMassFine(avalonId: number, request: MassFineRequest): Observable<AvalonPenalty[]> {
    return this.api.post<AvalonPenalty[]>(`/avalons/${avalonId}/penalties/mass`, request);
  }

  applyManual(avalonId: number, request: ManualPenaltyRequest): Observable<AvalonPenalty> {
    return this.api.post<AvalonPenalty>(`/avalons/${avalonId}/penalties/manual`, request);
  }

  listDelegates(avalonId: number): Observable<AvalonDelegate[]> {
    return this.api.get<AvalonDelegate[]>(`/avalons/${avalonId}/penalties/delegates`);
  }

  assignDelegate(avalonId: number, playerId: number): Observable<AvalonDelegate> {
    return this.api.post<AvalonDelegate>(`/avalons/${avalonId}/penalties/delegates`, { playerId });
  }

  removeDelegate(avalonId: number, playerId: number): Observable<void> {
    return this.api.delete<void>(`/avalons/${avalonId}/penalties/delegates/${playerId}`);
  }

  myPenalties(): Observable<AvalonPenalty[]> {
    return this.api.get<AvalonPenalty[]>('/penalties/mine');
  }

  submitAppeal(penaltyId: number, request: SubmitAppealRequest): Observable<PenaltyAppeal> {
    return this.api.post<PenaltyAppeal>(`/penalties/${penaltyId}/appeal`, request);
  }

  myAppeals(): Observable<PenaltyAppeal[]> {
    return this.api.get<PenaltyAppeal[]>('/penalties/appeals/mine');
  }

  pendingAppeals(): Observable<PenaltyAppeal[]> {
    return this.api.get<PenaltyAppeal[]>('/penalties/appeals/pending');
  }

  reviewAppeal(appealId: number, request: ReviewAppealRequest): Observable<PenaltyAppeal> {
    return this.api.post<PenaltyAppeal>(`/penalties/appeals/${appealId}/review`, request);
  }

  allPenalties(): Observable<AvalonPenalty[]> {
    return this.api.get<AvalonPenalty[]>('/penalties/all');
  }

  allAppeals(): Observable<PenaltyAppeal[]> {
    return this.api.get<PenaltyAppeal[]>('/penalties/appeals/all');
  }

  createAdminManual(request: AdminManualPenaltyRequest): Observable<AvalonPenalty> {
    return this.api.post<AvalonPenalty>('/penalties/admin/manual', request);
  }
}
