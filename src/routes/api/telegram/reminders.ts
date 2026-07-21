import { createFileRoute } from "@tanstack/react-router";

// Hit on a schedule (Cloudflare cron trigger, or any external scheduler) to send
// "your live class starts soon" reminders. Protected by CRON_SECRET, supplied
// either in the X-Cron-Secret header or a ?secret= query param.

async function run(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
  // Fail CLOSED: no configured secret means the endpoint is disabled.
  if (!secret) return new Response("cron not configured", { status: 503 });
  if (provided !== secret) return new Response("forbidden", { status: 403 });
  try {
    const { sendEventReminders } = await import("@/lib/telegram.reminders");
    const result = await sendEventReminders();
    return Response.json({ ok: true, ...result });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/telegram/reminders")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});
