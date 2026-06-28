import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SaleRequest {
  lootItemId: number;
  buyerId: number;
  discount: number;
}

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly api = inject(ApiService);

  createSale(request: SaleRequest): Observable<void> {
    return this.api.post<void>('/sales', request);
  }
}
