import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BorradoresService {
  clave(usuario: string, pantalla: string) { return `sgic:borrador:v1:${encodeURIComponent(usuario)}:${encodeURIComponent(pantalla)}`; }
  leer(clave: string): any {
    const raw = localStorage.getItem(clave);
    if (!raw) return null;
    try { return JSON.parse(raw, (_k, valor) => valor && typeof valor === 'object' && Object.keys(valor).length === 1 && valor.$fecha ? new Date(valor.$fecha) : valor).datos; }
    catch { localStorage.removeItem(clave); return null; }
  }
  guardar(clave: string, datos: any) {
    const preparar = (valor: any): any => {
      if (valor instanceof Date) return { $fecha: valor.toISOString() };
      if (valor instanceof File || valor instanceof Blob) return undefined;
      if (Array.isArray(valor)) return valor.map(preparar);
      if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor)
        .filter(([k]) => !/password|contrase[nñ]a|token|cookie|secret/i.test(k)).map(([k, v]) => [k, preparar(v)]));
      return valor;
    };
    localStorage.setItem(clave, JSON.stringify({ guardado: new Date().toISOString(), datos: preparar(datos) }));
  }
  eliminar(clave: string) { localStorage.removeItem(clave); }
}
