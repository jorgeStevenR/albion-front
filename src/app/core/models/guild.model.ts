import { RoleBuildSlot, SwapItem } from './build-template.model';

export interface SyncGuildRequest {
  guildName: string;
}

export interface SyncGuildResponse {
  guild: string;
  playersImported: number;
  updated: number;
  created: number;
  skipped?: boolean;
  lastSyncAt?: string;
}

export interface GuildPlayer {
  id: number;
  albionName: string;
  rank: string;
  active: boolean;
  balance?: number;
  totalEarned?: number;
  avalonCount?: number;
}

export interface GuildPlayerDistribution {
  id: number;
  avalonId: number;
  avalonZone: string;
  amount: number;
  createdAt: string;
}

export interface GuildPlayerAvalonParticipation {
  avalonId: number;
  date: string;
  zone: string;
  participantType: string;
}

export interface GuildPlayerDetail {
  id: number;
  albionName: string;
  rank: string;
  active: boolean;
  guildName: string;
  balance: number;
  distributions: GuildPlayerDistribution[];
  avalonParticipations: GuildPlayerAvalonParticipation[];
}

export interface GuildStats {
  treasuryBalance: number;
  unsoldLootValue: number;
  totalMemberWallets: number;
  weeklySalesIncome: number;
  weeklyMemberEarnings: number;
  totalAvalons: number;
  openAvalons: number;
  finishedAvalons?: number;
  closedAvalons: number;
  weeklyAvalons: number;
  activeMembers: number;
  topCallers: CallerStat[];
  weeklyStats: WeeklyGuildStat[];
  weeklyPaymentRanking?: PlayerPaymentStat[];
}

export interface PlayerPaymentStat {
  playerId: number;
  playerName: string;
  totalPaid: number;
}

export interface CallerStat {
  playerId: number;
  playerName: string;
  avalonCount: number;
}

export interface WeeklyGuildStat {
  weekLabel: string;
  avalonCount: number;
  salesIncome: number;
  memberEarnings: number;
}

export interface GuildTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  avalonId?: number;
  avalonZone?: string;
  playerName?: string;
  createdAt: string;
}

export interface PingTemplateRoleSlot {
  slotKey: string;
  displayName: string;
  maxPlayers: number;
  sortOrder: number;
  buildSlots?: RoleBuildSlot[];
  swapItems?: SwapItem[];
}

export interface PingTemplate {
  id: number;
  name: string;
  zone: string;
  description?: string;
  pingMessage?: string;
  active: boolean;
  createdByName?: string;
  createdAt: string;
  roleSlots: PingTemplateRoleSlot[];
}

export interface SavePingTemplateRequest {
  name: string;
  zone: string;
  description?: string;
  pingMessage?: string;
  roleSlots: PingTemplateRoleSlot[];
}
