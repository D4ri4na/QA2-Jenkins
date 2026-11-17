# Practico 4 del bloque 2 - Integracion de pipelines

## API importada de practico3_jenkinsfile

Se incorporaron las colecciones y herramientas de [arianylopez/jenkins-QA, rama practico3_jenkinsfile](https://github.com/arianylopez/jenkins-QA/tree/practico3_jenkinsfile), commit `9d676c6fb5613e24afbb966921c37667d4bc958d`, conservando WDIO y Appium de esta rama.

El `Jenkinsfile` conserva por defecto el trabajo `Newman_Pipeline` existente, que ya aprobo en Jenkins. Para ejecutar las colecciones importadas en el mismo checkout, activar **USE_IMPORTED_API**: smoke (3 solicitudes), regresion CRUD (15) y negativas (4), con dashboard, JUnit y puerta de calidad. Karate sigue usando su trabajo existente.

Para USE_IMPORTED_API o Jenkinsfile.api, crear en Jenkins una credencial **Secret text** con ID **qa2-gorest-token** y un token valido de GoREST. La ejecucion predeterminada conserva las credenciales del trabajo Newman existente. El token exportado en el repositorio de origen no se copia: el environment queda sin secreto y el ejecutor lo inyecta en memoria. Se usa Newman instalado por `npm ci`, sin rutas del perfil de Ariany.

Para ejecutar solo API, configurar una Pipeline desde SCM con este repositorio, rama `*/wdio` y Script Path **Jenkinsfile.api**. Incluye los parametros originales `MODO`, `PRUEBAS_NEGATIVAS`, `MAX_PROMEDIO_MS`, `MAX_P95_MS` y `SIMULAR_FALLO`. Localmente, con `GOREST_TOKEN` ya definido en el entorno:

```powershell
npm.cmd ci --no-audit --no-fund
npm.cmd run test:api
```

`npm test` ejecuta la misma suite API. Los resultados estan en `reports/QA_Dashboard.html`, `reports/QA_Resumen.json` y `reports/*.xml`. El dashboard rechaza reportes ausentes, pruebas fallidas y latencias superiores al limite. Los JSON intermedios solo contienen metricas y se eliminan al generar el dashboard.

La pipeline integrada conserva los requisitos de BrowserStack descritos abajo. El registro del 17 de noviembre confirma que Reloj ya pudo cargarse y abrir una sesion; la seccion final documenta el fallo de compatibilidad posterior. `Jenkinsfile.api` permite ejecutar la API independientemente.

Rama **wdio** de `https://github.com/D4ri4na/QA2-Jenkins`.

La consigna pide integrar las pipelines vistas en clase y agregar pruebas WebdriverIO y el proyecto Appium usando BrowserStack. Esta entrega incorpora la suite web del practico 4 y la app Reloj del practico 7. Los originales moviles se conservan en `appium/original/` como referencia; solo `appium/test/` se ejecuta.

## Que ejecuta Jenkins

| Etapa | Implementacion | Resultado |
| --- | --- | --- |
| API Newman | Trabajo existente, o colecciones importadas con USE_IMPORTED_API | Resultado del trabajo hijo, o QA Dashboard y JUnit |
| API Karate | Invoca `karate` existente | Enlace y resultado del trabajo hijo |
| WebdriverIO | Cinco pruebas con Chrome headless | HTML, JUnit, JSON y capturas en fallos |
| Appium + BrowserStack | Pruebas de Reloj en Android real remoto | HTML, JUnit, JSON; video y sesion en BrowserStack |

El `Jenkinsfile` principal es la integracion completa. `Jenkinsfile.web` conserva la pipeline web independiente y `Jenkinsfile.api` ejecuta solo las colecciones Newman importadas. La opcion USE_IMPORTED_API usa la credencial `qa2-gorest-token`; los trabajos Newman y Karate existentes conservan sus credenciales. La pipeline no ocupa un ejecutor mientras espera a los trabajos hijos. Los fallos de las suites se propagan y las etapas siguientes siguen ejecutandose; un fallo en la preparacion inicial de BrowserStack detiene la pipeline. Una ejecucion que desactiva API o BrowserStack se marca **UNSTABLE / parcial**.

## Requisitos

- Agente Jenkins Windows; Jenkins en `http://localhost:8083`.
- Node.js 24 en `C:\Program Files\nodejs` y npm. Ajustar `NODEJS_HOME` si corresponde.
- Google Chrome instalado en el agente para WDIO local.
- Plugins Jenkins: Pipeline, Git, Credentials Binding, JUnit, HTML Publisher, Workspace Cleanup, Timestamper.
- Trabajos `Newman_Pipeline` y `karate` funcionando. La credencial Secret text `qa2-gorest-token` solo se necesita al activar USE_IMPORTED_API o ejecutar Jenkinsfile.api.
- Cuenta BrowserStack con acceso y minutos de **App Automate**, username y access key.
- Una version instalable y compatible de **Google Clock / Reloj**, paquete `com.google.android.deskclock`, para subir a BrowserStack.

No basta con tener la app preinstalada en tu emulador: BrowserStack necesita la app subida. No se reemplaza el proyecto de Reloj por una aplicacion de ejemplo para aparentar que aprobo. La version de la app, su interfaz y los selectores deben coincidir con la version probada. La ejecucion local no acredita una ejecucion en BrowserStack.

## Ejecutar web localmente

Desde la raiz:

```powershell
npm.cmd --prefix webDriveIO ci --no-audit --no-fund
$env:NODE_OPTIONS = '--use-system-ca'
npm.cmd run test:web
```

Chrome se inicia en headless. Para mostrarlo, usar `$env:HEADLESS = 'false'`. Se admiten `CHROME_BINARY` y `CHROMEDRIVER_PATH` si el agente requiere rutas especificas. Los cinco casos verifican checkbox, dropdown, agregar/eliminar elementos, alerta JavaScript y hover de perfil en `the-internet.herokuapp.com`.

## Configurar BrowserStack sin guardar claves en Git

1. Crear o iniciar sesion en BrowserStack y abrir **App Automate**.
2. Copiar el username y access key desde las preferencias de la cuenta.
3. En Jenkins: **Administrar Jenkins > Credentials > System > Global credentials > Add Credentials**.
4. Tipo **Username with password**. Username: el de BrowserStack. Password: access key. ID exacto: **browserstack-credentials**.
5. Subir el APK/AAB/XAPK de la app Reloj a App Automate. Guardar el `app_url` que empieza por `bs://`.
6. Al construir la pipeline, indicar ese valor en **APP_ID**. Alternativamente, indicar en **APP_PATH** una ruta del archivo de la app en el agente Jenkins: se subira automaticamente antes de las pruebas.
7. Elegir **DEVICE** y **ANDROID_VERSION** compatibles y disponibles en la cuenta. Los valores iniciales son Google Pixel 8 / Android 14.0; deben verificarse con tu version de Reloj.

`withCredentials` inyecta las claves y Jenkins las oculta en la consola. No escribirlas en Jenkinsfile, GitHub, README ni en capturas. La ruta APP_PATH debe pertenecer al agente que ejecuta la etapa; no es una ruta del navegador ni una ruta de tu equipo si el agente es remoto.

La app instalada en el emulador puede estar dividida en `base.apk` y otros APK de recursos. **No subir solo base.apk si necesita splits**: conseguir un APK universal, un AAB o XAPK completo compatible. No se incluye un APK de terceros ni claves de acceso en el repositorio.

## Reloj instalado directamente en este Jenkins

El paquete completo extraido del emulador esta instalado en:

```text
C:\ProgramData\Jenkins\.jenkins\apps\qa2-reloj\Reloj-completo.xapk
```

En Practico4 puedes dejar **APP_ID** y **APP_PATH** vacios: la etapa movil usa este archivo del agente Windows y lo sube a BrowserStack con la credencial `browserstack-credentials`. Una ruta explicita en APP_PATH tiene prioridad; si solo indicas APP_ID, se usa la app ya subida. En otros agentes debes indicar su propio APP_PATH o APP_ID.

El artefacto `appium/.browserstack-app.json` conserva el APP_ID devuelto por BrowserStack, incluso si las pruebas posteriores fallan. El binario no se publica en Git.

## Appium en BrowserStack desde la terminal

Configurar las variables de credenciales de forma privada en la terminal. El repositorio no carga archivos `.env` automaticamente; `.env.example` solo documenta nombres.

```powershell
npm.cmd --prefix appium ci --no-audit --no-fund
$env:NODE_OPTIONS = '--use-system-ca'
# BROWSERSTACK_USERNAME y BROWSERSTACK_ACCESS_KEY deben existir en el entorno.
npm.cmd run upload:app -- 'C:\apps\reloj.apk'
npm.cmd run test:mobile
```

El upload guarda el identificador en `appium/.browserstack-app.json`, excluido de Git. Se puede omitir el upload si ya se configuro `BROWSERSTACK_APP_ID=bs://...`. No se necesita iniciar un servidor Appium local para BrowserStack.

Variables opcionales: `BROWSERSTACK_DEVICE`, `BROWSERSTACK_OS_VERSION`, `BROWSERSTACK_BUILD_NAME`, `BROWSERSTACK_APPIUM_VERSION`. Se utiliza HTTPS, `/wd/hub`, UiAutomator2 y una sola sesion simultanea. La sesion se marca passed/failed al finalizar. Video y depuracion estan habilitados; aparecen en el panel de App Automate.

WDIO web tambien puede ejecutarse en BrowserStack (requiere el producto Automate):

```powershell
npm.cmd run test:web:browserstack
```

La pipeline principal ejecuta la web en Chrome local y la app en BrowserStack, como integracion requerida. El modo web remoto es adicional.

## Appium local en Android

Se necesita Android SDK, Java, Appium y UiAutomator2. En este equipo ya estaban instalados Appium 3.7.0 y UiAutomator2 8.6.1. Para otro equipo seguir las instrucciones oficiales compatibles con sus versiones.

1. Iniciar el emulador y esperar a que Android termine de arrancar.
2. Verificar `adb devices`: debe mostrar un dispositivo en estado `device`.
3. Instalar y abrir Reloj en el emulador.
4. En una terminal: `appium --address 127.0.0.1 --port 4723`.
5. En otra terminal:

```powershell
npm.cmd --prefix appium ci --no-audit --no-fund
$env:ANDROID_DEVICE = 'emulator-5554'
npm.cmd run test:mobile:local
```

`APPIUM_PORT` permite cambiar el puerto local. Se usa `noReset` para conservar los datos existentes del emulador; la suite crea y elimina su propia alarma, elimina su temporizador y reinicia el cronometro. La Paz queda agregada al Reloj Mundial como resultado del ejercicio. Usar un emulador dedicado de QA, no un telefono con alarmas personales.

## Crear la pipeline integrada

Primero publicar los cambios de la rama `wdio` en el remoto; Jenkins descarga lo publicado, no los cambios locales sin commit.

1. Crear un trabajo **Pipeline** llamado `QA2_Integracion`.
2. Elegir **Pipeline script from SCM > Git**.
3. URL: `https://github.com/D4ri4na/QA2-Jenkins.git`.
4. Rama: `*/wdio`.
5. Script Path: `Jenkinsfile`.
6. Guardar. En **Build with Parameters**, mantener activas API y BrowserStack e indicar APP_ID o APP_PATH.
7. Revisar que las cuatro etapas aprueben, los reportes y los trabajos hijos.

Como alternativa, `jenkins/QA2_Integracion.xml` contiene la definicion importable por Jenkins. `scripts/configure-jenkins.ps1` valida el Jenkinsfile con Jenkins y crea ese trabajo mediante la API autenticada. Solicita un usuario y API token de Jenkins. No modifica trabajos existentes ni lanza compilaciones automaticamente.

Para la pipeline solo web, usar `Jenkinsfile.web`. Se conserva el trabajo `wdio` existente; la integracion se configura como un trabajo aparte para que no se llame a si misma.

## Resultados y evidencia

| Suite | HTML | JUnit |
| --- | --- | --- |
| Web | `webDriveIO/reports/index.html` | `webDriveIO/reports/junit/*.xml` |
| Movil | `appium/reports/index.html` | `appium/reports/junit/*.xml` |

Los directorios `reports/` contienen tambien JSON, logs y capturas de fallos. Estan excluidos de Git. Jenkins los archiva antes de limpiar el workspace. Los resultados antiguos se limpian al empezar cada suite para no presentar evidencia de otra ejecucion. Una ejecucion sin pruebas se considera fallida.

Para presentar: mostrar el build integrado con cuatro etapas aprobadas, los resultados Newman/Karate, los cinco casos WDIO, los casos Appium y su sesion real con video en BrowserStack. Una cuenta sin acceso App Automate, un APK incompatible o credenciales ausentes impiden completar esa evidencia; no se sustituyen por resultados simulados.

Comprobaciones de configuracion y reportes:

```powershell
npm.cmd run check
```

El estado de las verificaciones realizadas esta documentado en `VERIFICACION.md`.

## Fuentes oficiales

- [WebdriverIO y BrowserStack App Automate](https://www.browserstack.com/docs/app-automate/appium/getting-started/nodejs/webdriverio)
- [Especificar la app subida](https://www.browserstack.com/docs/app-automate/appium/set-up-tests/specify-app)
- [Subir una aplicacion desde el equipo](https://www.browserstack.com/docs/app-automate/appium/upload-app-from-filesystem)
- [Capacidades de WebdriverIO](https://www.browserstack.com/docs/app-automate/appium/wdio-browserstack-capabilities)
- [Jenkins Credentials Binding](https://www.jenkins.io/doc/pipeline/steps/credentials-binding/)

### Carga de Reloj antes de las pruebas

La primera etapa prepara Reloj en BrowserStack. Con APP_ID y APP_PATH vacios usa la copia instalada en `C:\ProgramData\Jenkins\.jenkins\apps\qa2-reloj\Reloj-completo.xapk`. Si la carga falla, la ejecucion termina antes de lanzar Newman, Karate y WDIO. El error del proveedor se conserva sin credenciales en el artefacto `appium/reports/browserstack-upload-error.json`. Si funciona, el identificador se comparte con Appium y se archiva en `appium/.browserstack-app.json`.

El paquete local se reconstruyo con `min_sdk_version: 32`, leido del manifiesto del APK original. Sus dos APK conservan sus firmas y contenido. La aceptacion en BrowserStack y la ejecucion movil deben comprobarse en una ejecucion real de Jenkins; las pruebas del cargador simulan respuestas HTTP para verificar el tratamiento de errores.
### APK completo de Reloj (correccion del rechazo 422)

La ejecucion 6 confirmo `BROWSERSTACK_UNPROCESSABLE_ENTITY` al cargar el XAPK. Se extrajo entonces el APK completo de fabrica `app/PrebuiltDeskClockGoogle/PrebuiltDeskClockGoogle.apk` de la particion product de la imagen oficial del SDK Android, sin arrancar ni modificar el emulador. Es Google Clock 7.5 (563137996), versionCode 76002074, minSdk 23 y targetSdk 33. Contiene su codigo DEX, no requiere splits ni contiene bibliotecas nativas de una arquitectura concreta. Sus firmas v2/v3 originales verifican para Android 7 o posterior; el dispositivo configurado usa Android 14.

Jenkins ahora usa `C:\ProgramData\Jenkins\.jenkins\apps\qa2-reloj\Reloj-completo.apk` al dejar vacios APP_ID y APP_PATH. SHA256: `f59213f5e16f032f739e341df6a3dcc016c6027aecd3ed52992a045b493a0bb7`. Se mantienen selectores alternativos para las pantallas de Reloj 7.5 y 9.1. La carga y la suite completa de esta version aun requieren validacion real en BrowserStack; las comprobaciones de configuracion no sustituyen esa ejecucion.
### Diagnostico confirmado tras la ejecucion 7

La ejecucion 7 (commit 3a5a62b) volvio a recibir HTTP 422 `BROWSERSTACK_UNPROCESSABLE_ENTITY` al cargar el APK completo. Por tanto, cambiar de XAPK a APK no resolvio el rechazo. La cuenta mostraba 100 de 100 minutos disponibles. La carga por URL de la app oficial WikipediaSample.apk desde App Management fue aceptada; se utilizo exclusivamente como control y NO sustituye a Reloj en las pruebas ni al APP_ID del pipeline.

La FAQ oficial de BrowserStack atribuye este codigo a minutos de prueba agotados para la app o a una marca de su sistema de deteccion de abuso: https://www.browserstack.com/support/faq/app-automate/common-errors/browserstack_unprocessable_entity-error-during-app-upload. No se puede determinar cual de esas condiciones aplica a Reloj desde el mensaje generico recibido. El saldo general de la cuenta no demuestra que la app este habilitada. Se requiere revision del proveedor antes de afirmar que la integracion movil funciona. No se han cambiado paquetes ni firmas para eludir ese control y no se ha desactivado Appium para presentar un resultado aprobado.

### Correccion del fallo Appium del 17 de noviembre de 2026

El registro de Practico4 proporcionado ese dia confirma que la carga de Reloj ya fue aceptada, Newman y Karate aprobaron, y las cinco pruebas web aprobaron. Appium abrio una sesion real pero fallo en los hooks inicial y final: el servidor respondio `Unknown mobile command "getCurrentPackage"`. Esa ejecucion uso el commit antiguo `4266278`.

`appium/support/android-compat.cjs` mantiene el comando moderno y, solo ante ese mensaje concreto, consulta el endpoint HTTP [current_package de Appium](https://appium.github.io/appium.io/docs/en/commands/device/activity/current-package/), disponible en WDIO como `appiumGetCurrentPackage`. Los errores de red, de sesion o del endpoint alternativo siguen haciendo fallar las pruebas. No se omiten casos ni se simula una aprobacion.

`npm.cmd run check` incluye ocho pruebas de regresion de esta compatibilidad y doce comprobaciones de configuracion, reportes y puerta de calidad. Despues de publicar, volver a ejecutar Practico4 y comprobar que el checkout usa el commit nuevo. Mantener RUN_API_PIPELINES y RUN_BROWSERSTACK activados, y USE_IMPORTED_API desactivado para conservar el trabajo Newman que ya aprobo. La suite movil completa debe validarse de nuevo en BrowserStack; las pruebas de regresion locales no equivalen a esa ejecucion.

### Selectores corregidos tras Practico4, build 9

El build 9 ya supero el fallo de protocolo y ejecuto los siete casos moviles: dos aprobaron y cinco fallaron. Las capturas y XML archivados confirman que la alarma de 16:17 se creo correctamente dentro de `alarm_card_layout`. La suite ahora reconoce ese contenedor y `alarm_card`, valida la hora usando el reloj y su descripcion, y no confunde 14:17 con 4:17.

El temporizador usa `play_pause` y `tertiary_button` en Reloj 7.5. Se elimino el fallback al FAB al pausar porque ese boton agrega otro temporizador. Se conserva la comprobacion de estado pausado y la eliminacion con regreso a la pantalla de configuracion. Las variantes modernas siguen soportadas.

`npm.cmd run check`: **28/28 comprobaciones aprobadas**. El XPath tambien se verifico directamente sobre el XML real del fallo: encuentra una unica alarma, de 16:17. Esto verifica los selectores y la logica local; la ejecucion completa en BrowserStack requiere reconstruir Practico4 con el nuevo commit.
