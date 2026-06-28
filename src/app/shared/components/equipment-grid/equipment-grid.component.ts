import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ItemSearchComponent } from '../item-search/item-search.component';
import {
  AlbionItem,
  EquipmentSlot,
  SLOT_LABELS,
} from '../../../core/models/build-template.model';
import {
  EQUIPMENT_GRID_ROWS,
  GridSlotItem,
  isTwoHandedWeapon,
  SLOT_ICONS,
} from '../../utils/equipment.util';

@Component({
  selector: 'app-equipment-grid',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, ItemSearchComponent],
  templateUrl: './equipment-grid.component.html',
  styleUrl: './equipment-grid.component.scss',
})
export class EquipmentGridComponent {
  @HostBinding('class.editable') get editableClass(): boolean {
    return this.editMode;
  }

  @Input() editMode = false;
  @Input() slotData: Partial<Record<EquipmentSlot, GridSlotItem>> = {};
  @Output() slotChange = new EventEmitter<{ slot: EquipmentSlot; item: AlbionItem | null }>();

  readonly gridRows = EQUIPMENT_GRID_ROWS;
  readonly slotLabels = SLOT_LABELS;
  readonly slotIcons = SLOT_ICONS;

  activeEditSlot: EquipmentSlot | null = null;

  get offhandBlocked(): boolean {
    return isTwoHandedWeapon(this.slotData['MAINHAND']?.uniqueName);
  }

  isSlotDisabled(slot: EquipmentSlot): boolean {
    return slot === 'OFFHAND' && this.offhandBlocked;
  }

  getItem(slot: EquipmentSlot): GridSlotItem | null {
    return this.slotData[slot] ?? null;
  }

  onItemSelected(slot: EquipmentSlot, item: AlbionItem | null): void {
    if (!item) return;
    if (slot === 'MAINHAND' && isTwoHandedWeapon(item.uniqueName)) {
      this.slotChange.emit({ slot: 'OFFHAND', item: null });
    }
    this.slotChange.emit({ slot, item });
    this.activeEditSlot = null;
  }

  toggleEdit(slot: EquipmentSlot): void {
    if (!this.editMode || this.isSlotDisabled(slot)) return;
    this.activeEditSlot = this.activeEditSlot === slot ? null : slot;
  }

  offhandHint(): string {
    return this.offhandBlocked
      ? 'Arma a dos manos — no puedes llevar off-hand'
      : 'Arma a una mano — puedes equipar off-hand';
  }
}
