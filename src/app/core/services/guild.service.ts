import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { GuildInfo } from '../models/guild-info.model';
import {
  GuildPlayer,
  GuildPlayerDetail,
  GuildStats,
  GuildTransaction,
  SyncGuildRequest,
  SyncGuildResponse,
} from '../models/guild.model';

const DEFAULT_GUILD_INFO: GuildInfo = {
  name: 'II TEMPUS FUGIT II',
  defaultMemberPasswordHint: 'tempus123',
};

@Injectable({ providedIn: 'root' })
export class GuildService {
  private readonly api = inject(ApiService);

  syncGuild(): Observable<SyncGuildResponse> {
    return this.api.post<SyncGuildResponse>('/guild/sync', {});
  }

  getGuildInfo(): Observable<GuildInfo> {
    return this.api.get<GuildInfo>('/auth/guild-info', { skipErrorToast: true }).pipe(
      catchError(() => of({ ...DEFAULT_GUILD_INFO })),
    );
  }

  getSyncedPlayers(): Observable<GuildPlayer[]> {
    return this.api.get<GuildPlayer[]>('/guild/players');
  }

  getSyncedPlayerById(id: number): Observable<GuildPlayerDetail> {
    return this.api.get<GuildPlayerDetail>(`/guild/players/${id}`);
  }

  getStats(): Observable<GuildStats> {
    return this.api.get<GuildStats>('/guild/stats');
  }

  getTransactions(): Observable<GuildTransaction[]> {
    return this.api.get<GuildTransaction[]>('/guild/transactions');
  }
}
