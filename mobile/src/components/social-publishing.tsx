import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useIsFocused } from "expo-router";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button, Field, H2, Notice, Pill } from "@/components/ui";
import { api, ApiError, type RenderedPost, type SocialAccount, type SocialAccounts, type SocialPost } from "@/lib/api";
import {
  canCancelSocialPost,
  canPublishRenderedPost,
  canRetrySocialPost,
  createIdempotencyKey,
  frozenPayload,
  hasActiveSocialPosts,
  isAllowedMetaPermalink,
  isOlderSocialBackend,
  mediaDescription,
  ownsStoreResponse,
  parseStrictLocalSchedule,
  publishingFingerprint,
  type PublishingPayload,
  type StoreOwner,
} from "@/lib/social-publishing";
import { radius, space, type, useColors } from "@/lib/theme";

type Message = { text: string; tone: "ok" | "error" | "info" } | null;
type Confirmation = {
  payload: PublishingPayload;
  idempotencyKey: string;
  accountNames: string[];
  media: string;
  kind: string;
  mediaUrls: string[];
  schedule: { local: string; utc: string; timeZone: string } | null;
};

type Props = {
  storeId: string | null;
  storeRevision: number;
  renderedPost: RenderedPost | null;
  caption: string;
  format?: string;
  disabled?: boolean;
  onReviewChange?: (open: boolean) => void;
};

const errorText = (error: unknown, fallback: string) => error instanceof ApiError ? error.message : fallback;
const ownerNow = (storeId: string | null): StoreOwner => ({ storeId, revision: api.storeRevision() });

/**
 * Keeps OAuth credentials out of the app: this surface sees only public Page/IG metadata.
 * It also remains useful without a freshly generated post because connections and history are store-scoped.
 */
export function SocialPublishing({ storeId, storeRevision, renderedPost, caption, format, disabled = false, onReviewChange }: Props) {
  return <SocialPublishingForStore key={`${storeId ?? "none"}:${storeRevision}`} storeId={storeId} storeRevision={storeRevision} renderedPost={renderedPost} caption={caption} format={format} disabled={disabled} onReviewChange={onReviewChange} />;
}

