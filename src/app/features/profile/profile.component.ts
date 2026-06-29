import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserProfile } from '../../core/models/auth.model';
import { finishLoading } from '../../shared/utils/loading.util';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  saving = false;
  profile: UserProfile | null = null;
  requiredChange = false;
  selectedTab = 0;
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  });

  ngOnInit(): void {
    this.requiredChange = this.route.snapshot.queryParamMap.get('required') === '1'
      || this.auth.mustChangePassword();

    if (this.requiredChange) {
      this.selectedTab = 1;
    }

    this.auth.getProfile().pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.requiredChange = profile.mustChangePassword || this.requiredChange;
        if (this.requiredChange) {
          this.selectedTab = 1;
        }
      },
    });
  }

  submitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.notification.error('La confirmación no coincide con la nueva contraseña');
      return;
    }

    this.saving = true;
    this.auth.changePassword({ currentPassword, newPassword }).pipe(
      finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: () => {
        this.notification.success('Contraseña actualizada correctamente');
        this.passwordForm.reset();
        this.requiredChange = false;
        this.router.navigate(['/dashboard']);
      },
    });
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      CALLER: 'Caller',
      OFFICER: 'Oficial',
      PLAYER: 'Jugador',
    };
    return labels[role] ?? role;
  }
}
