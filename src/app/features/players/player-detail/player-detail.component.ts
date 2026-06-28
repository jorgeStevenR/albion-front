import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PlayerService } from '../../../core/services/player.service';
import { GuildService } from '../../../core/services/guild.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Player } from '../../../core/models/player.model';
import { GuildPlayerDetail } from '../../../core/models/guild.model';
import { PlayerRole } from '../../../core/models/auth.model';
import { finishLoading } from '../../../shared/utils/loading.util';
import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    CurrencySilverPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './player-detail.component.html',
  styleUrl: './player-detail.component.scss',
})
export class PlayerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly playerService = inject(PlayerService);
  private readonly guildService = inject(GuildService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isAdmin = this.authService.isAdmin();

  loading = true;
  guildPlayer: GuildPlayerDetail | null = null;
  account: Player | null = null;
  roles: PlayerRole[] = ['ADMIN', 'CALLER', 'OFFICER', 'PLAYER'];
  distributionColumns = ['avalonZone', 'amount', 'createdAt'];
  avalonColumns = ['date', 'zone', 'participantType'];

  form = this.fb.nonNullable.group({
    albionName: ['', Validators.required],
    discordName: ['', Validators.required],
    role: ['PLAYER' as PlayerRole, Validators.required],
    password: [''],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      guild: this.guildService.getSyncedPlayerById(id),
      account: this.isAdmin
        ? this.playerService.getById(id).pipe(catchError(() => of(null)))
        : of(null),
    }).pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: ({ guild, account }) => {
        this.guildPlayer = guild;
        this.account = account;
        if (account) {
          this.form.patchValue({
            albionName: account.albionName,
            discordName: account.discordName,
            role: account.role,
          });
        }
      },
    });
  }

  save(): void {
    if (!this.account || this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.playerService.update(this.account.id, {
      albionName: raw.albionName,
      discordName: raw.discordName,
      role: raw.role,
      password: raw.password || undefined,
    }).subscribe({
      next: () => this.notification.success('Cuenta actualizada'),
    });
  }
}
