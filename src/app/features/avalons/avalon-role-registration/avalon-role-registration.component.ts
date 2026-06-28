import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { AvalonService } from '../../../core/services/avalon.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AvalonRolesOverview, AvalonRoleSlot } from '../../../core/models/avalon.model';
import { finishLoading } from '../../../shared/utils/loading.util';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { EquipmentGridComponent } from '../../../shared/components/equipment-grid/equipment-grid.component';
import { SwapInventoryComponent } from '../../../shared/components/swap-inventory/swap-inventory.component';
import { slotItemMap } from '../../../shared/utils/equipment.util';

@Component({
  selector: 'app-avalon-role-registration',
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    EquipmentGridComponent,
    SwapInventoryComponent,
  ],
  templateUrl: './avalon-role-registration.component.html',
  styleUrl: './avalon-role-registration.component.scss',
})
export class AvalonRoleRegistrationComponent implements OnInit {
  private readonly avalonService = inject(AvalonService);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) avalonId!: number;
  @Input() canManage = false;

  loading = true;
  actionSlotKey: string | null = null;
  rolesOverview: AvalonRolesOverview | null = null;
  readonly slotItemMap = slotItemMap;

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.avalonService.getRoles(this.avalonId).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (data) => {
        this.rolesOverview = data;
      },
    });
  }

  slotLabel(slot: AvalonRoleSlot): string {
    return slot.displayName || slot.slotKey;
  }

  isRegisteredIn(slot: AvalonRoleSlot): boolean {
    return slot.currentPlayerRegistrationId != null;
  }

  canJoin(slot: AvalonRoleSlot): boolean {
    return !!this.rolesOverview?.avalonOpen
      && !!this.rolesOverview?.registrationsOpen
      && !slot.full
      && !this.isRegisteredIn(slot)
      && !this.isRegisteredElsewhere();
  }

  isRegisteredElsewhere(): boolean {
    if (!this.rolesOverview) return false;
    return this.rolesOverview.roles.some((r) => r.currentPlayerRegistrationId != null);
  }

  getBuildSlots(slot: AvalonRoleSlot) {
    if (slot.slotBuild?.length) {
      return slot.slotBuild;
    }
    return slot.buildTemplate?.slots ?? [];
  }

  joinSlot(slot: AvalonRoleSlot): void {
    if (!confirm(`¿Confirmas inscribirte como ${this.slotLabel(slot)}?`)) return;

    this.actionSlotKey = slot.slotKey;
    this.avalonService.joinSlot(this.avalonId, slot.slotKey).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.actionSlotKey = null))),
    ).subscribe({
      next: (data) => {
        this.rolesOverview = data;
        this.notification.success(`Te inscribiste como ${this.slotLabel(slot)}`);
      },
    });
  }

  leaveSlot(slot: AvalonRoleSlot): void {
    if (!confirm(`¿Cancelar tu inscripción como ${this.slotLabel(slot)}?`)) return;

    this.actionSlotKey = slot.slotKey;
    this.avalonService.leaveSlot(this.avalonId, slot.slotKey).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.actionSlotKey = null))),
    ).subscribe({
      next: (data) => {
        this.rolesOverview = data;
        this.notification.success('Inscripción cancelada');
      },
    });
  }

  toggleRegistrations(): void {
    if (!this.rolesOverview) return;
    const close = this.rolesOverview.registrationsOpen;
    const action = close
      ? this.avalonService.closeRegistrations(this.avalonId)
      : this.avalonService.openRegistrations(this.avalonId);

    action.subscribe({
      next: (data) => {
        this.rolesOverview = data;
        this.notification.success(close ? 'Registros cerrados' : 'Registros abiertos');
      },
    });
  }
}
