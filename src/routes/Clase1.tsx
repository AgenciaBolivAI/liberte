import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/Clase1")({
  beforeLoad: () => {
    throw redirect({ to: "/clasesenvivo/m1c1" });
  },
});
