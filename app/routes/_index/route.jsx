import { redirect } from "@remix-run/node";

// Simplified loader that always redirects to the app
export const loader = async ({ request }) => {
  // Just redirect directly to the app route which will use the API token
  return redirect("/app");
};

// We won't need the component anymore since we're always redirecting
export default function App() {
  return null;
}
