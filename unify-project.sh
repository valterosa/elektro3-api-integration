#!/bin/bash
# Script para unificar o projeto movendo arquivos do submódulo para a raiz

# Criar um backup da pasta app atual
echo "📦 Criando backup da pasta app..."
if [ -d "app" ]; then
  mv app app.bak
fi

# Mover a pasta app do submódulo para a raiz
echo "🔄 Movendo pasta app do submódulo para a raiz..."
cp -r elektro3-api-module/app ./

# Copiar outras pastas essenciais
echo "📋 Copiando outras pastas essenciais..."

# Prisma
if [ ! -d "prisma" ]; then
  mkdir -p prisma
fi
cp -r elektro3-api-module/prisma/* ./prisma/

# Garantir que a pasta extensions existe
if [ ! -d "extensions" ]; then
  mkdir -p extensions
  cp -r elektro3-api-module/extensions/* ./extensions/ 2>/dev/null || :
fi

# Copiar arquivos de configuração importantes
echo "⚙️ Copiando arquivos de configuração..."
cp -f elektro3-api-module/shopify.web.toml ./ 2>/dev/null || :
cp -f elektro3-api-module/.env.example ./ 2>/dev/null || :

# Verificar e ajustar diretórios existentes
echo "🔍 Verificando diretórios existentes..."
mkdir -p public
mkdir -p build
mkdir -p api

echo "✅ Unificação básica concluída. Agora execute 'npm install' para atualizar dependências."
echo "ℹ️ Lembre-se de verificar a pasta app.bak para arquivos personalizados que precisam ser incorporados."