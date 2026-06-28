import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { PenaltyService } from '../../../core/services/penalty.service';
import { AvalonService } from '../../../core/services/avalon.service';
import { PlayerService } from '../../../core/services/player.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AvalonDelegate, AvalonPenalty, PenaltyDirection } from '../../../core/models/penalty.model';
import { RegisteredPlayerSummary } from '../../../core/models/avalon.model';
import { Player } from '../../../core/models/player.model';
import { finishLoading } from '../../../shared/utils/loading.util';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-avalon-penalties',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    LoadingSpinnerComponent,
    CurrencySilverPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './avalon-penalties.component.html',
  styleUrl: './avalon-penalties.component.scss',
})
export class AvalonPenaltiesComponent implements OnInit {
  private readonly penaltyService = inject(PenaltyService);
  private readonly avalonService = inject(AvalonService);
  private readonly playerService = inject(PlayerService);
  private readonly notification = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) avalonId!: number;
  @Input() createdByPlayerId?: number;

  loading = true;
  submitting = false;
  canManage = false;
  canManageDelegates = false;
  penalties: AvalonPenalty[] = [];
  delegates: AvalonDelegate[] = [];
  registeredPlayers: RegisteredPlayerSummary[] = [];
  allPlayers: Player[] = [];

  noShowForm = this.fb.nonNullable.group({
    noShowPlayerId: [0, Validators.required],
    replacementPlayerId: [0, Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    reason: [''],
  });

  massFineForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    reason: ['', Validators.required],
  });

  manualForm = this.fb.nonNullable.group({
    playerId: [0, Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    direction: ['DEBIT' as PenaltyDirection, Validators.required],
    reason: ['', Validators.required],
  });

  delegateForm = this.fb.nonNullable.group({
    playerId: [0, Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      penalties: this.penaltyService.listByAvalon(this.avalonId),
      canManage: this.penaltyService.canManage(this.avalonId),
      roles: this.avalonService.getRoles(this.avalonId),
    }).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: ({ penalties, canManage, roles }) => {
        this.penalties = penalties;
        this.canManage = canManage.canManage;
        this.registeredPlayers = roles.registeredPlayers?.length
          ? roles.registeredPlayers
          : roles.roles.flatMap((r) => r.players.map((p) => ({
              registrationId: p.registrationId,
              playerId: p.playerId,
              albionName: p.albionName,
              slotKey: p.slotKey ?? r.slotKey,
              slotDisplayName: p.slotDisplayName ?? r.displayName,
            })));
        this.canManageDelegates = this.auth.isOfficerOrAdmin()
          || this.auth.getCurrentUser()?.playerId === this.createdByPlayerId;

        if (this.canManageDelegates) {
          this.penaltyService.listDelegates(this.avalonId).subscribe({
            next: (d) => (this.delegates = d),
          });
        }
        if (this.canManageDelegates || this.auth.isAdmin()) {
          this.playerService.getAll().subscribe({
            next: (p) => (this.allPlayers = p.filter((pl) => pl.active)),
          });
        }
      },
    });
  }

  private isPingCreator(): boolean {
    const user = this.auth.getCurrentUser();
    return !!user && user.playerId === this.createdByPlayerId;
  }

  applyNoShow(): void {
    if (this.noShowForm.invalid) return;
    const val = this.noShowForm.getRawValue();
    if (val.noShowPlayerId === val.replacementPlayerId) {
      this.notification.error('El ausente y el reemplazo deben ser distintos');
      return;
    }
    this.submitting = true;
    this.penaltyService.applyNoShow(this.avalonId, val).pipe(
      finalize(() => (this.submitting = false)),
    ).subscribe({
      next: () => {
        this.notification.success('Multa y recompensa aplicadas');
        this.noShowForm.reset({ noShowPlayerId: 0, replacementPlayerId: 0, amount: 0, reason: '' });
        this.load();
      },
    });
  }

  applyMassFine(): void {
    if (this.massFineForm.invalid) return;
    if (!confirm(`¿Multar a todos los registrados (${this.registeredPlayers.length})?`)) return;
    this.submitting = true;
    this.penaltyService.applyMassFine(this.avalonId, this.massFineForm.getRawValue()).pipe(
      finalize(() => (this.submitting = false)),
    ).subscribe({
      next: (result) => {
        this.notification.success(`Multa aplicada a ${result.length} jugadores`);
        this.massFineForm.reset({ amount: 0, reason: '' });
        this.load();
      },
    });
  }

  applyManual(): void {
    if (this.manualForm.invalid) return;
    this.submitting = true;
    this.penaltyService.applyManual(this.avalonId, this.manualForm.getRawValue()).pipe(
      finalize(() => (this.submitting = false)),
    ).subscribe({
      next: () => {
        this.notification.success('Ajuste aplicado');
        this.manualForm.reset({ playerId: 0, amount: 0, direction: 'DEBIT', reason: '' });
        this.load();
      },
    });
  }

  assignDelegate(): void {
    const playerId = this.delegateForm.controls.playerId.value;
    if (!playerId) return;
    this.penaltyService.assignDelegate(this.avalonId, playerId).subscribe({
      next: (d) => {
        this.delegates = [...this.delegates, d];
        this.delegateForm.reset({ playerId: 0 });
        this.notification.success('Delegado asignado');
      },
    });
  }

  removeDelegate(playerId: number): void {
    this.penaltyService.removeDelegate(this.avalonId, playerId).subscribe({
      next: () => {
        this.delegates = this.delegates.filter((d) => d.playerId !== playerId);
        this.notification.success('Delegado eliminado');
      },
    });
  }

  penaltyTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      NO_SHOW_FINE: 'No asistió',
      REPLACEMENT_REWARD: 'Reemplazo',
      MASS_FINE: 'Multa masiva',
      MANUAL_FINE: 'Multa manual',
      MANUAL_REWARD: 'Recompensa',
    };
    return labels[type] ?? type;
  }
}
