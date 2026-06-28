import { EquipmentSlot } from '../../core/models/build-template.model';

export interface GridSlotItem {
  uniqueName?: string;
  displayName?: string;
  iconUrl?: string;
}

export interface EquipmentGridRow {
  slots: (EquipmentSlot | null)[];
}

/** Albion Online equipment panel layout */
export const EQUIPMENT_GRID_ROWS: EquipmentGridRow[] = [
  { slots: ['BAG', 'HEAD', 'CAPE'] },
  { slots: ['MAINHAND', 'ARMOR', 'OFFHAND'] },
  { slots: ['POTION', 'SHOES', 'FOOD'] },
  { slots: [null, 'MOUNT', null] },
];

export const SLOT_ICONS: Record<EquipmentSlot, string> = {
  BAG: 'backpack',
  HEAD: 'face',
  CAPE: 'dry_cleaning',
  MAINHAND: 'sports_martial_arts',
  ARMOR: 'shield',
  OFFHAND: 'back_hand',
  POTION: 'local_drink',
  SHOES: 'hiking',
  FOOD: 'restaurant',
  MOUNT: 'pets',
};

/** Two-handed weapons block the off-hand slot in Albion */
export function isTwoHandedWeapon(uniqueName: string | undefined | null): boolean {
  if (!uniqueName) return false;
  const upper = uniqueName.toUpperCase();
  return upper.includes('_2H_') || upper.includes('_MAIN_TWOHAND');
}

export function slotItemMap(
  slots: { equipmentSlot: EquipmentSlot; itemUniqueName: string; itemDisplayName: string; iconUrl: string }[],
): Partial<Record<EquipmentSlot, GridSlotItem>> {
  const map: Partial<Record<EquipmentSlot, GridSlotItem>> = {};
  for (const s of slots) {
    map[s.equipmentSlot] = {
      uniqueName: s.itemUniqueName,
      displayName: s.itemDisplayName,
      iconUrl: s.iconUrl,
    };
  }
  return map;
}
