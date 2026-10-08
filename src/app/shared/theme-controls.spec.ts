import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { MatSelect } from '@angular/material/select';
import { ThemeService } from './theme.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  styleUrls: ['../casos/pages/add-case-alerta/add-case-alerta.component.css'],
  template: `<div class="v3-card"><div class="v3-card-title-group"><h2>Datos del caso</h2><p>Información de la persona</p></div>
    <mat-form-field appearance="outline"><mat-label>Nombre</mat-label>
      <input matInput [formControl]="nombre" placeholder="Nombre completo">
      <mat-hint>Ingresa el nombre</mat-hint><mat-error>Nombre obligatorio</mat-error>
    </mat-form-field>
    <mat-form-field appearance="fill"><mat-label>Observaciones</mat-label><textarea matInput readonly>Dato de consulta</textarea></mat-form-field>
    <mat-form-field appearance="outline"><mat-label>Tipo</mat-label><mat-select value="alerta"><mat-option value="alerta">Alerta</mat-option></mat-select></mat-form-field>
    <div class="v3-required-badge">Obligatorio</div></div>`
})
class CaseControlsFixture { nombre = new FormControl('Ana', Validators.required); }

@Component({
  standalone: true,
  styleUrls: ['../documentacion-inicial/pages/nueva-documentacion/nueva-documentacion.component.css'],
  template: `<div class="documentacion-container"><div class="header-text"><h1>Documentación inicial</h1><p>Datos del expediente</p></div>
    <div class="case-summary"><span>Número</span><strong>DEIC-1</strong></div>
    <div class="plan-item-header"><strong>Plan de investigación</strong></div></div>`
})
class DocumentationFixture {}

@Component({
  standalone: true,
  template: `<div class="bg-white border border-slate-200"><h2 class="text-slate-900">Usuarios y autorizaciones</h2><p class="text-slate-500">Información</p>
    <span class="bg-green-50 text-green-700">Autorizado</span><span class="bg-red-50 text-red-700">Rechazado</span>
    <button class="bg-slate-900 text-white">Guardar</button></div>`
})
class UtilityFixture {}

function contrast(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const c = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
  };
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

describe('Contraste de formularios y módulos', () => {
  let original: string | null;
  beforeEach(() => {
    original = localStorage.getItem('dark-theme');
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    TestBed.inject(ThemeService).set(true);
  });
  afterEach(() => {
    TestBed.inject(ThemeService).set(original === 'true');
    if (original === null) localStorage.removeItem('dark-theme');
  });
  it('mantiene contraste y estados de los inputs, etiquetas, ayudas y selector', async () => {
    const f = TestBed.createComponent(CaseControlsFixture); f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    const surface = getComputedStyle(el.querySelector('.v3-card')!).backgroundColor;
    for (const selector of ['h2', 'p', 'input', '.mdc-floating-label', 'mat-hint']) {
      expect(contrast(getComputedStyle(el.querySelector(selector)!).color, surface)).withContext(selector).toBeGreaterThanOrEqual(4.5);
    }
    const input = el.querySelector('input')!;
    const outline = el.querySelector('.mdc-notched-outline__leading')!;
    const normal = getComputedStyle(outline).borderColor;
    expect(getComputedStyle(el.querySelector('.mdc-notched-outline__notch')!).borderRightWidth).toBe('0px');
    input.focus(); f.detectChanges(); await f.whenStable();
    const focused = getComputedStyle(outline).borderColor;
    expect(focused).not.toBe(normal);
    f.componentInstance.nombre.setValue(''); f.componentInstance.nombre.markAsTouched(); input.blur(); f.detectChanges(); await f.whenStable(); f.detectChanges();
    expect(getComputedStyle(outline).borderColor).not.toBe(normal);
    expect(getComputedStyle(outline).borderColor).not.toBe(focused);
    expect(contrast(getComputedStyle(el.querySelector('mat-error')!).color, surface)).toBeGreaterThanOrEqual(4.5);
    f.componentInstance.nombre.disable(); f.detectChanges(); await f.whenStable();
    expect(input.disabled).toBeTrue();
    expect(getComputedStyle(input).color).not.toBe(getComputedStyle(el.querySelector('textarea')!).color);
    const select = f.debugElement.query(By.directive(MatSelect)).componentInstance as MatSelect;
    select.open(); f.detectChanges(); await f.whenStable();
    const panel = document.querySelector('.mat-mdc-select-panel')!;
    expect(contrast(getComputedStyle(panel.querySelector('.mdc-list-item__primary-text')!).color, getComputedStyle(panel).backgroundColor)).toBeGreaterThanOrEqual(4.5);
    select.close();
    TestBed.inject(ThemeService).set(false); f.detectChanges();
    expect(getComputedStyle(el.querySelector('.v3-card')!).backgroundColor).toBe('rgb(255, 255, 255)');
  });
  it('hace legibles textos heredados y resúmenes de Documentación inicial', () => {
    const f = TestBed.createComponent(DocumentationFixture); f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    for (const selector of ['.case-summary span', '.case-summary strong', '.plan-item-header strong']) {
      const node = el.querySelector(selector)!;
      expect(contrast(getComputedStyle(node).color, getComputedStyle(node.parentElement!).backgroundColor)).withContext(selector).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('adapta las utilidades de Usuarios y Autorizaciones preservando botones sólidos', () => {
    const f = TestBed.createComponent(UtilityFixture); f.detectChanges();
    const el: HTMLElement = f.nativeElement;
    const surface = getComputedStyle(el.querySelector('div')!).backgroundColor;
    for (const selector of ['h2', 'p']) expect(contrast(getComputedStyle(el.querySelector(selector)!).color, surface)).toBeGreaterThanOrEqual(4.5);
    el.querySelectorAll('span,button').forEach(node => expect(contrast(getComputedStyle(node).color, getComputedStyle(node).backgroundColor)).toBeGreaterThanOrEqual(4.5));
    TestBed.inject(ThemeService).set(false); f.detectChanges();
    expect(getComputedStyle(el.querySelector('div')!).backgroundColor).toBe('rgb(255, 255, 255)');
  });
});
