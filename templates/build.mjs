/**
 * Generates every Liberté e-mail template from ONE skeleton.
 *
 * The generated .html files are committed, so nobody has to run this to use
 * them — paste the file straight into Supabase. Run `node templates/build.mjs`
 * only when the brand changes; defining the palette, the header and the footer
 * once is what stops ten templates from drifting apart.
 *
 * Everything is inlined table HTML on purpose: Gmail strips <style> blocks from
 * the <head> in some contexts, Outlook renders with Word's engine, and neither
 * supports flexbox or grid. The one <style> block we keep carries only the
 * mobile media query, which is additive — the layout is already correct without
 * it.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/* ----------------------------------------------------------------- brand --
 * Hexes taken from the app, not invented: the auth screens hard-code
 * #1E3A5F / #4FB2EA (src/components/AuthPage.tsx) and the design tokens in
 * src/styles.css document #EDF8FC, #C44536 and friends.
 */
const BRAND = {
  navy: "#1E3A5F",
  navySoft: "#3D5589",
  blue: "#4FB2EA",
  sky: "#9BCBEF",
  ice: "#EDF8FC",
  cream: "#F5F0E8",
  gold: "#EAC55B",
  green: "#4CB86A",
  red: "#C44536",
  text: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  white: "#FFFFFF",
};

const SITE = "https://www.libertefrances.com";
const LOGIN_PATH = "/liberte-log-in-983749824923465723";
/** 34 KB PNG, verified 200 in production. The 1.5 MB "bon voyage" banner is
 *  deliberately NOT used here — it is far too heavy for an inbox. */
const LOGO = `${SITE}/__l5e/assets-v1/f6993728-fdc2-4e0a-9560-eba445c69606/liberte-logo-full.png`;

/* ------------------------------------------------------------- skeleton -- */

/** Hidden preview line — the grey text an inbox shows next to the subject.
 *  Without it, clients scrape the first visible words ("Si el botón no…"). */
function preheader(text) {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.ice};opacity:0;">${text}</div>
      <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>`;
}

/** Bulletproof CTA: VML for Outlook (which ignores padding + border-radius on
 *  an <a>), a normal anchor everywhere else. */
function button(label, url, color = BRAND.blue) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                    <tr>
                      <td align="center">
                        <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:50px;v-text-anchor:middle;width:300px;" arcsize="20%" stroke="f" fillcolor="${color}">
                          <w:anchorlock/>
                          <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${label}</center>
                        </v:roundrect>
                        <![endif]-->
                        <!--[if !mso]><!-- -->
                        <a href="${url}" target="_blank" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:15px 32px;border-radius:12px;font-weight:700;font-size:16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;mso-hide:all;">${label}</a>
                        <!--<![endif]-->
                      </td>
                    </tr>
                  </table>`;
}

/** A coloured status chip — "Aprobada", "Acción requerida". */
function pill(text, color) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td style="background:${color}1A;border:1px solid ${color}59;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${color};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${text}</td>
                  </tr></table>`;
}

function paragraph(html, extra = "") {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${BRAND.text};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;${extra}">${html}</p>`;
}

