import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

/**
 * Esta rota lida com todas as solicitações de autenticação genéricas
 * Se a URL parecer um callback OAuth, redirecionamos para nossa rota específica
 */
export const loader = async ({ request }) => {
  try {
    // Obter a URL completa e seus parâmetros
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    console.log("Auth wildcard route - URL:", request.url);
    console.log("Parâmetros relevantes:", {
      shop,
      code: code?.substring(0, 5) + "...",
      state,
    });

    // Se parece um callback OAuth (tem código), direcionar para nossa rota específica
    if (code && shop) {
      const callbackUrl = new URL("/auth/callback", url.origin);
      url.searchParams.forEach((value, key) =>
        callbackUrl.searchParams.set(key, value)
      );

      console.log(
        "Detectado padrão de callback OAuth, redirecionando para:",
        callbackUrl.toString()
      );
      return redirect(callbackUrl.toString());
    }

    // Tentar autenticação normal
    try {
      console.log("Tentando autenticar via authenticate.admin");
      await authenticate.admin(request);

      // Se não redirecionar, o usuário já está autenticado - ir para o app
      console.log("Usuário já autenticado, redirecionando para /app");
      return redirect("/app");
    } catch (authError) {
      // Se for redirecionamento, deixar acontecer (parte normal do fluxo OAuth)
      if (authError instanceof Response && authError.status === 302) {
        const location = authError.headers.get("Location");
        console.log("Redirecionamento de autenticação para:", location);
        return authError;
      }
      throw authError;
    }
  } catch (error) {
    console.error("Erro na rota auth.$:", error);

    // Se for um redirecionamento, parte do fluxo normal
    if (error instanceof Response && error.status === 302) {
      const location = error.headers.get("Location");
      console.log("Redirecionando para:", location);

      // Este é o ponto crítico: garantir que o cabeçalho content-type está correto
      // Alguns ambientes serverless têm problemas com redirecionamentos quando este cabeçalho não está correto
      const headers = new Headers(error.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");

      // Criar um novo objeto Response com os mesmos dados mas cabeçalhos corretos
      return new Response(null, {
        status: 302,
        headers,
      });
    }

    // Para outros erros, tente redirecionar para login
    return redirect("/auth/login?error=auth_error");
  }
};
