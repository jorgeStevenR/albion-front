import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil, tap } from 'rxjs';
import { ItemCatalogService, itemDisplayLabel } from '../../../core/services/item-catalog.service';
import { AlbionItem, EquipmentSlot } from '../../../core/models/build-template.model';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-item-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './item-search.component.html',
  styleUrl: './item-search.component.scss',
})
export class ItemSearchComponent implements OnInit, OnDestroy {
  private readonly itemCatalog = inject(ItemCatalogService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger?: MatAutocompleteTrigger;

  @Input({ required: true }) label!: string;
  @Input() placeholder = 'Buscar item...';
  @Input() slot?: EquipmentSlot;
  @Input() initialDisplayName = '';
  @Input() disabled = false;
  @Output() itemSelected = new EventEmitter<AlbionItem | null>();

  readonly itemLabel = itemDisplayLabel;
  readonly searchControl = new FormControl('');

  selectedItem: AlbionItem | null = null;
  results: AlbionItem[] = [];
  searching = false;
  catalogReady = true;
  statusHint = '';

  ngOnInit(): void {
    if (this.initialDisplayName) {
      this.searchControl.setValue(this.initialDisplayName, { emitEvent: false });
    }
    if (this.disabled) {
      this.searchControl.disable();
    }

    this.itemCatalog.getCatalogStatus().pipe(catchError(() => of(null))).subscribe((status) => {
      if (status) {
        this.catalogReady = status.ready;
        this.updateStatusHint();
        this.cdr.detectChanges();
        if (!status.ready) {
          setTimeout(() => this.recheckCatalog(), 5000);
        }
      }
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.searching = true;
        this.cdr.detectChanges();
      }),
      switchMap((q) => this.fetchResults((q ?? '').trim())),
      takeUntil(this.destroy$),
    ).subscribe((items) => {
      this.results = items;
      this.searching = false;
      this.updateStatusHint();
      this.cdr.detectChanges();
      queueMicrotask(() => {
        if (this.results.length > 0) {
          this.autocompleteTrigger?.openPanel();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFocus(): void {
    const query = (this.searchControl.value ?? '').trim();
    if (query.length >= 2 || !this.slot) {
      return;
    }
    this.searching = true;
    this.cdr.detectChanges();
    this.fetchResults(query).subscribe((items) => {
      this.results = items;
      this.searching = false;
      this.updateStatusHint();
      this.cdr.detectChanges();
      queueMicrotask(() => this.autocompleteTrigger?.openPanel());
    });
  }

  onSelect(item: AlbionItem): void {
    this.selectedItem = item;
    this.searchControl.setValue(itemDisplayLabel(item), { emitEvent: false });
    this.itemSelected.emit(item);
  }

  private updateStatusHint(): void {
    const query = (this.searchControl.value ?? '').trim();
    if (this.searching) {
      this.statusHint = 'Buscando...';
      return;
    }
    if (!this.catalogReady) {
      this.statusHint = 'Cargando catálogo de items… espera un momento y vuelve a buscar.';
      return;
    }
    if (query.length >= 2 && this.results.length === 0) {
      this.statusHint = 'Sin resultados. Prueba en español: casco soldado, martillo t8…';
      return;
    }
    if (this.slot && query.length < 2 && this.results.length === 0) {
      this.statusHint = 'Escribe al menos 2 letras o espera a que cargue el catálogo.';
      return;
    }
    this.statusHint = '';
  }

  private fetchResults(query: string) {
    const minLength = this.slot ? 0 : 2;
    if (query.length < minLength && !this.slot) {
      return of([] as AlbionItem[]);
    }

    return this.itemCatalog.search({
      q: query || undefined,
      slot: this.slot,
      limit: 30,
    }).pipe(
      catchError(() => {
        this.catalogReady = false;
        return of([] as AlbionItem[]);
      }),
    );
  }

  private recheckCatalog(): void {
    this.itemCatalog.getCatalogStatus().pipe(catchError(() => of(null))).subscribe((status) => {
      if (!status) return;
      const wasReady = this.catalogReady;
      this.catalogReady = status.ready;
      this.updateStatusHint();
      this.cdr.detectChanges();
      if (!wasReady && status.ready) {
        const query = (this.searchControl.value ?? '').trim();
        if (query.length >= 2 || this.slot) {
          this.fetchResults(query).subscribe((items) => {
            this.results = items;
            this.updateStatusHint();
            this.cdr.detectChanges();
            queueMicrotask(() => this.autocompleteTrigger?.openPanel());
          });
        }
      } else if (!status.ready) {
        setTimeout(() => this.recheckCatalog(), 5000);
      }
    });
  }
}
