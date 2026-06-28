export type PlayerRole = 'ADMIN' | 'CALLER' | 'OFFICER' | 'PLAYER';

export interface LoginRequest {
  albionName: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  playerId: number;
  albionName: string;
  role: PlayerRole;
}

export interface AuthUser {
  token: string;
  playerId: number;
  albionName: string;
  role: PlayerRole;
}
