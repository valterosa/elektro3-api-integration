import { useEffect } from "react";

/**
 * Componente para lidar com redirecionamentos OAuth
 * Este componente verifica se há um URL de redirecionamento OAuth na resposta e o segue automaticamente
 */
export function OAuthRedirect({ redirectUrl }) {
  useEffect(() => {
    if (redirectUrl && typeof window !== "undefined") {
      console.log("OAuthRedirect: Redirecionando para", redirectUrl);
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  // Renderiza uma mensagem enquanto redireciona
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
        maxWidth: "500px",
        margin: "100px auto",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Redirecionando...
      </h1>
      <p style={{ marginBottom: "1.5rem" }}>
        Você será redirecionado para o Shopify para continuar o processo de
        instalação.
      </p>
      <p style={{ fontSize: "0.875rem", color: "#666" }}>
        Se não for redirecionado automaticamente,
        <a
          href={redirectUrl}
          style={{ color: "#007bff", marginLeft: "0.25rem" }}
        >
          clique aqui
        </a>
        .
      </p>
    </div>
  );
}
