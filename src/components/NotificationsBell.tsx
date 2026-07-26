import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useIsStaff } from "@/lib/use-staff";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ---------- Unread Mensajes badge (client #7: "no hay notificaciones de
 * mensajes") — a live count for the nav item, for every user. ---------- */

export function useUnreadMessages(path?: string): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    const { count: c } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    setCount(c ?? 0);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-count on navigation too: opening a thread marks it read server-side,
  // so leaving /mensajes refreshes the badge without waiting for realtime.
  useEffect(() => {
    void load();
  }, [load, path]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("nav-unread-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, load]); // eslint-disable-line react-hooks/exhaustive-deps

  return count;
}

/* ---------- Activity notifications bell (teachers + admins) ---------- */

type Notif = {
  id: string;
  kind: string;
  payload: {
    student_id?: string;
    student_name?: string;
    day_id?: number;
    week_number?: number;
    score_10?: number;
    weekly_score?: number;
  };
  read_at: string | null;
  created_at: string;
};

function notifText(n: Notif): string {
  const who = n.payload.student_name || "Un alumno";
  if (n.kind === "day_completed") return `${who} completó el Día ${n.payload.day_id}`;
  if (n.kind === "defi_submitted")
    return `${who} envió el défi del Día ${n.payload.day_id}` +
      (n.payload.score_10 != null ? ` · ${Number(n.payload.score_10).toFixed(1)}/10` : "");
  if (n.kind === "weekly_evaluated")
    return `${who} terminó la evaluación de la Semana ${n.payload.week_number}` +
      (n.payload.weekly_score != null ? ` · ${Number(n.payload.weekly_score).toFixed(1)}/10` : "");
  return `${who}: actividad nueva`;
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

/** Bell with unread badge. Renders nothing for regular students — activity
 *  notifications are only ever written for coaches/admins. */
export function NotificationsBell() {
  const { user, isAdmin } = useAuth();
  const isStaff = useIsStaff();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const staff = isStaff || isAdmin;

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, kind, payload, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as unknown as Notif[]);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!staff) return;
    void load();
  }, [staff, load]);

  useEffect(() => {
    if (!user || !staff) return;
    const channel = supabase
      .channel("nav-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, staff, load]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!staff) return null;

  const unread = items.filter((n) => !n.read_at).length;

  async function markAllRead() {
    if (!user || unread === 0) return;
    const now = new Date().toISOString();
    // Optimistic: clear the badge immediately, then persist.
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("recipient_id", user.id)
      .is("read_at", null);
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) void markAllRead(); }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Actividad de los alumnos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">Sin actividad todavía.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() =>
                  navigate({ to: isAdmin ? "/liberte-profesor-panel-9382745-admin" : "/coach" })
                }
                className="block w-full px-3 py-2 text-left text-sm transition hover:bg-accent"
              >
                <span className="block text-foreground">{notifText(n)}</span>
                <span className="block text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
