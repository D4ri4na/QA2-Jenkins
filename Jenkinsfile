pipeline {
    agent none
    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }
    parameters {
        booleanParam(name: 'RUN_API_PIPELINES', defaultValue: true, description: 'Ejecutar tambien Newman y Karate ya configurados en Jenkins')
        booleanParam(name: 'RUN_BROWSERSTACK', defaultValue: true, description: 'Ejecutar Appium en BrowserStack. Desactivarlo deja la entrega INCOMPLETA (UNSTABLE).')
        string(name: 'NEWMAN_JOB', defaultValue: 'Newman_Pipeline', description: 'Trabajo existente de Newman')
        string(name: 'KARATE_JOB', defaultValue: 'karate', description: 'Trabajo existente de Karate')
        string(name: 'APP_ID', defaultValue: '', description: 'App Reloj subida a BrowserStack: bs://...')
        string(name: 'APP_PATH', defaultValue: '', description: 'Opcional: ruta del APK/AAB/XAPK de Reloj en el agente para subirlo en esta ejecucion')
        string(name: 'DEVICE', defaultValue: 'Google Pixel 8', description: 'Dispositivo disponible en App Automate')
        string(name: 'ANDROID_VERSION', defaultValue: '14.0', description: 'Version Android compatible con la app y el dispositivo')
    }
    environment {
        NODEJS_HOME = 'C:\\Program Files\\nodejs'
        NODE_OPTIONS = '--use-system-ca'
        HEADLESS = 'true'
    }
    stages {
        stage('Preparar Reloj en BrowserStack') {
            when { beforeAgent true; expression { params.RUN_BROWSERSTACK } }
            agent any
            environment {
                BROWSERSTACK_APP_ID = "${params.APP_ID}"
                BROWSERSTACK_APP_PATH = "${params.APP_PATH}"
            }
            steps {
                deleteDir()
                checkout scm
                withCredentials([usernamePassword(credentialsId: 'browserstack-credentials',
                    usernameVariable: 'BROWSERSTACK_USERNAME', passwordVariable: 'BROWSERSTACK_ACCESS_KEY')]) {
                    bat '''@echo off
set "PATH=%NODEJS_HOME%;%PATH%"
if defined BROWSERSTACK_APP_PATH goto prepareApp
if defined BROWSERSTACK_APP_ID goto prepareApp
set "BROWSERSTACK_APP_PATH=C:\\ProgramData\\Jenkins\\.jenkins\\apps\\qa2-reloj\\Reloj-completo.xapk"
:prepareApp
node scripts/upload-browserstack.cjs
exit /b %errorlevel%
'''
                }
                stash name: 'reloj-browserstack', includes: 'appium/.browserstack-app.json', useDefaultExcludes: false
            }
            post {
                always {
                    archiveArtifacts artifacts: 'appium/.browserstack-app.json,appium/reports/browserstack-upload-error.json', allowEmptyArchive: true, defaultExcludes: false
                    cleanWs(deleteDirs: true, disableDeferredWipeout: true)
                }
            }
        }
        stage('Newman - pipeline de API') {
            when { expression { params.RUN_API_PIPELINES } }
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    script {
                        def run = build job: params.NEWMAN_JOB, wait: true, propagate: false
                        echo "Newman: ${run.result} - ${run.absoluteUrl}"
                        if (run.result != 'SUCCESS') { error("Newman termino con ${run.result}") }
                    }
                }
            }
        }
        stage('Karate - pipeline de API') {
            when { expression { params.RUN_API_PIPELINES } }
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    script {
                        def run = build job: params.KARATE_JOB, wait: true, propagate: false
                        echo "Karate: ${run.result} - ${run.absoluteUrl}"
                        if (run.result != 'SUCCESS') { error("Karate termino con ${run.result}") }
                    }
                }
            }
        }
        stage('WebdriverIO - Chrome') {
            agent any
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    script { if (isUnix()) { error('Selecciona un agente Windows con Node.js 24 y Chrome.') } }
                    deleteDir()
                    checkout scm
                    bat '''@echo off
set "PATH=%NODEJS_HOME%;%PATH%"
node --version
if errorlevel 1 exit /b %errorlevel%
call npm.cmd --prefix webDriveIO ci --no-audit --no-fund
if errorlevel 1 exit /b %errorlevel%
call npm.cmd --prefix webDriveIO test
exit /b %errorlevel%
'''
                }
            }
            post {
                always {
                    catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                        script {
                            if (fileExists('webDriveIO/reports/junit')) {
                                junit testResults: 'webDriveIO/reports/junit/*.xml', allowEmptyResults: false
                            } else { error('WDIO no genero resultados JUnit; revisar la instalacion o el inicio del navegador.') }
                            publishHTML(target: [allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true,
                                reportDir: 'webDriveIO/reports', reportFiles: 'index.html', reportName: 'WDIO - Reporte web'])
                        }
                    }
                }
                cleanup {
                    archiveArtifacts artifacts: 'webDriveIO/reports/**', allowEmptyArchive: true
                    cleanWs(deleteDirs: true, disableDeferredWipeout: true)
                }
            }
        }
        stage('Appium - BrowserStack') {
            when { beforeAgent true; expression { params.RUN_BROWSERSTACK } }
            agent any
            environment {
                BROWSERSTACK_APP_ID = ''
                BROWSERSTACK_APP_PATH = "${params.APP_PATH}"
                BROWSERSTACK_DEVICE = "${params.DEVICE}"
                BROWSERSTACK_OS_VERSION = "${params.ANDROID_VERSION}"
                BROWSERSTACK_BUILD_NAME = "QA2-${env.BUILD_NUMBER}"
            }
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    deleteDir()
                    checkout scm
                    unstash 'reloj-browserstack'
                    withCredentials([usernamePassword(credentialsId: 'browserstack-credentials',
                        usernameVariable: 'BROWSERSTACK_USERNAME', passwordVariable: 'BROWSERSTACK_ACCESS_KEY')]) {
                        bat '''@echo off
set "PATH=%NODEJS_HOME%;%PATH%"
call npm.cmd --prefix appium ci --no-audit --no-fund
if errorlevel 1 exit /b %errorlevel%

call npm.cmd --prefix appium test
exit /b %errorlevel%
'''
                    }
                }
            }
            post {
                always {
                    catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                        script {
                            if (fileExists('appium/reports/junit')) {
                                junit testResults: 'appium/reports/junit/*.xml', allowEmptyResults: false
                                publishHTML(target: [allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true,
                                    reportDir: 'appium/reports', reportFiles: 'index.html', reportName: 'Appium - Reporte movil'])
                            } else { error('Appium no genero resultados. Comprueba browserstack-credentials, APP_ID/APP_PATH y el plan App Automate.') }
                        }
                    }
                }
                cleanup {
                    archiveArtifacts artifacts: 'appium/.browserstack-app.json,appium/reports/**', allowEmptyArchive: true
                    cleanWs(deleteDirs: true, disableDeferredWipeout: true)
                }
            }
        }
        stage('Verificar alcance de la entrega') {
            steps {
                script {
                    if (!params.RUN_BROWSERSTACK || !params.RUN_API_PIPELINES) {
                        unstable('Ejecucion parcial: para presentar el practico deben ejecutarse Newman, Karate, WDIO y Appium en BrowserStack.')
                    }
                }
            }
        }
    }
}
