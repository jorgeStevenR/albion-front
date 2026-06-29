import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    <noscript>
      <p style="padding: 2rem; color: #e8eaed; background: #0a0c12; font-family: Inter, sans-serif;">
        Albion Treasury requiere JavaScript. Actívalo para continuar.
      </p>
    </noscript>
  `,
})
export class App {}
