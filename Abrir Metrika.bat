@echo off
title Metrika - Iniciando...
chcp 65001 >nul

set "PROJ=C:\Users\Usuário\OneDrive\Pessoais\Documentos\minha_pasta\Projetos\mini_saas_metrika"
set "NODE_EXE=C:\Program Files\nodejs\node.exe"

cd /d "%PROJ%"

:: Verifica se o servidor ja esta rodando
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo Servidor ja esta rodando! Abrindo navegador...
    start http://localhost:3000
    exit /b
)

:: Limpa o cache do Turbopack (o OneDrive costuma corromper o .next e derrubar o servidor)
if exist ".next" rd /s /q ".next"

:: Inicia o servidor em janela separada
echo Iniciando servidor Metrika...
start /min "Metrika Server" "%NODE_EXE%" "node_modules\next\dist\bin\next" dev

:: Aguarda o servidor ficar disponivel
echo Aguardando servidor iniciar...
set /a count=0

:loop
timeout /t 2 /nobreak >nul
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto abrir
set /a count+=1
if %count% lss 30 goto loop

echo Nao consegui confirmar o servidor, mas vou tentar abrir mesmo assim...

:abrir
echo Abrindo navegador...
start http://localhost:3000
exit /b
