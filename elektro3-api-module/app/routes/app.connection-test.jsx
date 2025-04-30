import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  Banner,
  SkeletonBodyText,
  BlockStack,
  Text,
  Divider,
} from "@shopify/polaris";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useSubmit,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  fetchProductsFromElektro3API,
  authenticate as authenticateElektro3,
} from "../../lib/elektro3-api.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  return json({
    elektro3ApiUrl: process.env.ELEKTRO3_API_URL || "Not configured",
    shopifyShop: process.env.SHOPIFY_SHOP || "Not configured",
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "test-elektro3") {
      // Test Elektro3 API connection
      try {
        await authenticateElektro3();
        return json({
          action: "test-elektro3",
          success: true,
          message: "Connection to Elektro3 API established successfully!",
        });
      } catch (error) {
        console.error("Error connecting to Elektro3 API:", error);
        return json({
          action: "test-elektro3",
          success: false,
          message: "Failed to connect to Elektro3 API",
          details: error.message,
        });
      }
    } else if (action === "test-shopify") {
      // Test Shopify API connection
      try {
        const response = await admin.graphql(
          `query {
            shop {
              name
              primaryDomain {
                url
              }
            }
          }`,
        );

        const responseJson = await response.json();
        const shop = responseJson.data.shop;

        return json({
          action: "test-shopify",
          success: true,
          message: "Connection to Shopify API established successfully!",
          shopName: shop.name,
          shopUrl: shop.primaryDomain.url,
        });
      } catch (error) {
        console.error("Error connecting to Shopify API:", error);
        return json({
          action: "test-shopify",
          success: false,
          message: "Failed to connect to Shopify API",
          details: error.message,
        });
      }
    } else if (action === "test-elektro3-products") {
      // Test Elektro3 API product retrieval
      try {
        const { products, categories } = await fetchProductsFromElektro3API({
          limit: 5,
        });

        return json({
          action: "test-elektro3-products",
          success: true,
          message: `Successfully retrieved ${products.length} products from Elektro3 API`,
          productCount: products.length,
          categoryCount: categories.length,
          sampleProduct:
            products.length > 0
              ? {
                  codigo: products[0].codigo,
                  nombre: products[0].nombre,
                  precio: products[0].precio,
                }
              : null,
        });
      } catch (error) {
        console.error("Error fetching products from Elektro3 API:", error);
        return json({
          action: "test-elektro3-products",
          success: false,
          message: "Failed to fetch products from Elektro3 API",
          details: error.message,
        });
      }
    }
  } catch (error) {
    console.error("Error performing connection test:", error);
    return json({
      success: false,
      message: "Error performing connection test",
      details: error.message,
    });
  }
};

export default function ConnectionTest() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";

  const [elektro3TestResult, setElektro3TestResult] = useState(null);
  const [shopifyTestResult, setShopifyTestResult] = useState(null);
  const [productsTestResult, setProductsTestResult] = useState(null);

  // Update state when action data is received
  if (actionData && !isLoading) {
    if (
      actionData.action === "test-elektro3" &&
      elektro3TestResult !== actionData
    ) {
      setElektro3TestResult(actionData);
    } else if (
      actionData.action === "test-shopify" &&
      shopifyTestResult !== actionData
    ) {
      setShopifyTestResult(actionData);
    } else if (
      actionData.action === "test-elektro3-products" &&
      productsTestResult !== actionData
    ) {
      setProductsTestResult(actionData);
    }
  }

  const handleTestElektro3 = () => {
    const formData = new FormData();
    formData.append("action", "test-elektro3");
    submit(formData, { method: "post" });
  };

  const handleTestShopify = () => {
    const formData = new FormData();
    formData.append("action", "test-shopify");
    submit(formData, { method: "post" });
  };

  const handleTestElektro3Products = () => {
    const formData = new FormData();
    formData.append("action", "test-elektro3-products");
    submit(formData, { method: "post" });
  };

  const renderTestResult = (result) => {
    if (!result) return null;

    return (
      <Banner
        title={result.message}
        status={result.success ? "success" : "critical"}
      >
        {result.details && <p>{result.details}</p>}
        {result.shopName && <p>Shop name: {result.shopName}</p>}
        {result.shopUrl && <p>Shop URL: {result.shopUrl}</p>}
        {result.productCount && <p>Products found: {result.productCount}</p>}
        {result.categoryCount && (
          <p>Categories found: {result.categoryCount}</p>
        )}
        {result.sampleProduct && (
          <div>
            <Text variant="headingSm">Sample product:</Text>
            <p>Code: {result.sampleProduct.codigo}</p>
            <p>Name: {result.sampleProduct.nombre}</p>
            <p>Price: {result.sampleProduct.precio}</p>
          </div>
        )}
      </Banner>
    );
  };

  return (
    <Page
      title="API Connection Test"
      subtitle="Test your connections to Elektro3 and Shopify APIs"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd">Configuration</Text>
              <BlockStack gap="2">
                <Text>Elektro3 API URL: {loaderData.elektro3ApiUrl}</Text>
                <Text>Shopify Shop: {loaderData.shopifyShop}</Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd">Elektro3 API Connection</Text>
              <div>
                <Button
                  onClick={handleTestElektro3}
                  loading={
                    isLoading &&
                    navigation.formData?.get("action") === "test-elektro3"
                  }
                >
                  Test Elektro3 Connection
                </Button>
              </div>
              {isLoading &&
              navigation.formData?.get("action") === "test-elektro3" ? (
                <SkeletonBodyText lines={3} />
              ) : (
                renderTestResult(elektro3TestResult)
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd">Elektro3 Products</Text>
              <div>
                <Button
                  onClick={handleTestElektro3Products}
                  loading={
                    isLoading &&
                    navigation.formData?.get("action") ===
                      "test-elektro3-products"
                  }
                >
                  Test Product Retrieval
                </Button>
              </div>
              {isLoading &&
              navigation.formData?.get("action") ===
                "test-elektro3-products" ? (
                <SkeletonBodyText lines={5} />
              ) : (
                renderTestResult(productsTestResult)
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="4">
              <Text variant="headingMd">Shopify API Connection</Text>
              <div>
                <Button
                  onClick={handleTestShopify}
                  loading={
                    isLoading &&
                    navigation.formData?.get("action") === "test-shopify"
                  }
                >
                  Test Shopify Connection
                </Button>
              </div>
              {isLoading &&
              navigation.formData?.get("action") === "test-shopify" ? (
                <SkeletonBodyText lines={3} />
              ) : (
                renderTestResult(shopifyTestResult)
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