function SocialPublishingForStore({ storeId, storeRevision, renderedPost, caption, format, disabled = false, onReviewChange }: Props) {
  const c = useColors();
  const focused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const [connection, setConnection] = useState<SocialAccounts | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [dateText, setDateText] = useState("");
  const [timeText, setTimeText] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [legacyBackend, setLegacyBackend] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [disconnecting, setDisconnecting] = useState<SocialAccount | null>(null);
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);
  const reviewing = useRef(false);
  const refreshDeadline = useRef(0);
  const readGeneration = useRef(0);
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => setAppActive(next === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    reviewing.current = !!confirmation;
    onReviewChange?.(!!confirmation);
  }, [confirmation, onReviewChange]);

  const refresh = useCallback(async (quiet = false, isCurrent: () => boolean = () => true) => {
    const started: StoreOwner = { storeId, revision: storeRevision };
    if (!started.storeId) return;
    const request = ++readGeneration.current;
    try {
      const [nextConnection, nextHistory] = await Promise.all([api.socialAccounts(started.storeId), api.socialPosts(started.storeId)]);
      if (!isCurrent() || request !== readGeneration.current || !ownsStoreResponse(started, ownerNow(storeId))) return;
      setLegacyBackend(false);
      setConnection(nextConnection);
      setPosts(nextHistory.posts);
      // Keep destination selection explicit. A server-side reconnect cannot silently add a Page to a pending review.
      if (!reviewing.current) {
        const connected = new Set(nextConnection.accounts.filter((account) => account.status === "connected").map((account) => account.id));
        setSelected((current) => current.filter((id) => connected.has(id)));
      }
    } catch (error) {
      if (!isCurrent() || request !== readGeneration.current || !ownsStoreResponse(started, ownerNow(storeId))) return;
      if (isOlderSocialBackend(error)) {
        setLegacyBackend(true);
        setConnection(null);
        setPosts([]);
      } else if (!quiet) {
        setMessage({ text: errorText(error, "Couldn’t load publishing status."), tone: "error" });
      }
    }
  }, [storeId, storeRevision]);

  useFocusEffect(useCallback(() => {
    let current = true;
    refreshDeadline.current = Date.now() + 10 * 60_000;
    void refresh(false, () => current);
    // OAuth returns the user to this route; focus refresh is the source of truth after that return.
    return () => { current = false; readGeneration.current++; };
  }, [refresh]));

  // Website: the Facebook window can't always tell this page it's done, so look again whenever this window gets focus back.
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.addEventListener !== "function" || !storeId) return;
    const onFocus = () => { void refresh(true); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh, storeId]);

  const activePosts = useMemo(() => hasActiveSocialPosts(posts), [posts]);
  useEffect(() => {
    if (!focused || !appActive || !activePosts || legacyBackend || !storeId || confirmation || busy || Date.now() >= refreshDeadline.current) return;
    let current = true;
    const timer = setTimeout(() => { void refresh(true, () => current).finally(() => { if (current) setPollAttempt((value) => value + 1); }); }, 6_000);
    return () => { current = false; clearTimeout(timer); };
  }, [activePosts, posts, pollAttempt, busy, appActive, confirmation, focused, legacyBackend, refresh, storeId]);

  const isBusy = disabled || !!busy;
  const connectedAccounts = connection?.accounts.filter((account) => account.status === "connected") ?? [];
  const publishable = canPublishRenderedPost(renderedPost, format ?? renderedPost?.format);

  async function connect() {
    const started: StoreOwner = { storeId, revision: storeRevision };
    if (!started.storeId || isBusy) return;
    readGeneration.current++;
    setBusy("connect"); setMessage(null);
    try {
      const auth = await api.socialAuthorize(started.storeId);
      if (!ownsStoreResponse(started, ownerNow(storeId))) return;
      // The server owns the fixed callback/state. The native app only opens its returned auth URL and redirect URL.
      const result = await WebBrowser.openAuthSessionAsync(auth.url, auth.redirect_url);
      if (!ownsStoreResponse(started, ownerNow(storeId))) return;
      if (result.type === "success") setMessage({ text: "Connection returned. Refreshing your Pages and Instagram accounts…", tone: "info" });
      await refresh(false, () => ownsStoreResponse(started, ownerNow(storeId)));
    } catch (error) {
      if (!ownsStoreResponse(started, ownerNow(storeId))) return;
      if (isOlderSocialBackend(error)) setLegacyBackend(true);
      else setMessage({ text: errorText(error, "Couldn’t open secure Meta connection."), tone: "error" });
    } finally {
      if (ownsStoreResponse(started, ownerNow(storeId))) setBusy(null);
    }
  }

  function toggleDestination(id: string) {
    if (isBusy || confirmation) return;
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function beginReview() {
    if (!renderedPost || isBusy || !storeId) return;
    if (caption.trim().length > 2200) { setMessage({ text: "Keep the exact caption, including hashtags, within 2,200 characters.", tone: "error" }); return; }
    let publishAt: string | null = null;
    let schedule: Confirmation["schedule"] = null;
    if (scheduleEnabled) {
      const parsed = parseStrictLocalSchedule(dateText, timeText);
      if (!parsed.ok) { setMessage({ text: parsed.error, tone: "error" }); return; }
      publishAt = parsed.publishAt;
      schedule = { local: parsed.local, utc: parsed.utc, timeZone: parsed.timeZone };
    }
    const payload = frozenPayload(renderedPost, caption, selected, publishAt);
    if (!payload) {
      setMessage({ text: !selected.length ? "Select at least one connected Page or Instagram account." : "A caption and server-owned render are required before publishing.", tone: "error" });
      return;
    }
    const fingerprint = publishingFingerprint(payload);
    if (!idempotency.current || idempotency.current.fingerprint !== fingerprint) idempotency.current = { fingerprint, key: createIdempotencyKey() };
    const names = connection?.accounts.filter((account) => payload.account_ids.includes(account.id)).map((account) => `${account.platform === "facebook" ? "Facebook Page" : "Instagram"}: ${account.name}`) ?? [];
    setConfirmation({
      payload,
      idempotencyKey: idempotency.current.key,
      accountNames: names,
      media: mediaDescription(renderedPost.kind, renderedPost.files.length),
      kind: renderedPost.kind,
      mediaUrls: renderedPost.files.map((file) => file.url),
      schedule,
    });
  }

  async function confirmPublish() {
    const review = confirmation;
    const started: StoreOwner = { storeId, revision: storeRevision };
    if (!review || !started.storeId || isBusy) return;
    readGeneration.current++;
    setBusy("publish"); setMessage(null);
    try {
      const response = await api.createSocialPosts({ ...review.payload, idempotency_key: review.idempotencyKey }, started.storeId);
      if (!ownsStoreResponse(started, ownerNow(storeId))) return;
      readGeneration.current++;
      setPosts((current) => [...response.posts, ...current.filter((post) => !response.posts.some((next) => next.id === post.id))]);
      refreshDeadline.current = Date.now() + 10 * 60_000;
      setConfirmation(null);
      setSelected([]);
      setMessage({ text: review.payload.publish_at ? "Scheduled for the selected destinations." : "Sent to the publishing queue.", tone: "ok" });
    } catch (error) {
      if (!ownsStoreResponse(started, ownerNow(storeId))) return;
      // Do not throw away the key on a network/ambiguous failure: reviewing the unchanged payload retries safely.
      setConfirmation(null);
      if (isOlderSocialBackend(error)) setLegacyBackend(true);
      else setMessage({ text: `${errorText(error, "Couldn’t confirm publishing.")} Your identical retry will use the same safe request key.`, tone: "error" });
    } finally {
      if (ownsStoreResponse(started, ownerNow(storeId))) setBusy(null);
    }
  }

  async function disconnect() {
    const account = disconnecting;
    const started: StoreOwner = { storeId, revision: storeRevision };
    if (!account || !started.storeId || isBusy) return;
    readGeneration.current++;
    setBusy(`disconnect:${account.id}`);
    try {
      const response = await api.disconnectSocialAccount(account.id, started.storeId);
      if (!ownsStoreResponse(started, ownerNow(storeId))) return;
      readGeneration.current++;
      setConnection(response);
      setSelected((current) => current.filter((id) => id !== account.id));
      setDisconnecting(null);
      setMessage({ text: "Disconnected for future publishing. Existing posts were not changed.", tone: "ok" });
    } catch (error) {
      if (!ownsStoreResponse(started, ownerNow(storeId))) return;
      if (isOlderSocialBackend(error)) setLegacyBackend(true);
      else setMessage({ text: errorText(error, "Couldn’t disconnect this destination."), tone: "error" });
    } finally {
      if (ownsStoreResponse(started, ownerNow(storeId))) setBusy(null);
    }
  }

  async function postAction(post: SocialPost, action: "cancel" | "retry") {
    const started: StoreOwner = { storeId, revision: storeRevision };
    if (!started.storeId || isBusy) return;
    readGeneration.current++;
    setBusy(`${action}:${post.id}`);
    try {
      const response = action === "cancel" ? await api.cancelSocialPost(post.id, started.storeId) : await api.retrySocialPost(post.id, started.storeId);
      if (!ownsStoreResponse(started, ownerNow(storeId))) return;
      readGeneration.current++;
      setPosts(response.posts);
    } catch (error) {
      if (!ownsStoreResponse(started, ownerNow(storeId))) return;
      if (isOlderSocialBackend(error)) setLegacyBackend(true);
      else setMessage({ text: errorText(error, `Couldn’t ${action} this post.`), tone: "error" });
    } finally {
      if (ownsStoreResponse(started, ownerNow(storeId))) setBusy(null);
    }
  }

  if (!storeId) return (
    <PublishingShell>
      <H2>Meta publishing</H2>
      <Body muted>Choose a store to manage its secure connections and publishing history.</Body>
    </PublishingShell>
  );

  if (legacyBackend) return (
    <PublishingShell>
      <H2>Meta publishing</H2>
      <Body muted>Native Meta publishing needs the updated Snapfront server. Save, Share, caption copy, and TikTok export still work normally.</Body>
    </PublishingShell>
  );

  return (
    <PublishingShell>
      <View style={{ gap: 5 }}>
        <H2>Meta publishing</H2>
        <Body muted>Connect Facebook Pages and their linked professional Instagram accounts. Personal Facebook profiles and unlinked Instagram accounts aren’t supported on this route.</Body>
      </View>
      <Notice text={message?.text ?? null} tone={message?.tone} />

      {connection && !connection.enabled ? (
        <View style={{ gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: c.sunk }}>
          <Text style={[type.label, { color: c.ink }]}>Coming soon</Text>
          <Text style={[type.small, { color: c.muted }]}>{connection.setup_required || "Posting straight to Instagram and Facebook is coming soon. For now, save or share your post and add it in the app."}</Text>
        </View>
      ) : (
        <Button label={connection?.accounts.length ? "Connect another Page or Instagram" : "Connect Facebook Page & Instagram"} variant="secondary" loading={busy === "connect"} disabled={isBusy || connection === null} onPress={connect} />
      )}

      {connection?.enabled && connection.accounts.length ? (
        <View style={{ gap: space.sm }}>
          <Text style={[type.label, { color: c.ink }]}>Destinations</Text>
          {connection.accounts.map((account) => {
            const checked = selected.includes(account.id);
            const available = account.status === "connected";
            return (
              <View key={account.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: 1, borderColor: checked ? c.accent : c.line }}>
                <Pressable accessibilityRole="checkbox" accessibilityLabel={`Publish to ${account.platform === "facebook" ? "Facebook Page" : "Instagram"}: ${account.name}`} accessibilityState={{ checked, disabled: !available || isBusy || !!confirmation }} disabled={!available || isBusy || !!confirmation} onPress={() => toggleDestination(account.id)} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: checked ? c.accent : c.line, backgroundColor: checked ? c.accent : c.sunk, alignItems: "center", justifyContent: "center" }}>
                  {checked ? <Ionicons name="checkmark" size={18} color={c.onAccent} /> : null}
                </Pressable>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[type.label, { color: c.ink }]}>{account.name}</Text>
                  <Text style={[type.small, { color: c.muted }]}>{account.platform === "facebook" ? "Facebook Page" : "Professional Instagram"} · {account.status === "connected" ? "Connected" : "Reconnect required"}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={`Disconnect ${account.name}`} disabled={isBusy || !!confirmation} style={{ minHeight: 44, justifyContent: "center" }} onPress={() => setDisconnecting(account)}><Text style={[type.small, { color: c.bad, opacity: isBusy || confirmation ? 0.5 : 1 }]}>Disconnect</Text></Pressable>
              </View>
            );
          })}
        </View>
      ) : connection?.enabled ? <Body muted>No connected Pages or linked professional Instagram accounts yet.</Body> : null}

      {renderedPost ? (
        <View style={{ gap: space.md, paddingTop: space.sm, borderTopWidth: 1, borderColor: c.line }}>
          <Text style={[type.label, { color: c.ink }]}>Publish this reviewed media</Text>
          {renderedPost.kind === "reel" ? <Body muted>Instagram destinations receive a Reel. Facebook destinations receive a standard Page video post, not a Facebook Reel.</Body> : null}
          {!publishable ? (
            <Body muted>{format === "story" || renderedPost.format === "story" ? "Story-format art is available for manual Save/Share only. Native Meta publishing here supports feed posts and Reels—make a Square or Portrait post to publish." : "This render came from an older server without a protected render ID. Manual Save and Share remain available; update the server before publishing."}</Body>
          ) : (
            <>
              <Text style={[type.small, { color: c.muted }]}>The preview above is the exact {mediaDescription(renderedPost.kind, renderedPost.files.length)} that will be approved with the caption below.</Text>
              <Pressable accessibilityRole="checkbox" accessibilityLabel="Schedule this approved post" accessibilityState={{ checked: scheduleEnabled, disabled: isBusy || !!confirmation }} disabled={isBusy || !!confirmation} onPress={() => setScheduleEnabled((value) => !value)} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: scheduleEnabled ? c.accent : c.line, backgroundColor: scheduleEnabled ? c.accent : c.sunk }}>
                  {scheduleEnabled ? <Ionicons name="checkmark" size={16} color={c.onAccent} /> : null}
                </View>
                <Text style={[type.body, { color: c.ink }]}>Schedule this approved post</Text>
              </Pressable>
              {scheduleEnabled ? <View style={{ gap: space.sm }}>
                <Field label="Local date" hint="YYYY-MM-DD" value={dateText} onChangeText={setDateText} placeholder="2026-10-15" keyboardType="numbers-and-punctuation" editable={!isBusy && !confirmation} />
                <Field label="Local time" hint="24-hour HH:MM" value={timeText} onChangeText={setTimeText} placeholder="14:30" keyboardType="numbers-and-punctuation" editable={!isBusy && !confirmation} />
                <Text style={[type.small, { color: c.muted }]}>We’ll show the exact local time, time zone, and UTC time before scheduling.</Text>
              </View> : null}
              <Button label={scheduleEnabled ? "Review schedule" : "Review & publish now"} disabled={isBusy || !connectedAccounts.length} onPress={beginReview} />
            </>
          )}
        </View>
      ) : <Body muted>Generate a Square or Portrait post, carousel, or Reel to review a one-time publish. Connections and history remain available here without a new draft.</Body>}

      <History posts={posts} busy={busy} disabled={isBusy} onAction={postAction} />
      <Button label="Refresh publishing status" variant="ghost" disabled={isBusy || !!confirmation} onPress={() => { refreshDeadline.current = Date.now() + 10 * 60_000; void refresh(); }} />
      <ReviewModal confirmation={confirmation} busy={busy === "publish"} onClose={() => setConfirmation(null)} onConfirm={confirmPublish} />
      <DisconnectModal account={disconnecting} busy={busy?.startsWith("disconnect:") ?? false} onClose={() => setDisconnecting(null)} onConfirm={disconnect} />
    </PublishingShell>
  );
}

