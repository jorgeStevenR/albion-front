import { Pipe, PipeTransform } from '@angular/core';
import { formatCurrencySilver } from '../utils/currency-silver.util';

@Pipe({ name: 'currencySilver', standalone: true })
export class CurrencySilverPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCurrencySilver(value);
  }
}
