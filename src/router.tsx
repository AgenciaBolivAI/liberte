import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Fetch a route's chunk while the student is still hovering/touching the
    // tile. The day player pulls ~1.5 MB of lesson data, and with no preloading
    // that download only started on click — the client's "tarda mucho en abrir".
    defaultPreload: "intent",
  });

  return router;
};
