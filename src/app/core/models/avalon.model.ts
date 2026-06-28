import { RoleBuildTemplate, RoleBuildSlot, SwapItem } from './build-template.model';

export type AvalonStatus = 'OPEN' | 'FINISHED' | 'CLOSED';
export type ParticipantType = 'PLAYER' | 'SCOUT' | 'GUILD';
export type LootType = 'BAG' | 'ITEM';
export type RoleType = 'CALLER' | 'TANK' | 'HEALER' | 'DPS' | 'SUPPORT' | 'SCOUT';

export interface AvalonRun {
  id: number;
  date: string;
  scheduledAt?: string;
  zone: string;
  description?: string;
  status: AvalonStatus;
  registrationsOpen?: boolean;
  mapsThrown?: number;
  mapsCost?: number;
  registeredCount?: number;
  totalCapacity?: number;
  participants?: AvalonParticipant[];
  lootItems?: LootItem[];
  createdByPlayerId?: number;
  createdByName?: string;
}

export interface AvalonRunRequest {
  date: string;
  scheduledAt?: string;
  zone: string;
  description?: string;
}

export interface AvalonParticipant {
  id: number;
  playerId: number;
  albionName: string;
  participantType: ParticipantType;
  roleSlotKey?: string;
  roleDisplayName?: string;
}

export type LootSaleStatus = 'UNSOLD' | 'SOLD' | 'NOT_APPLICABLE';

export interface LootItem {
  id: number;
  name: string;
  type: LootType;
  quantity: number;
  marketValue: number;
  effectiveValue?: number;
  saleStatus?: LootSaleStatus;
  createdAt?: string;
}

export interface ParticipantRequest {
  playerId: number;
  participantType: ParticipantType;
}

export interface LootItemRequest {
  name: string;
  type: LootType;
  quantity: number;
  marketValue: number;
}

export interface AvalonMapsRequest {
  mapsThrown: number;
  mapsCost: number;
}

export interface DistributionCalculation {
  avalonId: number;
  totalBalance: number;
  totalWeight: number;
  distributions: Distribution[];
}

export interface Distribution {
  id: number;
  avalonId: number;
  avalonZone: string;
  amount: number;
  createdAt: string;
}

export interface AvalonRolePlayer {
  registrationId: number;
  playerId: number;
  albionName: string;
  slotKey?: string;
  slotDisplayName?: string;
}

export interface RegisteredPlayerSummary {
  registrationId: number;
  playerId: number;
  albionName: string;
  slotKey: string;
  slotDisplayName: string;
}

export interface AvalonRoleSlot {
  slotId?: number;
  slotKey: string;
  displayName: string;
  roleType?: RoleType;
  sortOrder?: number;
  maxPlayers: number;
  currentPlayers: number;
  players: AvalonRolePlayer[];
  full: boolean;
  currentPlayerRegistrationId: number | null;
  buildTemplate?: RoleBuildTemplate;
  slotBuild?: RoleBuildSlot[];
  slotSwaps?: SwapItem[];
}

export interface AvalonRolesOverview {
  avalonId: number;
  registrationsOpen: boolean;
  avalonOpen: boolean;
  totalRegistered?: number;
  totalCapacity?: number;
  registeredPlayers?: RegisteredPlayerSummary[];
  roles: AvalonRoleSlot[];
}

export interface AvalonRoleSlotRequest {
  roleType: RoleType;
  maxPlayers: number;
}

export interface ConfigureAvalonRolesRequest {
  slots: AvalonRoleSlotRequest[];
}
