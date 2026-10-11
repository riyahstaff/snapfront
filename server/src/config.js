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
  revenuecatSecretKey: env.REVENUECAT_SECRET_KEY || "",
  serpapiKey: env.SERPAPI_KEY || "",
  cjApiKey: env.CJ_API_KEY || "",
  revenuecatWebhookAuth: env.REVENUECAT_WEBHOOK_AUTH || "",
  downloadSecret: env.DOWNLOAD_SIGNING_SECRET || "dev-only-secret-change-me",
  resendKey: env.RESEND_API_KEY || "",
  emailFrom: env.EMAIL_FROM || "Snapfront <orders@example.com>",
};

export const dirs = {
  images: path.join(config.dataDir, "images"),
  files: path.join(config.dataDir, "files"),
};
for (const d of [config.dataDir, dirs.images, dirs.files]) fs.mkdirSync(d, { recursive: true });

if (config.downloadSecret === "dev-only-secret-change-me" && env.NODE_ENV === "production") {
  console.warn("[snapfront] DOWNLOAD_SIGNING_SECRET is not set; download links are not secure.");
}
