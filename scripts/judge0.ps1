param([ValidateSet('start', 'stop', 'status')][string]$Action = 'status')
$ErrorActionPreference = 'Stop'
$compose = Join-Path $PSScriptRoot '../.local/judge0/docker-compose.yml'
if (!(Test-Path -LiteralPath $compose)) { throw "Missing local Judge0 configuration: $compose" }
switch ($Action) {
  'start' { docker compose -p judge0-v1131 -f $compose up -d }
  'stop' { docker compose -p judge0-v1131 -f $compose stop }
  'status' { docker compose -p judge0-v1131 -f $compose ps }
}
if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed ($LASTEXITCODE)" }
