import { useState } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
  Banner,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  try {
    // Tenta realizar o login
    const loginResult = await login(request);

    // Captura mensagens de erro formatadas
    const errors = loginErrorMessage(loginResult);

    // Retorna os resultados como JSON com as traduções do Polaris
    return { errors, polarisTranslations };
  } catch (error) {
    console.error("Erro no loader de login:", error);

    // Throw Response em vez de Error para melhor tratamento no ErrorBoundary
    throw new Response(
      JSON.stringify({ message: "Erro durante o processo de login" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const action = async ({ request }) => {
  try {
    // Tenta realizar o login quando o formulário é submetido
    const loginResult = await login(request);

    // Captura mensagens de erro formatadas
    const errors = loginErrorMessage(loginResult);

    // Retorna os resultados
    return { errors };
  } catch (error) {
    console.error("Erro na action de login:", error);

    // Throw Response em vez de Error para melhor tratamento no ErrorBoundary
    throw new Response(
      JSON.stringify({ message: "Erro durante o processo de login" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <Page>
        <Card>
          {errors && errors.general && (
            <Banner status="critical" title="Erro">
              {errors.general}
            </Banner>
          )}
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Log in
              </Text>
              <TextField
                type="text"
                name="shop"
                label="Shop domain"
                helpText="example.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={errors?.shop}
              />
              <Button submit>Log in</Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = "Ocorreu um erro inesperado.";
  let errorDetails = "";

  // Verifica se é um erro de resposta de rota
  if (isRouteErrorResponse(error)) {
    errorMessage = `Erro ${error.status}`;

    try {
      // Tenta extrair dados JSON da resposta de erro
      const data = JSON.parse(error.data);
      if (data.message) {
        errorDetails = data.message;
      }
    } catch (e) {
      // Se não for JSON, usa o texto bruto
      errorDetails = error.data;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
    // Em desenvolvimento, podemos mostrar mais detalhes do erro
    if (process.env.NODE_ENV === "development") {
      errorDetails = error.stack;
    }
  }

  // Renderiza um componente Polaris com a mensagem de erro
  return (
    <PolarisAppProvider i18n={polarisTranslations}>
      <Page>
        <Card>
          <FormLayout>
            <Banner status="critical" title={errorMessage}>
              {errorDetails ||
                "Houve um problema ao processar sua solicitação. Por favor, tente novamente mais tarde."}
            </Banner>
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              <Button url="/auth/login">Tentar novamente</Button>
            </div>
          </FormLayout>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
