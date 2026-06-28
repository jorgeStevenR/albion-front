import { RoleType } from './avalon.model';

export type EquipmentSlot =
  | 'MAINHAND'
  | 'OFFHAND'
  | 'HEAD'
  | 'ARMOR'
  | 'SHOES'
  | 'CAPE'
  | 'BAG'
  | 'MOUNT'
  | 'FOOD'
  | 'POTION';

export interface AlbionItem {
  uniqueName: string;
  displayName: string;
  displayNameEs?: string;
  label?: string;
  equipmentSlot: EquipmentSlot;
  tier: number;
  enchantment: number;
  quality: number;
  iconUrl: string;
}

export interface ItemSearchParams {
  q?: string;
  slot?: EquipmentSlot;
  tier?: number;
  enchantment?: number;
  quality?: number;
  limit?: number;
}

export interface FilterOption {
  value: number;
  label: string;
}

export interface EquipmentSlotOption {
  value: EquipmentSlot;
  label: string;
}

export interface RoleBuildSlot {
  equipmentSlot: EquipmentSlot;
  itemUniqueName: string;
  itemDisplayName: string;
  iconUrl: string;
}

export interface SwapItem {
  itemUniqueName: string;
  itemDisplayName: string;
  iconUrl?: string;
  note?: string;
  sortOrder?: number;
}

export interface RoleBuildTemplate {
  id: number;
  roleType: RoleType;
  name: string;
  description?: string;
  slots: RoleBuildSlot[];
}

export interface SaveRoleBuildTemplateRequest {
  name: string;
  description?: string;
  slots: {
    equipmentSlot: EquipmentSlot;
    itemUniqueName: string;
    itemDisplayName: string;
  }[];
}

export const EQUIPMENT_SLOTS: EquipmentSlotOption[] = [
  { value: 'MAINHAND', label: 'Arma principal' },
  { value: 'OFFHAND', label: 'Mano secundaria' },
  { value: 'HEAD', label: 'Casco / Capucha' },
  { value: 'ARMOR', label: 'Armadura / Chaqueta' },
  { value: 'SHOES', label: 'Zapatos' },
  { value: 'CAPE', label: 'Capa' },
  { value: 'BAG', label: 'Bolsa' },
  { value: 'MOUNT', label: 'Montura' },
  { value: 'FOOD', label: 'Comida' },
  { value: 'POTION', label: 'Poción' },
];

export const SLOT_LABELS: Record<EquipmentSlot, string> = Object.fromEntries(
  EQUIPMENT_SLOTS.map((s) => [s.value, s.label]),
) as Record<EquipmentSlot, string>;
