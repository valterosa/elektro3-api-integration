import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "./shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export async function loader({ request }) {
  const { session } = await authenticate
    .admin(request)
    .catch(() => ({ session: null }));

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopOrigin: session?.shop || "",
  });
}

export default function App() {
  const { apiKey, shopOrigin } = useLoaderData();

  const config =
    apiKey && shopOrigin
      ? {
          apiKey,
          host: shopOrigin ? new URL(shopOrigin).host : "",
          forceRedirect: true,
        }
      : null;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        {config ? (
          <AppProvider config={config}>
            <PolarisAppProvider>
              <Outlet />
            </PolarisAppProvider>
          </AppProvider>
        ) : (
          <Outlet />
        )}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);

  let errorMessage = "Um erro inesperado ocorreu";
  let errorStatus = "500";

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data || errorMessage;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "object" && error !== null) {
    // Converter objeto de erro em string
    errorMessage = JSON.stringify(error);
  }

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Erro na aplicação</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div
          style={{
            padding: "20px",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <h1>Erro {errorStatus}</h1>
          <p>{errorMessage}</p>
          {process.env.NODE_ENV !== "production" && error instanceof Error && (
            <pre
              style={{
                margin: "20px auto",
                padding: "20px",
                backgroundColor: "#f7f7f7",
                borderRadius: "5px",
                maxWidth: "800px",
                overflow: "auto",
                textAlign: "left",
              }}
            >
              {error.stack}
            </pre>
          )}
        </div>
        <Scripts />
      </body>
    </html>
  );
}
