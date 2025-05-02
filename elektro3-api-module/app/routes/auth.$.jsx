import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  // Em vez de usar authenticate.admin, vamos redirecionar
  // diretamente para a nossa app no Shopify Admin
  const shop = process.env.SHOPIFY_SHOP || "electro-malho.myshopify.com";

  // Redirecionar para a custom app no Shopify Admin
  return redirect(`https://${shop}/admin/apps/elektro3-api-connection`);
};
