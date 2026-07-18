import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import signupImage from "@/assets/bon-voyage-signup.png.asset.json";
import mobileBanner from "@/assets/bon-voyage-mobile-banner.png.asset.json";
import liberteLogoFull from "@/assets/liberte-logo-full.png.asset.json";

const signInSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export function AuthPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    // Someone with an active session doesn't need the login form.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/liberte-plataforma-834798234728482934254-student", replace: true });
      }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = signInSchema.safeParse({ email, password });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) {
        toast.error("Correo o contraseña incorrectos.");
        return;
      }
      toast.success("¡Bon retour!");
      navigate({ to: "/liberte-plataforma-834798234728482934254-student" });
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email("Correo inválido").safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Same message whether or not the account exists — no user enumeration.
      toast.success("Si el correo existe, te enviamos un enlace para restablecer tu contraseña.");
      setForgotMode(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8"
      style={{ background: "linear-gradient(135deg, #EDF8FC 0%, #F5F0E8 100%)" }}
    >
      <Toaster position="top-center" richColors />
      <div
        className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl grid md:grid-cols-[40%_60%]"
        style={{ boxShadow: "0 30px 80px -20px rgba(30,58,95,0.35)" }}
      >
        <div
          className="relative hidden md:block"
          style={{
            background: "linear-gradient(160deg, #1E3A5F 0%, #23395E 60%, #3A4C73 100%)",
          }}
        >
          <img
            src={signupImage.url}
            alt="Bienvenue à Paris"
            className="absolute inset-0 h-full w-full object-cover opacity-95"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(30,58,95,0.15) 0%, rgba(30,58,95,0.55) 100%)",
            }}
          />
        </div>

        <div className="relative h-44 md:hidden overflow-hidden">
          <img
            src={mobileBanner.url}
            alt="Bon voyage"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-center">
          <div className="flex items-center">
            <img
              src={liberteLogoFull.url}
              alt="Liberté · Instituto de Francés"
              className="h-16 w-auto"
            />
          </div>

          <h1
            className="mt-4 text-3xl font-bold tracking-tight"
            style={{ color: "#1E3A5F", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {forgotMode ? "Restablecer contraseña" : "Inicia sesión"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {forgotMode
              ? "Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña."
              : "Bienvenido/a de vuelta. Continúa tu programa donde lo dejaste."}
          </p>

          <form onSubmit={forgotMode ? handleForgot : handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="h-11 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:ring-[#4FB2EA]"
              />
            </div>

            {!forgotMode && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">
                  Contraseña
                </Label>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: "#4FB2EA" }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  minLength={6}
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
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
              style={{ backgroundColor: "#4FB2EA", color: "white" }}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : forgotMode ? (
                "Enviar enlace"
              ) : (
                "Iniciar sesión"
              )}
            </Button>

            {forgotMode && (
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-center text-sm font-semibold hover:underline"
                style={{ color: "#4FB2EA" }}
              >
                ← Volver a iniciar sesión
              </button>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            ¿Nuevo/a en Liberté?{" "}
            <Link
              to="/liberte-frances-98273425-plataforma-834823"
              className="font-semibold hover:underline"
              style={{ color: "#4FB2EA" }}
            >
              Crea tu cuenta
            </Link>
          </p>

          <p className="mt-8 text-center text-[11px] text-slate-400">
            <Link to="/" className="hover:text-slate-600">
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
