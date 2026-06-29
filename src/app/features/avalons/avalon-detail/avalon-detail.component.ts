import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AvalonService } from '../../../core/services/avalon.service';
import { PlayerService } from '../../../core/services/player.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SaleService } from '../../../core/services/sale.service';
import { AvalonRun, LootItem, ParticipantType } from '../../../core/models/avalon.model';
import { Player } from '../../../core/models/player.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { formatCurrencySilver } from '../../../shared/utils/currency-silver.util';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { AvalonRoleRegistrationComponent } from '../avalon-role-registration/avalon-role-registration.component';
import { AvalonPenaltiesComponent } from '../avalon-penalties/avalon-penalties.component';
import { AvalonCountdown, getAvalonCountdown } from '../../../shared/utils/avalon-countdown.util';

@Component({
  selector: 'app-avalon-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    CurrencySilverPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatDividerModule,
    AvalonRoleRegistrationComponent,
    AvalonPenaltiesComponent,
  ],
  templateUrl: './avalon-detail.component.html',
  styleUrl: './avalon-detail.component.scss',
})
export class AvalonDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly avalonService = inject(AvalonService);
  private readonly playerService = inject(PlayerService);
  private readonly notification = inject(NotificationService);
  private readonly saleService = inject(SaleService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly canEdit = inject(AuthService).isOfficerOrAdmin();
  private readonly auth = inject(AuthService);

  loading = true;
  loadError = false;
  calculating = false;
  closing = false;
  selling = false;
  savingMaps = false;
  savingBags = false;
  sellingLootId: number | null = null;
  avalon: AvalonRun | null = null;
  countdown: AvalonCountdown | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  players: Player[] = [];
  initialTabIndex = 0;

  participantTypes: ParticipantType[] = ['PLAYER', 'SCOUT', 'GUILD'];

  participantForm = this.fb.nonNullable.group({
    playerId: [0, Validators.required],
    participantType: ['PLAYER' as ParticipantType, Validators.required],
  });

  bagForm = this.fb.nonNullable.group({
    grossValue: [0, [Validators.required, Validators.min(0)]],
  });

  chestForm = this.fb.nonNullable.group({
    grossValue: [0, [Validators.required, Validators.min(1)]],
  });

  mapsForm = this.fb.nonNullable.group({
    mapsThrown: [0, [Validators.required, Validators.min(0)]],
    mapsCost: [0, [Validators.required, Validators.min(0)]],
  });

  saleForm = this.fb.nonNullable.group({
    buyerId: [0, Validators.required],
    discount: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'penalties') {
      this.initialTabIndex = 3;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAvalon(id);

    if (this.canEdit) {
      this.playerService.getAll().subscribe({
        next: (p) => (this.players = p.filter((pl) => pl.active)),
      });
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  loadAvalon(id: number): void {
    this.loading = true;
    this.loadError = false;
    this.avalonService.getById(id).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (data) => {
        this.avalon = data;
        this.mapsForm.reset({
          mapsThrown: data.mapsThrown ?? 0,
          mapsCost: data.mapsCost ?? 0,
        });
        const bagItem = data.lootItems?.find((i) => i.type === 'BAG');
        this.bagForm.reset({ grossValue: bagItem?.marketValue ?? 0 });
        this.startCountdown();
      },
      error: () => {
        this.loadError = true;
        this.avalon = null;
      },
    });
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.updateCountdown();
    if (!this.avalon?.scheduledAt) {
      return;
    }
    this.countdownTimer = setInterval(() => this.updateCountdown(), 60_000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private updateCountdown(): void {
    this.countdown = getAvalonCountdown(this.avalon?.scheduledAt);
    this.cdr.markForCheck();
  }

  get canManageLoot(): boolean {
    if (this.canEdit) return true;
    const user = this.auth.getCurrentUser();
    return !!user && user.playerId === this.avalon?.createdByPlayerId;
  }

  isChestType(type: LootItem['type']): boolean {
    return type === 'CHEST' || type === 'ITEM';
  }

  getAvalonSubtitle(): string {
    if (!this.avalon) return '';
    const statusLabels: Record<string, string> = {
      OPEN: 'Abierta',
      FINISHED: 'Terminada — vendiendo loot',
      CLOSED: 'Cerrada',
    };
    const status = statusLabels[this.avalon.status] ?? this.avalon.status;
    if (this.avalon.scheduledAt) {
      const when = new Date(this.avalon.scheduledAt).toLocaleString('es-ES', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `Ping: ${when} · ${status}`;
    }
    return `${this.avalon.date} · ${status}`;
  }

  addParticipant(): void {
    if (!this.avalon || this.participantForm.invalid) return;
    const val = this.participantForm.getRawValue();
    this.avalonService.addParticipant(this.avalon.id, val).subscribe({
      next: (updated) => {
        this.avalon = updated;
        this.participantForm.reset({ playerId: 0, participantType: 'PLAYER' });
        this.notification.success('Participante agregado');
      },
    });
  }

  saveBags(): void {
    if (!this.avalon || this.bagForm.invalid || this.savingBags) return;
    this.savingBags = true;
    this.avalonService.setBagGross(this.avalon.id, this.bagForm.controls.grossValue.value).subscribe({
      next: (updated) => {
        this.avalon = updated;
        this.savingBags = false;
        this.notification.success('Bolsitas del piso guardadas');
      },
      error: () => {
        this.savingBags = false;
      },
    });
  }

  addChest(): void {
    if (!this.avalon || this.chestForm.invalid) return;
    const grossValue = this.chestForm.controls.grossValue.value;
    this.avalonService.addChest(this.avalon.id, grossValue).subscribe({
      next: (updated) => {
        this.avalon = updated;
        this.chestForm.reset({ grossValue: 0 });
        this.notification.success('Cofre agregado — tax gremio 20% al repartir');
      },
    });
  }

  saveMaps(): void {
    if (!this.avalon || this.mapsForm.invalid) return;
    this.savingMaps = true;
    this.avalonService.updateMaps(this.avalon.id, this.mapsForm.getRawValue()).subscribe({
      next: (updated) => {
        this.avalon = updated;
        this.savingMaps = false;
        this.notification.success('Mapas registrados');
      },
      error: () => {
        this.savingMaps = false;
      },
    });
  }

  calculate(): void {
    if (!this.avalon) return;
    this.calculating = true;
    this.avalonService.calculate(this.avalon.id).subscribe({
      next: (result) => {
        const mapsPart = (result.mapsDeducted ?? 0) > 0
          ? ` (bolsas ${formatCurrencySilver(result.bagNet ?? 0)} netas, mapas -${formatCurrencySilver(result.mapsDeducted ?? 0)})`
          : ` (bolsas ${formatCurrencySilver(result.bagNet ?? 0)} netas)`;
        const chestPart = (result.chestNet ?? 0) > 0
          ? ` + cofres ${formatCurrencySilver(result.chestNet ?? 0)} netos`
          : '';
        this.notification.success(
          `Avalon terminada. Reparto: ${formatCurrencySilver(result.totalBalance)}${mapsPart}${chestPart}. Vende el loot para cerrar.`,
        );
        this.loadAvalon(this.avalon!.id);
        this.calculating = false;
      },
      error: () => {
        this.calculating = false;
      },
    });
  }

  closeAvalon(): void {
    if (!this.avalon) return;
    this.closing = true;
    this.avalonService.close(this.avalon.id).subscribe({
      next: () => {
        this.notification.success('Avaloniana cerrada — todo el loot fue vendido');
        this.loadAvalon(this.avalon!.id);
        this.closing = false;
      },
      error: () => {
        this.closing = false;
      },
    });
  }

  getChestLootItems(): LootItem[] {
    return this.avalon?.lootItems?.filter((i) => this.isChestType(i.type)) ?? [];
  }

  getBagLootItems(): LootItem[] {
    return this.avalon?.lootItems?.filter((i) => i.type === 'BAG') ?? [];
  }

  getLootTypeLabel(item: LootItem): string {
    if (item.type === 'BAG') return 'Bolsita piso';
    if (this.isChestType(item.type)) return 'Cofre';
    return item.type;
  }

  getBagGrossValue(): number {
    if (!this.avalon?.lootItems) return 0;
    return this.avalon.lootItems
      .filter((i) => i.type === 'BAG')
      .reduce((sum, item) => sum + item.marketValue * item.quantity, 0);
  }

  getChestGrossValue(): number {
    if (!this.avalon?.lootItems) return 0;
    return this.avalon.lootItems
      .filter((i) => this.isChestType(i.type))
      .reduce((sum, item) => sum + item.marketValue * item.quantity, 0);
  }

  getMapsCostPerMap(): number {
    return this.avalon?.mapsCost ?? 0;
  }

  getMapsTotalDeduction(): number {
    const count = this.avalon?.mapsThrown ?? 0;
    const perMap = this.getMapsCostPerMap();
    if (count <= 0 || perMap <= 0) return 0;
    return count * perMap;
  }

  getBagNetValue(): number {
    return Math.max(0, this.getBagGrossValue() - this.getMapsTotalDeduction());
  }

  getChestNetValue(): number {
    return this.getChestGrossValue() * 0.8;
  }

  getTotalLootValue(): number {
    return this.getBagNetValue() + this.getChestNetValue();
  }

  getLootLineValue(item: LootItem): number {
    const gross = item.marketValue * item.quantity;
    if (this.isChestType(item.type)) {
      return gross * 0.8;
    }
    if (item.type === 'BAG') {
      return Math.max(0, gross - this.getMapsTotalDeduction());
    }
    return gross;
  }

  getRawLootValue(): number {
    return this.getBagGrossValue() + this.getChestGrossValue();
  }

  saleStatusLabel(item: LootItem): string {
    if (item.type === 'BAG' || item.saleStatus === 'NOT_APPLICABLE') return 'N/A';
    if (item.saleStatus === 'SOLD') return 'Vendido';
    return 'Sin vender';
  }

  canSell(item: LootItem): boolean {
    return this.canEdit
      && (this.avalon?.status === 'FINISHED' || this.avalon?.status === 'CLOSED')
      && this.isChestType(item.type)
      && item.saleStatus === 'UNSOLD';
  }

  startSell(lootId: number): void {
    this.sellingLootId = lootId;
    this.saleForm.reset({ buyerId: 0, discount: 20 });
  }

  confirmSell(): void {
    if (!this.avalon || !this.sellingLootId || this.saleForm.invalid) return;
    this.selling = true;
    const val = this.saleForm.getRawValue();
    this.saleService.createSale({
      lootItemId: this.sellingLootId,
      buyerId: val.buyerId,
      discount: val.discount,
    }).subscribe({
      next: () => {
        this.notification.success('Venta registrada — suma al balance del gremio');
        this.sellingLootId = null;
        this.selling = false;
        this.loadAvalon(this.avalon!.id);
      },
      error: () => {
        this.selling = false;
      },
    });
  }
}
