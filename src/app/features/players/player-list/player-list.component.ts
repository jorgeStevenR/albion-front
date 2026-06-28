import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import { RouterLink } from '@angular/router';

import { DatePipe } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Observable, catchError, finalize, of } from 'rxjs';

import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

import { PlayerService } from '../../../core/services/player.service';

import { GuildService } from '../../../core/services/guild.service';

import { AuthService } from '../../../core/auth/auth.service';

import { NotificationService } from '../../../core/services/notification.service';

import { Player } from '../../../core/models/player.model';

import { GuildPlayer } from '../../../core/models/guild.model';

import { PlayerRole } from '../../../core/models/auth.model';

import { CurrencySilverPipe } from '../../../shared/pipes/currency-silver.pipe';

import { finishLoading } from '../../../shared/utils/loading.util';

import { MatTableModule } from '@angular/material/table';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';

import { MatSelectModule } from '@angular/material/select';

import { MatTabsModule } from '@angular/material/tabs';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';



@Component({

  selector: 'app-player-list',

  standalone: true,

  imports: [

    RouterLink,

    DatePipe,

    ReactiveFormsModule,

    PageHeaderComponent,

    LoadingSpinnerComponent,

    MatTableModule,

    MatButtonModule,

    MatIconModule,

    MatFormFieldModule,

    MatInputModule,

    MatSelectModule,

    MatTabsModule,

    MatProgressSpinnerModule,

    CurrencySilverPipe,

  ],

  templateUrl: './player-list.component.html',

  styleUrl: './player-list.component.scss',

})

export class PlayerListComponent implements OnInit {

  private readonly playerService = inject(PlayerService);

  private readonly guildService = inject(GuildService);

  private readonly authService = inject(AuthService);

  private readonly notification = inject(NotificationService);

  private readonly fb = inject(FormBuilder);

  private readonly cdr = inject(ChangeDetectorRef);



  readonly isAdmin = this.authService.isAdmin();



  loading = true;

  syncing = false;

  guildName = 'II TEMPUS FUGIT II';

  players: Player[] = [];

  syncedPlayers: GuildPlayer[] = [];

  showForm = false;

  roles: PlayerRole[] = ['ADMIN', 'CALLER', 'OFFICER', 'PLAYER'];

  accountColumns = ['albionName', 'discordName', 'role', 'active', 'createdAt', 'actions'];

  guildColumns = ['albionName', 'rank', 'balance', 'totalEarned', 'avalonCount', 'active', 'actions'];



  form = this.fb.nonNullable.group({

    albionName: ['', Validators.required],

    discordName: ['', Validators.required],

    role: ['PLAYER' as PlayerRole, Validators.required],

    password: ['', [Validators.required, Validators.minLength(4)]],

  });



  ngOnInit(): void {

    this.guildService.getGuildInfo().subscribe({

      next: (info) => (this.guildName = info.name),

    });

    this.load();

  }



  load(): void {

    this.loading = true;

    this.guildService.getSyncedPlayers().pipe(

      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),

    ).subscribe({

      next: (data) => {

        this.syncedPlayers = data ?? [];

      },

    });



    if (this.isAdmin) {
      this.playerService.getAll().pipe(
        catchError(() => of([] as Player[])),
      ).subscribe({
        next: (data) => {
          this.players = data ?? [];
        },
      });
    }

  }



  syncGuild(): void {

    this.syncing = true;

    this.guildService.syncGuild().pipe(

      finalize(() => finishLoading(this.cdr, () => (this.syncing = false))),

    ).subscribe({

      next: (result) => {
        if (result.skipped) {
          this.notification.info(
            `Gremio ya actualizado (${result.playersImported} miembros en caché)`,
          );
        } else {
          this.notification.success(
            `Gremio "${result.guild}" sincronizado: ${result.created} nuevos, ${result.updated} actualizados`,
          );
          this.load();
        }
      },

    });

  }



  create(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    this.playerService.create(this.form.getRawValue()).subscribe({

      next: () => {

        this.notification.success('Jugador creado');

        this.showForm = false;

        this.form.reset({ role: 'PLAYER' });

        this.playerService.getAll().subscribe({

          next: (data) => {

            this.players = data ?? [];

          },

        });

      },

    });

  }



  deactivate(id: number): void {

    if (confirm('¿Desactivar este jugador?')) {

      this.playerService.deactivate(id).subscribe({

        next: () => {

          this.notification.success('Jugador desactivado');

          this.playerService.getAll().subscribe({

            next: (data) => {

              this.players = data ?? [];

            },

          });

        },

      });

    }

  }

}


