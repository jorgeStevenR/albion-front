import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { AvalonService } from '../../../core/services/avalon.service';
import { PlayerService } from '../../../core/services/player.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SaleService } from '../../../core/services/sale.service';
import { AvalonRun, LootItem, LootType, ParticipantType } from '../../../core/models/avalon.model';
import { Player } from '../../../core/models/player.model';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
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

@Component({
  selector: 'app-avalon-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
export class AvalonDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly avalonService = inject(AvalonService);
  private readonly playerService = inject(PlayerService);
  private readonly notification = inject(NotificationService);
  private readonly saleService = inject(SaleService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly canEdit = inject(AuthService).isOfficerOrAdmin();

  loading = true;
  calculating = false;
  closing = false;
  selling = false;
  sellingLootId: number | null = null;
  avalon: AvalonRun | null = null;
  players: Player[] = [];
  initialTabIndex = 0;

  participantTypes: ParticipantType[] = ['PLAYER', 'SCOUT', 'GUILD'];
  lootTypes: LootType[] = ['BAG', 'ITEM'];

  participantForm = this.fb.nonNullable.group({
    playerId: [0, Validators.required],
    participantType: ['PLAYER' as ParticipantType, Validators.required],
  });

  lootForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: ['ITEM' as LootType, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    marketValue: [0, [Validators.required, Validators.min(1)]],
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

  loadAvalon(id: number): void {
    this.loading = true;
    this.avalonService.getById(id).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (data) => {
        this.avalon = data;
      },
    });
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

  addLoot(): void {
    if (!this.avalon || this.lootForm.invalid) return;
    this.avalonService.addLoot(this.avalon.id, this.lootForm.getRawValue()).subscribe({
      next: (updated) => {
        this.avalon = updated;
        this.lootForm.reset({ name: '', type: 'ITEM', quantity: 1, marketValue: 0 });
        this.notification.success('Loot agregado');
      },
    });
  }

  calculate(): void {
    if (!this.avalon) return;
    this.calculating = true;
    this.avalonService.calculate(this.avalon.id).subscribe({
      next: (result) => {
        this.notification.success(`Avalon terminada. Reparto: ${result.totalBalance} silver. Vende el loot para cerrar.`);
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

  getTotalLootValue(): number {
    if (!this.avalon?.lootItems) return 0;
    return this.avalon.lootItems.reduce((sum, item) => {
      const total = item.marketValue * item.quantity;
      return sum + (item.type === 'ITEM' ? total * 0.8 : total);
    }, 0);
  }

  getRawLootValue(): number {
    if (!this.avalon?.lootItems) return 0;
    return this.avalon.lootItems.reduce((s, i) => s + i.marketValue * i.quantity, 0);
  }

  saleStatusLabel(item: LootItem): string {
    if (item.type === 'BAG' || item.saleStatus === 'NOT_APPLICABLE') return 'N/A';
    if (item.saleStatus === 'SOLD') return 'Vendido';
    return 'Sin vender';
  }

  canSell(item: LootItem): boolean {
    return this.canEdit
      && (this.avalon?.status === 'FINISHED' || this.avalon?.status === 'CLOSED')
      && item.type === 'ITEM'
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
