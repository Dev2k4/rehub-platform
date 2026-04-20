import { Box } from "@chakra-ui/react";
import {
  createRootRoute,
  Outlet,
  useMatchRoute,
  useRouterState,
} from "@tanstack/react-router";
import { ChatFloatingWidget } from "@/features/chat/components/ChatFloatingWidget";
import { MarketplaceHeader } from "@/features/home/components/MarketplaceHeader";
import { Footer } from "@/components/layout/Footer";

function AppLayout() {
  const matchRoute = useMatchRoute();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isHome = Boolean(matchRoute({ to: "/", fuzzy: false }));
  const isAuthFlow = pathname.startsWith("/auth");
  const isAdmin = pathname.startsWith("/admin");

  return (
    <Box minH="100vh" bg="gray.50">
      {!isHome && !isAuthFlow && (
        <Box position="fixed" top={0} left={0} right={0} zIndex={1000}>
          <MarketplaceHeader />
        </Box>
      )}
      <Box pt={isHome || isAuthFlow ? 0 : { base: "76px", sm: "92px" }}>
        <Outlet />
      </Box>
      <ChatFloatingWidget />
      {!isAdmin && !isAuthFlow && <Footer />}
    </Box>
  );
}

export const Route = createRootRoute({
  component: AppLayout,
});
