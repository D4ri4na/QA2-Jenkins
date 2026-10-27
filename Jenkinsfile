pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        JAVA_HOME = 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot'
        MAVEN_HOME = 'C:\\Users\\Usuario\\AppData\\Local\\Programs\\apache-maven-3.9.9'
    }

    stages {
        stage('Descargar codigo Karate') {
            steps {
                script {
                    if (isUnix()) {
                        error('Esta pipeline requiere un agente Windows con Java 21 y Maven 3.9.9. Ajusta JAVA_HOME y MAVEN_HOME si usas otras rutas.')
                    }
                }
                cleanWs(deleteDirs: true, disableDeferredWipeout: true)
                checkout([$class: 'GitSCM', branches: [[name: '*/karate']], userRemoteConfigs: [[url: 'https://github.com/D4ri4na/QA2-Jenkins.git']]])
            }
        }
        stage('Verificar Java y Maven') {
            steps {
                bat '''@echo off
set "PATH=%JAVA_HOME%\\bin;%MAVEN_HOME%\\bin;%PATH%"
"%JAVA_HOME%\\bin\\java.exe" -version
if errorlevel 1 exit /b %errorlevel%
call "%MAVEN_HOME%\\bin\\mvn.cmd" -version
exit /b %errorlevel%
'''
            }
        }
        stage('Ejecutar pruebas Karate') {
            steps {
                withCredentials([string(credentialsId: 'qa2-gorest-token', variable: 'GOREST_TOKEN')]) {
                    bat '''@echo off
set "PATH=%JAVA_HOME%\\bin;%MAVEN_HOME%\\bin;%PATH%"
call "%MAVEN_HOME%\\bin\\mvn.cmd" -B -ntp -f karate-prueba/pom.xml clean test
exit /b %errorlevel%
'''
                }
            }
        }
    }

    post {
        always {
            script {
                if (fileExists('karate-prueba/target/karate-reports/karate-summary.html')) {
                    junit testResults: 'karate-prueba/target/karate-reports/*.xml', allowEmptyResults: false
                } else if (currentBuild.currentResult == 'SUCCESS') {
                    error('Karate termino sin generar su reporte HTML.')
                }
            }
            archiveArtifacts artifacts: 'karate-prueba/target/karate-reports/**,karate-prueba/target/surefire-reports/**', allowEmptyArchive: true
        }
        cleanup {
            cleanWs(deleteDirs: true, disableDeferredWipeout: true)
        }
    }
}
