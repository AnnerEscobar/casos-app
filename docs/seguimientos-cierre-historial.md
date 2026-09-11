# Seguimientos: cierre por tipo de expediente e historial

## Regla final acordada

| Tipo | Permite continuar | Estado terminal |
| --- | --- | --- |
| Maltrato | Informado, incluido Informado → Informado | Desestimado |
| Conflicto | Informado, incluido Informado → Informado | Desestimado |
| Alerta Alba-Keneth | Informado, incluido Informado → Informado | Remitido o Concluido |

La última corrección del usuario establece que **Remitido también cierra la investigación**. Por tanto, una Alerta remitida no admite otro seguimiento, incluido Concluido. Se conservaron los valores actuales de las opciones, sin agregar estados.

## Último seguimiento y backend

Los tres services registran actuaciones mediante `seguimientos.push(...)`. Se utiliza el último elemento del arreglo persistido, conservando la presentación de antiguo a reciente. Este orden es determinista y resuelve registros con fechas idénticas o sin fecha. No se ordena por una fecha de actuación ni se busca cualquier cierre antiguo. Tampoco se utiliza `estadoInvestigacion` del expediente como sustituto del último seguimiento.

Alerta guarda el estado en `nuevoEstado`; Maltrato y Conflicto lo guardan en `estado`. La función común `esEstadoTerminal(tipo, estado)` distingue ambos módulos. `validarSeguimientoAbierto()` se ejecuta antes de subir documentos y guardar el seguimiento. Un caso cerrado devuelve **HTTP 409 Conflict**, código `SEGUIMIENTO_TERMINAL` y mensaje acorde a desestimado, remitida o concluida.

`guardarSeguimiento()` añade al filtro de la escritura una condición sobre la cantidad de actuaciones leídas. Si otra petición agregó un seguimiento mientras se procesaba la actual, la escritura se rechaza con 409 y código `HISTORIAL_ACTUALIZADO`. Esto evita agregar actuaciones utilizando una lectura anterior a un cierre concurrente. No requiere nuevos campos, estados o índices.

La regla se aplica a SISTEMA e HISTORICO y a casos anteriores sin origen. Sin seguimientos se permite registrar el primero.

## Interfaz e historial

Al cargar el caso o agregar un seguimiento, la interfaz calcula el cierre a partir del historial. Oculta todas las secciones de captura, archivos nuevos, responsable y botón de envío. Conserva el expediente y su línea de tiempo. La card usa los estilos existentes y muestra «Caso desestimado», «Alerta remitida» o «Alerta concluida», con fecha cuando existe.

Ante 409 muestra MatSnackBar e intenta actualizar el caso. Si esa consulta falla, conserva el expediente y bloquea nuevos envíos hasta volver a consultarlo; no inventa una fecha ni un seguimiento terminal. Esto también cubre los históricos pendientes que la búsqueda existente puede excluir.

Cada actuación conserva estado, fecha/hora e indicador de adjuntos. Se agregan investigador asignado y usuario registrador cuando existen. Si ambos tienen el mismo `_id`, se muestra solamente el investigador. No se toma el investigador original, el incorporador del caso ni la sesión para completar información faltante. Las referencias sin nombre disponible no se presentan como nombres inventados.

Se reutilizan exclusivamente `nuevoEstado`/`estado`, `fecha`, `investigadorAsignado`, `registradoPor` y `archivos`; Alerta mantiene su dirección de localización visible cuando existe. Los schemas de seguimiento no contienen observación ni número de requerimiento/oficio: por ello no se añadieron esos datos ni campos nuevos. Las observaciones existentes en otras partes del expediente no se reutilizaron como si fueran una actuación.

El backend resuelve únicamente el nombre de ambas referencias en las consultas de seguimiento y en la respuesta al guardar, incluido el arreglo sin sub-schema de Alerta. Los arrays de URLs y su indicador icono + cantidad se conservan; con cero archivos no se muestra indicador. Se mantiene el comportamiento existente de documentos.

## Archivos de esta corrección

Frontend, relativos a `casos-app`:

