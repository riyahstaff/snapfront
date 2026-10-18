// One community post: the full text and photo, likes, comments with one level of replies, and the
// author's or owner's tools (edit, pin, remove, report).
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice } from "@/components/ui";
import { Avatar, NameLine, timeAgo } from "@/components/community-ui";
import { ApiError, communityApi, type CommunityComment, type CommunityMe, type CommunityPost } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
function confirm(question: string): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(question));
  return new Promise((resolve) => Alert.alert(question, undefined, [{ text: "Cancel", style: "cancel", onPress: () => resolve(false) }, { text: "Yes", style: "destructive", onPress: () => resolve(true) }]));
}

export default function CommunityPostScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [me, setMe] = useState<CommunityMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", body: "" });

  const load = useCallback(async () => {
    try {
      const [t, h] = await Promise.all([communityApi.thread(String(id)), communityApi.home()]);
      setPost(t.post); setComments(t.comments); setMe(h.me); setError(null);
    } catch (e) { setError(errText(e, "Couldn't open this post.")); }
  }, [id]);
  useFocusEffect(useCallback(() => { load(); const t = setInterval(load, 30_000); return () => clearInterval(t); }, [load]));

  if (!post || !me) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  const canAct = me.can_post;

  const likePost = async () => {
    const on = !post.liked;
    setPost({ ...post, liked: on, likes: post.likes + (on ? 1 : -1) });
    try { const r = await communityApi.like("post", post.id, on); setPost((p) => (p ? { ...p, liked: r.liked, likes: r.likes } : p)); } catch (e) { setError(errText(e, "Couldn't save your like.")); load(); }
  };
  const likeComment = async (cm: CommunityComment) => {
    try { await communityApi.like("comment", cm.id, !cm.liked); load(); } catch (e) { setError(errText(e, "Couldn't save your like.")); }
  };
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true); setError(null);
    try { const t = await communityApi.comment(post.id, text.trim(), replyTo?.id); setPost(t.post); setComments(t.comments); setText(""); setReplyTo(null); }
    catch (e) { setError(errText(e, "Couldn't post your comment.")); } finally { setBusy(false); }
  };
  const removePost = async () => {
    if (!(await confirm("Remove this post?"))) return;
    try { await communityApi.remove(post.id); router.back(); } catch (e) { setError(errText(e, "Couldn't remove it.")); }
  };
  const removeComment = async (cm: CommunityComment) => {
    if (!(await confirm("Remove this comment?"))) return;
    try { const t = await communityApi.removeComment(cm.id); setPost(t.post); setComments(t.comments); } catch (e) { setError(errText(e, "Couldn't remove it.")); }
  };
  const report = async (kind: "post" | "comment", targetId: string) => {
    if (!(await confirm("Report this to Snapfront?"))) return;
    try {
      await communityApi.report(kind, targetId, ""); setError(null);
      if (Platform.OS === "web") window.alert("Thanks. Snapfront will take a look."); else Alert.alert("Thanks. Snapfront will take a look.");
    }
    catch (e) { setError(errText(e, "Couldn't send the report.")); }
  };
  const saveEdit = async () => {
    try { setPost(await communityApi.edit(post.id, draft)); setEditing(false); } catch (e) { setError(errText(e, "Couldn't save.")); }
  };

  const Comment = ({ cm, reply }: { cm: CommunityComment; reply?: boolean }) => (
    <View style={{ flexDirection: "row", gap: space.md, marginLeft: reply ? 46 : 0 }}>
      <Avatar person={cm.author} size={reply ? 30 : 36} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ backgroundColor: c.sunk, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, gap: 2 }}>
          <NameLine person={cm.author} extra={timeAgo(cm.created_at)} />
          <Text style={[type.body, { color: cm.removed ? c.muted : c.ink, fontStyle: cm.removed ? "italic" : "normal" }]}>{cm.removed ? "This comment was removed." : cm.body}</Text>
        </View>
        {!cm.removed ? (
          <View style={{ flexDirection: "row", gap: space.lg, alignItems: "center", paddingLeft: 4 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={cm.liked ? "Unlike comment" : "Like comment"} disabled={!canAct || cm.author.id === me.id} onPress={() => likeComment(cm)} hitSlop={8} style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
              <Ionicons name={cm.liked ? "heart" : "heart-outline"} size={15} color={cm.liked ? "#FF7A8A" : c.muted} />
              <Text style={[type.small, { color: c.muted }]}>{cm.likes || ""}</Text>
            </Pressable>
            {canAct ? <Pressable accessibilityRole="button" onPress={() => setReplyTo(cm)} hitSlop={8}><Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.muted }}>Reply</Text></Pressable> : null}
            {cm.can_remove ? <Pressable accessibilityRole="button" onPress={() => removeComment(cm)} hitSlop={8}><Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.muted }}>Remove</Text></Pressable>
              : <Pressable accessibilityRole="button" onPress={() => report("comment", cm.id)} hitSlop={8}><Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.muted }}>Report</Text></Pressable>}
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <View style={{ width: "100%", maxWidth: 760, alignSelf: "center", padding: space.lg, gap: space.lg }}>
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
          <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
            <Avatar person={post.author} size={44} />
            <View style={{ flex: 1 }}>
              <NameLine person={post.author} extra={`Level ${post.author.level}`} />
              <Text style={[type.small, { color: c.muted }]}>{timeAgo(post.created_at)}{post.edited_at ? " · edited" : ""}{post.pinned ? " · 📌 Pinned" : ""}</Text>
            </View>
          </View>
          {editing ? (
            <View style={{ gap: space.sm }}>
              <TextInput value={draft.title} onChangeText={(v) => setDraft({ ...draft, title: v })} accessibilityLabel="Title" style={{ fontFamily: fonts.bodyBold, fontSize: 20, color: c.ink, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 6 }} />
              <TextInput value={draft.body} onChangeText={(v) => setDraft({ ...draft, body: v })} multiline accessibilityLabel="Post" style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: c.ink, minHeight: 120, textAlignVertical: "top" }} />
              <View style={{ flexDirection: "row", gap: space.sm }}><Button label="Save" onPress={saveEdit} /><Button label="Cancel" variant="ghost" onPress={() => setEditing(false)} /></View>
            </View>
          ) : (
            <>
              <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.5, color: c.ink }}>{post.title}</Text>
              {post.body ? <Text selectable style={[type.body, { color: c.ink, fontSize: 16, lineHeight: 25 }]}>{post.body}</Text> : null}
            </>
          )}
          {post.image_url ? <Image source={{ uri: post.image_url }} style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: c.sunk }} contentFit="contain" /> : null}
          <View style={{ flexDirection: "row", gap: space.lg, alignItems: "center", flexWrap: "wrap" }}>
            <Pressable accessibilityRole="button" accessibilityLabel={post.liked ? "Unlike" : "Like"} disabled={!canAct || post.mine} onPress={likePost} hitSlop={10} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name={post.liked ? "heart" : "heart-outline"} size={22} color={post.liked ? "#FF7A8A" : c.muted} />
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.muted }}>{post.likes} {post.likes === 1 ? "like" : "likes"}</Text>
            </Pressable>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.muted }}>{post.comments} {post.comments === 1 ? "comment" : "comments"}</Text>
            <View style={{ flex: 1 }} />
            {post.can_edit && !editing ? <Button label="Edit" variant="ghost" onPress={() => { setDraft({ title: post.title, body: post.body }); setEditing(true); }} /> : null}
            {me.owner ? <Button label={post.pinned ? "Unpin" : "Pin"} variant="ghost" onPress={() => communityApi.pin(post.id, !post.pinned).then(setPost).catch((e) => setError(errText(e, "Couldn't pin.")))} /> : null}
            {post.can_remove ? <Button label="Remove" variant="danger" onPress={removePost} /> : <Button label="Report" variant="ghost" onPress={() => report("post", post.id)} />}
          </View>
        </View>

        <Notice text={error} tone="error" />
        {canAct ? (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.md, gap: space.sm }}>
            {replyTo ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Text style={[type.small, { color: c.muted, flex: 1 }]}>Replying to {replyTo.author.name}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Cancel reply" onPress={() => setReplyTo(null)}><Ionicons name="close" size={18} color={c.muted} /></Pressable>
              </View>
            ) : null}
            <View style={{ flexDirection: "row", gap: space.sm, alignItems: "flex-end" }}>
              <Avatar person={me} size={34} badge={false} />
              <TextInput value={text} onChangeText={setText} placeholder={replyTo ? "Write a reply…" : "Write a comment…"} placeholderTextColor={c.muted} multiline maxLength={2000} accessibilityLabel="Comment"
                style={{ flex: 1, fontFamily: fonts.body, fontSize: 15, color: c.ink, minHeight: 40, maxHeight: 160, paddingVertical: 9 }} />
              <Button label="Send" loading={busy} disabled={!text.trim()} onPress={send} />
            </View>
          </View>
        ) : <Notice text={me.member ? "Posting is paused on your account." : "Become a member to comment and like."} />}

        <View style={{ gap: space.lg }}>
          {comments.map((cm) => (
            <View key={cm.id} style={{ gap: space.md }}>
              <Comment cm={cm} />
              {(cm.replies || []).map((r) => <Comment key={r.id} cm={r} reply />)}
            </View>
          ))}
          {!comments.length ? <Text style={[type.body, { color: c.muted, textAlign: "center" }]}>No comments yet. Start the conversation.</Text> : null}
        </View>
      </View>
    </ScrollView>
  );
}
