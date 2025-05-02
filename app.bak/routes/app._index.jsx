import { useEffect, useState } from "react";
import { useFetcher, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  EmptyState,
  Banner,
  List,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { shopifyAdminClient } from "../lib/shopify-admin-client.js";

export const loader = async ({ request }) => {
  return null;
};

export const action = async ({ request }) => {
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];

  const productResponse = await shopifyAdminClient.graphql(
    `
    mutation populateProduct($product: ProductInput!) {
      productCreate(input: $product) {
        product {
          id
          title
          handle
          status
          variants(first: 10) {
            edges {
              node {
                id
                price
                barcode
                createdAt
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
    {
      product: {
        title: `${color} Snowboard`,
      },
    }
  );

  const product = productResponse.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;

  const variantResponse = await shopifyAdminClient.graphql(
    `
    mutation updateVariant($productId: ID!, $variants: [ProductVariantInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
    {
      productId: product.id,
      variants: [{ id: variantId, price: "100.00" }],
    }
  );

  return json({
    product: product,
    variant: variantResponse.data.productVariantsBulkUpdate.productVariants,
  });
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    ""
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page fullWidth>
      <TitleBar title="Elektro3 API Integration" />
      <BlockStack gap="500">
        {showWelcomeBanner && (
          <Banner
            title="Welcome to Elektro3 API Integration"
            onDismiss={() => setShowWelcomeBanner(false)}
          >
            <p>
              This app allows you to import products from Elektro3 to your
              Shopify store.
            </p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Elektro3 to Shopify Product Integration
                  </Text>
                  <Text variant="bodyMd" as="p">
                    This app helps you seamlessly import products from Elektro3
                    API to your Shopify store. Use the Elektro3 Importer to
                    manage and import your products or test your connections
                    with the Connection Test tool.
                  </Text>
                </BlockStack>

                <InlineStack gap="300">
                  <Button
                    primary
                    onClick={() => navigate("/app/elektro3-importer")}
                  >
                    Go to Elektro3 Importer
                  </Button>
                  <Button onClick={() => navigate("/app/connection-test")}>
                    Test Connections
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>

            <div style={{ marginTop: "20px" }}>
              <Card>
                <EmptyState
                  heading="Start importing products"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  action={{
                    content: "Import Products",
                    onAction: () => navigate("/app/elektro3-importer"),
                  }}
                >
                  <p>
                    Import products from Elektro3 API to your Shopify store.
                  </p>
                </EmptyState>
              </Card>
            </div>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    App Features
                  </Text>
                  <List>
                    <List.Item>Browse products from Elektro3 API</List.Item>
                    <List.Item>
                      Filter products by category, name, and stock status
                    </List.Item>
                    <List.Item>Import selected products to Shopify</List.Item>
                    <List.Item>Test API connections</List.Item>
                  </List>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Quick Actions
                  </Text>
                  <Button
                    fullWidth
                    onClick={() => navigate("/app/elektro3-importer")}
                  >
                    Elektro3 Importer
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => navigate("/app/connection-test")}
                  >
                    Connection Test
                  </Button>
                  <Button
                    fullWidth
                    onClick={generateProduct}
                    loading={isLoading}
                  >
                    Generate Sample Product
                  </Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>

        {/* Product creation result section */}
        {fetcher.data?.product && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Sample Product Created
                  </Text>
                  <InlineStack align="space-between">
                    <Text variant="bodyMd">
                      Product: {fetcher.data.product.title}
                    </Text>
                    <Button
                      url={`shopify:admin/products/${productId}`}
                      target="_blank"
                      variant="plain"
                    >
                      View in Shopify
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}
      </BlockStack>
    </Page>
  );
}
