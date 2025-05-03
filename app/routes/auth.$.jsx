import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

/**
 * Esta rota lida com todas as solicitações de autenticação genéricas
 * e redireciona o usuário para a página inicial da aplicação após
 * uma autenticação bem-sucedida.
 */
export const loader = async ({ request }) => {
  // Logar a URL completa para depuração
  console.log("Auth Wildcard - URL:", request.url);

  try {
    // Adicionando logs para diagnosticar o problema
    console.log("Auth loader - início da requisição");

    // Verificar se a URL contém um parâmetro shop
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (shop) {
      console.log(`Shop encontrado nos parâmetros: ${shop}`);
    }

    // Se esta for a rota de callback, redirecionar para nossa página específica de callback
    if (
      url.pathname.includes("/auth/callback") ||
      url.pathname.endsWith("/callback") ||
      url.searchParams.has("code")
    ) {
      console.log(
        "Detectado padrão de callback OAuth, redirecionando para rota específica"
      );
      // Criar uma nova URL com os mesmos parâmetros, mas apontando para nossa rota de callback
      const callbackUrl = new URL("/auth/callback", url.origin);
      url.searchParams.forEach((value, key) => {
        callbackUrl.searchParams.append(key, value);
      });

      console.log("Redirecionando para:", callbackUrl.toString());
      return Response.redirect(callbackUrl.toString(), 302);
    }

    // Tentar autenticar
    const authResponse = await authenticate.admin(request);

    // Se authenticate.admin() não lançar um redirecionamento, significa que o usuário está autenticado
    console.log("Autenticação bem-sucedida, usuário já autenticado");
    return json({ status: "authenticated" });
  } catch (error) {
    // Se o erro for um redirecionamento (302), o que é esperado no fluxo OAuth, retorne-o
    if (error instanceof Response && error.status === 302) {
      const location = error.headers.get("Location");
      console.log(`Redirecionando para: ${location}`);

      // Garantir que o cabeçalho Content-Type esteja correto
      const headers = new Headers(error.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");

      // Retornar um novo Response com os mesmos dados, mas com cabeçalhos atualizados
      return new Response(null, {
        status: 302,
        headers,
      });
    }

    // Para outros erros, registrar e retornar uma mensagem amigável
    console.error("Erro na rota de autenticação:", error);
    return json(
      {
        status: "error",
        message: "Ocorreu um erro durante a autenticação",
      },
      { status: 500 }
    );
  }
};
