import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  private open(message: string, panelClass: string, duration = 4000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass: ['app-snackbar', panelClass],
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  success(message: string): void {
    this.open(message, 'snackbar-success');
  }

  error(message: string): void {
    this.open(message, 'snackbar-error', 5000);
  }

  info(message: string): void {
    this.open(message, 'snackbar-info');
  }
}
