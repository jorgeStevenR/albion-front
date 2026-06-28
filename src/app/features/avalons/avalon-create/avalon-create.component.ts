import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PingTemplateService } from '../../../core/services/ping-template.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PingTemplate } from '../../../core/models/guild.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { finishLoading } from '../../../shared/utils/loading.util';

@Component({
  selector: 'app-avalon-create',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './avalon-create.component.html',
  styleUrl: './avalon-create.component.scss',
})
export class AvalonCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pingService = inject(PingTemplateService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly isAdmin = inject(AuthService).isAdmin();

  loadingTemplates = true;
  submitting = false;
  templates: PingTemplate[] = [];
  readonly minDate = new Date();

  form = this.fb.nonNullable.group({
    templateId: [0, [Validators.required, Validators.min(1)]],
    date: [new Date(), Validators.required],
    scheduledTime: ['', Validators.required],
  });

  ngOnInit(): void {
    this.form.controls.scheduledTime.setValue(this.defaultTimeOneHourAhead());
    this.pingService.getActive().pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loadingTemplates = false))),
    ).subscribe({
      next: (t) => {
        this.templates = t ?? [];
      },
    });
  }

  get scheduledDayLabel(): string {
    const date = this.form.controls.date.value;
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  get selectedTemplate(): PingTemplate | undefined {
    const id = this.form.controls.templateId.value;
    return id > 0 ? this.templates.find((t) => t.id === id) : undefined;
  }

  goToTemplates(): void {
    if (this.isAdmin) {
      this.router.navigate(['/admin/ping-templates']);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const validationError = this.validateScheduleClient();
    if (validationError) {
      this.notification.error(validationError);
      return;
    }

    const raw = this.form.getRawValue();
    const scheduledAt = this.buildScheduledAt(raw.date, raw.scheduledTime);
    if (!scheduledAt) {
      this.notification.error('Fecha u hora inválida');
      return;
    }

    this.submitting = true;
    this.pingService.createAvalonFromTemplate(raw.templateId, scheduledAt).subscribe({
      next: (res) => {
        const tpl = this.templates.find((t) => t.id === raw.templateId);
        this.notification.success('Ping de avaloniana publicado');
        if (tpl?.pingMessage) {
          navigator.clipboard.writeText(tpl.pingMessage).catch(() => undefined);
          this.notification.success('Mensaje de ping copiado al portapapeles');
        }
        this.router.navigate(['/avalons', res.avalonId]);
      },
      error: () => {
        this.submitting = false;
      },
      complete: () => {
        this.submitting = false;
      },
    });
  }

  private validateScheduleClient(): string | null {
    const scheduledAt = this.buildScheduledAt(
      this.form.controls.date.value,
      this.form.controls.scheduledTime.value,
    );
    if (!scheduledAt) {
      return 'Selecciona fecha y hora válidas';
    }

    const when = new Date(scheduledAt);
    const minWhen = new Date(Date.now() + 60 * 60 * 1000);
    if (when < minWhen) {
      return 'El ping debe ser al menos 1 hora después de ahora';
    }
    return null;
  }

  private defaultTimeOneHourAhead(): string {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private buildScheduledAt(dateInput: Date | string | null, time: string): string | undefined {
    if (!dateInput || !time) return undefined;
    const base = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
    const [hours, minutes] = time.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
    base.setHours(hours, minutes, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}:00`;
  }
}
