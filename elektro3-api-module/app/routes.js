import { flatRoutes } from "@remix-run/fs-routes";

export default flatRoutes({
  // Don't exclude any routes to ensure all routes are included in the build
  exclude: [],
});
