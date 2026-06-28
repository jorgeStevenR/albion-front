import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PingTemplate, SavePingTemplateRequest } from '../models/guild.model';

@Injectable({ providedIn: 'root' })
export class PingTemplateService {
  private readonly api = inject(ApiService);

  getActive(): Observable<PingTemplate[]> {
    return this.api.get<PingTemplate[]>('/ping-templates');
  }

  getAll(): Observable<PingTemplate[]> {
    return this.api.get<PingTemplate[]>('/ping-templates/all');
  }

  create(request: SavePingTemplateRequest): Observable<PingTemplate> {
    return this.api.post<PingTemplate>('/ping-templates', request);
  }

  deactivate(id: number): Observable<void> {
    return this.api.delete<void>(`/ping-templates/${id}`);
  }

  createAvalonFromTemplate(id: number, scheduledAt?: string): Observable<{ avalonId: number }> {
    return this.api.post<{ avalonId: number }>(`/ping-templates/${id}/create-avalon`, {
      scheduledAt: scheduledAt ?? null,
    });
  }
}
