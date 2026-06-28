import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AvalonRun,
  AvalonRunRequest,
  AvalonMapsRequest,
  AvalonRolesOverview,
  ConfigureAvalonRolesRequest,
  DistributionCalculation,
  LootItemRequest,
  ParticipantRequest,
  RoleType,
} from '../models/avalon.model';

@Injectable({ providedIn: 'root' })
export class AvalonService {
  private readonly api = inject(ApiService);

  getAll(): Observable<AvalonRun[]> {
    return this.api.get<AvalonRun[]>('/avalons');
  }

  getById(id: number): Observable<AvalonRun> {
    return this.api.get<AvalonRun>(`/avalons/${id}`);
  }

  create(request: AvalonRunRequest): Observable<AvalonRun> {
    return this.api.post<AvalonRun>('/avalons', request);
  }

  addParticipant(avalonId: number, request: ParticipantRequest): Observable<AvalonRun> {
    return this.api.post<AvalonRun>(`/avalons/${avalonId}/participants`, request);
  }

  addLoot(avalonId: number, request: LootItemRequest): Observable<AvalonRun> {
    return this.api.post<AvalonRun>(`/avalons/${avalonId}/loot`, request);
  }

  updateMaps(avalonId: number, request: AvalonMapsRequest): Observable<AvalonRun> {
    return this.api.put<AvalonRun>(`/avalons/${avalonId}/maps`, request);
  }

  calculate(avalonId: number): Observable<DistributionCalculation> {
    return this.api.post<DistributionCalculation>(`/avalons/${avalonId}/calculate`, {});
  }

  close(avalonId: number): Observable<AvalonRun> {
    return this.api.post<AvalonRun>(`/avalons/${avalonId}/close`, {});
  }

  getRoles(avalonId: number): Observable<AvalonRolesOverview> {
    return this.api.get<AvalonRolesOverview>(`/avalons/${avalonId}/roles`);
  }

  joinRole(avalonId: number, role: RoleType): Observable<AvalonRolesOverview> {
    return this.api.post<AvalonRolesOverview>(`/avalons/${avalonId}/roles/${role}/join`, {});
  }

  joinSlot(avalonId: number, slotKey: string): Observable<AvalonRolesOverview> {
    return this.api.post<AvalonRolesOverview>(`/avalons/${avalonId}/roles/slots/${slotKey}/join`, {});
  }

  leaveRole(avalonId: number, role: RoleType): Observable<AvalonRolesOverview> {
    return this.api.delete<AvalonRolesOverview>(`/avalons/${avalonId}/roles/${role}/leave`);
  }

  leaveSlot(avalonId: number, slotKey: string): Observable<AvalonRolesOverview> {
    return this.api.delete<AvalonRolesOverview>(`/avalons/${avalonId}/roles/slots/${slotKey}/leave`);
  }

  configureRoles(avalonId: number, request: ConfigureAvalonRolesRequest): Observable<AvalonRolesOverview> {
    return this.api.post<AvalonRolesOverview>(`/avalons/${avalonId}/roles/setup`, request);
  }

  updateRoleSlot(avalonId: number, role: RoleType, maxPlayers: number): Observable<AvalonRolesOverview> {
    return this.api.put<AvalonRolesOverview>(`/avalons/${avalonId}/roles/${role}`, { maxPlayers });
  }

  closeRegistrations(avalonId: number): Observable<AvalonRolesOverview> {
    return this.api.post<AvalonRolesOverview>(`/avalons/${avalonId}/roles/close-registrations`, {});
  }

  openRegistrations(avalonId: number): Observable<AvalonRolesOverview> {
    return this.api.post<AvalonRolesOverview>(`/avalons/${avalonId}/roles/open-registrations`, {});
  }
}
