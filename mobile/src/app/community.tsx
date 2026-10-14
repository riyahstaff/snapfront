// The Snapfront community: members' Discord, the Whop page and live coaching times.
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Button, Notice } from "@/components/ui";
import { Card } from "@/components/panel";
import { academy, ApiError, type Community } from "@/lib/api";
import { space, type, useColors } from "@/lib/theme";

export default function CommunityScreen() {
  const c = useColors();
  const [data, setData] = useState<Community | null>(null);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { academy.community().then(setData).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load the community.")); }, []));
  if (!data) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.xl }}>{error ? <Notice text={error} tone="error" /> : <ActivityIndicator color={c.accent} />}</View>;
  const nothingYet = !data.has_discord && !data.whop;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }}>
      <Text style={[type.body, { color: c.muted }]}>Ask questions, share wins, get feedback on your store and join live coaching with other Snapfront sellers.</Text>
      {data.live_schedule ? <Card title="Live coaching" sub={data.live_schedule}><Text style={[type.body, { color: c.muted }]}>Bring your store and your questions. Replays are posted in the community.</Text></Card> : null}
      {data.has_discord ? (
        <Card title="Members' Discord" sub="Channels for wins, store reviews, content feedback and going live.">
          {data.discord ? <Button label="Join the Discord" onPress={() => Linking.openURL(data.discord!)} />
            : <><Text style={[type.body, { color: c.muted }]}>The members&apos; Discord comes with Snapfront Pro.</Text><Button label="See membership" variant="secondary" onPress={() => router.push({ pathname: "/plans", params: { highlight: "pro" } })} /></>}
        </Card>
      ) : null}
      {data.whop ? (
        <Card title="Snapfront on Whop" sub="Resources, announcements and the community feed.">
          <Button label="Open Whop" variant={data.discord ? "secondary" : "primary"} onPress={() => Linking.openURL(data.whop!)} />
        </Card>
      ) : null}
      {nothingYet ? <Notice text="The community is opening soon. We'll email you the invite." /> : null}
      <Card title="Keep learning">
        <Button label="Open Snapfront Academy" variant="secondary" onPress={() => router.push("/academy")} />
      </Card>
    </ScrollView>
  );
}
