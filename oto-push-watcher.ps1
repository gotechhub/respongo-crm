# Respongo CRM - Olay tabanli otomatik push (DERS 32)
#
# ESKI YONTEMDEN FARKI: Windows Gorev Zamanlayici artik her 3 dakikada
# bir bu klasoru "yoklamiyor" (polling). Bunun yerine bu script ARKA
# PLANDA surekli calisan TEK bir islem olarak baslatilir ve Windows'un
# kendi dosya sistemi bildirim mekanizmasini (FileSystemWatcher)
# dinler - yani klasorde GERCEKTEN bir dosya degismeden hicbir sey
# yapmaz, hicbir pencere acmaz, hicbir islem baslatmaz. Bir dosya
# degistiginde (Claude bir seyi kaydettiginde) ~20 saniye bekleyip
# (ayni anda gelen birden fazla dosyayi TEK commit'te toplamak icin)
# otomatik commit+push yapar.
#
# Bu script sadece Windows'ta zaten yerlesik olarak bulunan PowerShell
# ve .NET FileSystemWatcher kullanir - hicbir ek program/eklenti
# kurulumu gerekmez.

$ErrorActionPreference = "SilentlyContinue"
$repo = "D:\Claude\Projeler\respongo-crm\v2-26-08-2026"
$lockFile = Join-Path $repo ".oto-push-watcher.lock"
$logFile = Join-Path $repo "oto-push-watcher-log.txt"
$debounceSeconds = 20

function Write-Log($msg) {
    $ts = Get-Date -Format "dd.MM.yyyy HH:mm:ss"
    "[$ts] $msg" | Out-File -FilePath $logFile -Append -Encoding utf8
}

# --- Ayni anda birden fazla kopya calismasin (cift push'u engelle) ---
if (Test-Path $lockFile) {
    $oldPid = Get-Content $lockFile -ErrorAction SilentlyContinue
    if ($oldPid -and (Get-Process -Id $oldPid -ErrorAction SilentlyContinue)) {
        exit 0  # zaten calisan bir kopya var, cik
    }
}
$PID | Out-File -FilePath $lockFile -Force

Write-Log "Watcher baslatildi (PID $PID)."

Set-Location $repo

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repo
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]'LastWrite, FileName, DirectoryName, Size'
$watcher.EnableRaisingEvents = $true

$global:lastChangeAt = $null

$onChange = {
    $changedPath = $Event.SourceEventArgs.FullPath
    # git/node_modules/.next/log/lock gibi gurultulu yollari yoksay -
    # bunlar Claude'un yazdigi gercek kod degil, arac/derleme artiklari.
    if ($changedPath -match '\\\.git(\\|$)' -or
        $changedPath -match '\\node_modules(\\|$)' -or
        $changedPath -match '\\\.next(\\|$)' -or
        $changedPath -like '*oto-push-watcher-log.txt*' -or
        $changedPath -like '*.oto-push-watcher.lock*') {
        return
    }
    $global:lastChangeAt = Get-Date
}

Register-ObjectEvent $watcher Changed -Action $onChange | Out-Null
Register-ObjectEvent $watcher Created -Action $onChange | Out-Null
Register-ObjectEvent $watcher Deleted -Action $onChange | Out-Null
Register-ObjectEvent $watcher Renamed -Action $onChange | Out-Null

try {
    while ($true) {
        Start-Sleep -Seconds 5
        if ($global:lastChangeAt -and ((Get-Date) - $global:lastChangeAt).TotalSeconds -ge $debounceSeconds) {
            $global:lastChangeAt = $null
            Set-Location $repo
            git add -A 2>&1 | Out-Null
            git diff --cached --quiet
            if ($LASTEXITCODE -ne 0) {
                $ts = Get-Date -Format "dd.MM.yyyy HH:mm:ss"
                git commit -m "Otomatik kayit - $ts" 2>&1 | Out-Null
                git push 2>&1 | Out-Null
                Write-Log "Degisiklik algilandi, commit+push gonderildi."
            }
        }
    }
} finally {
    Remove-Item $lockFile -ErrorAction SilentlyContinue
}
