import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { SKIP_ERROR_TOAST } from '../http/http-context';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string, options?: { skipErrorToast?: boolean }): Observable<T> {
    const context = options?.skipErrorToast
      ? new HttpContext().set(SKIP_ERROR_TOAST, true)
      : undefined;
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { context })
      .pipe(map((res) => this.unwrap(res)));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(map((res) => this.unwrap(res)));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(map((res) => this.unwrap(res)));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.message ?? 'API error');
    }
    return response.data;
  }
}
