import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';
import { SKIP_ERROR_TOAST } from '../http/http-context';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const skipToast = req.context.get(SKIP_ERROR_TOAST);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!skipToast) {
        let message = 'Ha ocurrido un error inesperado';

        if (error.status === 401) {
          message = 'Sesión expirada. Inicia sesión nuevamente.';
          auth.logout();
          router.navigate(['/auth/login']);
        } else if (error.status === 403) {
          message = 'No tienes permisos para esta acción';
        } else if (error.status === 404) {
          message = 'Recurso no encontrado';
        } else if (error.error?.message === 'ROLE_FULL') {
          message = 'Este rol ya está completo';
        } else if (error.error?.message === 'An unexpected error occurred') {
          message = 'Error del servidor. Recarga la página o reinicia el backend.';
        } else if (error.error?.message) {
          message = error.error.message;
        } else if (error.status === 0) {
          message = 'No se pudo conectar con el servidor';
        }

        notification.error(message);
      }
      return throwError(() => error);
    }),
  );
};
