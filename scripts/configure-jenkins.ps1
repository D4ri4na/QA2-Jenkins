param(
    [string]$JenkinsUrl = 'http://localhost:8083',
    [string]$JobName = 'QA2_Integracion',
    [PSCredential]$Credential
)
$ErrorActionPreference = 'Stop'
if (!$Credential) { $Credential = Get-Credential -Message 'Usuario Jenkins y API token (en el campo de contraseña)' }
if (!$Credential) { throw 'No se proporcionaron credenciales.' }
$basic = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Credential.UserName + ':' + $Credential.GetNetworkCredential().Password))
$headers = @{ Authorization = 'Basic ' + $basic }
try {
    $root = $JenkinsUrl.TrimEnd('/')
    $crumb = Invoke-RestMethod -Uri "$root/crumbIssuer/api/json" -Headers $headers
    $headers[$crumb.crumbRequestField] = $crumb.crumb
    $pipelineFile = Join-Path $PSScriptRoot '..\Jenkinsfile'
    $validation = Invoke-RestMethod -Uri "$root/pipeline-model-converter/validate" -Method Post -Headers $headers -Body @{ jenkinsfile = (Get-Content -LiteralPath $pipelineFile -Raw) }
    if ($validation -notmatch 'Jenkinsfile successfully validated') { throw "Jenkins rechazo la pipeline: $validation" }
    Write-Output 'Jenkinsfile validado por Jenkins.'
    $jobs = Invoke-RestMethod -Uri "$root/api/json?tree=jobs[name]" -Headers $headers
    if ($jobs.jobs.name -contains $JobName) { throw "El trabajo $JobName ya existe. No se modifico." }
    $configPath = Join-Path $PSScriptRoot '..\jenkins\QA2_Integracion.xml'
    $body = [IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $configPath).Path)
    Invoke-WebRequest -Uri "$root/createItem?name=$([uri]::EscapeDataString($JobName))" -Method Post -Headers $headers -ContentType 'application/xml; charset=utf-8' -Body $body -UseBasicParsing | Out-Null
    Write-Output "Pipeline creada: $root/job/$([uri]::EscapeDataString($JobName))/"
    Write-Output 'Publica la rama wdio y configura browserstack-credentials antes de construir.'
} finally {
    $headers.Clear()
    $basic = $null
    $Credential = $null
}
