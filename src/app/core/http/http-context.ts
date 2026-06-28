import { HttpContextToken } from '@angular/common/http';

/** Evita el toast global en peticiones opcionales (p. ej. guild-info decorativo). */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
