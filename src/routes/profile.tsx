import { createFileRoute } from "@tanstack/react-router";
import { TopNav } from "@/components/TopNav";
import parisBg from "@/assets/paris-map-bg.jpg";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Pencil, Save, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TelegramConnect } from "@/components/TelegramConnect";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRY_CODES } from "@/lib/country-codes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Mi perfil — Liberté" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, fullName, avatarUrl, profile, refreshAvatar, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable draft
  const [dFullName, setDFullName] = useState("");
  const [dPhone, setDPhone] = useState("");
  const [dNationality, setDNationality] = useState("");
  const [dCountry, setDCountry] = useState("");
  const [dBirth, setDBirth] = useState<Date | undefined>(undefined);
  const [dObjective, setDObjective] = useState("");
  const [dMotherTongue, setDMotherTongue] = useState("");

  useEffect(() => {
    if (!profile) return;
    setDFullName(profile.full_name ?? "");
    setDPhone(profile.phone ?? "");
    setDNationality(profile.nationality ?? "");
    setDCountry(profile.country_residence ?? "");
    setDBirth(profile.birth_date ? parseISO(profile.birth_date) : undefined);
    setDObjective(profile.objective ?? "");
    setDMotherTongue(profile.mother_tongue ?? "");
  }, [profile, editing]);

  const displayName = fullName || user?.email?.split("@")[0] || "Estudiante";
  const initial = displayName.charAt(0).toUpperCase();
  const email = user?.email ?? "—";
  const enrolled = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const birthDisplay = profile?.birth_date
    ? format(parseISO(profile.birth_date), "d 'de' MMMM, yyyy", { locale: es })
    : "—";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Elige una imagen (JPG o PNG).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe pesar menos de 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      await refreshAvatar();
      toast.success("¡Foto actualizada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: dFullName.trim() || "",
          phone: dPhone.trim() || null,
          nationality: dNationality.trim() || null,
          country_residence: dCountry.trim() || null,
          birth_date: dBirth ? format(dBirth, "yyyy-MM-dd") : null,
          objective: dObjective.trim() || null,
          mother_tongue: dMotherTongue.trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Perfil actualizado");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center md:bg-fixed"
      style={{
        backgroundImage: `linear-gradient(180deg, oklch(0.42 0.075 265 / 0.78) 0%, oklch(0.32 0.08 265 / 0.90) 100%), url(${parisBg})`,
      }}
    >
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-card shadow-card">
          <div className="h-32 bg-gradient-navy" />
          <div className="-mt-12 px-6 pb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="relative inline-block">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-gradient-blue font-display text-3xl font-extrabold text-white shadow-card">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  aria-label="Cambiar foto de perfil"
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-blue text-white shadow-card transition hover:bg-navy disabled:opacity-70"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFile}
                  className="hidden"
                />
              </div>
              {!editing ? (
                <Button onClick={() => setEditing(true)} className="mt-14 gap-2 bg-blue text-white hover:bg-navy">
                  <Pencil className="h-4 w-4" /> Editar datos
                </Button>
              ) : (
                <div className="mt-14 flex gap-2">
                  <Button onClick={() => setEditing(false)} variant="outline" className="gap-2">
                    <X className="h-4 w-4" /> Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="gap-2 bg-blue text-white hover:bg-navy">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
                  </Button>
                </div>
              )}
            </div>

            <h1 className="mt-4 font-display text-3xl font-extrabold text-navy">{displayName}</h1>
            <p className="text-sm text-muted-foreground">Inscrita el {enrolled}</p>

            {!editing ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nombre completo" value={profile?.full_name || displayName} />
                <Field label="Email" value={email} />
                <Field label="Teléfono" value={profile?.phone || "—"} />
                <Field label="Nacionalidad" value={profile?.nationality || "—"} />
                <Field label="País de residencia" value={profile?.country_residence || "—"} />
                <Field label="Fecha de nacimiento" value={birthDisplay} />
                <Field label="Idioma materno" value={profile?.mother_tongue || "—"} />
                <Field label="Objetivo" value={profile?.objective || "—"} />
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <EditField label="Nombre completo">
                  <Input value={dFullName} onChange={(e) => setDFullName(e.target.value)} />
                </EditField>
                <EditField label="Email">
                  <Input value={email} disabled />
                </EditField>
                <EditField label="Teléfono">
                  <Input value={dPhone} onChange={(e) => setDPhone(e.target.value)} placeholder="+52 55 1234 5678" />
                </EditField>
                <EditField label="Nacionalidad">
                  <Input value={dNationality} onChange={(e) => setDNationality(e.target.value)} placeholder="Mexicana" />
                </EditField>
                <EditField label="País de residencia">
                  <Select value={dCountry} onValueChange={setDCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((c) => (
                        <SelectItem key={`${c.iso}-${c.code}`} value={c.name}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </EditField>
                <EditField label="Fecha de nacimiento">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !dBirth && "text-muted-foreground")}
                      >
                        {dBirth ? format(dBirth, "d 'de' MMMM, yyyy", { locale: es }) : "Elegir fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dBirth}
                        onSelect={setDBirth}
                        defaultMonth={dBirth ?? new Date(1995, 0)}
                        captionLayout="dropdown"
                        fromYear={1930}
                        toYear={new Date().getFullYear()}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </EditField>
                <EditField label="Idioma materno">
                  <Input value={dMotherTongue} onChange={(e) => setDMotherTongue(e.target.value)} placeholder="Español" />
                </EditField>
                <EditField label="Objetivo">
                  <Input value={dObjective} onChange={(e) => setDObjective(e.target.value)} placeholder="Nivel B1 en 6 meses" />
                </EditField>
              </div>
            )}
          </div>
        </div>

        <TelegramConnect />
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-ice p-4">
      <p className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-medium break-words text-navy">{value}</p>
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-ice p-4">
      <Label className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
