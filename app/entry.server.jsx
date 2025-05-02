import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createRequestHandler } from "@remix-run/express";
import { renderToString } from "react-dom/server";
import { isRouteErrorResponse } from "@remix-run/react";

export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
  loadContext
) {
  // Configura uma função de tratamento de erro global
  if (remixContext.staticHandlerContext?.serverHandoffString) {
    try {
      const { loaderErrors, actionErrors } = JSON.parse(
        remixContext.staticHandlerContext.serverHandoffString
      );

      if (loaderErrors || actionErrors) {
        console.error("Erros detectados no contexto do servidor:", {
          loaderErrors,
          actionErrors,
        });
      }
    } catch (error) {
      // Ignora erros de parsing JSON
    }
  }

  let markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}

export function handleError(error, { request }) {
  // Log detalhado do erro para fins de depuração no servidor
  console.error("Erro não tratado no servidor:", {
    message: error.message,
    stack: error.stack,
    url: request?.url,
    method: request?.method,
  });

  // Se for um erro de rota do Remix, adicione informações adicionais
  if (isRouteErrorResponse(error)) {
    console.error("Detalhes do erro de rota:", {
      data: error.data,
      status: error.status,
      statusText: error.statusText,
    });
  }

  // Você pode integrar com serviços de monitoramento de erros aqui
  // como Sentry, LogRocket, etc.

  return error;
}

// Configuração para Vercel
export const config = {
  runtime: "nodejs",
};
