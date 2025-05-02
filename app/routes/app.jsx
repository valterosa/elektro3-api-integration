import {
  Link,
  Outlet,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { boundary, authenticate } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export async function loader({ request }) {
  try {
    // Usar o método de autenticação padrão do Shopify
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    return json({
      apiKey: process.env.SHOPIFY_API_KEY || "",
      shop,
    });
  } catch (error) {
    console.error("Erro de autenticação:", error);
    throw error;
  }
}

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
  const error = useRouteError();

  // Tratamento adequado para garantir que objetos sejam convertidos para string
  if (
    typeof error === "object" &&
    error !== null &&
    !(error instanceof Error) &&
    !isRouteErrorResponse(error)
  ) {
    console.error("Objeto de erro não tratado:", error);
    return boundary.error({
      message: "Um erro inesperado ocorreu: " + JSON.stringify(error),
    });
  }

  return boundary.error(error);
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
