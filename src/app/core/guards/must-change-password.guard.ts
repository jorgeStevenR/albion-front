import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const mustChangePasswordGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (state.url.startsWith('/profile')) {
    return true;
  }

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  return auth.refreshProfileFlags().pipe(
    map(() => {
      if (!auth.mustChangePassword()) {
        return true;
      }
      return router.createUrlTree(['/profile'], { queryParams: { required: '1' } });
    }),
    catchError(() => {
      auth.logout();
      return of(router.createUrlTree(['/auth/login']));
    }),
  );
};
