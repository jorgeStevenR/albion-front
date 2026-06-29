import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { map, shareReplay } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
  exact?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    AsyncPipe,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isHandset$ = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map((r) => r.matches), shareReplay());

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', exact: true },
    { label: 'Ping Ava', icon: 'campaign', route: '/avalons/create', roles: ['ADMIN', 'CALLER', 'OFFICER'], exact: true },
    { label: 'Avalonianas', icon: 'shield', route: '/avalons', exact: true },
    { label: 'Multas', icon: 'gavel', route: '/caller/penalties', roles: ['CALLER'], exact: true },
    { label: 'Multas', icon: 'gavel', route: '/admin/penalties', roles: ['ADMIN'], exact: true },
    { label: 'Mi Balance', icon: 'account_balance_wallet', route: '/wallet', roles: ['CALLER', 'PLAYER', 'ADMIN', 'OFFICER'], exact: true },
    { label: 'Balance Gremial', icon: 'account_balance', route: '/guild/balance', roles: ['ADMIN', 'OFFICER'], exact: true },
    { label: 'Mis multas', icon: 'gavel', route: '/wallet/penalties', roles: ['PLAYER'], exact: true },
    { label: 'Movimientos', icon: 'swap_horiz', route: '/wallet/transactions', roles: ['ADMIN', 'OFFICER'], exact: true },
    { label: 'Solicitudes', icon: 'payments', route: '/withdrawals', roles: ['PLAYER', 'CALLER', 'OFFICER'], exact: true },
    { label: 'Solicitudes', icon: 'payments', route: '/withdrawals', roles: ['ADMIN'], exact: true },
    { label: 'Usuarios', icon: 'group', route: '/players', roles: ['ADMIN'], exact: true },
    { label: 'Admin Panel', icon: 'admin_panel_settings', route: '/admin', roles: ['ADMIN'], exact: true },
    { label: 'Plantillas Ava', icon: 'event_note', route: '/admin/ping-templates', roles: ['ADMIN'], exact: true },
    { label: 'Mi perfil', icon: 'person', route: '/profile', exact: true },
  ];

  ngOnInit(): void {
    this.auth.refreshProfileFlags().subscribe({
      next: () => this.cdr.markForCheck(),
    });
  }

  get user() {
    return this.auth.getCurrentUser();
  }

  visibleNavItems(): NavItem[] {
    const role = this.user?.role;
    return this.navItems.filter((item) => !item.roles || (role && item.roles.includes(role)));
  }

  isExactRoute(item: NavItem): boolean {
    return item.exact !== false;
  }

  canViewGuildBalance(): boolean {
    return this.auth.canViewGuildBalance();
  }

  getRoleLabel(): string {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      CALLER: 'Caller',
      OFFICER: 'Oficial',
      PLAYER: 'Jugador',
    };
    return labels[this.user?.role ?? ''] ?? '';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  closeSidenavIfMobile(sidenav: MatSidenav): void {
    this.isHandset$.subscribe((isHandset) => {
      if (isHandset) sidenav.close();
    }).unsubscribe();
  }
}
