# Continuar un registro después de iniciar sesión

Los formularios de recepción y registro de Alerta, Maltrato y Conflicto guardan
sus valores mientras se editan, incluidos registros históricos y sus filas de
personas. También se conservan seguimientos, carátulas, plan, rúbrica e informe.
El cierre por 15 minutos de inactividad conserva la URL para volver a esa pantalla.

Las copias se separan por ID del usuario, URL (incluye el expediente o documento)
y formulario. No se recuperan copias de otra cuenta ni los borradores antiguos
sin propietario. Los datos se recuperan después de cargar los datos autorizados
del servidor. Campos bloqueados y formularios de solo lectura no se sobrescriben.
Los seguimientos vuelven a consultar el expediente para comprobar el acceso.

`BorradoresService` utiliza almacenamiento local del navegador, sin cifrado.
La separación por usuario evita mezclar copias en la interfaz; no impide que
alguien con acceso al perfil del navegador inspeccione su almacenamiento.
No sincroniza dispositivos y borrar los datos del navegador elimina estas copias.
El borrador no equivale a registrar o entregar el expediente en el servidor.

No se guardan contraseñas, tokens ni archivos. Los adjuntos deben seleccionarse
otra vez. Las fechas mantienen su tipo y las filas conservan los validadores
de los componentes originales. La copia se limpia al confirmar el guardado o
reiniciar el formulario; los errores de envío no la eliminan. En documentación
se descarta por separado el plan o la rúbrica confirmados. Los fallos de espacio
o almacenamiento se comunican sin impedir seguir editando.
