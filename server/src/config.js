import fs from "node:fs";
import path from "node:path";

// Minimal .env loader (no dependency); real env vars win.
const envFile = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const env = process.env;
/** A JSON value pasted as-is, or base64 of it (easier to paste in some dashboards). */
function decodeJson(v) {
  const t = String(v || "").trim();
  if (!t) return "";
  if (t.startsWith("{")) return t;
  try { const d = Buffer.from(t, "base64").toString("utf8"); return d.trim().startsWith("{") ? d : ""; } catch { return ""; }
}
export const config = {
  port: Number(env.PORT || 8080),
  publicUrl: (env.PUBLIC_URL || `http://localhost:${env.PORT || 8080}`).replace(/\/$/, ""),
  dataDir: path.resolve(env.DATA_DIR || "./data"),
  anthropicKey: env.ANTHROPIC_API_KEY || "",
  claudeModel: env.CLAUDE_MODEL || "claude-sonnet-5-5",
  agentModel: env.AGENT_MODEL || "claude-fable-5-1",
  stripeKey: env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
  stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY || "",
  platformFeePercent: Math.max(0, Math.min(50, Number(env.PLATFORM_FEE_PERCENT ?? 0))),
  // Google Play: the service account JSON (pasted whole, or base64) that checks purchases, and the app id.
  googlePlayServiceAccount: decodeJson(env.GOOGLE_PLAY_SERVICE_ACCOUNT),
  playPackage: env.PLAY_PACKAGE || "com.sidebanc.snapfront",
  serpapiKey: env.SERPAPI_KEY || "",
  cjApiKey: env.CJ_API_KEY || "",
  photoroomKey: env.PHOTOROOM_API_KEY || "",
  runpodKey: env.RUNPOD_API_KEY || env.SNAPFRONT_KEY || "",   // AI video and lifestyle photos (Runpod public endpoints)   // photo studio backgrounds; a sandbox_ key gives free watermarked results
  // Stores get https://<slug>.<STORE_DOMAIN> (e.g. snapfront.app) once its wildcard DNS is in place.
  cloudflareToken: env.CLOUDFLARE_API_TOKEN || "",
  adminToken: env.ADMIN_TOKEN || "",
  storeDomain: String(env.STORE_DOMAIN || "").trim().toLowerCase().replace(/^\.+|\/+$/g, ""),
  downloadSecret: env.DOWNLOAD_SIGNING_SECRET || "dev-only-secret-change-me",
  resendKey: env.RESEND_API_KEY || "",
  emailFrom: env.EMAIL_FROM || "Snapfront <orders@example.com>",
};

export const dirs = {
  images: path.join(config.dataDir, "images"),
  files: path.join(config.dataDir, "files"),
  media: path.join(config.dataDir, "media"),   // marketing posts and videos
};
for (const d of [config.dataDir, dirs.images, dirs.files, dirs.media]) fs.mkdirSync(d, { recursive: true });

if (config.downloadSecret === "dev-only-secret-change-me" && env.NODE_ENV === "production") {
  console.warn("[snapfront] DOWNLOAD_SIGNING_SECRET is not set; download links are not secure.");
}
