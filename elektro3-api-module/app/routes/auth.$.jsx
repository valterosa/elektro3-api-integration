import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const { admin, shop } = await authenticate.admin(request);

  // Redirect to the Shopify Admin with the embedded app
  return redirect(`https://${shop}/admin/apps`);
};
