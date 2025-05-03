import { redirect } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

/**
 * Página inicial que redireciona para a Custom App instalada
 * Esta rota é útil para acessar diretamente a aplicação via URL
 */
export const loader = async ({ request }) => {
  try {
    // Verificar se já está autenticado
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    // Gerar URL direta para a Custom App no Admin do Shopify
    console.log("Usuário autenticado, redirecionando para app do Shopify");

    // Para Custom Apps, a URL normalmente segue este formato:
    const shopifyAdminAppUrl = `https://${shop}/admin/apps/elektro3-api-integration`;

    return redirect(shopifyAdminAppUrl);
  } catch (error) {
    // Se houver erro de autenticação, redirecionar para login
    console.error("Erro ao acessar homepage:", error);

    if (error instanceof Response && error.status === 302) {
      return error; // Permitir redirecionamentos OAuth
    }

    // Redirecionar para login
    return redirect("/auth/login");
  }
};
