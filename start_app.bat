@echo off
title Monely Finance Automation Launcher

echo ==================================================
echo   Iniciando Monely Finance com Automacao
echo ==================================================
echo.

echo [1/3] Verificando dependencias Python...
python -m pip install -r c:\monelyfinance\python\requirements.txt > nul 2>&1
if %errorlevel% neq 0 (
    echo AVISO: Falha ao instalar dependencias ou Python nao encontrado.
    echo A automacao pode nao funcionar.
) else (
    echo Dependencias OK.
)

echo.
echo [2/3] Iniciando Servidor de Automacao (Background)...
start /B python c:\monelyfinance\python\server.py > c:\monelyfinance\python\server.log 2>&1

echo.
echo [3/3] Iniciando Interface Web...
echo O navegador abrira em instantes...
echo Pressione CTRL+C nesta janela para encerrar o servidor web.
echo.

cd c:\monelyfinance
npm run dev
