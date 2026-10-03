export function personaExpediente(caso: any): { etiqueta: string; nombre: string } {
  const tipo = String(caso.tipo).toLowerCase();
  const alerta = tipo.includes('alerta');
  const conflicto = tipo === 'conflicto';
  const etiqueta = alerta ? 'Persona desaparecida' : conflicto ? 'Adolescente en conflicto' : 'Víctima';
  if (caso.acceso === 'RESTRINGIDO') return { etiqueta, nombre: 'Información restringida' };
  const nombres = alerta ? [caso.nombreDesaparecido] : (conflicto ? caso.infractores : caso.victimas)?.map((p: any) => p.nombre) || [];
  return { etiqueta, nombre: nombres.filter(Boolean).join(', ') || 'Nombre no registrado' };
}
