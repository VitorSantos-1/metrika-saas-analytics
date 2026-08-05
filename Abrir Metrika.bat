@echo off
title Metrika - Iniciando...
chcp 65001 >nul

cd /d "C:\Users\Usuário\Desktop\metrika"

set NODE_EXE=C:\Users\Usuário\AppData\Local\ms-playwright-go\1.57.0\node.exe

:: Verifica se o servidor ja esta rodando
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% == 0 (
    echo Servidor ja esta rodando! Abrindo navegador...
    start http://localhost:3000
    exit
)

:: Inicia o servidor em janela separada
echo Iniciando servidor Metrika...
start /min "Metrika Server" "%NODE_EXE%" "node_modules\next\dist\bin\next" dev

:: Aguarda o servidor ficar disponivel
echo Aguardando servidor iniciar...
set /a count=0

:loop
timeout /t 2 /nobreak >nul
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% == 0 goto abrir
set /a count+=1
if %count% lss 20 goto loop

:abrir
echo Abrindo navegador...
start http://localhost:3000
exit
