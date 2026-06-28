import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EquipmentGridComponent } from '../../../shared/components/equipment-grid/equipment-grid.component';
import { SwapInventoryComponent } from '../../../shared/components/swap-inventory/swap-inventory.component';
import { PingTemplateService } from '../../../core/services/ping-template.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PingTemplate, PingTemplateRoleSlot, SavePingTemplateRequest } from '../../../core/models/guild.model';
import { AlbionItem, EquipmentSlot, SwapItem } from '../../../core/models/build-template.model';
import { finishLoading } from '../../../shared/utils/loading.util';
import { GridSlotItem, isTwoHandedWeapon, slotItemMap } from '../../../shared/utils/equipment.util';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';

/** Plantilla estándar del gremio — 10 puestos (3 Falce, 3 Dagas, 1 Healer, 1 Martillo, 1 Offtank, 1 SC) */
export const GUILD_AVA_SLOTS: Omit<PingTemplateRoleSlot, 'buildSlots'>[] = [
  { slotKey: 'MARTILLO', displayName: 'Martillo', maxPlayers: 1, sortOrder: 1 },
  { slotKey: 'OFFTANK', displayName: 'Offtank', maxPlayers: 1, sortOrder: 2 },
  { slotKey: 'HEALER', displayName: 'Healer', maxPlayers: 1, sortOrder: 3 },
  { slotKey: 'SC', displayName: 'SC', maxPlayers: 1, sortOrder: 4 },
  { slotKey: 'FALCE', displayName: 'Falce', maxPlayers: 3, sortOrder: 5 },
  { slotKey: 'DAGAS', displayName: 'Dagas', maxPlayers: 3, sortOrder: 6 },
];

interface PartySlotEditor extends PingTemplateRoleSlot {
  buildSelections: Partial<Record<EquipmentSlot, AlbionItem | null>>;
  swapItems: SwapItem[];
}

@Component({
  selector: 'app-ping-templates',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EquipmentGridComponent,
    SwapInventoryComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
  ],
  templateUrl: './ping-templates.component.html',
  styleUrl: './ping-templates.component.scss',
})
export class PingTemplatesComponent implements OnInit {
  private readonly pingService = inject(PingTemplateService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  submitting = false;
  showForm = false;
  templates: PingTemplate[] = [];
  partySlots: PartySlotEditor[] = [];
  readonly slotItemMap = slotItemMap;

  form = this.fb.nonNullable.group({
    name: ['Ava estándar gremio', Validators.required],
    zone: ['', Validators.required],
    description: [''],
    pingMessage: ['🔔 Ava — registrarse en la app del gremio'],
  });

  ngOnInit(): void {
    this.loadGuildDefaultSlots();
    this.load();
  }

  loadGuildDefaultSlots(): void {
    this.partySlots = GUILD_AVA_SLOTS.map((s) => ({
      ...s,
      buildSlots: [],
      buildSelections: {},
      swapItems: [],
    }));
  }

  load(): void {
    this.loading = true;
    this.pingService.getAll().pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (data) => (this.templates = data),
    });
  }

  getGridData(slot: PartySlotEditor): Partial<Record<EquipmentSlot, GridSlotItem>> {
    const result: Partial<Record<EquipmentSlot, GridSlotItem>> = {};
    for (const [key, item] of Object.entries(slot.buildSelections) as [EquipmentSlot, AlbionItem | null][]) {
      if (item) {
        result[key] = { uniqueName: item.uniqueName, displayName: item.displayName, iconUrl: item.iconUrl };
      }
    }
    return result;
  }

  onSwapsChange(slot: PartySlotEditor, items: SwapItem[]): void {
    slot.swapItems = items;
  }

  onGridChange(slot: PartySlotEditor, event: { slot: EquipmentSlot; item: AlbionItem | null }): void {
    slot.buildSelections[event.slot] = event.item;
    if (event.slot === 'MAINHAND' && event.item && isTwoHandedWeapon(event.item.uniqueName)) {
      slot.buildSelections['OFFHAND'] = null;
    }
  }

  create(): void {
    if (this.form.invalid) return;
    this.submitting = true;

    const request: SavePingTemplateRequest = {
      ...this.form.getRawValue(),
      roleSlots: this.partySlots
        .filter((s) => s.maxPlayers > 0)
        .map((s) => ({
          slotKey: s.slotKey,
          displayName: s.displayName,
          maxPlayers: s.maxPlayers,
          sortOrder: s.sortOrder,
          buildSlots: Object.entries(s.buildSelections)
            .filter(([, item]) => !!item)
            .map(([eq, item]) => ({
              equipmentSlot: eq as EquipmentSlot,
              itemUniqueName: item!.uniqueName,
              itemDisplayName: item!.displayName,
              iconUrl: item!.iconUrl,
            })),
          swapItems: s.swapItems.map((sw, index) => ({
            itemUniqueName: sw.itemUniqueName,
            itemDisplayName: sw.itemDisplayName,
            iconUrl: sw.iconUrl,
            note: sw.note,
            sortOrder: index,
          })),
        })),
    };

    this.pingService.create(request).pipe(
      finalize(() => (this.submitting = false)),
    ).subscribe({
      next: () => {
        this.notification.success('Plantilla de ava creada');
        this.showForm = false;
        this.loadGuildDefaultSlots();
        this.load();
      },
    });
  }

  deactivate(id: number): void {
    if (!confirm('¿Desactivar esta plantilla?')) return;
    this.pingService.deactivate(id).subscribe({
      next: () => {
        this.notification.success('Plantilla desactivada');
        this.load();
      },
    });
  }

  copyMessage(msg: string): void {
    navigator.clipboard.writeText(msg);
    this.notification.success('Mensaje copiado');
  }

  totalPlayers(): number {
    return this.partySlots.reduce((s, p) => s + p.maxPlayers, 0);
  }

  templatePlayerCount(t: PingTemplate): number {
    return t.roleSlots.reduce((s, r) => s + r.maxPlayers, 0);
  }
}
