# Guia de Deploy para Vercel - Elektro3 API Integration

## ✅ Configurações Concluídas

### 1. Correções de Build
- [x] Removida importação problemática `@shopify/app-bridge/actions` 
- [x] Atualizado `navigation-helper.js` para usar navegação compatível
- [x] Configurado Prisma schema corretamente para produção
- [x] Adicionado output path no Prisma para evitar warnings

### 2. Configurações do Vercel
- [x] `vercel.json` configurado com rotas para webhooks e autenticação
- [x] `api/index.js` configurado como handler principal
- [x] Build command específico para Vercel (`vercel-build`)
- [x] Headers de segurança configurados (CSP, X-Frame-Options, etc.)

### 3. Configurações do Shopify
- [x] `shopify.app.toml` atualizado para usar variáveis de ambiente
- [x] URLs de redirect configuradas dinamicamente
- [x] Scopes configurados via variável de ambiente

### 4. Scripts Auxiliares
- [x] `vercel-db-setup.js` para configuração do banco
- [x] `deploy-to-vercel.js` script de ajuda ao deploy
- [x] `.env.production` template com variáveis necessárias

## 🚀 Próximos Passos para Deploy

### Passo 1: Commit e Push
```bash
git add .
git commit -m "Configurado para deploy no Vercel - correções de build"
git push origin main
```

### Passo 2: Configurar no Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório do GitHub
3. Configure as seguintes variáveis de ambiente:

#### Variáveis Obrigatórias:
```env
# Shopify
SHOPIFY_API_KEY=876289cfbb8474b45386415b86fa5be4
SHOPIFY_API_SECRET=seu_api_secret_aqui
SHOPIFY_APP_URL=https://seu-app.vercel.app
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders

# Elektro3 API
ELEKTRO3_API_URL=https://api.elektro3.com
ELEKTRO3_CLIENT_ID=seu_client_id
ELEKTRO3_SECRET_KEY=sua_secret_key
ELEKTRO3_USERNAME=seu_username
ELEKTRO3_PASSWORD=sua_senha

# Database (SQLite para início, PostgreSQL opcional)
DATABASE_URL=file:dev.sqlite

# Ambiente
NODE_ENV=production
```

### Passo 3: Atualizar Configurações do Shopify
Após o deploy no Vercel:
1. Acesse o [Portal de Parceiros Shopify](https://partners.shopify.com)
2. Vá para seu app "elektro3-api-integration"
3. Atualize a URL do app para a URL do Vercel
4. Atualize as URLs de redirecionamento OAuth

### Passo 4: Teste o Deploy
1. Instale o app em uma loja de desenvolvimento
2. Teste todas as funcionalidades:
   - Autenticação OAuth
   - Navegação entre páginas
   - Conexão com API Elektro3
   - Import de produtos

## 🔧 Comandos de Build Disponíveis

- `npm run build` - Build local padrão
- `npm run vercel-build` - Build específico para Vercel
- `npm run deploy:vercel` - Script helper para deploy

## 📝 Arquivos de Configuração

### vercel.json
- Configurado com rotas específicas para Shopify
- Headers de segurança apropriados
- Build command customizado

### shopify.app.toml
- URLs dinâmicas usando variáveis de ambiente
- Configuração para ambiente embeddado
- Scopes configuráveis

### package.json
- Scripts de build otimizados
- Dependências atualizadas

## ⚠️ Pontos de Atenção

1. **Database**: Atualmente configurado para SQLite. Para produção com múltiplas instâncias, considere PostgreSQL.

2. **Variáveis de Ambiente**: Certifique-se de que todas as variáveis estão configuradas no Vercel antes do deploy.

3. **URLs**: Após o deploy, atualize a variável `SHOPIFY_APP_URL` com a URL real do Vercel.

4. **Webhooks**: Verifique se os webhooks estão funcionando corretamente após o deploy.

## 🆘 Troubleshooting

### Build Fails no Vercel
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que não há importações problemáticas do `@shopify/app-bridge/actions`

### App não carrega no Shopify
- Verifique se a URL do app está correta no Partners Dashboard
- Confirme que os headers CSP estão corretos
- Teste se as URLs de redirect estão funcionando

### Problemas de Autenticação
- Confirme que `SHOPIFY_API_KEY` e `SHOPIFY_API_SECRET` estão corretos
- Verifique se as URLs de redirect estão atualizadas no Shopify Partners

## 📞 Status do Build
✅ Build local: SUCESSO
✅ Vercel build: SUCESSO
✅ Prisma generation: SUCESSO
✅ Vite build: SUCESSO

O projeto está pronto para deploy no Vercel!
