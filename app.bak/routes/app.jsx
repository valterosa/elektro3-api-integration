import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { json } from "@remix-run/node";
import { shopifyAdminClient } from "../lib/shopify-admin-client.js";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  // Não precisamos usar authenticate.admin porque estamos
  // usando diretamente o Admin API Access Token
  const shop = process.env.SHOPIFY_SHOP || "electro-malho.myshopify.com";

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop,
  });
};

export default function App() {
  const { apiKey, shop } = useLoaderData();
  const shopOrigin = `https://${shop}`;

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} shopOrigin={shopOrigin}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
        <Link to="/app/elektro3-importer">Elektro3 Importer</Link>
        <Link to="/app/connection-test">Connection Test</Link>
        <Link to="/app/graphql-admin-api">GraphQL Admin API</Link>
        <Link to="/app/additional">Additional page</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
