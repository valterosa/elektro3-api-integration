# Elektro3 API Integration para Shopify

Este projeto é uma aplicação Remix para integrar a API da Elektro3 com lojas Shopify, permitindo a importação de produtos e outras funcionalidades.

## Funcionalidades Principais

- Importação de produtos da API Elektro3 para Shopify
- Consulta de produtos e categorias da Elektro3
- Gerenciamento de webhooks do Shopify
- Testes de conexão com ambas as APIs

## Requisitos

- Node.js (versão 18.20.0 ou superior)
- npm (versão 8 ou superior)
- Credenciais da API Elektro3
- Loja Shopify com acesso à API Admin

## Configuração do Ambiente

1. Clone o repositório:

   ```bash
   git clone <repositório>
   cd elektro3-api-integration
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie um arquivo `.env` baseado no `.env.example`:

   ```bash
   cp .env.example .env
   ```

4. Edite o arquivo `.env` e adicione suas credenciais:

   ```
   # Configurações da API Elektro3
   ELEKTRO3_API_URL=https://api.elektro3.com
   ELEKTRO3_CLIENT_ID=seu_client_id
   ELEKTRO3_SECRET_KEY=sua_secret_key
   ELEKTRO3_USERNAME=seu_username
   ELEKTRO3_PASSWORD=sua_senha

   # Configurações do Shopify
   SHOPIFY_SHOP=sua-loja.myshopify.com
   SHOPIFY_API_KEY=sua_api_key
   SHOPIFY_API_SECRET=seu_api_secret
   SHOPIFY_ADMIN_API_ACCESS_TOKEN=seu_admin_token
   SHOPIFY_APP_URL=https://sua-app.vercel.app
   SCOPES=write_products,read_products
   ```

5. Verifique seu ambiente local:

   ```bash
   npm run check-env
   ```

6. Teste a conexão com as APIs:
   ```bash
   npm run test-connection
   ```

## Desenvolvimento Local

Para executar a aplicação em modo de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em http://localhost:3000

## Preparar para Produção

Para preparar a aplicação para produção:

```bash
npm run prepare-local
npm run build
```

## Publicação no Vercel

1. Certifique-se de ter todas as variáveis de ambiente configuradas no projeto do Vercel.
2. Faça o deploy usando o CLI do Vercel ou conectando o repositório GitHub.

```bash
vercel --prod
```

## Estrutura do Projeto

- `/app` - Código principal da aplicação Remix
  - `/lib` - Utilitários e funções compartilhadas
  - `/routes` - Rotas da aplicação
- `/prisma` - Schema e migrações do banco de dados
- `/public` - Arquivos estáticos
- `/build` - Output da build (gerado automaticamente)

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria uma build de produção
- `npm start` - Inicia o servidor de produção
- `npm run check-env` - Verifica o ambiente local
- `npm run test-connection` - Testa a conexão com as APIs
- `npm run prepare-local` - Prepara o ambiente local (verifica ambiente e corrige importações)

## Resolução de Problemas

### Erro no build com importações

Se você encontrar erros relacionados a importações durante o build, execute:

```bash
npm run fix-imports
```

### Problemas com importação JSON no Shopify

Se você encontrar erros relacionados à importação de JSON em módulos do Shopify, execute:

```bash
npm run fix-json-import
```

### Erro de conexão com a API

Verifique suas credenciais no arquivo `.env` e execute o teste de conexão:

```bash
npm run test-connection
```

## Desenvolvimento e Contribuições

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b minha-feature`
3. Faça commit de suas alterações: `git commit -m 'Adiciona nova feature'`
4. Envie para a branch: `git push origin minha-feature`
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).
