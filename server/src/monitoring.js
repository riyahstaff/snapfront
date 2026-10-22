// Error monitoring with Sentry (sentry.io). Off until SENTRY_DSN is set on the host.
//
// What's sent: the error, where in the code it happened, the route and the server release. What's
// never sent: who the member is, their email, sign-in tokens, cookies, request bodies or payment
// details. Emails, tokens and card-like numbers are also scrubbed out of messages before sending.
// SnapCare reads recent errors back (by their Sentry event id) to attach them to bug reports.
import * as Sentry from "@sentry/node";

const DSN = () => String(process.env.SENTRY_DSN || "").trim();
let started = false;
export const enabled = () => started;

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LONG_TOKEN = /\b(?:sk|pk|rk|whsec|sf|zk)_[A-Za-z0-9_]{8,}\b|\b[A-Za-z0-9_-]{32,}\b/g;
const CARDISH = /\b\d(?:[ -]?\d){12,18}\b/g;
/** Remove personal details and secrets from any text before it leaves the server. */
export function scrub(text) {
  return String(text ?? "").replace(EMAIL, "[email]").replace(LONG_TOKEN, "[token]").replace(CARDISH, "[number]");
}
function clean(event) {
  delete event.user;
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.headers) event.request.headers = { "user-agent": event.request.headers["user-agent"] };
    if (event.request.url) event.request.url = scrub(event.request.url.split("?")[0]);
  }
  if (event.message) event.message = scrub(event.message);
  for (const ex of event.exception?.values || []) if (ex.value) ex.value = scrub(ex.value);
  for (const b of event.breadcrumbs || []) if (b.message) b.message = scrub(b.message);
  if (event.extra) event.extra = Object.fromEntries(Object.entries(event.extra).map(([k, v]) => [k, typeof v === "string" ? scrub(v) : v]));
  return event;
}

export function start() {
  if (started || !DSN()) return false;
  Sentry.init({
    dsn: DSN(),
    environment: process.env.STANDBY === "true" ? "standby" : "production",
    release: process.env.RENDER_GIT_COMMIT || process.env.RAILWAY_GIT_COMMIT_SHA || undefined,
    sendDefaultPii: false,
    tracesSampleRate: 0,   // errors only: no tracing or profiling (the free plan's limits stay far away)
    beforeSend: clean,
    beforeBreadcrumb: (b) => (b.category === "console" ? null : b),
  });
  started = true;
  console.log("[sentry] error monitoring on");
  return true;
}

/** Report a server error. Returns Sentry's event id (or null when monitoring is off). */
export function report(err, context = {}) {
  if (!started) return null;
  return Sentry.withScope((scope) => {
    for (const [k, v] of Object.entries(context)) if (v != null) scope.setTag(k, String(v).slice(0, 120));
    return Sentry.captureException(err);
  });
}
/** Report a problem that isn't a thrown error (e.g. one the web app saw). */
export function message(text, level = "error", context = {}) {
  if (!started) return null;
  return Sentry.withScope((scope) => {
    for (const [k, v] of Object.entries(context)) if (v != null) scope.setTag(k, String(v).slice(0, 120));
    scope.setLevel(level);
    return Sentry.captureMessage(scrub(text).slice(0, 2000));
  });
}
export const flush = (ms = 2000) => (started ? Sentry.flush(ms) : Promise.resolve(true));
