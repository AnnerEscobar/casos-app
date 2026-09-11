import { SeguimientoCaso, TipoCaso } from '../casos/models/caso-historico.model';

// Orden persistido de registro (push en los tres services), de antiguo a nuevo.
export function ultimoSeguimiento(historial?: SeguimientoCaso[] | null): SeguimientoCaso | undefined {
  return historial?.[historial.length - 1];
}
export function estaCerrado(tipo: TipoCaso, historial?: SeguimientoCaso[] | null): boolean {
  const ultimo = ultimoSeguimiento(historial);
  const estado = tipo === 'alerta' ? ultimo?.nuevoEstado : ultimo?.estado;
  return tipo === 'alerta' ? estado === 'Remitido' || estado === 'Concluido' : estado === 'Desestimado';
}
