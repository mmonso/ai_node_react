@echo off
echo ======================================================
echo Iniciando o servidor backend do AI Assistant...
echo ======================================================

cd backend

echo.
echo Verificando dependencias...
call npm install

echo.
echo Iniciando o servidor...
call npm run start:dev

echo.
if %ERRORLEVEL% NEQ 0 (
  echo [ERRO] O servidor falhou ao iniciar. Verifique os erros acima.
  echo.
  echo Pressione qualquer tecla para sair...
) else (
  echo Servidor iniciado com sucesso!
  echo.
  echo Pressione CTRL+C para encerrar o servidor.
)

pause 