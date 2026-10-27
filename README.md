# QA2-Jenkins · Rama karate

Proyecto del ZIP `Tarea2-DPA (2).zip`, incorporado en `karate-prueba/`. Conserva Karate 1.4.1, JavaFaker 1.0.2 y los escenarios originales de usuarios, posts y comentarios de GoREST.

## Ejecutar localmente

Requiere Java 21 y Maven 3.9.9 en este equipo. El proyecto compila con nivel Java 11, como en el ZIP original.

Configura un token valido de GoREST en la variable de entorno `GOREST_TOKEN` y ejecuta desde la raiz del repositorio:

```powershell
mvn.cmd -B -ntp -f karate-prueba/pom.xml clean test
```

`ExamplesTest` ejecuta todos los features en paralelo con cinco hilos. `UsersRunner` se conserva para la ejecucion de usuarios desde el IDE; Maven selecciona `ExamplesTest` por su nombre y no ejecuta ambos runners por defecto.

## Pipeline en Jenkins

Despues de hacer push de la rama `karate`, crea un trabajo de tipo **Pipeline** (por ejemplo `Karate_Pipeline`):

1. Selecciona **Pipeline script from SCM** y **Git**.
2. URL: `https://github.com/D4ri4na/QA2-Jenkins.git`.
3. Rama: `*/karate`.
4. Script Path: `Jenkinsfile`.
5. Guarda y ejecuta **Construir ahora**.

Usa un agente Windows con Java y Maven instalados. El Jenkinsfile contiene las rutas de este equipo en `JAVA_HOME` y `MAVEN_HOME`; ajustalas si cambia la instalacion. Necesita los plugins Git, Pipeline, Credentials Binding, JUnit, Workspace Cleanup y Timestamper, y la credencial Secret text existente `qa2-gorest-token`.

La pipeline descarga la rama configurada, verifica herramientas, ejecuta Maven con el token durante las pruebas, publica resultados JUnit y archiva los reportes antes de limpiar el workspace. Una prueba fallida hace fallar la compilacion.

## Reportes

- HTML: `karate-prueba/target/karate-reports/karate-summary.html`.
- JUnit por feature: `karate-prueba/target/karate-reports/*.xml`.
- Maven/Surefire: `karate-prueba/target/surefire-reports/`.

`target/` y los archivos del IDE estan excluidos de Git. La autorizacion se configura desde el entorno; `SafeHttpLogModifier` oculta el encabezado Authorization y el token en los registros HTTP. No se incluye el ZIP ni tokens en los commits nuevos.

Los escenarios originales crean datos en la API real y no todos los eliminan. No los ejecutes contra un entorno de produccion. El resultado depende de la disponibilidad de GoREST y de la vigencia del token.

## Archivos de Newman

Los archivos de Postman y Newman heredados permanecen en esta rama para conservar el contenido anterior. El `Jenkinsfile` de esta rama ejecuta Karate. La rama `main` conserva la pipeline de Newman.
