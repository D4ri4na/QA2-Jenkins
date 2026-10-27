pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 10, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    environment {
        NODEJS_HOME = 'C:\\Program Files\\nodejs'
        NODE_OPTIONS = '--use-system-ca'
    }

    stages {
        stage('Descargar codigo') {
            steps {
                script {
                    if (isUnix()) {
                        error('Esta pipeline usa un agente Windows con Node.js 24 instalado. Asigna el trabajo a ese agente.')
                    }
                }
                cleanWs(deleteDirs: true, disableDeferredWipeout: true)
                checkout scm
            }
        }

        stage('Verificar herramientas') {
            steps {
                bat '''@echo off
set "PATH=%NODEJS_HOME%;%PATH%"
"%NODEJS_HOME%\\node.exe" --version
if errorlevel 1 exit /b %errorlevel%
call "%NODEJS_HOME%\\npm.cmd" --version
exit /b %errorlevel%
'''
            }
        }

        stage('Instalar dependencias') {
            steps {
                bat '''@echo off
set "PATH=%NODEJS_HOME%;%PATH%"
call "%NODEJS_HOME%\\npm.cmd" ci --no-audit --no-fund
exit /b %errorlevel%
'''
            }
        }

        stage('Ejecutar pruebas Newman') {
            steps {
                withCredentials([string(credentialsId: 'qa2-gorest-token', variable: 'GOREST_TOKEN')]) {
                    bat '''@echo off
set "PATH=%NODEJS_HOME%;%PATH%"
call "%NODEJS_HOME%\\npm.cmd" test
exit /b %errorlevel%
'''
                }
            }
        }
    }

    post {
        always {
            script {
                if (fileExists('reports/junit.xml')) {
                    junit testResults: 'reports/junit.xml', allowEmptyResults: false
                } else if (currentBuild.currentResult == 'SUCCESS') {
                    error('Newman termino sin generar reports/junit.xml.')
                }
            }
            archiveArtifacts artifacts: 'reports/*.html,reports/*.json,reports/*.xml', allowEmptyArchive: true
        }
        cleanup {
            cleanWs(deleteDirs: true, disableDeferredWipeout: true)
        }
    }
}
