import type { PostKind, RenderedPost, SocialPost } from "./api";

export type StoreOwner = { storeId: string | null; revision: number };
export type PublishingPayload = {
  render_id: string;
  caption: string;
  account_ids: string[];
  publish_at: string | null;
};
export type ScheduleResult =
  | { ok: true; publishAt: string; local: string; utc: string; timeZone: string }
  | { ok: false; error: string };

/** A response belongs on screen only if neither the active store nor its selection revision changed. */
export function ownsStoreResponse(started: StoreOwner, current: StoreOwner) {
  return started.storeId === current.storeId && started.revision === current.revision;
}

/** A deterministic representation lets one request retain its idempotency key through a network retry. */
export function publishingFingerprint(payload: PublishingPayload) {
  return JSON.stringify({
    render_id: payload.render_id,
    caption: payload.caption,
    account_ids: [...payload.account_ids].sort(),
    publish_at: payload.publish_at,
  });
}

/** No native crypto dependency is needed: this is an opaque, bounded duplicate-detection key, not a secret. */
export function createIdempotencyKey() {
  return `sf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`.slice(0, 72);
}

export function canPublishRenderedPost(render: RenderedPost | null, format: string | undefined) {
  if (!render?.render_id || !render.files.length) return false;
  // Generated Story still art remains manual Save/Share. Reels are vertical by design and publish through the Reel route.
  return render.kind === "reel" || format !== "story";
}

export function canCancelSocialPost(post: SocialPost) {
  return post.status === "queued";
}

export function canRetrySocialPost(post: SocialPost) {
  return post.status === "failed" && post.retryable;
}

export function hasActiveSocialPosts(posts: SocialPost[]) {
  return posts.some((post) => post.status === "queued" || post.status === "processing");
}

export function isOlderSocialBackend(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && (error as { status?: unknown }).status === 404;
}

export function isAllowedMetaPermalink(url: string | null) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const allowed = ["facebook.com", "instagram.com", "fb.watch"];
    return parsed.protocol === "https:" && allowed.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Parse local text without Date's rollover behavior (for example, rejecting 2026-02-31).
 * Marketing schedules are intentionally capped at 90 days so server validation remains the final authority.
 */
/** "10/20/2026" (or "2026-10-20") → [year, month, day]. */
function parseDate(text: string): [number, number, number] | null {
  const t = text.trim();
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (us) return [Number(us[3]), Number(us[1]), Number(us[2])];
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  return iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : null;
}
/** "2:30 PM", "2pm", "12:05 am" (or 24-hour "14:30") → [hour 0-23, minute]. */
function parseTime(text: string): [number, number] | null {
  const t = text.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  const twelve = /^(\d{1,2})(?::(\d{2}))? ?(am|pm|a|p)$/.exec(t);
  if (twelve) {
    const h = Number(twelve[1]), m = Number(twelve[2] ?? "0");
    if (h < 1 || h > 12 || m > 59) return null;
    return [(h % 12) + (twelve[3].startsWith("p") ? 12 : 0), m];
  }
  const day = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!day || Number(day[1]) > 23 || Number(day[2]) > 59) return null;
  return [Number(day[1]), Number(day[2])];
}
/** The time box plus the AM/PM buttons. A time typed with its own AM/PM, or as 24-hour (0:30, 14:30), wins. */
export function withMeridiem(timeText: string, meridiem: "AM" | "PM") {
  const typed = timeText.trim();
  if (/[ap]\.?\s*m?\.?$/i.test(typed)) return typed;
  const hour = /^(\d{1,2})(?::\d{2})?$/.exec(typed);
  if (hour && (Number(hour[1]) > 12 || Number(hour[1]) === 0)) return typed;
  return typed ? `${typed} ${meridiem}` : typed;
}
/** A date and time people read every day: "Tuesday, October 20, 2026, 2:30 PM". */
export function friendlyDateTime(date: Date) {
  return date.toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

export function parseStrictLocalSchedule(dateText: string, timeText: string, now = new Date(), maxDays = 90): ScheduleResult {
  const date = parseDate(dateText);
  const time = parseTime(timeText);
  if (!date || !time) return { ok: false, error: "Enter a date like 10/20/2026 and a time like 2:30 PM." };
  const [year, month, day] = date;
  const [hour, minute] = time;
  if (month < 1 || month > 12 || day < 1) return { ok: false, error: "Enter a real date and time." };
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day || local.getHours() !== hour || local.getMinutes() !== minute) {
    return { ok: false, error: "Enter a real date and time." };
  }
  const distance = local.getTime() - now.getTime();
  if (distance <= 0) return { ok: false, error: "Choose a time in the future." };
  if (distance > maxDays * 24 * 60 * 60 * 1000) return { ok: false, error: `Choose a time within ${maxDays} days.` };
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time zone";
  return {
    ok: true,
    publishAt: local.toISOString(),
    local: friendlyDateTime(local),
    utc: local.toISOString().replace(".000Z", "Z"),
    timeZone,
  };
}

export function frozenPayload(render: RenderedPost, caption: string, accountIds: string[], publishAt: string | null): PublishingPayload | null {
  if (!render.render_id || !render.files.length || !caption.trim() || !accountIds.length) return null;
  return { render_id: render.render_id, caption: caption.trim(), account_ids: [...accountIds].sort(), publish_at: publishAt };
}

export function mediaDescription(kind: PostKind, count: number) {
  if (kind === "reel") return "1 Reel";
  return `${count} ${kind === "carousel" ? "carousel slide" : "image"}${count === 1 ? "" : "s"}`;
}