- `src/app/seguimientos/seguimiento-alerta/seguimiento-alerta.component.ts`
- `src/app/seguimientos/seguimiento-alerta/seguimiento-alerta.component.html`
- `src/app/seguimientos/seguimiento-maltrato/seguimiento-maltrato.component.ts`
- `src/app/seguimientos/seguimiento-maltrato/seguimiento-maltrato.component.html`
- `src/app/seguimientos/seguimiento-conflicto/seguimiento-conflicto.component.ts`
- `src/app/seguimientos/seguimiento-conflicto/seguimiento-conflicto.component.html`
- Nuevo `src/app/seguimientos/seguimiento-terminal.ts`: decisión de cierre.
- Nuevo `src/app/seguimientos/seguimiento-participantes.component.ts`: información secundaria compartida; estilos locales con salto de nombres largos.
- Nuevo `src/app/seguimientos/seguimiento-terminal.spec.ts`: pruebas de integración Angular.
- Nuevo `docs/seguimientos-cierre-historial.md`: este documento.

Backend, relativos a `casos-app-backend`:

- `src/casos-alerta/casos-alerta.service.ts`
- `src/casos-maltrato/casos-maltrato.service.ts`
- `src/casos-conflicto/casos-conflicto.service.ts`
- Nuevo `src/common/seguimiento-terminal.ts`: cierre, protección de escritura y nombres del historial.
- Nuevo `src/common/seguimiento-terminal.spec.ts`: pruebas de services, decisión y escritura Mongoose.
- Nuevo `test/jest-seguimientos.json`: resolución de imports para la suite.

No se modificaron DTOs, schemas, interfaces, URLs, servicios HTTP Angular, autenticación, usuarios, dashboard, creación de casos, búsquedas generales, sidenav ni estilos globales en esta corrección. Las modificaciones anteriores de históricos permanecen en el directorio de trabajo y se distinguen de este inventario.

## Comprobaciones y límites

Resultados: compilación Angular de desarrollo y TypeScript del backend correctas. Las 26 pruebas nuevas frontend pasaron en escritorio, laptop y tablet (78 ejecuciones); a 390 px efectivos pasaron esas 26 más 32 de regresión histórica (58). Backend: 21 pruebas nuevas y 80 históricas correctas. Las pruebas de población usan los tres schemas reales con respuestas de consulta simuladas.

Las pruebas cubren primero, Informado repetido, cierre inmediato, lectura nueva desde API/documento persistido, cierre anterior seguido de actuación abierta, fechas iguales, casos históricos, errores 409, fallo de refresco, nombres distintos/iguales, ausencia de datos y adjuntos. Se comprueba Alerta sin introducir Desestimado y con ambos estados terminales. También se comprueba el filtro real emitido por Mongoose al escribir; las respuestas de Mongo/Drive/HTTP se simulan.

No se ejecutó una prueba integral contra MongoDB o Drive reales ni se desplegaron cambios. Una carrera que ocurra durante la subida puede dejar un archivo en Drive aunque la escritura del seguimiento se rechace; no se incorporó una limpieza automática de documentos a esta corrección. El orden registrado del arreglo debe preservarse en futuras importaciones.

La compilación de producción se ejecutó y mantiene un bloqueo previo por el presupuesto CSS de las tres pantallas de seguimiento: Alerta 9.32 kB, Maltrato 9.77 kB y Conflicto 9.71 kB frente al límite de 8.19 kB. Sus hojas no se modificaron aquí, y no se aumentó el límite para ocultarlo.

Comandos desde el repositorio correspondiente:

```powershell
# Backend
node node_modules/typescript/bin/tsc --project tsconfig.build.json --pretty false
node node_modules/jest/bin/jest.js --config test/jest-seguimientos.json --runInBand
node node_modules/jest/bin/jest.js --config test/jest-historicos.json --runInBand
# Frontend
node node_modules/@angular/cli/bin/ng.js build --configuration development
node node_modules/@angular/cli/bin/ng.js test --watch=false --karma-config=karma.historicos.conf.cjs --include=src/app/seguimientos/seguimiento-terminal.spec.ts --browsers=HistoricosDesktop,HistoricosLaptop,HistoricosTablet
$env:HISTORICOS_VIEWPORT='390'
node node_modules/@angular/cli/bin/ng.js test --watch=false --karma-config=karma.historicos.conf.cjs --include=src/app/seguimientos/seguimiento-terminal.spec.ts --include=src/app/casos/historicos/historicos.spec.ts --browsers=HistoricosMobile
Remove-Item Env:HISTORICOS_VIEWPORT
```
