import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  LoginRequest,
  PlayerRole,
  UserProfile,
} from '../models/auth.model';
import { ApiService } from '../services/api.service';

const AUTH_KEY = 'albion_guild_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response) => this.persistUser(response)),
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.api.get<UserProfile>('/auth/me');
  }

  changePassword(request: ChangePasswordRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/change-password', request).pipe(
      tap((response) => this.persistUser(response)),
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

  mustChangePassword(): boolean {
    return !!this.getCurrentUser()?.mustChangePassword;
  }

  hasRole(...roles: PlayerRole[]): boolean {
    const user = this.getCurrentUser();
    return !!user && roles.includes(user.role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isCaller(): boolean {
    return this.hasRole('CALLER');
  }

  isCallerOrAdmin(): boolean {
    return this.hasRole('ADMIN', 'CALLER', 'OFFICER');
  }

  /** @deprecated use isCallerOrAdmin */
  isOfficerOrAdmin(): boolean {
    return this.isCallerOrAdmin();
  }

  canViewGuildBalance(): boolean {
    return this.hasRole('ADMIN', 'OFFICER');
  }

  refreshProfileFlags(): Observable<UserProfile> {
    return this.getProfile().pipe(
      tap((profile) => {
        const user = this.getCurrentUser();
        if (!user) return;
        const updated: AuthUser = {
          ...user,
          mustChangePassword: profile.mustChangePassword,
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
        this.currentUserSubject.next(updated);
      }),
    );
  }

  private persistUser(response: AuthResponse): void {
    const user: AuthUser = {
      token: response.token,
      playerId: response.playerId,
      albionName: response.albionName,
      role: response.role,
      mustChangePassword: response.mustChangePassword,
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<AuthUser>;
      if (!parsed.token || !parsed.playerId || !parsed.albionName || !parsed.role) {
        return null;
      }
      return {
        token: parsed.token,
        playerId: parsed.playerId,
        albionName: parsed.albionName,
        role: parsed.role,
        mustChangePassword: parsed.mustChangePassword ?? false,
      };
    } catch {
      return null;
    }
  }
}
