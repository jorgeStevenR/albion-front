import { PlayerRole } from './auth.model';

export interface Player {
  id: number;
  albionName: string;
  discordName: string;
  role: PlayerRole;
  createdAt: string;
  active: boolean;
}

export interface PlayerRequest {
  albionName: string;
  discordName: string;
  role: PlayerRole;
  password: string;
}

export interface PlayerUpdateRequest {
  albionName: string;
  discordName: string;
  role: PlayerRole;
  password?: string;
}
