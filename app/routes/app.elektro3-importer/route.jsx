import { useState, useCallback, useEffect } from "react";
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
  ProgressBar,
  InlineStack,
} from "@shopify/polaris";
import {
  useLoaderData,
  useSubmit,
  useNavigation as useRemixNavigation,
  useActionData,
} from "@remix-run/react";
import { useNavigate } from "../../utils/navigation-helper";
import { json } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import {
  fetchProductsFromElektro3API,
  importProductsToShopify,
  fetchCategories,
  testConnections,
} from "../../lib/elektro3-api.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const category = url.searchParams.get("category") || "";
  const query = url.searchParams.get("query") || "";
  const inStock = url.searchParams.get("inStock") === "true";
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const testConnection = url.searchParams.get("testConnection") === "true";

  // Testar conexões se solicitado
  if (testConnection) {
    try {
      const connectionStatus = await testConnections();
      return json({
        connectionStatus,
        products: [],
        categories: [],
        totalProducts: 0,
        filters: { category, query, inStock, page },
      });
    } catch (error) {
      console.error("Erro ao testar conexões:", error);
      return json({
        connectionStatus: {
          elektro3: { success: false, message: error.message },
          shopify: { success: false, message: "Não testado" },
        },
        products: [],
        categories: [],
        totalProducts: 0,
        filters: { category, query, inStock, page },
        error: "Falha ao testar conexões",
      });
    }
  }

  // Buscar categorias e produtos da API Elektro3
  try {
    // Obter categorias
    const categories = await fetchCategories();

    // Preparar filtros para a busca de produtos
    const productFilters = {};

    if (category) productFilters.codigo_categoria = category;
    if (query) productFilters.search = query;
    if (inStock) productFilters.stock_gt = 0;

    // Buscar produtos com os filtros
    const { products, totalProducts, totalPages, currentPage } =
      await fetchProductsFromElektro3API({
        filter:
          Object.keys(productFilters).length > 0 ? productFilters : undefined,
        page,
        limit: 20,
      });

    return json({
      products,
      categories,
      totalProducts,
      totalPages,
      currentPage,
      filters: { category, query, inStock, page },
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return json({
      products: [],
      categories: [],
      totalProducts: 0,
      filters: { category, query, inStock, page },
      error: `Falha ao buscar produtos da API Elektro3: ${error.message}`,
    });
  }
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productsToImport = JSON.parse(formData.get("products"));

  try {
    // Importar produtos para o Shopify usando nossa função especializada
    const results = await importProductsToShopify(productsToImport);

    return json({
      status: "success",
      message: `Importação concluída. ${results.filter((r) => r.status === "success").length} produtos importados com sucesso.`,
      total: productsToImport.length,
      successCount: results.filter((r) => r.status === "success").length,
      errorCount: results.filter((r) => r.status === "error").length,
      results: results,
    });
  } catch (error) {
    console.error("Erro ao importar produtos:", error);
    return json({
      status: "error",
      message: "Falha ao importar produtos para o Shopify",
      errorDetails: error.message,
    });
  }
};

export default function Elektro3Importer() {
  const loaderData = useLoaderData();
  const {
    products = [],
    categories = [],
    totalProducts = 0,
    totalPages = 1,
    currentPage = 1,
    filters = { category: "", query: "", inStock: false, page: 1 },
    error,
    connectionStatus,
  } = loaderData;

  const actionData = useActionData();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isImportingProducts, setIsImportingProducts] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const submit = useSubmit();
  const navigate = useNavigate();
  const navigation = useRemixNavigation();
  const isLoading =
    navigation.state === "loading" || navigation.state === "submitting";

  // Atualizar resultados de importação quando os dados da ação forem recebidos
  useEffect(() => {
    if (actionData && actionData.status) {
      setImportResults(actionData);
      setSelectedProducts([]);
    }
  }, [actionData]);

  // Tratar mudanças de seleção
  const handleSelectionChange = useCallback(
    (selectedIds) => {
      const selected = products.filter((product) =>
        selectedIds.includes(product.codigo)
      );
      setSelectedProducts(selected);
    },
    [products]
  );

  // Tratar mudanças de filtro
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
    [submit]
  );

  // Testar conexões
  const handleTestConnections = useCallback(() => {
    const searchParams = new URLSearchParams();
    searchParams.set("testConnection", "true");
    submit(searchParams, { replace: true, method: "get" });
    setIsConnectModalOpen(true);
  }, [submit]);

  // Importar produtos
  const handleImportProducts = useCallback(() => {
    setIsImportingProducts(true);

    const formData = new FormData();
    formData.append("products", JSON.stringify(selectedProducts));

    submit(formData, {
      method: "post",
      replace: true,
    });

    // Fechar modal após envio
    setIsImportModalOpen(false);
  }, [selectedProducts, submit]);

  // Renderizar item de produto na lista
  const renderItem = (item) => {
    const {
      codigo,
      nombre,
      imagen,
      precio,
      stock,
      marca,
      categoria,
      subfamilia,
    } = item;

    return (
      <ResourceList.Item
        id={codigo}
        accessibilityLabel={`Ver detalhes de ${nombre}`}
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
                {stock > 0 ? `${stock} em estoque` : "Sem estoque"}
              </Badge>
            </div>
            <div style={{ marginTop: "4px" }}>
              <Text variant="bodyMd">Marca: {marca}</Text>
              <Text variant="bodyMd">Categoria: {categoria}</Text>
              {subfamilia && (
                <Text variant="bodyMd">Subcategoria: {subfamilia}</Text>
              )}
            </div>
          </div>
        </div>
      </ResourceList.Item>
    );
  };

  // Controle de filtros
  const filterControl = (
    <Filters
      queryValue={filters.query}
      queryPlaceholder="Buscar produtos..."
      filters={[
        {
          key: "category",
          label: "Categoria",
          filter: (
            <div style={{ padding: "8px" }}>
              <select
                value={filters.category}
                onChange={(e) =>
                  handleFilterChange({
                    ...filters,
                    category: e.target.value,
                    page: 1,
                  })
                }
                style={{ width: "100%", padding: "8px" }}
              >
                <option value="">Todas as Categorias</option>
                {categories.map((category) => (
                  <option
                    key={category.codigo_categoria || category.id}
                    value={category.codigo_categoria || category.id}
                  >
                    {category.categoria || category.name}
                  </option>
                ))}
              </select>
            </div>
          ),
          shortcut: true,
        },
        {
          key: "inStock",
          label: "Disponível em estoque",
          filter: (
            <div style={{ padding: "8px" }}>
              <Button
                pressed={filters.inStock}
                onClick={() =>
                  handleFilterChange({
                    ...filters,
                    inStock: !filters.inStock,
                    page: 1,
                  })
                }
              >
                {filters.inStock ? "Sim" : "Não"}
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

  // Controle de paginação
  const paginationMarkup = (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
    >
      <Button
        disabled={currentPage <= 1}
        onClick={() =>
          handleFilterChange({ ...filters, page: currentPage - 1 })
        }
      >
        Anterior
      </Button>
      <div style={{ margin: "0 10px", lineHeight: "36px" }}>
        Página {currentPage} de {totalPages || 1}
      </div>
      <Button
        disabled={currentPage >= totalPages || products.length < 20}
        onClick={() =>
          handleFilterChange({ ...filters, page: currentPage + 1 })
        }
      >
        Próxima
      </Button>
    </div>
  );

  // Banner de resultados de importação
  const importResultsBanner = importResults && (
    <Banner
      status={importResults.status === "success" ? "success" : "critical"}
      title={importResults.message}
      onDismiss={() => setImportResults(null)}
    >
      <p>
        Total: {importResults.total} | Sucesso: {importResults.successCount} |
        Erros: {importResults.errorCount}
      </p>

      {importResults.results &&
        importResults.results.some((r) => r.status === "error") && (
          <div style={{ marginTop: "10px" }}>
            <Text variant="headingSm">Detalhes dos erros:</Text>
            <ul>
              {importResults.results
                .filter((r) => r.status === "error")
                .map((result) => (
                  <li key={result.elektro3Id}>
                    {result.elektro3Id}: {result.error}
                  </li>
                ))}
            </ul>
          </div>
        )}
    </Banner>
  );

  return (
    <Page
      title="Importador de Produtos Elektro3"
      primaryAction={{
        content: "Importar Produtos Selecionados",
        disabled: selectedProducts.length === 0,
        onAction: () => setIsImportModalOpen(true),
      }}
      secondaryActions={[
        {
          content: "Testar Conexões",
          onAction: handleTestConnections,
        },
      ]}
    >
      <Frame>
        {isLoading && <Loading />}

        {error && (
          <Banner status="critical" title="Ocorreu um erro">
            <p>{error}</p>
          </Banner>
        )}

        {importResultsBanner}

        <Layout>
          <Layout.Section>
            <LegacyCard>
              <ResourceList
                resourceName={{ singular: "produto", plural: "produtos" }}
                items={products}
                renderItem={renderItem}
                selectedItems={selectedProducts.map((p) => p.codigo)}
                onSelectionChange={handleSelectionChange}
                selectable
                filterControl={filterControl}
                emptyState={
                  <EmptyState
                    heading="Nenhum produto encontrado"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Tente alterar seus critérios de busca ou filtros.</p>
                  </EmptyState>
                }
              />
              {products.length > 0 && paginationMarkup}
            </LegacyCard>
          </Layout.Section>
        </Layout>

        {/* Modal de importação */}
        <Modal
          open={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Importar Produtos"
          primaryAction={{
            content: "Importar Produtos",
            onAction: handleImportProducts,
            loading: isImportingProducts,
          }}
          secondaryActions={[
            {
              content: "Cancelar",
              onAction: () => setIsImportModalOpen(false),
            },
          ]}
        >
          <Modal.Section>
            <Text>
              Você está prestes a importar {selectedProducts.length} produtos
              para sua loja Shopify. Esta ação não pode ser desfeita. Deseja
              continuar?
            </Text>

            <div style={{ marginTop: "20px" }}>
              <Text variant="headingMd">Produtos Selecionados:</Text>
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

        {/* Modal de teste de conexão */}
        <Modal
          open={isConnectModalOpen && !!connectionStatus}
          onClose={() => setIsConnectModalOpen(false)}
          title="Status das Conexões"
        >
          <Modal.Section>
            {connectionStatus && (
              <InlineStack spacing="loose">
                <InlineStack.Item>
                  <Text variant="headingMd">Elektro3 API</Text>
                  <Banner
                    status={
                      connectionStatus.elektro3.success ? "success" : "critical"
                    }
                    title={
                      connectionStatus.elektro3.success
                        ? "Conectado"
                        : "Falha na conexão"
                    }
                  >
                    <p>{connectionStatus.elektro3.message}</p>
                    {connectionStatus.elektro3.token && (
                      <p>Token: {connectionStatus.elektro3.token}</p>
                    )}
                  </Banner>
                </InlineStack.Item>

                <InlineStack.Item>
                  <Text variant="headingMd">Shopify API</Text>
                  <Banner
                    status={
                      connectionStatus.shopify.success ? "success" : "critical"
                    }
                    title={
                      connectionStatus.shopify.success
                        ? "Conectado"
                        : "Falha na conexão"
                    }
                  >
                    <p>{connectionStatus.shopify.message}</p>
                    {connectionStatus.shopify.shopName && (
                      <p>Loja: {connectionStatus.shopify.shopName}</p>
                    )}
                  </Banner>
                </InlineStack.Item>

                <InlineStack.Item>
                  <Button onClick={() => setIsConnectModalOpen(false)}>
                    Fechar
                  </Button>
                </InlineStack.Item>
              </InlineStack>
            )}
          </Modal.Section>
        </Modal>
      </Frame>
    </Page>
  );
}
