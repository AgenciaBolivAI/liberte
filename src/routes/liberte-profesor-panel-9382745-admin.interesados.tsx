import { createFileRoute } from "@tanstack/react-router";
import { LeadsInbox } from "@/components/LeadsInbox";

export const Route = createFileRoute("/liberte-profesor-panel-9382745-admin/interesados")({
  component: InteresadosTab,
});

function InteresadosTab() {
  return <LeadsInbox />;
}
