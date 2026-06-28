import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Player, PlayerRequest, PlayerUpdateRequest } from '../models/player.model';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly api = inject(ApiService);

  getAll(): Observable<Player[]> {
    return this.api.get<Player[]>('/players');
  }

  getById(id: number): Observable<Player> {
    return this.api.get<Player>(`/players/${id}`);
  }

  create(request: PlayerRequest): Observable<Player> {
    return this.api.post<Player>('/players', request);
  }

  update(id: number, request: PlayerUpdateRequest): Observable<Player> {
    return this.api.put<Player>(`/players/${id}`, request);
  }

  deactivate(id: number): Observable<void> {
    return this.api.delete<void>(`/players/${id}`);
  }
}
