import { createFileRoute } from "@tanstack/react-router";
import { ContentManager } from "@/components/ContentManager";
import { PlusResourcesManager } from "@/components/PlusResourcesManager";

export const Route = createFileRoute("/liberte-profesor-panel-9382745-admin/contenido")({
  component: ContenidoTab,
});

function ContenidoTab() {
  return (
    <>
      <ContentManager />
      <PlusResourcesManager />
    </>
  );
}
