import { useState } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
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
  const errors = loginErrorMessage(await login(request));

  return { errors, polarisTranslations };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <PolarisAppProvider i18n={polarisTranslations}>
      <Page>
        <Card>
          <Banner title="Erro" status="critical">
            <p>
              {isRouteErrorResponse(error)
                ? `${error.status} ${error.statusText}`
                : error instanceof Error
                  ? error.message
                  : "Ocorreu um erro desconhecido durante o login. Por favor, tente novamente."}
            </p>
          </Banner>
          <div style={{ marginTop: "1rem" }}>
            <Button url="/auth/login">Tentar novamente</Button>
          </div>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <Page>
        <Card>
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
                error={errors.shop}
              />
              <Button submit>Log in</Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
