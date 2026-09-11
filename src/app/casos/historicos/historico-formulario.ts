import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { CrearHistorico, EstadoExpedienteHistorico, TipoCaso } from '../models/caso-historico.model';

export const normalizarNumeroCaso = (valor: string): string => valor.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '').trim().toUpperCase();
export const patronesDeic: Record<TipoCaso, RegExp> = {
  alerta: /^(?:DEIC52-\d{4}-\d{2}-\d{2}-\d+|AK\d{6})$/,
  maltrato: /^(?:DEIC51-\d{4}-\d{2}-\d{2}-\d+|MT\d{6})$/,
  conflicto: /^(?:DEIC53-\d{4}-\d{2}-\d{2}-\d+|AC\d{6})$/,
};
const patronesMp: Record<TipoCaso, RegExp> = {
  alerta: /^M0030-\d{4}-\d+$/,
  maltrato: /^(?:(?:MPE01|M0008|MP004|M0030|MP001)-\d{4}-\d+|IC\/PNCORLLAT\d+-\d{4}-\d+)$/,
  conflicto: /^(?:M0004|MP001|MPE01)-\d{4}-\d+$/,
};

// Solo se invoca sobre instancias abiertas explícitamente en modo histórico.
export function quitarRequeridos(control: AbstractControl): void {
  control.removeValidators(Validators.required);
  if (control instanceof FormGroup || control instanceof FormArray) {
    Object.values(control.controls).forEach(quitarRequeridos);
  }
  control.updateValueAndValidity({ emitEvent: false });
}

function limpiar(valor: unknown): unknown {
  if (valor == null || valor === '') return undefined;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? undefined : valor.toISOString();
  if (typeof valor === 'string') return valor.trim() || undefined;
  if (Array.isArray(valor)) {
    const items = valor.map(limpiar).filter(item => item !== undefined);
    return items.length ? items : undefined;
  }
  if (typeof valor === 'object') {
    const entries = Object.entries(valor).map(([k, v]) => [k, limpiar(v)] as const).filter(([, v]) => v !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return valor;
}

export class HistoricoFormulario {
  readonly datos = new FormGroup({
    estadoExpedienteHistorico: new FormControl<EstadoExpedienteHistorico | null>(null, Validators.required),
    fuenteInformacionHistorica: new FormControl(''),
    anioCaso: new FormControl<number | null>(null, [Validators.min(1), Validators.max(9999), Validators.pattern(/^\d+$/)]),
    observacionHistorica: new FormControl(''),
    investigadorOriginal: new FormGroup({ usuarioId: new FormControl(''), nombre: new FormControl('') }),
  });
  // valueChanges del control se emite antes de actualizar el valor agregado del grupo.
  get minimo(): boolean {
    const estado = this.datos.controls.estadoExpedienteHistorico.value;
    return estado !== 'COMPLETO' && estado !== 'PARCIAL';
  }

  preparar(form: FormGroup, tipo: TipoCaso, numero: string): void {
    quitarRequeridos(form);
    form.get('numeroDeic')?.setValidators([Validators.required, Validators.pattern(patronesDeic[tipo])]);
    form.get('numeroMp')?.setValidators(Validators.pattern(patronesMp[tipo]));
    form.patchValue({ numeroDeic: normalizarNumeroCaso(numero) });
    this.cambiarEstado(form);
  }
  cambiarEstado(form: FormGroup): void {
    for (const [key, control] of Object.entries(form.controls)) {
      if (['numeroDeic', 'numeroMp', 'numeroAlerta'].includes(key)) continue;
      if (this.minimo) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    }
    form.updateValueAndValidity({ emitEvent: false });
  }
  payload(form: FormGroup, tipo: TipoCaso): CrearHistorico {
    const datos: Record<string, unknown> = { ...form.value };
    for (const campo of ['numeroDeic', 'numeroMp', 'numeroAlerta']) {
      if (typeof datos[campo] === 'string') datos[campo] = normalizarNumeroCaso(datos[campo] as string);
    }
    if (this.minimo) {
      for (const campo of Object.keys(datos)) if (!['numeroDeic', 'numeroMp', 'numeroAlerta'].includes(campo)) delete datos[campo];
    }
    if (tipo === 'maltrato') { datos['sindicados'] = datos['infractores']; delete datos['infractores']; }
    return limpiar({ ...datos, ...this.datos.getRawValue(), origenCaso: 'HISTORICO' }) as CrearHistorico;
  }
}

export function mensajeError(error: unknown, respaldo: string): string {
  const e = error as { status?: number; error?: { message?: string | string[] } };
  if (e?.status === 403) return 'No tienes permisos para realizar esta acción.';
  if (e?.status === 401) return 'Tu sesión ha vencido. Inicia sesión nuevamente.';
  if (e?.status === 409) return 'El caso ya se encuentra registrado. Puede estar pendiente de aprobación; no se creó un duplicado.';
  const mensaje = e?.error?.message;
  return Array.isArray(mensaje) ? mensaje.join(' ') : mensaje || respaldo;
}

// Mismos campos multipart que el registro normal: objetos como JSON y PDF en file.
export function historicoFormData(datos: CrearHistorico, file: File): FormData {
  const formData = new FormData();
  for (const [campo, valor] of Object.entries(datos)) {
    if (valor != null) formData.append(campo, typeof valor === 'object' ? JSON.stringify(valor) : String(valor));
  }
  if (['COMPLETO', 'PARCIAL'].includes(datos.estadoExpedienteHistorico)) {
    formData.append('file', file, file.name);
  }
  return formData;
}
