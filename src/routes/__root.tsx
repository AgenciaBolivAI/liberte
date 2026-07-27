import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { IntroSplash } from "@/components/IntroSplash";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGate } from "@/components/AuthGate";
import { TutorMascot } from "@/components/TutorMascot";
import { Toaster } from "@/components/ui/sonner";


// Both recovery links point at the STUDENT dashboard, not "/": the public
// marketing landing always shows "Iniciar sesión", so a logged-in student who
// hit an error and clicked home believed the app had signed them out
// ("me saca de la sesión y me pide la clave" — their session was intact).
const STUDENT_HOME = "/liberte-plataforma-834798234728482934254-student";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que tu cherches n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to={STUDENT_HOME}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu se charger
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un problème est survenu de notre côté. Réessaie, ou reviens à l'accueil — ta session
          et ta progression sont intactes.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href={STUDENT_HOME}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Liberté — Instituto de Francés" },
      { name: "description", content: "Tu programa premium de 6 meses para hablar francés. Aprende día a día con Liberté." },
      { name: "author", content: "Liberté Instituto de Francés" },
      { property: "og:title", content: "Liberté — Instituto de Francés" },
      { property: "og:description", content: "Tu programa premium de 6 meses para hablar francés. Aprende día a día con Liberté." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Liberté — Instituto de Francés" },
      { name: "twitter:description", content: "Tu programa premium de 6 meses para hablar francés. Aprende día a día con Liberté." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/ad190634-99f5-4668-a781-5553cb536cb1" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/ad190634-99f5-4668-a781-5553cb536cb1" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IntroSplash />
        <AuthGate>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </AuthGate>
        <TutorMascot />
        {/* Single app-wide toast host (was duplicated across 5 routes → double toasts). */}
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
