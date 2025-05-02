import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Integração Elektro3 para Shopify</h1>
        <p className={styles.text}>
          Sincronize automaticamente seus produtos, clientes e pedidos entre o
          Elektro3 e sua loja Shopify.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Domínio da loja</span>
              <input className={styles.input} type="text" name="shop" />
              <span>exemplo: sua-loja.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Entrar
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Importação de produtos</strong>. Sincronize automaticamente
            seu catálogo de produtos do Elektro3 para o Shopify, incluindo
            imagens, variantes e estoque.
          </li>
          <li>
            <strong>Sincronização de pedidos</strong>. Mantenha seus pedidos
            atualizados entre os dois sistemas, garantindo que seu estoque
            esteja sempre correto.
          </li>
          <li>
            <strong>Gestão de clientes</strong>. Acesse seus clientes do
            Elektro3 diretamente no Shopify e mantenha todos os dados
            atualizados.
          </li>
        </ul>
      </div>
    </div>
  );
}
