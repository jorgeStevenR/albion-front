import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AvalonService } from '../../../core/services/avalon.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AvalonRun } from '../../../core/models/avalon.model';
import { finishLoading } from '../../../shared/utils/loading.util';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-avalon-list',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './avalon-list.component.html',
  styleUrl: './avalon-list.component.scss',
})
export class AvalonListComponent implements OnInit {
  private readonly avalonService = inject(AvalonService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly canCreate = inject(AuthService).isCallerOrAdmin();

  loading = true;
  avalons: AvalonRun[] = [];
  displayedColumns = ['scheduledAt', 'zone', 'status', 'participants', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.avalonService.getAll().pipe(
      finalize(() => finishLoading(this.cdr, () => (this.loading = false))),
    ).subscribe({
      next: (data) => {
        this.avalons = data ?? [];
      },
    });
  }

  goToCreate(): void {
    this.router.navigate(['/avalons/create']);
  }
}
