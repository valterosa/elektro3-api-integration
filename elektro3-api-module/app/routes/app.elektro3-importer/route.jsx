import { useState, useCallback } from "react";
import {
  Page,
  Layout,
  LegacyCard,
  ResourceList,
  Filters,
  Button,
  Thumbnail,
  Text,
  Badge,
  Banner,
  Modal,
  Loading,
  Frame,
  EmptyState,
} from "@shopify/polaris";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { fetchProductsFromElektro3API } from "../../lib/elektro3-api.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const category = url.searchParams.get("category") || "";
  const query = url.searchParams.get("query") || "";
  const inStock = url.searchParams.get("inStock") === "true";
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  // Fetch products from Elektro3 API with filters
  try {
    const { products, categories, totalProducts } =
      await fetchProductsFromElektro3API({
        category,
        query,
        inStock,
        page,
        limit: 20,
      });

    return json({
      products,
      categories,
      totalProducts,
      filters: { category, query, inStock, page },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return json({
      products: [],
      categories: [],
      totalProducts: 0,
      filters: { category, query, inStock, page },
      error: "Failed to fetch products from Elektro3 API",
    });
  }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productsToImport = JSON.parse(formData.get("products"));

  try {
    const results = [];

    // Import products to Shopify
    for (const product of productsToImport) {
      try {
        // Transform Elektro3 product to Shopify product format
        const shopifyProduct = {
          title: product.nombre || "Produto sem nome",
          body_html: product.descripcion || "",
          vendor: product.marca || "Elektro3",
          product_type: product.subfamilia || product.categoria || "",
          tags: `${product.codigo_familia || ""}, ${product.subfamilia || ""}`.trim(),
          status: "active",
          variants: [
            {
              price: product.precio?.toString() || "0.00",
              inventory_quantity: product.stock || 0,
              requires_shipping: true,
              sku: product.codigo || "",
              barcode: product.ean13 || "",
              weight: product.peso || 0,
              weight_unit: "kg",
            },
          ],
          images: [],
        };

        // Add main image if it exists
        if (product.imagen) {
          shopifyProduct.images.push({
            src: product.imagen,
          });
        }

        // Add additional images if they exist
        if (
          product.imagenes_adicionales &&
          Array.isArray(product.imagenes_adicionales)
        ) {
          product.imagenes_adicionales.forEach((img) => {
            if (img.imagen) {
              shopifyProduct.images.push({
                src: img.imagen,
              });
            }
          });
        }

        // Create product in Shopify
        const response = await admin.graphql(
          `
          mutation productCreate($input: ProductInput!) {
            productCreate(input: $input) {
              product {
                id
                title
              }
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              input: shopifyProduct,
            },
          },
        );

        const responseJson = await response.json();
        const { productCreate } = responseJson.data;

        if (productCreate.userErrors.length > 0) {
          throw new Error(productCreate.userErrors[0].message);
        }

        results.push({
          elektro3Id: product.codigo,
          shopifyId: productCreate.product.id,
          title: shopifyProduct.title,
          status: "success",
        });
      } catch (productError) {
        console.error(
          `Error importing product ${product.codigo || "unknown"}:`,
          productError,
        );
        results.push({
          elektro3Id: product.codigo,
          error: productError.message,
          status: "error",
        });
      }
    }

    return json({
      status: "success",
      message: `Import completed. ${results.filter((r) => r.status === "success").length} products successfully imported.`,
      total: productsToImport.length,
      successCount: results.filter((r) => r.status === "success").length,
      errors: results.filter((r) => r.status === "error").length,
      results: results,
    });
  } catch (error) {
    console.error("Error importing products:", error);
    return json({
      success: false,
      error: "Failed to import products to Shopify",
      details: error.message,
    });
  }
};

export default function Elektro3Importer() {
  const { products, categories, totalProducts, filters, error } =
    useLoaderData();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportingProducts, setIsImportingProducts] = useState(false);
  const submit = useSubmit();
  const navigation = useNavigation();
  const isLoading =
    navigation.state === "loading" || navigation.state === "submitting";

  const handleSelectionChange = useCallback(
    (selectedIds) => {
      const selected = products.filter((product) =>
        selectedIds.includes(product.codigo),
      );
      setSelectedProducts(selected);
    },
    [products],
  );

  const handleFilterChange = useCallback(
    (newFilters) => {
      const searchParams = new URLSearchParams();

      if (newFilters.category)
        searchParams.set("category", newFilters.category);
      if (newFilters.query) searchParams.set("query", newFilters.query);
      if (newFilters.inStock) searchParams.set("inStock", newFilters.inStock);
      searchParams.set("page", newFilters.page || "1");

      submit(searchParams, { replace: true, method: "get" });
    },
    [submit],
  );

  const handleImportProducts = useCallback(() => {
    setIsImportingProducts(true);

    const formData = new FormData();
    formData.append("products", JSON.stringify(selectedProducts));

    submit(formData, {
      method: "post",
      replace: true,
    });

    // Close modal after submission
    setIsImportModalOpen(false);
    setIsImportingProducts(false);
  }, [selectedProducts, submit]);

  const renderItem = (item) => {
    const { codigo, nombre, imagen, precio, stock, marca, categoria } = item;

    return (
      <ResourceList.Item
        id={codigo}
        accessibilityLabel={`View details for ${nombre}`}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ marginRight: "20px" }}>
            <Thumbnail
              source={imagen || "https://via.placeholder.com/50"}
              alt={nombre}
              size="medium"
            />
          </div>

          <div style={{ flex: 1 }}>
            <Text variant="bodyMd" fontWeight="bold" as="h3">
              {nombre}
            </Text>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <Text variant="bodyMd">SKU: {codigo}</Text>
              <Text variant="bodyMd">€{Number(precio).toFixed(2)}</Text>
              <Badge status={stock > 0 ? "success" : "critical"}>
                {stock > 0 ? `${stock} in stock` : "Out of stock"}
              </Badge>
            </div>
            <div style={{ marginTop: "4px" }}>
              <Text variant="bodyMd">Marca: {marca}</Text>
              <Text variant="bodyMd">Categoria: {categoria}</Text>
            </div>
          </div>
        </div>
      </ResourceList.Item>
    );
  };

  const filterControl = (
    <Filters
      queryValue={filters.query}
      queryPlaceholder="Search products..."
      filters={[
        {
          key: "category",
          label: "Category",
          filter: (
            <div style={{ padding: "8px" }}>
              <select
                value={filters.category}
                onChange={(e) =>
                  handleFilterChange({ ...filters, category: e.target.value })
                }
                style={{ width: "100%", padding: "8px" }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option
                    key={category.codigo_categoria}
                    value={category.codigo_categoria}
                  >
                    {category.categoria}
                  </option>
                ))}
              </select>
            </div>
          ),
          shortcut: true,
        },
        {
          key: "inStock",
          label: "Available in stock",
          filter: (
            <div style={{ padding: "8px" }}>
              <Button
                pressed={filters.inStock}
                onClick={() =>
                  handleFilterChange({ ...filters, inStock: !filters.inStock })
                }
              >
                {filters.inStock ? "Yes" : "No"}
              </Button>
            </div>
          ),
        },
      ]}
      onQueryChange={(query) =>
        handleFilterChange({ ...filters, query, page: 1 })
      }
      onQueryClear={() =>
        handleFilterChange({ ...filters, query: "", page: 1 })
      }
      onClearAll={() =>
        handleFilterChange({ category: "", query: "", inStock: false, page: 1 })
      }
    />
  );

  const paginationMarkup = (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
    >
      <Button
        disabled={filters.page <= 1}
        onClick={() =>
          handleFilterChange({ ...filters, page: filters.page - 1 })
        }
      >
        Previous
      </Button>
      <div style={{ margin: "0 10px", lineHeight: "36px" }}>
        Page {filters.page}
      </div>
      <Button
        disabled={products.length < 20}
        onClick={() =>
          handleFilterChange({ ...filters, page: filters.page + 1 })
        }
      >
        Next
      </Button>
    </div>
  );

  return (
    <Page
      title="Elektro3 Product Importer"
      primaryAction={{
        content: "Import Selected Products",
        disabled: selectedProducts.length === 0,
        onAction: () => setIsImportModalOpen(true),
      }}
    >
      <Frame>
        {isLoading && <Loading />}

        {error && (
          <Banner status="critical" title="There was an error">
            <p>{error}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <LegacyCard>
              <ResourceList
                resourceName={{ singular: "product", plural: "products" }}
                items={products}
                renderItem={renderItem}
                selectedItems={selectedProducts.map((p) => p.codigo)}
                onSelectionChange={handleSelectionChange}
                selectable
                filterControl={filterControl}
                emptyState={
                  <EmptyState
                    heading="No products found"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Try changing your search or filter criteria.</p>
                  </EmptyState>
                }
              />
              {products.length > 0 && paginationMarkup}
            </LegacyCard>
          </Layout.Section>
        </Layout>

        <Modal
          open={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Products"
          primaryAction={{
            content: "Import Products",
            onAction: handleImportProducts,
            loading: isImportingProducts,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setIsImportModalOpen(false),
            },
          ]}
        >
          <Modal.Section>
            <Text>
              You are about to import {selectedProducts.length} products to your
              Shopify store. This action cannot be undone. Do you want to
              continue?
            </Text>

            <div style={{ marginTop: "20px" }}>
              <Text variant="headingMd">Selected Products:</Text>
              <ul style={{ marginTop: "10px" }}>
                {selectedProducts.map((product) => (
                  <li key={product.codigo}>
                    {product.nombre} (SKU: {product.codigo})
                  </li>
                ))}
              </ul>
            </div>
          </Modal.Section>
        </Modal>
      </Frame>
    </Page>
  );
}
