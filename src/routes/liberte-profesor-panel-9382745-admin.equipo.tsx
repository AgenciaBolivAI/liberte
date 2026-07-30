import { createFileRoute } from "@tanstack/react-router";
import { StaffManager } from "@/components/StaffManager";
import { TelegramBroadcast } from "@/components/TelegramBroadcast";

export const Route = createFileRoute("/liberte-profesor-panel-9382745-admin/equipo")({
  component: EquipoTab,
});

function EquipoTab() {
  return (
    <>
      <TelegramBroadcast />
      <StaffManager />
    </>
  );
}
