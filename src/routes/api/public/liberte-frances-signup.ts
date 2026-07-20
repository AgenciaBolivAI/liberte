import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// `.strict()` rejects a body padded with extra junk keys (a way to bloat the
// request into isolate memory). CRLF is stripped so no field can inject an
// email header downstream.
const noCRLF = (s: string) => s.replace(/[\r\n]+/g, " ");
const bodySchema = z
  .object({
    full_name: z.string().trim().transform(noCRLF).pipe(z.string().min(2).max(100)),
    email: z.string().trim().email().max(255),
    nationality: z.string().trim().transform(noCRLF).pipe(z.string().min(2).max(80)).optional(),
    phone: z.string().trim().transform(noCRLF).pipe(z.string().min(6).max(30)).optional(),
  })
  .strict();

// User-supplied fields are interpolated into email HTML — escape them so a
// crafted name/phone can't inject markup into the emails we send.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Best-effort in-memory rate limit (per isolate). Not a substitute for edge
// rate limiting, but blunts naive spam loops against this public endpoint.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

const PLATFORM_URL = "https://libertefrances.com";
const LOGIN_PATH = "/liberte-log-in-983749824923465723";
const BANNER_URL =
  "https://libertefrances.com/__l5e/assets-v1/25b93245-715a-4774-8e23-1087adb2fcac/bon-voyage-email-banner.png";

