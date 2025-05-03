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
    const shop = query.get("shop");

    // Logar os parâmetros para depuração
    console.log("Callback OAuth recebido com os seguintes parâmetros:");
    console.log("shop:", shop);
    console.log("hmac:", query.get("hmac"));
    console.log("timestamp:", query.get("timestamp"));
    console.log("state:", query.get("state"));
    console.log("code:", query.get("code")?.substring(0, 5) + "...");

    // Decisão crucial: se não houver parâmetro de código, redirecionar para a URL apropriada
    if (!query.get("code") && shop) {
      console.log(
        `Redirecionando para a página da Custom App para a loja: ${shop}`
      );
      return redirect(`https://${shop}/admin/apps/elektro3-api-integration`);
    }

    // Processar a autenticação via Shopify SDK
    console.log("Tentando completar autenticação OAuth...");

    try {
      // Esse é o método que processa o fluxo OAuth completo incluindo callback
      const authResponse = await authenticate.admin(request);

      // Se chegamos aqui, a autenticação foi bem-sucedida
      console.log("Autenticação completada com sucesso");

      if (authResponse.session && authResponse.session.shop) {
        const shopDomain = authResponse.session.shop;
        console.log(
          `Redirecionando para a Custom App no admin do Shopify: ${shopDomain}`
        );
        return redirect(
          `https://${shopDomain}/admin/apps/elektro3-api-integration`
        );
      }

      // Fallback para a rota /app se não conseguirmos o shop
      return redirect("/app");
    } catch (authError) {
      console.log("Erro durante authenticate.admin:", authError);

      // Se o erro for um redirecionamento, retorne-o
      if (authError instanceof Response && authError.status === 302) {
        const location = authError.headers.get("Location");
        console.log("Redirecionando para:", location);
        return authError;
      }

      throw authError;
    }
  } catch (error) {
    console.error("Erro no callback OAuth:", error);

    // Se for um redirecionamento, deixamos seguir
    if (error instanceof Response && error.status === 302) {
      const location = error.headers.get("Location");
      console.log("Redirecionando para:", location);
      return error;
    }

    // Outros erros - tente redirecionar para a página de login
    console.log("Redirecionando para página de login devido a erro");
    return redirect("/auth/login?error=callback_failed");
  }
};
