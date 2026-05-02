import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly KEY = 'dark-theme';
  private _dark = new BehaviorSubject<boolean>(
    localStorage.getItem(this.KEY) === 'true'
  );

  isDark$ = this._dark.asObservable();

  constructor() {
    this.apply(this._dark.value);
  }

  get isDark(): boolean { return this._dark.value; }

  toggle() { this.set(!this._dark.value); }

  set(dark: boolean) {
    this._dark.next(dark);
    localStorage.setItem(this.KEY, String(dark));
    this.apply(dark);
  }

  private apply(dark: boolean) {
    document.documentElement.classList.toggle('dark-theme', dark);
  }
}
