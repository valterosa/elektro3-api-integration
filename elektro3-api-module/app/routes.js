import { flatRoutes } from "@remix-run/fs-routes";

export default flatRoutes({
  exclude: [
    "webhooks.app.scopes_update",
    "webhooks.app.uninstalled",
    "auth.$"
  ]
});
