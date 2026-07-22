// Shared "is this account approved?" gate. Unapproved accounts (signed up but
// not yet activated by staff) must not be able to spend OpenAI tokens (chat /
// grading / STT / TTS) or enumerate the staff directory. Fails OPEN if the
// approval column doesn't exist yet (pre-migration) so a rollout never locks
// everyone out. Admins always pass.
//
// The context shape is intentionally loose (from/rpc as any) so any server-fn
// handler context is assignable without a cast — same pattern as the
// content-access enforce helpers.

type ApprovalCtx = {
  supabase: {
    from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
    rpc: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
  userId: string;
};

export async function requireApprovedStudent(context: ApprovalCtx): Promise<void> {
  try {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("approved_at")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) return; // pre-migration (column missing) → fail open
    if (data && data.approved_at == null) {
      const { data: isAdmin } = await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });
      if (!isAdmin) {
        throw new Error("Tu cuenta aún no está aprobada. El equipo activará tu acceso pronto.");
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Tu cuenta")) throw e;
    // any other failure → fail open (don't block paying users on an infra blip)
  }
}
