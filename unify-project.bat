@echo off
REM Script para unificar o projeto movendo arquivos do submódulo para a raiz (versão Windows)

echo 📦 Criando backup da pasta app...
if exist app (
    move app app.bak
)

echo 🔄 Movendo pasta app do submódulo para a raiz...
xcopy elektro3-api-module\app app\ /E /I /Y

echo 📋 Copiando outras pastas essenciais...

REM Prisma
if not exist prisma (
    mkdir prisma
)
xcopy elektro3-api-module\prisma\* prisma\ /E /I /Y

REM Garantir que a pasta extensions existe
if not exist extensions (
    mkdir extensions
    if exist elektro3-api-module\extensions (
        xcopy elektro3-api-module\extensions\* extensions\ /E /I /Y
    )
)

echo ⚙️ Copiando arquivos de configuração...
if exist elektro3-api-module\shopify.web.toml (
    copy elektro3-api-module\shopify.web.toml .\
)
if exist elektro3-api-module\.env.example (
    copy elektro3-api-module\.env.example .\
)

echo 🔍 Verificando diretórios existentes...
if not exist public (
    mkdir public
)
if not exist build (
    mkdir build
)
if not exist api (
    mkdir api
)

echo ✅ Unificação básica concluída. Agora execute 'npm install' para atualizar dependências.
echo ℹ️ Lembre-se de verificar a pasta app.bak para arquivos personalizados que precisam ser incorporados.