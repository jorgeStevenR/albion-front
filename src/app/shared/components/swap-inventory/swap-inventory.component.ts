import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ItemSearchComponent } from '../item-search/item-search.component';
import { AlbionItem, SwapItem } from '../../../core/models/build-template.model';

export interface SwapItemEditor extends SwapItem {
  localId: string;
}

@Component({
  selector: 'app-swap-inventory',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    ItemSearchComponent,
  ],
  templateUrl: './swap-inventory.component.html',
  styleUrl: './swap-inventory.component.scss',
})
export class SwapInventoryComponent {
  @HostBinding('class.editable') get editableClass(): boolean {
    return this.editMode;
  }

  @Input() editMode = false;
  @Input() set items(value: SwapItem[]) {
    this.swapItems = (value ?? []).map((item, index) => ({
      ...item,
      localId: `${item.itemUniqueName}-${index}`,
    }));
  }

  @Output() itemsChange = new EventEmitter<SwapItem[]>();

  swapItems: SwapItemEditor[] = [];
  adding = false;

  get displaySlots(): (SwapItemEditor | null)[] {
    const minSlots = Math.max(8, Math.ceil(this.swapItems.length / 4) * 4);
    const slots: (SwapItemEditor | null)[] = [...this.swapItems];
    while (slots.length < minSlots) {
      slots.push(null);
    }
    return slots;
  }

  onItemSelected(item: AlbionItem | null): void {
    if (!item) return;
    if (this.swapItems.some((s) => s.itemUniqueName === item.uniqueName)) {
      this.adding = false;
      return;
    }
    this.swapItems = [
      ...this.swapItems,
      {
        localId: `${item.uniqueName}-${Date.now()}`,
        itemUniqueName: item.uniqueName,
        itemDisplayName: item.displayName,
        iconUrl: item.iconUrl,
        note: '',
        sortOrder: this.swapItems.length,
      },
    ];
    this.emitChange();
    this.adding = false;
  }

  removeItem(localId: string): void {
    this.swapItems = this.swapItems.filter((s) => s.localId !== localId);
    this.emitChange();
  }

  updateNote(item: SwapItemEditor, note: string): void {
    item.note = note;
    this.emitChange();
  }

  startAdd(): void {
    if (!this.editMode) return;
    this.adding = true;
  }

  cancelAdd(): void {
    this.adding = false;
  }

  iconUrl(item: SwapItem): string {
    return item.iconUrl ?? `https://render.albiononline.com/v1/item/${item.itemUniqueName}.png`;
  }

  tooltip(item: SwapItem): string {
    return item.note ? `${item.itemDisplayName}\n${item.note}` : item.itemDisplayName;
  }

  private emitChange(): void {
    this.itemsChange.emit(
      this.swapItems.map(({ localId: _, ...rest }, index) => ({
        ...rest,
        sortOrder: index,
      })),
    );
  }
}
