import {
  Link,
  Outlet,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Frame, Navigation } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

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
      <Frame>
        <div style={{ display: "flex", height: "100%" }}>
          <div
            style={{
              width: "220px",
              borderRight: "1px solid #ddd",
              padding: "10px",
            }}
          >
            <Navigation location="">
              <Navigation.Section
                items={[
                  {
                    url: "/app",
                    label: "Home",
                  },
                  {
                    url: "/app/elektro3-importer",
                    label: "Elektro3 Importer",
                  },
                  {
                    url: "/app/connection-test",
                    label: "Connection Test",
                  },
                  {
                    url: "/app/graphql-admin-api",
                    label: "GraphQL Admin API",
                  },
                  {
                    url: "/app/additional",
                    label: "Additional Page",
                  },
                ]}
              />
            </Navigation>
          </div>
          <div style={{ flex: 1, padding: "1rem" }}>
            <Outlet />
          </div>
        </div>
      </Frame>
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
