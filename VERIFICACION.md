# Verificacion de la entrega

Fecha de trabajo: 28 de octubre de 2026 (America/La_Paz).

## Actualizacion del 17 de noviembre de 2026

- El registro de Practico4 entregado por el usuario confirma carga de Reloj aceptada, Newman SUCCESS, Karate SUCCESS y WDIO 5/5. Appium fallo antes de ejecutar los casos por `Unknown mobile command "getCurrentPackage"` en los hooks de preparacion y limpieza.
- Se agrego compatibilidad con el endpoint HTTP `current_package` para esa respuesta concreta del servidor, manteniendo los errores reales y las aserciones de navegacion.
- `npm.cmd run check`: **20/20 comprobaciones aprobadas**, incluidas ocho regresiones de compatibilidad y doce comprobaciones de configuracion, reportes, carga y puerta de calidad. Las respuestas de BrowserStack en estas comprobaciones son simuladas.
- Newman existente sigue siendo la opcion predeterminada; las colecciones importadas son opcionales mediante USE_IMPORTED_API o Jenkinsfile.api.
- La ejecucion completa con la correccion en BrowserStack sigue pendiente. Publicar el codigo y volver a construir Practico4; el registro anterior uso `4266278`.

Las secciones siguientes conservan la evidencia historica de octubre; no describen una nueva ejecucion de BrowserStack.

## Comprobaciones realizadas

- WebdriverIO local: **5/5 casos aprobados** en Chrome 156.0.8078.48.
- Compatibilidad de alerta WebDriver clasico: **1/1 caso aprobado**. Este es el protocolo configurado para el modo web BrowserStack.
- Configuracion y reportes: **5/5 comprobaciones aprobadas** con `npm run check`.
- Sintaxis de JavaScript, PowerShell y XML de la tarea: comprobada sin errores.
- Appium local: **7/7 casos aprobados en una sola ejecucion completa**, incluida la limpieza final; codigo de salida 0.

Entorno movil de prueba: Appium 3.7.0, UiAutomator2 8.6.1, emulador Android 17 y Google Clock 9.1 (965977594), minSdk 32. La suite conserva los siete objetivos del practico 7; crea una alarma propia a las 4:17 PM para no depender de alarmas predeterminadas. Se adapto el selector de hora, la navegacion, los botones actuales del cronometro y las esperas de UiAutomator2 para contadores animados.

## Pendiente para acreditar la consigna completa

1. Crear/configurar una cuenta BrowserStack con acceso a App Automate.
2. Guardar username y access key en Jenkins como `browserstack-credentials` (Username with password).
3. Subir una version completa y compatible de Reloj y configurar APP_ID (bs://...) o APP_PATH.
4. Autenticarse en Jenkins para validar/importar el trabajo e iniciar la pipeline integrada con todas las etapas activadas.
5. Conservar el build aprobado y la sesion real de App Automate como evidencia.

No se ha ejecutado una sesion real de BrowserStack ni la pipeline integrada en Jenkins durante esta entrega: no se proporciono una cuenta BrowserStack y la API Jenkins requiere autenticacion. Los trabajos de Newman y Karate existentes no se modificaron ni se volvieron a ejecutar. Sus verificaciones historicas no se presentan como una ejecucion nueva.

Las pruebas locales no sustituyen la evidencia de BrowserStack. La pipeline devuelve fallo si faltan credenciales, app o resultados; si se desactivan etapas se marca como ejecucion parcial (UNSTABLE).

## Archivos de evidencia local

- `webDriveIO/reports/index.html` y `webDriveIO/reports/junit/*.xml`.
- `appium/reports/index.html` y `appium/reports/junit/*.xml`.

Estos archivos son resultados generados, excluidos de Git. El Jenkinsfile los publica y archiva para cada build.