/** The big letter-spaced code box used by the re-authentication e-mail. */
function codeBox(value) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                    <tr>
                      <td align="center" style="background:${BRAND.ice};border:2px dashed ${BRAND.sky};border-radius:14px;padding:20px 34px;font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:700;letter-spacing:.34em;color:${BRAND.navy};">${value}</td>
                    </tr>
                  </table>`;
}

function render({ title, preview, pillHtml, heading, body, cta, fallbackUrl, footnote }) {
  const ctaBlock = cta
    ? `<tr><td style="padding:8px 32px 4px;">${button(cta.label, cta.url, cta.color)}</td></tr>`
    : "";

  // Every client mangles long URLs differently, so we always print the raw link
  // too. A student whose client blocks the button has to have a way through.
  const fallbackBlock = fallbackUrl
    ? `<tr>
                <td style="padding:16px 32px 0;">
                  <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                    ¿El botón no funciona? Copia y pega este enlace en tu navegador:<br />
                    <a href="${fallbackUrl}" target="_blank" style="color:${BRAND.blue};word-break:break-all;">${fallbackUrl}</a>
                  </p>
                </td>
              </tr>`
    : "";

  const footnoteBlock = footnote
    ? `<tr>
                <td style="padding:20px 32px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background:${BRAND.cream};border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.6;color:${BRAND.muted};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${footnote}</td>
                    </tr>
                  </table>
                </td>
              </tr>`
    : "";

  const pillBlock = pillHtml
    ? `<tr><td style="padding:32px 32px 0;">${pillHtml}</td></tr>`
    : "";

  return `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${title}</title>
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
    <![endif]-->
    <style>
      @media only screen and (max-width:620px) {
        .lb-card { width:100% !important; border-radius:0 !important; }
        .lb-pad  { padding-left:22px !important; padding-right:22px !important; }
        .lb-h1   { font-size:22px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.ice};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
      ${preheader(preview)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.ice};">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="lb-card" style="width:600px;max-width:600px;background:${BRAND.white};border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(30,58,95,0.10);">

            <!-- logo on white: the mark is full-colour and does not read on navy -->
            <tr>
              <td align="center" style="padding:30px 32px 22px;">
                <a href="${SITE}" target="_blank" style="text-decoration:none;">
                  <img src="${LOGO}" alt="Liberté · Instituto de Francés" width="188" style="display:block;width:188px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:0;line-height:0;height:4px;background:${BRAND.blue};">&nbsp;</td>
            </tr>
${pillBlock}
            <tr>
              <td class="lb-pad" style="padding:${pillHtml ? "16px" : "34px"} 32px 0;">
                <h1 class="lb-h1" style="margin:0 0 18px;font-size:26px;line-height:1.25;font-weight:800;color:${BRAND.navy};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td class="lb-pad" style="padding:0 32px;">
${body}
              </td>
            </tr>
${ctaBlock}
${fallbackBlock}
${footnoteBlock}

            <tr>
              <td class="lb-pad" style="padding:30px 32px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="border-top:1px solid ${BRAND.line};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>
                </table>
                <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:${BRAND.muted};text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                  À bientôt,<br /><strong style="color:${BRAND.navy};">El equipo de Liberté</strong> 🇫🇷
                </p>
                <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:${BRAND.faint};text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                  <a href="${SITE}" target="_blank" style="color:${BRAND.faint};text-decoration:none;">libertefrances.com</a>
                  &nbsp;·&nbsp;
                  <a href="mailto:hola@libertefrances.com" style="color:${BRAND.faint};text-decoration:none;">hola@libertefrances.com</a>
                </p>
                <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:${BRAND.faint};text-align:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                  Made by <a href="https://bolivai.com" target="_blank" style="color:${BRAND.blue};text-decoration:none;font-weight:600;">BolivAI</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

/* ------------------------------------------------------------ templates --
 *
 * SUPABASE variables are Go-template style with a dot: {{ .ConfirmationURL }}.
 * Supabase substitutes them; leave them exactly as written.
 *
 * TRANSACTIONAL variables have NO dot ({{FIRST_NAME}}) so the two kinds can
 * never be confused. Whoever sends these replaces them in code.
 */
const SUPA = "{{ .ConfirmationURL }}";

const TEMPLATES = [
  /* ============================ Supabase Auth ============================ */
  {
    dir: "supabase",
    file: "01-confirm-signup.html",
    subject: "Confirma tu correo para entrar a Liberté 🇫🇷",
    title: "Confirma tu correo",
    preview: "Un clic y tu cuenta queda activa.",
    heading: "Confirma tu correo",
    body: [
      paragraph("¡Bienvenue à Liberté! Ya casi estás dentro."),
      paragraph(
        "Solo falta confirmar que este correo es tuyo. Hasta que lo hagas, <strong>iniciar sesión te dará error aunque tu contraseña sea correcta</strong>.",
      ),
    ],
    cta: { label: "Confirmar mi correo", url: SUPA },
    fallbackUrl: SUPA,
    footnote:
      "Si no creaste ninguna cuenta en Liberté, puedes ignorar este correo: sin este clic no se activa nada.",
  },
  {
    dir: "supabase",
    file: "02-reset-password.html",
    subject: "Restablece tu contraseña de Liberté",
    title: "Restablece tu contraseña",
    preview: "Crea una contraseña nueva en menos de un minuto.",
    heading: "Crea una contraseña nueva",
    body: [
      paragraph("Pediste restablecer tu contraseña de Liberté."),
      paragraph(
        "Pulsa el botón y te llevaremos a una página para <strong>escribir tu contraseña nueva</strong>. El enlace caduca en 1 hora y solo puede usarse una vez.",
      ),
    ],
    cta: { label: "Elegir contraseña nueva", url: SUPA },
    fallbackUrl: SUPA,
    footnote:
      "¿No fuiste tú? Ignora este correo: tu contraseña actual sigue funcionando y nadie puede cambiarla sin abrir este enlace.",
  },
  {
    dir: "supabase",
    file: "03-magic-link.html",
    subject: "Tu enlace de acceso a Liberté",
    title: "Tu enlace de acceso",
    preview: "Entra sin contraseña con un solo clic.",
    heading: "Entra sin contraseña",
    body: [
      paragraph("Aquí tienes tu enlace de acceso directo a la plataforma."),
      paragraph("Caduca en 1 hora y solo funciona una vez."),
    ],
    cta: { label: "Entrar a la plataforma", url: SUPA },
    fallbackUrl: SUPA,
    footnote:
      "Si no pediste este enlace, ignora el correo. Nadie puede entrar a tu cuenta sin abrirlo.",
  },
  {
    dir: "supabase",
    file: "04-invite-user.html",
    subject: "Te invitamos a Liberté 🇫🇷",
    title: "Te invitamos a Liberté",
    preview: "Acepta tu invitación y crea tu contraseña.",
    pill: ["Invitación", BRAND.gold],
    heading: "Te damos la bienvenida",
    body: [
      paragraph("El equipo de Liberté te ha invitado a la plataforma."),
      paragraph(
        "Acepta la invitación para <strong>crear tu contraseña</strong> y empezar tu programa de francés.",
      ),
    ],
    cta: { label: "Aceptar la invitación", url: SUPA },
    fallbackUrl: SUPA,
    footnote: "Si crees que esta invitación no era para ti, simplemente ignora este correo.",
  },
  {
    dir: "supabase",
    file: "05-change-email.html",
    subject: "Confirma tu nueva dirección de correo",
    title: "Confirma tu nuevo correo",
    preview: "Confirma el cambio para seguir entrando con normalidad.",
    heading: "Confirma tu nuevo correo",
    body: [
      paragraph(
        "Pediste cambiar el correo de tu cuenta de <strong>{{ .Email }}</strong> a <strong>{{ .NewEmail }}</strong>.",
      ),
      paragraph(
        "Confirma el cambio para poder seguir entrando. Hasta entonces, tu correo anterior sigue siendo el válido.",
      ),
    ],
    cta: { label: "Confirmar el cambio", url: SUPA },
    fallbackUrl: SUPA,
    footnote:
      "¿No pediste este cambio? Ignora este correo y escríbenos a hola@libertefrances.com: tu cuenta no cambiará.",
  },
  {
    dir: "supabase",
    file: "06-reauthentication.html",
    subject: "Tu código de verificación de Liberté",
    title: "Tu código de verificación",
    preview: "Tu código de un solo uso está dentro.",
    heading: "Tu código de verificación",
    body: [
      paragraph("Para confirmar que eres tú, escribe este código en la plataforma:"),
      `<div style="margin:6px 0 22px;">${codeBox("{{ .Token }}")}</div>`,
      paragraph("El código caduca en unos minutos y solo puede usarse una vez.", `color:${BRAND.muted};font-size:14px;`),
    ],
    footnote:
      "Nunca compartas este código. El equipo de Liberté jamás te lo pedirá por teléfono, WhatsApp ni correo.",
  },

  /* ====================== Platform (sent with Resend) ===================== */
  {
    dir: "transactional",
    file: "welcome.html",
    subject: "¡Bienvenido a Liberté! 🇫🇷",
    title: "Bienvenue à Liberté",
    preview: "Tu viaje al francés empieza hoy.",
    heading: "¡Bienvenue à Liberté! 🇫🇷",
    body: [
      paragraph("<span translate=\"no\">{{FIRST_NAME}}</span>, tu viaje comienza hoy. ✨"),
      paragraph(
        "Estoy muy feliz de que seas parte de esta experiencia. Liberté, el colibrí, y yo te acompañaremos durante todo el camino. 🐦",
      ),
      paragraph("Entra a la plataforma para comenzar:"),
    ],
    cta: { label: "Entrar a la plataforma", url: "{{LOGIN_URL}}" },
    fallbackUrl: "{{LOGIN_URL}}",
  },
  {
    dir: "transactional",
    file: "application-approved.html",
    subject: "¡Tu acceso a Liberté está activo! 🎉",
    title: "Tu acceso está activo",
    preview: "Ya puedes entrar: tu cuenta fue aprobada.",
    pill: ["Solicitud aprobada", BRAND.green],
    heading: "¡Tu acceso ya está activo! 🎉",
    body: [
      paragraph("<span translate=\"no\">{{FIRST_NAME}}</span>, buenas noticias: el equipo revisó tu solicitud y <strong>tu acceso a Liberté está aprobado</strong>."),
      paragraph(
        "Ya puedes entrar con el correo y la contraseña que creaste al registrarte, y empezar por el Día 1.",
      ),
    ],
    cta: { label: "Empezar mi Día 1", url: "{{LOGIN_URL}}", color: BRAND.green },
    fallbackUrl: "{{LOGIN_URL}}",
    footnote:
      "¿Olvidaste tu contraseña? Usa «¿Olvidaste tu contraseña?» en la pantalla de acceso y te enviaremos un enlace para crear una nueva.",
  },
  {
    dir: "transactional",
    file: "application-denied.html",
    subject: "Sobre tu solicitud en Liberté",
    title: "Sobre tu solicitud",
    preview: "Novedades sobre tu solicitud de acceso.",
    pill: ["Solicitud revisada", BRAND.red],
    heading: "Sobre tu solicitud",
    body: [
      paragraph("Hola <span translate=\"no\">{{FIRST_NAME}}</span>,"),
      paragraph(
        "Gracias por tu interés en Liberté. Después de revisar tu solicitud, <strong>por ahora no podemos activar tu acceso</strong> a la plataforma.",
      ),
      paragraph(
        "Si crees que se trata de un error, o quieres saber cómo inscribirte en la próxima convocatoria, respóndenos a este correo y lo revisamos contigo.",
      ),
    ],
    cta: { label: "Escribir al equipo", url: "mailto:hola@libertefrances.com" },
    footnote:
      "No se te ha cobrado nada y tus datos no se usarán para ningún otro fin.",
  },
  {
    dir: "transactional",
    file: "new-lead-notification.html",
    subject: "Nuevo interesado en Liberté",
    title: "Nuevo interesado",
    preview: "Alguien acaba de pedir información.",
    pill: ["Nuevo interesado", BRAND.blue],
    heading: "Nuevo interesado en Liberté",
    body: [
      paragraph("Acaba de llegar una solicitud de información desde la web."),
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;border:1px solid ${BRAND.line};border-radius:12px;overflow:hidden;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:${BRAND.text};">
                  <tr><td style="padding:11px 16px;background:${BRAND.ice};width:118px;font-weight:700;color:${BRAND.navy};">Nombre</td><td style="padding:11px 16px;">{{FULL_NAME}}</td></tr>
                  <tr><td style="padding:11px 16px;background:${BRAND.ice};font-weight:700;color:${BRAND.navy};border-top:1px solid ${BRAND.line};">Email</td><td style="padding:11px 16px;border-top:1px solid ${BRAND.line};"><a href="mailto:{{EMAIL}}" style="color:${BRAND.blue};text-decoration:none;">{{EMAIL}}</a></td></tr>
                  <tr><td style="padding:11px 16px;background:${BRAND.ice};font-weight:700;color:${BRAND.navy};border-top:1px solid ${BRAND.line};">Teléfono</td><td style="padding:11px 16px;border-top:1px solid ${BRAND.line};">{{PHONE}}</td></tr>
                  <tr><td style="padding:11px 16px;background:${BRAND.ice};font-weight:700;color:${BRAND.navy};border-top:1px solid ${BRAND.line};">País</td><td style="padding:11px 16px;border-top:1px solid ${BRAND.line};">{{NATIONALITY}}</td></tr>
                </table>`,
      paragraph("<strong style=\"color:" + BRAND.navy + ";\">En qué necesita ayuda:</strong>"),
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 4px;"><tr>
                  <td style="background:${BRAND.cream};border-radius:12px;padding:14px 16px;font-size:15px;line-height:1.6;color:${BRAND.text};white-space:pre-wrap;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">{{MESSAGE}}</td>
                </tr></table>`,
    ],
    cta: { label: "Abrir en el panel", url: `${SITE}/liberte-profesor-panel-9382745-admin/interesados` },
    footnote:
      "Responde a este correo para escribirle directamente: la respuesta le llega a su bandeja, no a la nuestra.",
  },
];

/* ------------------------------------------------------------------ run -- */

const index = [];
for (const t of TEMPLATES) {
  const html = render({
    title: t.title,
    preview: t.preview,
    pillHtml: t.pill ? pill(t.pill[0], t.pill[1]) : null,
    heading: t.heading,
    body: t.body.join("\n"),
    cta: t.cta,
    fallbackUrl: t.fallbackUrl,
    footnote: t.footnote,
  });
  const out = join(HERE, t.dir, t.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html, "utf8");
  index.push({ ...t, bytes: Buffer.byteLength(html, "utf8") });
  console.log(`${t.dir}/${t.file}  ${(Buffer.byteLength(html, "utf8") / 1024).toFixed(1)} KB  — ${t.subject}`);
}

// Gmail CLIPS a message past ~102 KB and hides the rest behind "View entire
// message", which would bury the button. Fail loudly rather than ship that.
const tooBig = index.filter((t) => t.bytes > 102_000);
if (tooBig.length) {
  console.error("\nOVER GMAIL'S 102 KB CLIP LIMIT:", tooBig.map((t) => t.file).join(", "));
  process.exit(1);
}
console.log(`\n${index.length} templates, largest ${(Math.max(...index.map((t) => t.bytes)) / 1024).toFixed(1)} KB (Gmail clips at 102 KB).`);
