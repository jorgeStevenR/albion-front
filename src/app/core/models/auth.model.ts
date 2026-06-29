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
  mustChangePassword: boolean;
}

export interface AuthUser {
  token: string;
  playerId: number;
  albionName: string;
  role: PlayerRole;
  mustChangePassword: boolean;
}

export interface UserProfile {
  playerId: number;
  albionName: string;
  discordName: string;
  rank?: string;
  role: PlayerRole;
  mustChangePassword: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
