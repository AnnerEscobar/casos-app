# Casos históricos: implementación frontend V3

## Flujo y alcance

Las tres pantallas de seguimiento ofrecen «Incorporar caso histórico» únicamente tras un 404 y para Analista/Investigador. Otros errores muestran el mensaje correspondiente. El aviso contempla que la búsqueda actual solo devuelve casos aprobados: un número pendiente puede devolver 404, pero la creación responde 409 y conserva lo escrito.

El diálogo reutiliza los formularios existentes de Alerta, Maltrato y Conflicto. Al guardar recibe el caso completo, incluido `_id`, cierra el diálogo y selecciona ese objeto en la pantalla actual. Desplaza el foco hacia el nuevo seguimiento. No navega ni vuelve a consultar el número; funciona incluso cuando el caso recién incorporado está Pendiente. El PATCH agrega su respuesta al historial local, sin una segunda búsqueda que pudiera perder ese caso.

## Estados y validaciones

| Estado | Comportamiento |
| --- | --- |
| COMPLETO | Formulario habitual con datos históricos opcionales. |
| PARCIAL | Mismos campos; admite, por ejemplo, víctima sin sindicado. |
| NO_LOCALIZADO | Identificadores y metadatos; oculta y excluye personas, lugares y demás información desconocida. |

DEIC y selección de estado son obligatorios. MP es opcional, pero se valida su formato cuando está presente. Se normalizan mayúsculas, espacios exteriores y caracteres Unicode invisibles antes de validar y buscar. Se mantienen las validaciones de formato de los campos disponibles; los `required` se relajan únicamente en el modo histórico. Los formularios normales conservan sus requisitos y PDF.

Los históricos se crean como JSON sin PDF obligatorio. Campos vacíos, objetos vacíos y listas vacías se omiten. Cambiar a NO_LOCALIZADO excluye los campos ocultos del envío sin borrar lo escrito. El modo histórico no carga borradores ni datos de informes normales. Alerta admite ausencia de denunciante y localización. Maltrato muestra sindicados y adapta su array interno al contrato; Conflicto conserva infractores.

El investigador original es opcional: usuario o nombre conocido. Nunca se guarda «No determinado»; ese texto solo se usa al visualizar. `registradoPor` procede del JWT. Para el seguimiento histórico se exige elegir un investigador activo; no se copia el investigador original ni se selecciona automáticamente al usuario conectado.

Se bloquean búsquedas y envíos concurrentes, se impide cerrar el diálogo durante la creación y se conservan valores ante errores, incluidos 403 y 409.

## Presentación y compatibilidad

Una identificación discreta y un panel secundario muestran estado, fuente, investigador original, usuario que incorporó, fecha, año y observación disponibles. El panel aparece en la consulta dentro del flujo de seguimiento. Registros sin `origenCaso` se muestran como normales y admiten propiedades ausentes.

Se reutilizan ReactiveForms, Angular Material y los estilos V3 de cards, campos y botones. El CSS nuevo sigue colores y bordes existentes, utiliza grid adaptable y limita el diálogo al viewport. No se modifican rutas Angular, sidenav, layout, tipografía, tema global ni dependencias. No se amplía este cambio a búsquedas generales o dashboard; sus modificaciones previas se preservaron.

## Inventario exacto del frontend

Rutas relativas a `casos-app`. La notación `{alerta,maltrato,conflicto}` representa un archivo independiente por cada valor.

Archivos existentes modificados:

- `src/app/casos/pages/add-case-{alerta,maltrato,conflicto}/add-case-{alerta,maltrato,conflicto}.component.ts`: modo histórico, metadatos, creación y eventos (cada carpeta corresponde al mismo tipo).
- Los respectivos `.component.html`: integración del modo histórico y visibilidad condicional.
- Los respectivos `.component.css`: presentación del formulario embebido y botón adaptable.
- `src/app/casos/services/{alerta,maltrato,conflicto}.service.ts`: `crearHistorico()` tipado.
- `src/app/seguimientos/seguimiento-{alerta,maltrato,conflicto}/seguimiento-{alerta,maltrato,conflicto}.component.ts`: búsqueda, diálogo, selección directa, responsable e historial local.
- Los respectivos `.component.html`: aviso 404, procedencia y responsable. Sus hojas CSS existentes no se modificaron.
- `src/app/seguimientos/seguimiento-services/seguimiento-{alerta,maltrato,conflicto}.service.ts`: respuestas tipadas y normalización de DEIC.
- `src/app/usuarios/services/usuarios.service.ts`: `getInvestigadores()`.

Archivos nuevos:

