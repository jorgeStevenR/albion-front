import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ItemCatalogService, itemDisplayLabel } from '../../../core/services/item-catalog.service';
import { AlbionItem } from '../../../core/models/build-template.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-item-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './item-search.component.html',
  styleUrl: './item-search.component.scss',
})
export class ItemSearchComponent implements OnInit {
  private readonly itemCatalog = inject(ItemCatalogService);

  @Input({ required: true }) label!: string;
  @Input() placeholder = 'Buscar item...';
  @Input() initialDisplayName = '';
  @Input() disabled = false;
  @Output() itemSelected = new EventEmitter<AlbionItem | null>();

  readonly itemLabel = itemDisplayLabel;
  readonly searchControl = new FormControl('');

  selectedItem: AlbionItem | null = null;

  results$ = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((q) => {
      const query = (q ?? '').trim();
      if (query.length < 2) {
        return [[] as AlbionItem[]];
      }
      return this.itemCatalog.search({ q: query, limit: 30 });
    }),
  );

  ngOnInit(): void {
    if (this.initialDisplayName) {
      this.searchControl.setValue(this.initialDisplayName, { emitEvent: false });
    }
    if (this.disabled) {
      this.searchControl.disable();
    }
  }

  onSelect(item: AlbionItem): void {
    this.selectedItem = item;
    this.searchControl.setValue(itemDisplayLabel(item), { emitEvent: false });
    this.itemSelected.emit(item);
  }
}
