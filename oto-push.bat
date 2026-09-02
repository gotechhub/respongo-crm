@echo off
setlocal enabledelayedexpansion

set "REPO=D:\Claude\Projeler\respongo-crm\v2-26-08-2026"
set "LOG=%REPO%\oto-push-log.txt"

cd /d "%REPO%" 2>nul
if errorlevel 1 (
    exit /b 1
)

rem Log dosyasi HICBIR ZAMAN commit edilmemeli - yoksa her calismada
rem (kod degismese bile) yeni bir commit+deploy tetiklenir. .gitignore'a
rem ekle (yoksa) ve daha once yanlislikla commit edilmisse index'ten cikar.
if not exist ".gitignore" (
    echo oto-push-log.txt> .gitignore
) else (
    findstr /x /c:"oto-push-log.txt" .gitignore >nul 2>&1
    if errorlevel 1 echo oto-push-log.txt>> .gitignore
)
git rm --cached oto-push-log.txt >nul 2>&1

echo. >> "%LOG%"
echo ==== %date% %time% ==== >> "%LOG%"

git add -A >> "%LOG%" 2>&1

git diff --cached --quiet
if %errorlevel%==0 (
    echo Degisiklik yok - commit atlandi. >> "%LOG%"
) else (
    git commit -m "Otomatik kayit - %date% %time%" >> "%LOG%" 2>&1
    git push >> "%LOG%" 2>&1
)

echo Tamamlandi. >> "%LOG%"
endlocal
