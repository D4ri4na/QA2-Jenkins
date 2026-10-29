pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
    }

    environment {
        NODEJS_HOME = 'C:\\Program Files\\nodejs'
        NODE_OPTIONS = '--use-system-ca'
        HEADLESS = 'true'
    }

    stages {
        stage('Preparar Workspace') {
            steps {
                echo 'Limpiando workspace...'
                deleteDir()
            }
        }
        stage('Checkout') {
            steps {
                git branch: 'wdio', url: 'https://github.com/D4ri4na/QA2-Jenkins.git'
            }
        }
        stage('Instalar dependencias') {
            steps {
                dir('webDriveIO') {
                    bat '''@echo off
set "PATH=%NODEJS_HOME%;%PATH%"
call "%NODEJS_HOME%\\npm.cmd" ci --no-audit --no-fund
exit /b %errorlevel%
'''
                }
            }
        }
        stage('Ejecutar WDIO') {
            steps {
                echo 'Ejecutando pruebas WDIO...'
                dir('webDriveIO') {
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
                if (fileExists('webDriveIO/reports/junit')) {
                    junit testResults: 'webDriveIO/reports/junit/*.xml', allowEmptyResults: false
                }
                if (fileExists('webDriveIO/reports/index.html')) {
                    publishHTML(target: [
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'webDriveIO/reports',
                        reportFiles: 'index.html',
                        reportName: 'Reporte de Pruebas WebdriverIO'
                    ])
                } else if (currentBuild.currentResult == 'SUCCESS') {
                    error('WebdriverIO termino sin generar su reporte HTML.')
                }
            }
            archiveArtifacts artifacts: 'webDriveIO/reports/**', allowEmptyArchive: true
            echo 'Pipeline finalizada'
        }
        cleanup {
            cleanWs(deleteDirs: true, disableDeferredWipeout: true)
        }
    }
}
