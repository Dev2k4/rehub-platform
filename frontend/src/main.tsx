import { ChakraProvider } from "@chakra-ui/react";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { ApiError, OpenAPI } from "./client";
import { Toaster } from "./components/ui/toaster";
import "./index.css";
import {
  clearTokens,
  getAccessToken,
} from "./features/auth/utils/auth.storage";
import { RealtimeBridge } from "./features/shared/realtime/RealtimeBridge";
import { WebSocketProvider } from "./features/shared/realtime/ws.provider";
// Import custom system theme
import { system } from "./theme";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

OpenAPI.BASE = import.meta.env.VITE_API_URL || "http://10.0.0.47:8000";
OpenAPI.TOKEN = async () => {
  return getAccessToken() || "";
};

// Listen for auth token changes
window.addEventListener("auth:token-changed", (event: Event) => {
  const customEvent = event as CustomEvent<{ token: string | null }>;
  OpenAPI.TOKEN = async () => customEvent.detail.token || "";
});

const handleApiError = (error: Error) => {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      // Clear auth tokens and redirect to login
      clearTokens();
      window.location.href = "/auth/login";
    }
  }
};
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleApiError,
  }),
  mutationCache: new MutationCache({
    onError: handleApiError,
  }),
});

const router = createRouter({ routeTree });
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <RealtimeBridge />
          <RouterProvider router={router} />
          <Toaster />
        </WebSocketProvider>
      </QueryClientProvider>
    </ChakraProvider>
  </StrictMode>,
);
