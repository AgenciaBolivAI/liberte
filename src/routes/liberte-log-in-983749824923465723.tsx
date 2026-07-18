import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/AuthPage";

export const Route = createFileRoute("/liberte-log-in-983749824923465723")({
  head: () => ({
    meta: [
      { title: "Crea tu cuenta — Liberté Instituto de Francés" },
      {
        name: "description",
        content:
          "Regístrate en Liberté y accede a tus lecciones, ejercicios y progreso en cualquier momento.",
      },
    ],
  }),
  component: AuthPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Page introuvable.</div>,
});
