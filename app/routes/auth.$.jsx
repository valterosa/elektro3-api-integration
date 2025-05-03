import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  try {
    // Adicionando logs para diagnosticar o problema
    console.log("Auth loader - início da requisição");

    // Verificar se a URL contém um parâmetro shop
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (shop) {
      console.log(`Shop encontrado nos parâmetros: ${shop}`);
    }

    // Tentar autenticar
    const authResponse = await authenticate.admin(request);

    // Se authenticate.admin() não lançar um redirecionamento, significa que o usuário está autenticado
    console.log("Autenticação bem-sucedida, usuário já autenticado");
    return json({ status: "authenticated" });
  } catch (error) {
    // Se o erro for um redirecionamento (302), o que é esperado no fluxo OAuth, retorne-o
    if (error instanceof Response && error.status === 302) {
      console.log(`Redirecionando para: ${error.headers.get("Location")}`);
      return error;
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