function PublishingShell({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return <View style={{ gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>{children}</View>;
}

function History({ posts, busy, disabled, onAction }: { posts: SocialPost[]; busy: string | null; disabled: boolean; onAction: (post: SocialPost, action: "cancel" | "retry") => void }) {
  const c = useColors();
  if (!posts.length) return <Body muted>No native publishing activity for this store yet.</Body>;
  return (
    <View style={{ gap: space.sm, paddingTop: space.sm, borderTopWidth: 1, borderColor: c.line }}>
      <Text style={[type.label, { color: c.ink }]}>Publishing history</Text>
      {posts.map((post) => (
        <View key={post.id} style={{ gap: 5, padding: space.md, borderRadius: radius.md, backgroundColor: c.sunk }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
            <Text style={[type.label, { color: c.ink, flex: 1 }]}>{post.account_name}</Text>
            <Pill text={post.status} tone={post.status === "published" ? "good" : post.status === "failed" || post.status === "uncertain" ? "flash" : "neutral"} />
          </View>
          <Text numberOfLines={2} style={[type.small, { color: c.muted }]}>{post.caption}</Text>
          <Text style={[type.small, { color: c.muted }]}>{post.status === "queued" ? `Queued for ${formatDate(post.publish_at)}` : `${post.kind} · ${formatDate(post.created_at)}`}</Text>
          {post.error ? <Text style={[type.small, { color: c.bad }]}>{post.error}</Text> : null}
          {post.status === "uncertain" ? <Text style={[type.small, { color: c.muted }]}>Status is uncertain. Check Meta directly; Snapfront will not republish it automatically.</Text> : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
            {isAllowedMetaPermalink(post.permalink) ? <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(post.permalink!); }}><Text style={[type.small, { color: c.accent }]}>View on Meta</Text></Pressable> : null}
            {canCancelSocialPost(post) ? <Pressable accessibilityRole="button" disabled={disabled} onPress={() => onAction(post, "cancel")}><Text style={[type.small, { color: c.accent, opacity: disabled ? 0.5 : 1 }]}>{busy === `cancel:${post.id}` ? "Canceling…" : "Cancel"}</Text></Pressable> : null}
            {canRetrySocialPost(post) ? <Pressable accessibilityRole="button" disabled={disabled} onPress={() => onAction(post, "retry")}><Text style={[type.small, { color: c.accent, opacity: disabled ? 0.5 : 1 }]}>{busy === `retry:${post.id}` ? "Retrying…" : "Retry safely"}</Text></Pressable> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function ReviewModal({ confirmation, busy, onClose, onConfirm }: { confirmation: Confirmation | null; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const c = useColors();
  if (!confirmation) return null;
  const action = confirmation.payload.publish_at ? "Schedule post" : "Publish now";
  return (
    <Modal visible transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <View style={{ flex: 1, justifyContent: "center", padding: space.lg, backgroundColor: "rgba(0,0,0,0.76)" }}>
        <ScrollView style={{ maxHeight: "90%", borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }} contentContainerStyle={{ gap: space.md, padding: space.lg }} keyboardShouldPersistTaps="handled">
          <H2>Final review</H2>
          <Text style={[type.small, { color: c.muted }]}>This review freezes the selected accounts, caption, media, and timing. Edit nothing behind it; close to make changes.</Text>
          <View style={{ gap: 4 }}>
            <Text style={[type.label, { color: c.ink }]}>Destinations</Text>
            {confirmation.accountNames.map((name) => <Text key={name} style={[type.small, { color: c.muted }]}>• {name}</Text>)}
          </View>
          <View style={{ gap: 4 }}><Text style={[type.label, { color: c.ink }]}>Media</Text><Text style={[type.small, { color: c.muted }]}>{confirmation.media} · {confirmation.kind}</Text></View>
          {confirmation.kind === "reel" ? <Text style={[type.small, { color: c.muted }]}>Instagram: Reel. Facebook Page: standard video post (not Facebook Reel).</Text> : null}
          {confirmation.kind !== "reel" ? <ScrollView horizontal showsHorizontalScrollIndicator={confirmation.mediaUrls.length > 1}>
            {confirmation.mediaUrls.map((url, index) => <Image key={url} source={{ uri: url }} contentFit="contain" accessibilityLabel={`Approved media ${index + 1}`} style={{ width: 160, height: 180, marginRight: 8 }} />)}
          </ScrollView> : <FrozenReel key={confirmation.mediaUrls[0]} url={confirmation.mediaUrls[0]} />}
          <View style={{ gap: 4 }}><Text style={[type.label, { color: c.ink }]}>Exact caption</Text><Text style={[type.small, { color: c.muted }]}>{confirmation.payload.caption}</Text></View>
          {confirmation.schedule ? <View style={{ gap: 4 }}><Text style={[type.label, { color: c.ink }]}>Exact schedule</Text><Text style={[type.small, { color: c.muted }]}>{confirmation.schedule.local} ({confirmation.schedule.timeZone})</Text><Text style={[type.small, { color: c.muted }]}>UTC: {confirmation.schedule.utc}</Text></View> : <Text style={[type.small, { color: c.muted }]}>Publishing now after confirmation.</Text>}
          <Button label={action} loading={busy} onPress={onConfirm} />
          <Button label="Back to edit" variant="ghost" disabled={busy} onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function FrozenReel({ url }: { url: string }) {
  const player = useVideoPlayer(url, (instance) => { instance.muted = true; instance.loop = false; });
  const focused = useIsFocused();
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => { if (state !== "active") player.pause(); });
    return () => subscription.remove();
  }, [player]);
  useEffect(() => { if (!focused) player.pause(); }, [focused, player]);
  return <VideoView accessibilityLabel="Exact approved Reel preview" player={player} nativeControls contentFit="contain" style={{ width: "100%", height: 260, borderRadius: radius.md }} />;
}

function DisconnectModal({ account, busy, onClose, onConfirm }: { account: SocialAccount | null; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const c = useColors();
  if (!account) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <View style={{ flex: 1, justifyContent: "center", padding: space.lg, backgroundColor: "rgba(0,0,0,0.76)" }}>
        <ScrollView style={{ maxHeight: "90%", borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }} contentContainerStyle={{ gap: space.md, padding: space.lg }}>
          <H2>Disconnect {account.name}?</H2>
          <Body muted>This removes Snapfront’s secure access for future publishing. It never deletes posts already published to Meta.</Body>
          <Button label="Disconnect" variant="danger" loading={busy} onPress={onConfirm} />
          <Button label="Keep connected" variant="ghost" disabled={busy} onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
