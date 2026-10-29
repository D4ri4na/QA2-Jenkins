# Practico 4 del bloque 2 - Integracion de pipelines

Rama **wdio** de `https://github.com/D4ri4na/QA2-Jenkins`.

La consigna pide integrar las pipelines vistas en clase y agregar pruebas WebdriverIO y el proyecto Appium usando BrowserStack. Esta entrega incorpora la suite web del practico 4 y la app Reloj del practico 7. Los originales moviles se conservan en `appium/original/` como referencia; solo `appium/test/` se ejecuta.

## Que ejecuta Jenkins

| Etapa | Implementacion | Resultado |
| --- | --- | --- |
| API Newman | Invoca `Newman_Pipeline` existente | Enlace y resultado del trabajo hijo |
| API Karate | Invoca `karate` existente | Enlace y resultado del trabajo hijo |
| WebdriverIO | Cinco pruebas con Chrome headless | HTML, JUnit, JSON y capturas en fallos |
| Appium + BrowserStack | Pruebas de Reloj en Android real remoto | HTML, JUnit, JSON; video y sesion en BrowserStack |

El `Jenkinsfile` principal es la integracion completa. `Jenkinsfile.web` conserva la pipeline web independiente anterior. Los trabajos de API conservan su configuracion y sus credenciales de GoREST. La pipeline no ocupa un ejecutor mientras espera a los trabajos hijos, evitando bloquear Jenkins con pocos ejecutores. Los fallos se propagan y las otras suites siguen ejecutandose. Una ejecucion que desactiva API o BrowserStack se marca **UNSTABLE / parcial**, nunca como entrega completa aprobada.

## Requisitos

- Agente Jenkins Windows; Jenkins en `http://localhost:8083`.
- Node.js 24 en `C:\Program Files\nodejs` y npm. Ajustar `NODEJS_HOME` si corresponde.
- Google Chrome instalado en el agente para WDIO local.
- Plugins Jenkins: Pipeline, Git, Credentials Binding, JUnit, HTML Publisher, Workspace Cleanup, Timestamper.
- Trabajos `Newman_Pipeline` y `karate` funcionando. Sus nombres se pueden cambiar en los parametros.
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
