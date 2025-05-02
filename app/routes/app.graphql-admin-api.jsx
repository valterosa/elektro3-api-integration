import { useState, useCallback, useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Banner,
  TextField,
  Select,
  Link,
  ResourceList,
  ResourceItem,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import shopifyAdminClient from "../lib/shopify-admin-client";
import {
  createWebhookSubscription,
  listWebhooks,
  deleteWebhookSubscription,
} from "../lib/webhook-manager";

// Obter webhooks e dados da loja usando GraphQL Admin API
export async function loader() {
  try {
    // Buscar webhooks existentes
    const webhooks = await listWebhooks();

    // Buscar informações da loja
    const shopResponse = await shopifyAdminClient.graphql(`
      query {
        shop {
          name
          myshopifyDomain
          plan {
            displayName
          }
        }
      }
    `);

    return json({
      webhooks,
      shop: shopResponse.data.shop,
      success: null,
      error: null,
    });
  } catch (error) {
    return json({
      webhooks: [],
      shop: null,
      success: null,
      error: `Erro ao carregar dados: ${error.message}`,
    });
  }
}

// Processar ações: criar ou remover webhooks
export async function action({ request }) {
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "create") {
      const topic = formData.get("topic");
      const callbackUrl = formData.get("callbackUrl");

      const result = await createWebhookSubscription(topic, callbackUrl);

      const userErrors = result.data.webhookSubscriptionCreate.userErrors;
      if (userErrors.length > 0) {
        return json({
          success: false,
          error: userErrors.map((err) => err.message).join(", "),
        });
      }

      return json({
        success: true,
        message: `Webhook para ${topic} criado com sucesso.`,
      });
    } else if (action === "delete") {
      const webhookId = formData.get("webhookId");
      const result = await deleteWebhookSubscription(webhookId);

      const userErrors = result.data.webhookSubscriptionDelete.userErrors;
      if (userErrors.length > 0) {
        return json({
          success: false,
          error: userErrors.map((err) => err.message).join(", "),
        });
      }

      return json({
        success: true,
        message: "Webhook removido com sucesso.",
      });
    }
  } catch (error) {
    return json({
      success: false,
      error: `Erro na operação: ${error.message}`,
    });
  }

  return json({
    success: false,
    error: "Ação desconhecida",
  });
}

export default function GraphqlAdminApiDemo() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isLoading = navigation.state === "submitting";

  const [topic, setTopic] = useState("PRODUCTS_CREATE");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [webhooks, setWebhooks] = useState([]);
  const [shopInfo, setShopInfo] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerContent, setBannerContent] = useState({
    status: "",
    message: "",
  });

  // Carregar webhooks
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/app/graphql-admin-api");
      const data = await response.json();

      if (data.webhooks) {
        setWebhooks(data.webhooks);
      }

      if (data.shop) {
        setShopInfo(data.shop);
        // Preencher a URL de callback com a URL da loja
        setCallbackUrl(
          `https://${data.shop.myshopifyDomain}/admin/api/webhooks/callback`
        );
      }

      if (data.error) {
        setBannerContent({ status: "critical", message: data.error });
        setShowBanner(true);
      }
    } catch (error) {
      setBannerContent({
        status: "critical",
        message: `Erro ao carregar dados: ${error.message}`,
      });
      setShowBanner(true);
    }
  }, []);

  // Carregar dados quando a página é montada
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Mostrar mensagens de sucesso/erro ao realizar ações
  useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setBannerContent({ status: "success", message: actionData.message });
      } else if (actionData.error) {
        setBannerContent({ status: "critical", message: actionData.error });
      }

      setShowBanner(true);

      // Recarregar dados após uma ação
      fetchData();
    }
  }, [actionData, fetchData]);

  // Criar um novo webhook
  const handleCreateWebhook = () => {
    const formData = new FormData();
    formData.append("action", "create");
    formData.append("topic", topic);
    formData.append("callbackUrl", callbackUrl);

    submit(formData, { method: "post" });
  };

  // Remover um webhook
  const handleDeleteWebhook = (webhookId) => {
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("webhookId", webhookId);

    submit(formData, { method: "post" });
  };

  return (
    <Page fullWidth>
      <TitleBar title="GraphQL Admin API Demo" />

      {showBanner && (
        <Banner
          title={bannerContent.status === "success" ? "Sucesso" : "Erro"}
          status={bannerContent.status}
          onDismiss={() => setShowBanner(false)}
        >
          <p>{bannerContent.message}</p>
        </Banner>
      )}

      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Informações da Loja
              </Text>

              {shopInfo ? (
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    <strong>Nome:</strong> {shopInfo.name}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    <strong>Domínio:</strong> {shopInfo.myshopifyDomain}
                  </Text>
                  <Text as="p" variant="bodyMd">
                    <strong>Plano:</strong>{" "}
                    {shopInfo.plan?.displayName || "N/A"}
                  </Text>
                </BlockStack>
              ) : (
                <Text as="p" variant="bodyMd">
                  Carregando informações da loja...
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Criar Webhook via GraphQL
              </Text>

              <Select
                label="Tópico do Webhook"
                options={[
                  { label: "Produto Criado", value: "PRODUCTS_CREATE" },
                  { label: "Produto Atualizado", value: "PRODUCTS_UPDATE" },
                  { label: "Produto Removido", value: "PRODUCTS_DELETE" },
                  { label: "Pedido Criado", value: "ORDERS_CREATE" },
                  { label: "Pedido Atualizado", value: "ORDERS_UPDATED" },
                  { label: "App Desinstalado", value: "APP_UNINSTALLED" },
                ]}
                value={topic}
                onChange={setTopic}
              />

              <TextField
                label="URL de Callback"
                value={callbackUrl}
                onChange={setCallbackUrl}
                autoComplete="off"
              />

              <Button primary onClick={handleCreateWebhook} loading={isLoading}>
                Criar Webhook
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Webhooks Ativos
              </Text>

              {webhooks.length > 0 ? (
                <ResourceList
                  items={webhooks}
                  renderItem={(webhook) => {
                    const { id, topic, endpoint } = webhook;
                    const callbackUrl =
                      endpoint.__typename === "WebhookHttpEndpoint"
                        ? endpoint.callbackUrl
                        : "URL não disponível";

                    return (
                      <ResourceItem
                        id={id}
                        accessibilityLabel={`Webhook para ${topic}`}
                      >
                        <BlockStack gap="200">
                          <InlineStack align="space-between">
                            <Text variant="headingSm" as="h3">
                              <Badge>{topic}</Badge>
                            </Text>
                            <Button
                              destructive
                              onClick={() => handleDeleteWebhook(id)}
                              size="slim"
                            >
                              Remover
                            </Button>
                          </InlineStack>
                          <Text variant="bodyMd">URL: {callbackUrl}</Text>
                        </BlockStack>
                      </ResourceItem>
                    );
                  }}
                />
              ) : (
                <Text as="p" variant="bodyMd">
                  Nenhum webhook encontrado.
                </Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Sobre o GraphQL Admin API
              </Text>

              <Text as="p" variant="bodyMd">
                Esta página demonstra como usar o GraphQL Admin API do Shopify
                com uma custom app. O Shopify GraphQL Admin API permite criar,
                ler, atualizar e excluir recursos da sua loja de forma
                eficiente.
              </Text>

              <Text as="p" variant="bodyMd">
                <Link url="https://shopify.dev/docs/api/admin-graphql" external>
                  Documentação do GraphQL Admin API
                </Link>
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
