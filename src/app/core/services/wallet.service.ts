import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BalanceResponse } from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly api = inject(ApiService);

  getPlayerBalance(playerId: number): Observable<BalanceResponse> {
    return this.api.get<BalanceResponse>(`/balance/player/${playerId}`);
  }
}
