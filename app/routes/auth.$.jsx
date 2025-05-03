import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  // Se authenticate.admin() não redirecionar, significa que o usuário já está autenticado
  return null;
};
