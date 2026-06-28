import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GuildService } from '../../../core/services/guild.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  private readonly guildService = inject(GuildService);

  guildName = '';
  defaultPasswordHint = '';

  ngOnInit(): void {
    this.guildService.getGuildInfo().subscribe({
      next: (info) => {
        this.guildName = info.name;
        this.defaultPasswordHint = info.defaultMemberPasswordHint;
      },
    });
  }
}
