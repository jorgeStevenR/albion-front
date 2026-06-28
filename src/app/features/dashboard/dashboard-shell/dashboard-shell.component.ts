import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { DashboardPageComponent } from '../dashboard-page/dashboard-page.component';
import { PlayerDashboardComponent } from '../player-dashboard/player-dashboard.component';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [DashboardPageComponent, PlayerDashboardComponent],
  template: `
    @if (isPlayer) {
      <app-player-dashboard />
    } @else {
      <app-dashboard-page />
    }
  `,
})
export class DashboardShellComponent {
  private readonly auth = inject(AuthService);
  readonly isPlayer = this.auth.getCurrentUser()?.role === 'PLAYER';
}
