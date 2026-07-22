import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import liberteLogoFull from "@/assets/liberte-logo-full.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Restablecer contraseña — Liberté" }] }),
  component: ResetPasswordPage,
});

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres");

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // The recovery link signs the user in via the URL hash; the session may
    // arrive a moment after mount, so listen instead of checking only once.
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) setHasSession(true);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (session) {
        setHasSession(true);
        setChecking(false);
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("No pudimos actualizar la contraseña. Pide un nuevo enlace e inténtalo otra vez.");
        return;
      }
      toast.success("¡Contraseña actualizada!");
      navigate({ to: "/liberte-plataforma-834798234728482934254-student", replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8"
      style={{ background: "linear-gradient(135deg, #EDF8FC 0%, #F5F0E8 100%)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-10 shadow-2xl"
        style={{ boxShadow: "0 30px 80px -20px rgba(30,58,95,0.35)" }}
      >
        <img src={liberteLogoFull.url} alt="Liberté · Instituto de Francés" className="h-14 w-auto" />
        <h1
          className="mt-4 text-2xl font-bold tracking-tight"
          style={{ color: "#1E3A5F", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Nueva contraseña
        </h1>

        {checking && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {!checking && !hasSession && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">
              Este enlace no es válido o ya expiró. Pide uno nuevo desde la página de inicio de
              sesión con «¿Olvidaste tu contraseña?».
            </p>
            <Button asChild className="h-11 w-full rounded-xl" style={{ backgroundColor: "#4FB2EA", color: "white" }}>
              <Link to="/liberte-log-in-983749824923465723">Ir a iniciar sesión</Link>
            </Button>
          </div>
        )}

        {!checking && hasSession && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-slate-700">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/60 pr-10 focus-visible:ring-[#4FB2EA]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-slate-700">
                Confirma la contraseña
              </Label>
              <Input
                id="confirm-password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:ring-[#4FB2EA]"
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="mt-2 h-11 w-full rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
              style={{ backgroundColor: "#4FB2EA", color: "white" }}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
