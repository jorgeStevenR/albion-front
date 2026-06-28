import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-shell/dashboard-shell.component').then(
            (m) => m.DashboardShellComponent,
          ),
      },
      {
        path: 'wallet',
        loadComponent: () =>
          import('./features/wallet/my-wallet/my-wallet.component').then(
            (m) => m.MyWalletComponent,
          ),
      },
      {
        path: 'guild/balance',
        canActivate: [roleGuard('ADMIN', 'OFFICER')],
        loadComponent: () =>
          import('./features/wallet/guild-balance/guild-balance.component').then(
            (m) => m.GuildBalanceComponent,
          ),
      },
      {
        path: 'wallet/transactions',
        loadComponent: () =>
          import('./features/wallet/transactions/transactions.component').then(
            (m) => m.TransactionsComponent,
          ),
      },
      {
        path: 'wallet/penalties',
        loadComponent: () =>
          import('./features/wallet/my-penalties/my-penalties.component').then(
            (m) => m.MyPenaltiesComponent,
          ),
      },
      {
        path: 'wallet/weekly',
        loadComponent: () =>
          import('./features/wallet/weekly-balance/weekly-balance.component').then(
            (m) => m.WeeklyBalanceComponent,
          ),
      },
      {
        path: 'avalons',
        loadComponent: () =>
          import('./features/avalons/avalon-list/avalon-list.component').then(
            (m) => m.AvalonListComponent,
          ),
      },
      {
        path: 'avalons/create',
        canActivate: [roleGuard('ADMIN', 'CALLER', 'OFFICER')],
        loadComponent: () =>
          import('./features/avalons/avalon-create/avalon-create.component').then(
            (m) => m.AvalonCreateComponent,
          ),
      },
      {
        path: 'caller/penalties',
        canActivate: [roleGuard('CALLER')],
        loadComponent: () =>
          import('./features/caller/caller-penalties/caller-penalties.component').then(
            (m) => m.CallerPenaltiesComponent,
          ),
      },
      {
        path: 'avalons/:id',
        loadComponent: () =>
          import('./features/avalons/avalon-detail/avalon-detail.component').then(
            (m) => m.AvalonDetailComponent,
          ),
      },
      {
        path: 'withdrawals',
        loadComponent: () =>
          import('./features/withdrawals/withdrawal-request/withdrawal-request.component').then(
            (m) => m.WithdrawalRequestComponent,
          ),
      },
      { path: 'loans', redirectTo: 'withdrawals', pathMatch: 'full' },
      { path: 'wallet/weekly', redirectTo: 'wallet', pathMatch: 'full' },
      {
        path: 'wallet/penalties',
        loadComponent: () =>
          import('./features/wallet/my-penalties/my-penalties.component').then(
            (m) => m.MyPenaltiesComponent,
          ),
      },
      {
        path: 'players',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/players/player-list/player-list.component').then(
            (m) => m.PlayerListComponent,
          ),
      },
      {
        path: 'players/:id',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/players/player-detail/player-detail.component').then(
            (m) => m.PlayerDetailComponent,
          ),
      },
      {
        path: 'admin/penalties',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/admin/admin-penalties/admin-penalties.component').then(
            (m) => m.AdminPenaltiesComponent,
          ),
      },
      {
        path: 'admin/transactions',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/admin/guild-transactions/guild-transactions.component').then(
            (m) => m.GuildTransactionsComponent,
          ),
      },
      {
        path: 'admin/ping-templates',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/admin/ping-templates/ping-templates.component').then(
            (m) => m.PingTemplatesComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [roleGuard('ADMIN')],
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
