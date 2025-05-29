# 🧪 Guia de Teste - App Shopify Elektro3

## Status: ✅ PRONTO PARA TESTE COMPLETO

### URLs de Teste

#### 1. **App Principal**

```
https://elektro3-api-integration-g521gmtqb-electro-malho.vercel.app
```

#### 2. **Instalação do App na Loja**

```
https://elektro3-api-integration-g521gmtqb-electro-malho.vercel.app/auth?shop=electro-malho.myshopify.com
```

#### 3. **Shopify Partners Dashboard**

```
https://partners.shopify.com/3264468/apps/248448876545/versions/628153450497
```

### Checklist de Testes

#### ✅ 1. Infraestrutura

- [x] App acessível no Vercel
- [x] Build de produção funcionando
- [x] Configuração TOML atualizada
- [x] URLs de redirect configuradas

#### 🔄 2. Autenticação Shopify (A TESTAR)

- [ ] OAuth flow funciona
- [ ] Redirect após autenticação
- [ ] Sessão mantida corretamente
- [ ] Scopes de permissão aplicados

#### 🔄 3. Interface do App (A TESTAR)

- [ ] Dashboard principal carrega
- [ ] Navegação entre páginas
- [ ] Componentes Polaris funcionando
- [ ] Responsividade mobile

#### 🔄 4. Integração Elektro3 (A TESTAR)

- [ ] Teste de conexão com API
- [ ] Autenticação Elektro3
- [ ] Importação de produtos
- [ ] Sincronização de dados

#### 🔄 5. Funcionalidades Shopify (A TESTAR)

- [ ] GraphQL Admin API
- [ ] Leitura de produtos
- [ ] Criação de produtos
- [ ] Gestão de clientes
- [ ] Gestão de pedidos

### Passos Detalhados para Teste

#### Passo 1: Instalar o App

1. Acesse: `https://elektro3-api-integration-g521gmtqb-electro-malho.vercel.app/auth?shop=electro-malho.myshopify.com`
2. Faça login na loja Shopify
3. Aceite as permissões solicitadas
4. Verifique redirecionamento para o app

#### Passo 2: Testar Dashboard

1. Verifique se o dashboard carrega corretamente
2. Teste navegação entre páginas:
   - `/app` - Dashboard principal
   - `/app/connection-test` - Teste de conexão
   - `/app/graphql-admin-api` - GraphQL tester
   - `/app/additional` - Funcionalidades adicionais

#### Passo 3: Testar Conexão Elektro3

1. Acesse `/app/connection-test`
2. Execute teste de conectividade
3. Verifique autenticação com credenciais:
   - Client ID: 412
   - Username: electro.malho@gmail.com
   - API URL: https://api.elektro3.com

#### Passo 4: Testar GraphQL

1. Acesse `/app/graphql-admin-api`
2. Execute queries básicas:
   ```graphql
   query {
     products(first: 5) {
       edges {
         node {
           id
           title
           handle
         }
       }
     }
   }
   ```

#### Passo 5: Testar Importação

1. Acesse funcionalidade de importação
2. Teste sincronização de produtos
3. Verifique criação de produtos na loja

### Comandos para Debugging

#### Ver logs do Vercel

```bash
vercel logs https://elektro3-api-integration-g521gmtqb-electro-malho.vercel.app
```

#### Testar localmente (se necessário)

```bash
cd "d:\PROJETOS\12-Electro Malho\Shopify App\elektro3-api-integration"
npm run dev
```

#### Verificar configuração

```bash
shopify app info
```

### Troubleshooting Comum

#### Problema: App não carrega

**Solução**: Verificar logs do Vercel e configuração de ambiente

#### Problema: OAuth falha

**Solução**: Verificar URLs de redirect no `shopify.app.toml`

#### Problema: API Elektro3 não conecta

**Solução**: Verificar credenciais no arquivo `.env`

#### Problema: GraphQL retorna erro

**Solução**: Verificar scopes de permissão e token de acesso

### Métricas de Sucesso

#### ✅ **Teste Básico Passado Se:**

- App carrega sem erros
- OAuth funciona corretamente
- Dashboard é acessível
- Navegação funciona

#### ✅ **Teste Avançado Passado Se:**

- Conexão Elektro3 estabelecida
- GraphQL queries funcionam
- Importação de produtos funciona
- Dados sincronizam corretamente

### Próximas Ações Após Testes

#### Se Testes Passarem:

1. ✅ Marcar app como produção ready
2. 📚 Criar documentação de usuário
3. 🚀 Publicar app na Shopify App Store (opcional)
4. 📊 Configurar monitoramento

#### Se Testes Falharem:

1. 🐛 Documentar bugs encontrados
2. 🔧 Aplicar correções necessárias
3. 🔄 Re-testar funcionalidades
4. 📝 Atualizar documentação

---

**Data do Teste**: 29 de Maio de 2025
**Ambiente**: Produção (Vercel)
**Versão**: elektro3-api-integration-10
**Testador**: [A definir]

### Contatos para Suporte

- **Desenvolvedor**: Valter Rosa (valter@valterosa.com)
- **Repositório**: GitHub (se aplicável)
- **Vercel Project**: elektro3-api-integration
