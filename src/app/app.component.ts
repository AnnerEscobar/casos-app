import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ThemeService } from './shared/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'casos-app';
  // Injecting ThemeService here triggers its constructor,
  // which applies the saved dark/light preference on every page load.
  private _theme = inject(ThemeService);
}
