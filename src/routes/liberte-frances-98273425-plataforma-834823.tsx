import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Loader2, Eye, EyeOff, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRY_CODES } from "@/lib/country-codes";
import liberteLogoFull from "@/assets/liberte-logo-full.png.asset.json";
import desktopImage from "@/assets/bienvenue-desktop.png.asset.json";
import mobileBanner from "@/assets/bon-voyage-mobile-banner.png.asset.json";

export const Route = createFileRoute("/liberte-frances-98273425-plataforma-834823")({
  head: () => ({
    meta: [
      { title: "Bienvenido a Liberté" },
      {
        name: "description",
        content: "Regístrate y comienza tu viaje al mundo del francés con Liberté.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: BienvenueLiberte,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Ingresa tu nombre completo").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  nationality: z.string().trim().min(2, "Ingresa tu nacionalidad").max(80),
  country_residence: z.string().trim().min(2, "Selecciona tu país de residencia").max(80),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona tu fecha de nacimiento"),
  phone: z
    .string()
    .trim()
    .min(6, "Ingresa un número válido con código de país")
    .max(30)
    .regex(/^\+?[0-9\s\-()]+$/, "Solo números y símbolos + - ( )"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100),
});

function BienvenueLiberte() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryResidence, setCountryResidence] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [dialCode, setDialCode] = useState("+52|MX");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const code = dialCode.split("|")[0];
      const fullPhone = `${code} ${phoneNumber.trim()}`.trim();
      const birthStr = birthDate ? format(birthDate, "yyyy-MM-dd") : "";
      const parsed = schema.safeParse({
        full_name: fullName,
        email,
        nationality,
        country_residence: countryResidence,
        birth_date: birthStr,
        phone: fullPhone,
        password,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: parsed.data.full_name,
            nationality: parsed.data.nationality,
            country_residence: parsed.data.country_residence,
            birth_date: parsed.data.birth_date,
            phone: parsed.data.phone,
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("registered")) {
          toast.error("Este correo ya está registrado. Inicia sesión.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("¡Cuenta creada! 🎉 Un miembro del equipo activará tu acceso muy pronto.");
      navigate({ to: "/liberte-plataforma-834798234728482934254-student" });
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error, intenta de nuevo");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8"
      style={{ background: "linear-gradient(135deg, #EDF8FC 0%, #F5F0E8 100%)" }}
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl grid md:grid-cols-[40%_60%]"
        style={{ boxShadow: "0 30px 80px -20px rgba(30,58,95,0.35)" }}
      >
        <div
          className="relative hidden md:block"
          style={{
            background:
              "linear-gradient(160deg, #1E3A5F 0%, #23395E 60%, #3A4C73 100%)",
          }}
        >
          <img
            src={desktopImage.url}
            alt="Bienvenue à Liberté"
            className="absolute inset-0 h-full w-full object-cover opacity-95"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(30,58,95,0.10) 0%, rgba(30,58,95,0.45) 100%)",
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
            Bienvenido a Liberté
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Comienza tu viaje al mundo del francés. Crea tu cuenta y entra directo a la plataforma.
          </p>


          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-slate-700">Nombre completo</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Tu nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
                disabled={loading}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:ring-[#4FB2EA]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:ring-[#4FB2EA]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  disabled={loading}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nationality" className="text-slate-700">Nacionalidad</Label>
                <Input
                  id="nationality"
                  type="text"
                  placeholder="Ej. Mexicana"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  autoComplete="country-name"
                  required
                  disabled={loading}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:ring-[#4FB2EA]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-slate-700">Celular</Label>
                <div className="flex gap-2">
                  <Select value={dialCode} onValueChange={setDialCode} disabled={loading}>
                    <SelectTrigger className="h-11 w-[110px] shrink-0 rounded-xl border-slate-200 bg-slate-50/60 focus:ring-[#4FB2EA]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={`${c.iso}-${c.code}`} value={`${c.code}|${c.iso}`}>
                          <span className="mr-2">{c.flag}</span>
                          <span className="tabular-nums">{c.code}</span>
                          <span className="ml-2 text-xs text-slate-500">{c.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="55 1234 5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoComplete="tel-national"
                    required
                    disabled={loading}
                    className="h-11 min-w-0 flex-1 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:ring-[#4FB2EA]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="birth_date" className="text-slate-700">Fecha de nacimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="birth_date"
                      type="button"
                      variant="outline"
                      disabled={loading}
                      className={cn(
                        "h-11 w-full justify-start rounded-xl border-slate-200 bg-slate-50/60 font-normal hover:bg-slate-50",
                        !birthDate && "text-slate-400",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                      {birthDate
                        ? format(birthDate, "d 'de' MMMM, yyyy", { locale: es })
                        : "Selecciona tu fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={birthDate}
                      onSelect={setBirthDate}
                      captionLayout="dropdown"
                      defaultMonth={birthDate ?? new Date(2000, 0)}
                      startMonth={new Date(1930, 0)}
                      endMonth={new Date()}
                      disabled={(date) => date > new Date() || date < new Date("1930-01-01")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country_residence" className="text-slate-700">País de residencia</Label>
                <Select value={countryResidence} onValueChange={setCountryResidence} disabled={loading}>
                  <SelectTrigger
                    id="country_residence"
                    className="h-11 w-full rounded-xl border-slate-200 bg-slate-50/60 focus:ring-[#4FB2EA]"
                  >
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={`res-${c.iso}`} value={c.name}>
                        <span className="mr-2">{c.flag}</span>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>


            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-xl text-base font-semibold shadow-md transition-all hover:shadow-lg"
              style={{ backgroundColor: "#4FB2EA", color: "white" }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta y entrar"
              )}
            </Button>
          </form>


          <p className="mt-6 text-center text-sm text-slate-600">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/liberte-log-in-983749824923465723"
              className="font-semibold hover:underline"
              style={{ color: "#4FB2EA" }}
            >
              Inicia sesión
            </Link>
          </p>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            © Liberté · Aprende francés con libertad
          </p>
        </div>
      </div>
    </div>
  );
}
