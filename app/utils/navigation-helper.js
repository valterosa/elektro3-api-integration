// Helper functions for navigation in embedded apps
import { useNavigate as useRemixNavigate } from "@remix-run/react";
import { useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

/**
 * Custom navigation hook for Shopify embedded apps
 * This ensures navigation works properly within the embedded app context
 */
export function useNavigate() {
  const appBridge = useAppBridge();
  const remixNavigate = useRemixNavigate();

  return useCallback(
    (to, options = {}) => {
      if (appBridge) {
        // Use App Bridge navigation for embedded app context
        Redirect.create(appBridge).dispatch(Redirect.Action.APP, to);
      } else {
        // Fall back to Remix navigation outside of embedded context
        remixNavigate(to, options);
      }
    },
    [appBridge, remixNavigate]
  );
}
