import { ChangeDetectorRef } from '@angular/core';

export function finishLoading(cdr: ChangeDetectorRef, onDone: () => void): void {
  setTimeout(() => {
    onDone();
    cdr.detectChanges();
  });
}
