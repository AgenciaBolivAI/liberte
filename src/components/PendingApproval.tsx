import { useState } from "react";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import mascot from "@/assets/liberte-mascot.png.asset.json";

export function PendingApproval({ denied = false }: { denied?: boolean } = {}) {
  const { refresh, user } = useAuth();
  const [checking, setChecking] = useState(false);

  async function handleCheck() {
    setChecking(true);
    try {
      await refresh();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1b3a] p-4">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-card">
        <img src={mascot.url} alt="Liberté" className="mx-auto h-24 w-auto" />
        <p
          className={`mt-4 text-xs font-extrabold tracking-widest uppercase ${denied ? "text-red-500" : "text-gold"}`}
        >
          {denied ? "Inscription non retenue" : "Compte en cours de vérification"}
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy">
          {denied
            ? "Merci de ton intérêt"
            : `Presque, ${user?.user_metadata?.full_name?.split(" ")[0] || "bienvenue"} ! 🎉`}
        </h1>
        <p className="mt-3 text-sm text-navy/80">
          {denied
            ? "Tu inscripción no fue aceptada por ahora. Si crees que es un error o quieres retomarla, escríbenos a hola@libertefrances.com y lo revisamos."
            : "Ton compte a bien été créé. L’équipe Liberté vérifie ton inscription et activera ton accès très bientôt — on te préviendra par e-mail."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={handleCheck}
            disabled={checking}
            className="h-11 rounded-xl bg-gradient-blue font-bold text-white"
          >
            {checking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Comprobar de nuevo
          </Button>
          <Button
            variant="outline"
            onClick={() => supabase.auth.signOut()}
            className="h-11 rounded-xl border-navy/20 text-navy"
          >
            <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
}
