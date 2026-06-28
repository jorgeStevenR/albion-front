import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, AuthUser, LoginRequest, PlayerRole } from '../models/auth.model';
import { ApiService } from '../services/api.service';

const AUTH_KEY = 'albion_guild_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        const user: AuthUser = {
          token: response.token,
          playerId: response.playerId,
          albionName: response.albionName,
          role: response.role,
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.currentUserSubject.value?.token ?? null;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: PlayerRole[]): boolean {
    const user = this.getCurrentUser();
    return !!user && roles.includes(user.role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isCallerOrAdmin(): boolean {
    return this.hasRole('ADMIN', 'CALLER', 'OFFICER');
  }

  /** @deprecated use isCallerOrAdmin */
  isOfficerOrAdmin(): boolean {
    return this.isCallerOrAdmin();
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
