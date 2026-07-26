import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "@/components/AuthPage";

export const Route = createFileRoute("/liberte-log-in-983749824923465723")({
  head: () => ({
    meta: [
      { title: "Connexion — Liberté Institut de Français" },
      {
        name: "description",
        content:
          "Connecte-toi à Liberté pour accéder à tes leçons, exercices et progrès à tout moment.",
      },
    ],
  }),
  component: AuthPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Page introuvable.</div>,
});
