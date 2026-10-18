// Pieces shared by the community screens: avatars with a level badge, post cards, the level card and
// friendly times.
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { CommunityCategory, CommunityLevel, CommunityMe, CommunityPerson, CommunityPost } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

/** The server stores UTC as "YYYY-MM-DD HH:MM:SS". */
export const parseTime = (s: string) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s.replace(" ", "T")}Z`);
export function timeAgo(s: string) {
  const sec = Math.max(0, (Date.now() - parseTime(s).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}d`;
  return parseTime(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// A colour per person, so faces are easy to tell apart without photos.
const HUES = ["#D99568", "#76D8B3", "#8FB3FF", "#F2C66D", "#E58FB5", "#A99CF2", "#6FD0E0", "#F29C7A"];
const hueOf = (id: string) => HUES[[...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % HUES.length];

export function Avatar({ person, size = 40, badge = true }: { person: Pick<CommunityPerson, "id" | "initials" | "level" | "admin">; size?: number; badge?: boolean }) {
  const c = useColors();
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: hueOf(person.id), alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: size * 0.38, color: "#11151B" }}>{person.initials || "?"}</Text>
      </View>
      {badge ? (
        <View accessibilityLabel={`Level ${person.level}`} style={{ position: "absolute", right: -3, bottom: -3, minWidth: size * 0.46, height: size * 0.46, paddingHorizontal: 3, borderRadius: size, backgroundColor: c.accent, borderWidth: 2, borderColor: c.bg, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: Math.max(9, size * 0.26), color: c.onAccent }}>{person.level}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function NameLine({ person, extra }: { person: CommunityPerson; extra?: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: c.ink }} numberOfLines={1}>{person.name}</Text>
      {person.admin ? <View style={{ backgroundColor: c.brand, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 1 }}><Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "#11151B" }}>Snapfront</Text></View> : null}
      {extra ? <Text style={[type.small, { color: c.muted }]}>{extra}</Text> : null}
    </View>
  );
}

export function PostCard({ post, category, onOpen, onLike, canLike }: { post: CommunityPost; category?: CommunityCategory; onOpen: () => void; onLike: () => void; canLike: boolean }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${post.title}, by ${post.author.name}`} onPress={onOpen}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ backgroundColor: hovered ? c.sunk : c.surface, borderWidth: 1, borderColor: post.pinned ? "#5A6270" : c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md, opacity: pressed ? 0.9 : 1 })}>
      {post.pinned ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="pin" size={14} color={c.brand} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: c.brand, letterSpacing: 0.5 }}>PINNED</Text>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
        <Avatar person={post.author} />
        <View style={{ flex: 1, gap: 1 }}>
          <NameLine person={post.author} />
          <Text style={[type.small, { color: c.muted }]}>{timeAgo(post.created_at)}{category ? ` · ${category.emoji} ${category.name}` : ""}</Text>
        </View>
      </View>
      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 18, lineHeight: 24, color: c.ink }}>{post.title}</Text>
        {post.body ? <Text style={[type.body, { color: c.muted }]} numberOfLines={3}>{post.body}</Text> : null}
      </View>
      {post.image_url ? <Image source={{ uri: post.image_url }} style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: c.sunk }} contentFit="cover" /> : null}
      <View style={{ flexDirection: "row", gap: space.lg, alignItems: "center" }}>
        <Pressable accessibilityRole="button" accessibilityLabel={post.liked ? "Unlike" : "Like"} accessibilityState={{ selected: post.liked, disabled: !canLike }} disabled={!canLike} onPress={onLike} hitSlop={10}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name={post.liked ? "heart" : "heart-outline"} size={19} color={post.liked ? "#FF7A8A" : c.muted} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.muted }}>{post.likes}</Text>
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="chatbubble-outline" size={18} color={c.muted} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: c.muted }}>{post.comments}</Text>
        </View>
        {post.comments > 0 && post.activity_at !== post.created_at ? <Text style={[type.small, { color: c.muted }]}>New comment {timeAgo(post.activity_at)} ago</Text> : null}
      </View>
    </Pressable>
  );
}

/** Your level, points and how far to the next level, with the ladder of levels. */
export function LevelCard({ me, levels, compact }: { me: CommunityMe; levels: CommunityLevel[]; compact?: boolean }) {
  const c = useColors();
  const li = me.level_info;
  const from = levels.find((l) => l.level === li.level)?.points ?? 0;
  const pct = li.next_at ? Math.min(1, (li.points - from) / Math.max(1, li.next_at - from)) : 1;
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
        <Avatar person={me} size={52} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: c.ink }}>Level {li.level} · {li.name}</Text>
          <Text style={[type.small, { color: c.muted }]}>{li.next_at ? `${li.next_at - li.points} more ${li.next_at - li.points === 1 ? "point" : "points"} to level ${li.level + 1} (${li.next_name})` : "Top level. Legendary."}</Text>
        </View>
      </View>
      <View style={{ height: 8, borderRadius: 8, backgroundColor: c.sunk, overflow: "hidden" }}>
        <View style={{ width: `${Math.round(pct * 100)}%`, height: "100%", backgroundColor: c.brand }} />
      </View>
      <Text style={[type.small, { color: c.muted }]}>You earn a point each time someone likes your post or comment.</Text>
      {!compact ? (
        <View style={{ gap: 6, marginTop: 4 }}>
          {levels.map((l) => (
            <View key={l.level} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, opacity: l.level <= li.level ? 1 : 0.55 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: l.level <= li.level ? c.accent : c.sunk }}>
                {l.level < li.level ? <Ionicons name="checkmark" size={14} color={c.onAccent} /> : <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: l.level <= li.level ? c.onAccent : c.muted }}>{l.level}</Text>}
              </View>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: c.ink, flex: 1 }}>{l.name}</Text>
              <Text style={[type.small, { color: c.muted }]}>{l.points.toLocaleString()} pts</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const kindText: Record<string, string> = { comment: "commented on", reply: "replied to you on", like_post: "liked your post", like_comment: "liked your comment on" };
