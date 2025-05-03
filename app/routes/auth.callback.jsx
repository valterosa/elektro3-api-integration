import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

/**
 * Página específica para callback OAuth do Shopify
 * Esta página é chamada após o usuário autorizar a aplicação no Shopify
 */
export const loader = async ({ request }) => {
  try {
    // Obter a URL completa da requisição
    const url = new URL(request.url);
    const query = url.searchParams;

    // Logar os parâmetros para depuração
    console.log("Callback OAuth recebido com os seguintes parâmetros:");
    console.log("shop:", query.get("shop"));
    console.log("hmac:", query.get("hmac"));
    console.log("timestamp:", query.get("timestamp"));
    console.log("state:", query.get("state"));
    console.log("code:", query.get("code")?.substring(0, 5) + "...");

    // Decisão crucial: se não houver parâmetro de código, redirecionar para o app
    if (!query.get("code") && query.get("shop")) {
      console.log(
        `Redirecionando para a página inicial da aplicação para a loja: ${query.get("shop")}`
      );
      return redirect("/app");
    }

    // Processar a autenticação via Shopify SDK
    console.log("Tentando completar autenticação OAuth...");

    // Esse é o método que processa o fluxo OAuth completo incluindo callback
    const authResponse = await authenticate.admin(request);
    console.log(
      "Autenticação completada com sucesso, redirecionando para /app"
    );

    // Se authenticate.admin não redirecionar automaticamente, forçamos um redirecionamento para /app
    return redirect("/app");
  } catch (error) {
    console.error("Erro no callback OAuth:", error);

    // Se for um redirecionamento, deixamos seguir
    if (error instanceof Response && error.status === 302) {
      const location = error.headers.get("Location");
      console.log("Redirecionando para:", location);
      return error;
    }

    // Outros erros - redirecionar para a página de login
    console.log("Redirecionando para página de login devido a erro");
    return redirect("/auth/login?error=callback_failed");
  }
};
