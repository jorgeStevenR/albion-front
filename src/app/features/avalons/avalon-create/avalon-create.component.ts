import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { AvalonService } from '../../../core/services/avalon.service';
import { PingTemplateService } from '../../../core/services/ping-template.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PingTemplate } from '../../../core/models/guild.model';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-avalon-create',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './avalon-create.component.html',
  styleUrl: './avalon-create.component.scss',
})
export class AvalonCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly avalonService = inject(AvalonService);
  private readonly pingService = inject(PingTemplateService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  readonly canUseTemplates = inject(AuthService).isCallerOrAdmin();

  loading = false;
  templateLoading = false;
  templates: PingTemplate[] = [];
  selectedTemplateId: number | null = null;

  form = this.fb.nonNullable.group({
    date: [new Date(), Validators.required],
    scheduledTime: ['20:00', Validators.required],
    zone: ['', Validators.required],
    description: [''],
  });

  templateDate = new Date();
  templateTime = '20:00';

  ngOnInit(): void {
    if (this.canUseTemplates) {
      this.pingService.getActive().subscribe({
        next: (t) => (this.templates = t),
      });
    }
  }

  createFromTemplate(): void {
    if (!this.selectedTemplateId) return;
    this.templateLoading = true;
    const scheduledAt = this.buildScheduledAt(this.templateDate, this.templateTime);
    this.pingService.createAvalonFromTemplate(this.selectedTemplateId, scheduledAt).subscribe({
      next: (res) => {
        const tpl = this.templates.find((t) => t.id === this.selectedTemplateId);
        this.notification.success('Avaloniana creada desde plantilla');
        if (tpl?.pingMessage) {
          navigator.clipboard.writeText(tpl.pingMessage);
          this.notification.success('Mensaje de ping copiado al portapapeles');
        }
        this.router.navigate(['/avalons', res.avalonId]);
      },
      error: () => {
        this.templateLoading = false;
      },
      complete: () => {
        this.templateLoading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const date = raw.date instanceof Date
      ? raw.date.toISOString().split('T')[0]
      : raw.date;
    const scheduledAt = this.buildScheduledAt(raw.date, raw.scheduledTime);

    this.loading = true;
    this.avalonService.create({ date, scheduledAt, zone: raw.zone, description: raw.description }).subscribe({
      next: (avalon) => {
        this.notification.success('Avaloniana creada');
        this.router.navigate(['/avalons', avalon.id]);
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private buildScheduledAt(dateInput: Date | string | null, time = '20:00'): string | undefined {
    if (!dateInput) return undefined;
    const base = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const [hours, minutes] = time.split(':').map(Number);
    base.setHours(hours, minutes, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}:00`;
  }
}
