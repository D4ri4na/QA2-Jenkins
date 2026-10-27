# QA2-Jenkins · Rama wdio

Proyecto del ZIP `webDriveIO-practico4-dpa.zip`, incorporado en `webDriveIO/` y preparado para una pipeline independiente de Jenkins.

## Ejecutar localmente

Requiere Node.js 24, npm y Google Chrome. Desde la raiz del repositorio:

```powershell
cd webDriveIO
npm.cmd ci
$env:NODE_OPTIONS = '--use-system-ca'
npm.cmd test
```

Por defecto Chrome se ejecuta sin ventana (headless), adecuado para el servicio de Jenkins. Para mostrar la ventana durante una ejecucion local, configura `$env:HEADLESS = 'false'` antes de ejecutar las pruebas.

WebdriverIO gestiona el driver compatible con Chrome automaticamente. La primera ejecucion necesita acceso a Internet para descargarlo. Si Chrome no esta en una ruta habitual, indica su ejecutable mediante `CHROME_BINARY`. Para utilizar un driver propio compatible, configura `CHROMEDRIVER_PATH`.

El ejecutable incluido en el ZIP permanece localmente en `webDriveIO/drivers/`, excluido de Git. No se utiliza la ruta absoluta del proyecto original.

## Pruebas conservadas

Las cinco pruebas originales de `test/practico4.js` verifican en `the-internet.herokuapp.com`:

1. Seleccion de un checkbox.
2. Seleccion de la opcion 2 de un desplegable.
3. Agregar y eliminar un elemento.
4. Aceptar una alerta y comprobar el mensaje.
5. Mostrar la informacion de perfil al pasar el cursor.

No se omiten pruebas ni se ignoran fallos. Una prueba fallida devuelve un codigo de error. Su resultado depende de la disponibilidad de la web de practica.

## Crear la pipeline de Jenkins

Despues de publicar los cambios de esta rama:

1. Crea una nueva tarea de tipo **Pipeline**, por ejemplo `WDIO_Pipeline`.
2. Selecciona **Pipeline script from SCM** y **Git**.
3. Repositorio: `https://github.com/D4ri4na/QA2-Jenkins.git`.
4. Rama: `*/wdio` (sin `tree/`).
5. Script Path: `Jenkinsfile`.
6. Guarda y ejecuta **Construir ahora**.

El agente debe ser Windows, tener Chrome instalado y Node.js en `C:\Program Files\nodejs`. Si cambia esta ubicacion, ajusta `NODEJS_HOME` en el Jenkinsfile. Los plugins necesarios son Git, Pipeline, JUnit, HTML Publisher, Workspace Cleanup y Timestamper. Estas pruebas no necesitan el token de GoREST.

La pipeline descarga `wdio`, instala las dependencias fijadas en el lockfile, ejecuta WebdriverIO en headless, publica los reportes y limpia el workspace al finalizar.

## Reportes

- HTML: `webDriveIO/reports/index.html`, publicado como **Reporte de Pruebas WebdriverIO**.
- JUnit: `webDriveIO/reports/junit/*.xml`, visible en **Test Result**.
- JSON: `webDriveIO/reports/results.json`.
- Capturas en caso de fallo: `webDriveIO/reports/screenshots/`.

Los reportes y las dependencias quedan excluidos de Git y se archivan en cada compilacion de Jenkins antes de limpiar el espacio de trabajo. La instalacion del navegador y su driver no modifica los perfiles personales de Chrome.
