import { authenticate } from "../shopify.server";
import { json, redirect } from "@remix-run/node";

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

    // Processar a autenticação via Shopify SDK
    // Isso vai automaticamente verificar os parâmetros e completar o fluxo OAuth
    console.log("Tentando completar autenticação OAuth...");
    try {
      // Usar authenticate.admin, que vai tratar o fluxo OAuth completo
      return await authenticate.admin(request);
    } catch (authError) {
      console.log("Erro durante authenticate.admin:", authError);

      // Se o erro for um redirecionamento, deixe passar
      if (authError instanceof Response && authError.status === 302) {
        console.log("Redirecionando para:", authError.headers.get("Location"));
        return authError;
      }

      throw authError;
    }
  } catch (error) {
    console.error("Erro no callback OAuth:", error);

    // Se ainda for um redirecionamento, retorne-o
    if (error instanceof Response && error.status === 302) {
      console.log("Redirecionando para:", error.headers.get("Location"));
      return error;
    }

    // Redirecionar para a página de login em caso de erro
    return redirect("/auth/login?error=auth_callback_failed");
  }
};

// Não precisamos de um componente React neste arquivo, pois ele apenas
// processa a autenticação e redireciona o usuário
