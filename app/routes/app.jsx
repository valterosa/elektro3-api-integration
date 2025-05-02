import {
  Link,
  Outlet,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { boundary, authenticate } from "@shopify/shopify-app-remix/server";
import { NavigationMenu } from "@shopify/app-bridge-react";

export async function loader({ request }) {
  try {
    await authenticate.admin(request);
    return json({});
  } catch (error) {
    console.error("Erro de autenticação:", error);
    throw error;
  }
}

export default function App() {
  return (
    <>
      <NavigationMenu
        navigationLinks={[
          {
            label: "Home",
            destination: "/app",
          },
          {
            label: "Elektro3 Importer",
            destination: "/app/elektro3-importer",
          },
          {
            label: "Connection Test",
            destination: "/app/connection-test",
          },
          {
            label: "GraphQL Admin API",
            destination: "/app/graphql-admin-api",
          },
          {
            label: "Additional page",
            destination: "/app/additional",
          },
        ]}
      />
      <Outlet />
    </>
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
