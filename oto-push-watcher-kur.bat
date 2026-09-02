@echo off
echo Respongo CRM icin YENI olay-tabanli otomatik push kuruluyor (DERS 32)...
echo Eski "her 3 dakikada bir calis" gorevi kaldiriliyor...
echo.

schtasks /delete /tn "RespongoCRM_OtoPush" /f >nul 2>&1

schtasks /create /tn "RespongoCRM_OtoPushWatcher" /tr "wscript.exe \"%~dp0oto-push-launch.vbs\"" /sc ONLOGON /rl LIMITED /f
schtasks /create /tn "RespongoCRM_OtoPushWatchdog" /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%~dp0oto-push-watchdog.ps1\"" /sc MINUTE /mo 15 /rl LIMITED /f

echo.
echo Watcher'i simdi de (bilgisayari yeniden baslatmadan) calistiriyoruz...
wscript.exe "%~dp0oto-push-launch.vbs"

echo.
echo ==================================================
echo   KURULUM TAMAMLANDI (DERS 32 - olay tabanli push)
echo ==================================================
echo Artik dosyalar sadece GERCEKTEN degistiginde (Claude bir sey
echo yazip kaydettiginde) yaklasik 20 saniye icinde otomatik olarak
echo commit+push yapilacak.
echo.
echo "3 dakikada bir" calisan eski gorev SILINDI - artik ne pencere
echo acilmasi ne de gereksiz surekli calisma olacak.
echo.
echo Bilgisayar yeniden baslatilirsa oturum acildiginda watcher
echo otomatik tekrar baslar. Ayrica her 15 dakikada bir SESSIZCE
echo (hicbir pencere acmadan, git'e dokunmadan) watcher'in hala
echo calisip calismadigi kontrol edilir, dururmusca otomatik
echo yeniden baslatilir.
echo.
echo Calisma kaydini gormek icin: oto-push-watcher-log.txt dosyasina
echo bakabilirsiniz (sadece GERCEK bir push oldugunda satir eklenir).
echo ==================================================
echo.
pause