- `src/app/casos/models/caso-historico.model.ts`: tipos TipoCaso, OrigenCaso, EstadoExpedienteHistorico, FuenteInformacionHistorica, UsuarioReferencia, ReferenciaUsuario, DatosHistoricos, PersonaCaso, SeguimientoCaso, CasoSeguimiento, CrearHistorico, RespuestaSeguimiento y etiquetas legibles.
- `src/app/casos/historicos/incorporar-historico-dialog.component.ts`: diálogo que reutiliza los tres formularios.
- `src/app/casos/historicos/historico-data.component.ts`: selección de estado y metadatos.
- `src/app/casos/historicos/historico-info.component.ts`: procedencia del caso.
- `src/app/casos/historicos/responsable-seguimiento.component.ts`: selección explícita del investigador activo.
- `src/app/casos/historicos/historico-formulario.ts`: validación, normalización y preparación de payloads compartidas.
- `src/app/casos/historicos/historicos.css`: estilos compartidos de los componentes nuevos.
- `src/app/casos/historicos/historicos.spec.ts`: 32 pruebas.
- `karma.historicos.conf.cjs`: navegadores y tamaños de prueba.
- `docs/casos-historicos-frontend.md`: este documento.

## Contratos y ajustes del backend

Se usan las rutas existentes `POST /alertas/historico`, `/maltratos/historico` y `/conflictos/historico`, relativas a la URL de API configurada. Se conservan las rutas GET/PATCH de seguimiento.

Cambios complementarios de esta etapa, relativos a `casos-app-backend`:

- `src/auth/auth.controller.ts` y `src/auth/auth.service.ts`: nuevo `GET /auth/investigadores`, protegido con JWT y roles Analista/Investigador. Devuelve solo `_id`, `nombre`, `role`, `activo`. Incluye inactivos para identificar investigadores originales; el selector del seguimiento los filtra. `/auth/users` mantiene su restricción de Admin.
- `src/common/historicos/caso-historico.service.ts`: población de nombres del usuario incorporador e investigador original al crear.
- `src/casos-alerta/casos-alerta.service.ts`, `src/casos-maltrato/casos-maltrato.service.ts`, `src/casos-conflicto/casos-conflicto.service.ts`: población de esos nombres al consultar históricos.
- `src/common/historicos/casos-historicos.spec.ts`: adaptación del mock de población.
- `src/auth/investigadores.spec.ts`: pruebas de restricciones y selección de campos del directorio.

Para usar esta interfaz debe desplegarse también este backend. La preparación de índices MongoDB de la etapa anterior sigue documentada en `casos-app-backend/docs/casos-historicos.md`; no se ejecutó una migración contra una base real durante esta etapa.

## Verificación y limitaciones

- Compilación Angular de desarrollo correcta.
- 32 pruebas frontend correctas en las cuatro configuraciones de navegador: 128 ejecuciones. Repetición adicional de las 32 pruebas con viewport efectivo de 390 px, también correcta.
- Se cubren creación mínima, parcial, terminología, Alerta sin denunciante, requisitos normales, caso existente, Unicode invisible, registros sin origen, errores, roles, doble envío y continuidad de pendientes. Las verificaciones geométricas incluyen campos, cards y diálogo.
- Pruebas Angular con Chrome real y HTTP simulado; no equivalen a una prueba integral contra MongoDB/Drive ni a dispositivos físicos.
- Compilación TypeScript del backend correcta; 80 pruebas históricas y 2 del directorio de investigadores correctas. El conjunto histórico requiere `--config test/jest-historicos.json` para resolver los imports `src/`.
- **Producción bloqueada por presupuestos CSS existentes:** seguimiento Alerta 9.32 kB, Maltrato 9.77 kB y Conflicto 9.71 kB superan el máximo de 8.19 kB. Estas tres hojas no tienen cambios en esta etapa. No se elevó el presupuesto ni se modificaron sus estilos. Es necesario resolver ese bloqueo antes de desplegar el frontend.

Comandos de comprobación desde cada repositorio:

```powershell
# Frontend
node node_modules/@angular/cli/bin/ng.js build --configuration development
node node_modules/@angular/cli/bin/ng.js test --watch=false --karma-config=karma.historicos.conf.cjs --include=src/app/casos/historicos/historicos.spec.ts --browsers=HistoricosDesktop,HistoricosLaptop,HistoricosTablet,HistoricosMobile
$env:HISTORICOS_VIEWPORT='390'
node node_modules/@angular/cli/bin/ng.js test --watch=false --karma-config=karma.historicos.conf.cjs --include=src/app/casos/historicos/historicos.spec.ts --browsers=HistoricosMobile
Remove-Item Env:HISTORICOS_VIEWPORT
# Backend
node node_modules/typescript/bin/tsc --project tsconfig.build.json --pretty false
node node_modules/jest/bin/jest.js --config test/jest-historicos.json --runInBand
node node_modules/jest/bin/jest.js --runInBand src/auth/investigadores.spec.ts
```
