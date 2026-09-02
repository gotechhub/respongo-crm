@echo off
setlocal enabledelayedexpansion

set "REPO=D:\Claude\Projeler\respongo-crm\v2-26-08-2026"
set "LOG=%REPO%\oto-push-log.txt"

cd /d "%REPO%" 2>nul
if errorlevel 1 (
    echo [%date% %time%] HATA: Repo klasoru bulunamadi: %REPO% >> "%LOG%"
    exit /b 1
)

echo. >> "%LOG%"
echo ==== %date% %time% ==== >> "%LOG%"

git add -A >> "%LOG%" 2>&1

git diff --cached --quiet
if %errorlevel%==0 (
    echo Degisiklik yok - commit atlandi. >> "%LOG%"
) else (
    git commit -m "Otomatik kayit - %date% %time%" >> "%LOG%" 2>&1
)

git push >> "%LOG%" 2>&1

echo Tamamlandi. >> "%LOG%"
endlocal
