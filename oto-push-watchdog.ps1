# Respongo CRM - watcher'in hala calisip calismadigini SESSIZCE
# (pencere acmadan, git'e dokunmadan) kontrol eder; calismiyorsa
# tekrar baslatir. Bu, bilgisayar yeniden baslatilmadan watcher'in
# herhangi bir sebeple (orn. bir hata sonucu) durmasina karsi bir
# guvenlik agidir. Gorev Zamanlayici'da 15 dakikada bir calisir ama
# yaptigi tek sey bir "process calisiyor mu" kontrolu - git/commit/push
# ile hicbir ilgisi yok, gorunur hicbir sey acmaz.

$repo = "D:\Claude\Projeler\respongo-crm\v2-26-08-2026"
$lockFile = Join-Path $repo ".oto-push-watcher.lock"
$vbs = Join-Path $repo "oto-push-launch.vbs"

$running = $false
if (Test-Path $lockFile) {
    $existingPid = Get-Content $lockFile -ErrorAction SilentlyContinue
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
        $running = $true
    }
}

if (-not $running) {
    Start-Process "wscript.exe" -ArgumentList "`"$vbs`"" -WindowStyle Hidden
}
