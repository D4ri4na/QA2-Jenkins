# QA2-Jenkins · Pipeline de pruebas API

Práctico 3, bloque 2: integración de una pipeline que ejecuta las pruebas de GoREST en Jenkins. La configuración se guarda en `Jenkinsfile` y se descarga desde GitHub en cada ejecución.

## Qué hace la pipeline

1. Limpia el espacio de trabajo y descarga la revisión del repositorio que corresponde a la compilación.
2. Verifica Node.js y npm en el agente Windows.
3. Instala las versiones fijadas en `package-lock.json` mediante `npm ci`.
4. Ejecuta Newman con el token de GoREST proporcionado por Jenkins.
5. Publica los resultados JUnit y archiva los reportes HTML, JSON y XML, incluso cuando fallan las pruebas.
6. Limpia el espacio de trabajo al terminar. Los reportes quedan guardados en la compilación de Jenkins.

Una prueba fallida devuelve un código de error y hace fallar la compilación. No se omiten comprobaciones ni se ignoran errores para obtener un resultado verde. La pipeline tiene un tiempo máximo de 10 minutos y evita ejecuciones simultáneas del mismo trabajo.

## Requisitos

- Jenkins con un agente Windows, Git y Java compatibles con la instalación.
- Node.js 24 y npm instalados en `C:\Program Files\nodejs`. Si usas otra ubicación, cambia `NODEJS_HOME` en `Jenkinsfile`.
- Plugins Git, Pipeline (incluido Declarative), Credentials Binding, JUnit, Workspace Cleanup y Timestamper.
- Credencial de tipo **Secret text**, con ID `qa2-gorest-token`, que contenga un token válido de GoREST y esté disponible para el trabajo.

Se utiliza `--use-system-ca` para verificar HTTPS con los certificados de confianza de Windows. La validación de certificados permanece activa.

## Configurar Jenkins después del commit y push

El trabajo anterior `Newman_Example` es de estilo libre. Para mostrar las etapas de esta pipeline, crea un trabajo de tipo **Pipeline**, por ejemplo `Newman_Pipeline`:

1. Abre **Nueva tarea**, escribe el nombre y selecciona **Pipeline**.
2. En la sección **Pipeline**, elige **Pipeline script from SCM**.
3. Selecciona **Git** e ingresa `https://github.com/D4ri4na/QA2-Jenkins.git`.
4. En **Branch Specifier**, escribe `*/main`.
5. En **Script Path**, escribe `Jenkinsfile` (está en la raíz del repositorio).
6. Guarda y selecciona **Construir ahora**.

El repositorio público no necesita credenciales de Git para descargarlo. La credencial `qa2-gorest-token` autentica las peticiones a GoREST; la pipeline la vincula a `GOREST_TOKEN` únicamente durante las pruebas. No escribas el token dentro del Jenkinsfile.

Si hay varios agentes, asigna el trabajo a uno de Windows con Node.js instalado; esta pipeline utiliza comandos de Windows. En una instalación con un único agente Windows puede usarse tal como está.

## Resultados para la presentación

En la compilación de Jenkins revisa:

- **Etapas**: descarga, herramientas, dependencias y pruebas Newman.
- **Console Output**: peticiones, comprobaciones y resultado final.
- **Test Result**: resultados JUnit, incluidos los fallos si existen.
- **Artifacts**: `reports/Newman_Report.html`, `reports/summary.json` y `reports/junit.xml`.

La colección actual contiene **13 peticiones y 32 comprobaciones**. Crea un usuario, modifica sus datos, crea su post y comentario, valida sus relaciones y elimina los recursos creados. Los IDs se obtienen durante cada ejecución; no depende de datos de una sesión anterior. Se conservan los códigos HTTP esperados y el límite de 2000 ms de PATCH. La disponibilidad, la latencia y el token de la API real pueden afectar el resultado.

## Ejecutar localmente

Con Node.js 24, configura `GOREST_TOKEN` en el entorno de tu terminal y ejecuta desde la raíz del repositorio:

```powershell
npm.cmd ci
npm.cmd test
```

Se generan los mismos reportes dentro de `reports/`, carpeta excluida de Git.

## Dependencias y credenciales

El generador HTML 1.0.5 declara una dependencia antigua de Newman; `.npmrc` permite instalarlo con Newman 6.2.3, combinación utilizada por el proyecto. El reporte HTML usa una plantilla que no incluye tokens, cabeceras de autenticación ni el entorno exportado.

El archivo de entorno versionado tiene el token vacío. Si el token publicado en el historial anterior todavía no se rotó, renúevalo en GoREST y actualiza su valor en la credencial de Jenkins.
