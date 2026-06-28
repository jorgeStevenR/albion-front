import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AlbionItem,
  EquipmentSlot,
  EquipmentSlotOption,
  FilterOption,
  ItemSearchParams,
} from '../models/build-template.model';

@Injectable({ providedIn: 'root' })
export class ItemCatalogService {
  private readonly api = inject(ApiService);

  search(params: ItemSearchParams): Observable<AlbionItem[]> {
    const query = new URLSearchParams();
    if (params.q?.trim()) query.set('q', params.q.trim());
    if (params.slot) query.set('slot', params.slot);
    if (params.tier != null) query.set('tier', String(params.tier));
    if (params.enchantment != null) query.set('enchantment', String(params.enchantment));
    query.set('limit', String(params.limit ?? 25));
    return this.api.get<AlbionItem[]>(`/items/search?${query.toString()}`);
  }

  getSlots(): Observable<EquipmentSlotOption[]> {
    return this.api.get<EquipmentSlotOption[]>('/items/slots');
  }

  getFilters(): Observable<{
    tiers: number[];
    enchantments: FilterOption[];
    qualities: FilterOption[];
  }> {
    return this.api.get('/items/filters');
  }

  syncCatalog(): Observable<number> {
    return this.api.post<number>('/items/sync', {});
  }
}

export function itemDisplayLabel(item: AlbionItem): string {
  if (item.label?.trim()) {
    return item.label;
  }
  const name = item.displayNameEs?.trim() || item.displayName;
  const enchant = item.enchantment > 0 ? `.${item.enchantment}` : '.0';
  return `${name} · T${item.tier}${enchant}`;
}