function welcomeEmailHtml(nombre: string) {
  const first = escapeHtml((nombre.split(" ")[0] || nombre).trim());
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Bienvenue à Liberté</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Helvetica Neue',Arial,sans-serif;color:#1e2a45;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(30,42,69,0.08);">
            <tr>
              <td style="padding:0;">
                <img src="${BANNER_URL}" alt="Bon voyage" width="600" style="display:block;width:100%;height:auto;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <h2 style="margin:0 0 16px;color:#1e2a45;font-size:24px;">¡Bienvenue à Liberté! 🇫🇷</h2>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
                  <span translate="no">${first}</span>, tu viaje comienza hoy. ✨
                </p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">
                  Estoy muy feliz de que seas parte de esta experiencia. Liberté, el colibrí, y yo te acompañaremos en todo este viaje. 🐦
                </p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">
                  Entra a la plataforma para comenzar:
                </p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="${PLATFORM_URL}${LOGIN_PATH}"
                    style="display:inline-block;background:#4a90e2;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:16px;">
                    Entrar a la plataforma →
                  </a>
                </div>
                <p style="margin:0 0 8px;font-size:14px;color:#64748b;line-height:1.6;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
                  <a href="${PLATFORM_URL}${LOGIN_PATH}" style="color:#4a90e2;word-break:break-all;">${PLATFORM_URL}${LOGIN_PATH}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
                  À bientôt,<br />
                  El equipo de Liberté
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const Route = createFileRoute("/api/public/liberte-frances-signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const clientIp =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown";
        if (rateLimited(clientIp)) {
          return Response.json(
            { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
            { status: 429 },
          );
        }

        // Cap body size before parsing so a padded payload can't balloon memory.
        const len = Number(request.headers.get("content-length") ?? "0");
        if (len > 8_192) {
          return Response.json({ error: "Datos inválidos" }, { status: 400 });
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = bodySchema.safeParse(json);
        if (!parsed.success) {
          // Do not echo zod internals (field names / constraints) back to callers.
          return Response.json({ error: "Datos inválidos" }, { status: 400 });
        }

        const { full_name, email, nationality, phone } = parsed.data;

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const resendKey = process.env.RESEND_API_KEY;

        if (!supabaseUrl || !serviceKey) {
          console.error("Missing Supabase env");
          return Response.json({ error: "Configuración del servidor" }, { status: 500 });
        }

        // 1. Save lead (upsert by lowercase email)
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const emailLc = email.toLowerCase();
        const { data: existing, error: existingError } = await supabase
          .from("leads")
          .select("id")
          .ilike("email", emailLc)
          .maybeSingle();

        if (existingError) {
          console.error("Lead lookup failed", existingError);
          return Response.json({ error: "No pudimos guardar tus datos" }, { status: 500 });
        }

        // Insert-only. This endpoint is anonymous, so it must NEVER update an
        // existing row: anyone who knows a student's email could otherwise
        // overwrite their name/phone. A repeat submission of a known email is a
        // silent no-op, and — critically — does NOT re-send any email, which
        // removes the "loop one address to spam" amplification.
        const isNewLead = !existing;
        if (isNewLead) {
          const { error: insErr } = await supabase
            .from("leads")
            .insert({ full_name, email: emailLc, nationality, phone, status: "pending" });
          if (insErr && !String(insErr.message).toLowerCase().includes("duplicate")) {
            console.error("Lead insert failed", insErr);
            return Response.json({ error: "No pudimos guardar tus datos" }, { status: 500 });
          }
        }

        // Nothing new to notify about — return success without sending mail, so
        // a known email cannot be used to trigger repeated sends.
        if (!isNewLead) {
          return Response.json({ ok: true, emailed: false });
        }

        // 2. Send welcome email via the Resend API
        if (!resendKey) {
          console.error("Missing RESEND_API_KEY — lead saved but email skipped");
          return Response.json(
            {
              error:
                "Guardamos tus datos, pero el correo no pudo enviarse. Revisa la configuración del dominio de envío.",
            },
            { status: 502 },
          );
        }

        try {
          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Liberté <hola@libertefrances.com>",
              to: [email],
              subject: "¡Bienvenido a Liberté! 🇫🇷",
              html: welcomeEmailHtml(full_name),
            }),
          });

          if (!resendRes.ok) {
            const txt = await resendRes.text();
            console.error(`Resend failed [${resendRes.status}]: ${txt}`);
            return Response.json(
              {
                error:
                  "Guardamos tus datos, pero el correo no pudo enviarse porque el dominio de envío todavía no está verificado.",
              },
              { status: 502 },
            );
          }
        } catch (err) {
          console.error("Resend send threw", err);
          return Response.json(
            {
              error:
                "Guardamos tus datos, pero el correo no pudo enviarse. Intenta de nuevo en unos minutos.",
            },
            { status: 502 },
          );
        }

        // 3. Notify admin (best-effort, does not block success)
        try {
          const adminHtml = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1e2a45;padding:24px;">
            <h2 style="margin:0 0 16px;">Nuevo registro en Liberté 🎉</h2>
            <table cellpadding="6" style="border-collapse:collapse;font-size:15px;">
              <tr><td><strong>Nombre:</strong></td><td>${escapeHtml(full_name)}</td></tr>
              <tr><td><strong>Email:</strong></td><td>${escapeHtml(email)}</td></tr>
              <tr><td><strong>Nacionalidad:</strong></td><td>${escapeHtml(nationality ?? "—")}</td></tr>
              <tr><td><strong>Teléfono:</strong></td><td>${escapeHtml(phone ?? "—")}</td></tr>
              <tr><td><strong>Fecha:</strong></td><td>${new Date().toISOString()}</td></tr>
            </table>
          </body></html>`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Liberté <hola@libertefrances.com>",
              to: ["libertedirec@gmail.com"],
              // Static subject/reply-to: full_name is attacker-controlled and a
              // CRLF in it could otherwise inject email headers or send the
              // admin's reply to the attacker.
              reply_to: "hola@libertefrances.com",
              subject: "Nuevo registro en Liberté",
              html: adminHtml,
            }),
          }).then(async (r) => {
            if (!r.ok) console.error(`Admin notify failed [${r.status}]: ${await r.text()}`);
          });
        } catch (err) {
          console.error("Admin notify threw", err);
        }


        return Response.json({ ok: true, emailed: true });
      },
    },
  },
});
