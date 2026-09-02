@echo off
echo Respongo CRM icin otomatik git push gorevi kuruluyor...
echo.

schtasks /create /tn "RespongoCRM_OtoPush" /tr "\"%~dp0oto-push.bat\"" /sc MINUTE /mo 3 /f

if %errorlevel%==0 (
    echo.
    echo ==================================================
    echo   KURULUM TAMAMLANDI
    echo ==================================================
    echo Artik her 3 dakikada bir, bu klasordeki (D:\Claude\Projeler\respongo-crm\v2-26-08-2026)
    echo degisiklikler otomatik olarak commit edilip GitHub'a push edilecek.
    echo.
    echo Bir daha ELLE git push yapmaniza gerek YOK.
    echo.
    echo Calisma kaydini gormek icin: oto-push-log.txt dosyasina bakabilirsiniz
    echo ^(ayni klasorde olusacak^).
    echo.
    echo Gorevi Windows Gorev Zamanlayici'da "RespongoCRM_OtoPush" adiyla bulabilir,
    echo istediginizde durdurabilir veya silebilirsiniz.
    echo ==================================================
) else (
    echo.
    echo HATA: Gorev olusturulamadi. Lutfen bu dosyayi "Yonetici olarak calistir"
    echo secenegiyle tekrar deneyin.
)

echo.
pause
