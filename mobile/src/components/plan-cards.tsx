// The two ways to buy Snapfront, shown on the phone (Google Play) and the website (Stripe):
// Lifetime (one payment, everything for good) and Monthly (everything, billed monthly).
import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Body, Button } from "@/components/ui";
import type { Account, PlanLimits } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

export type PlanChoice = "lifetime" | "pro";
export const FALLBACK_PRICE: Record<PlanChoice, string> = { lifetime: "$299", pro: "$69" };

export function everything(l?: PlanLimits): string[] {
  if (!l) return [];
  return [
    `Up to ${l.liveStores} live stores, with 0% Snapfront fees on your sales`,
    `${l.photo} AI product pages and ${l.product} AI digital products a month`,
    `AI lifestyle photos, ${l.video} AI video clips and ${l.post} marketing posts a month`,
    "Email marketing, your own affiliate program and Instagram AutoDM",
    "Sales & profit, ad pixels and the store assistant",
  ];
}

type Props = {
  account: Account | null; prices: Partial<Record<PlanChoice, string>>; limits?: PlanLimits;
  busy: string | null; onBuy: (p: PlanChoice) => void; wide?: boolean;
};
export function PlanCards({ account, prices, limits, busy, onBuy, wide }: Props) {
  const lifetime = Boolean(account?.lifetime);
  const monthly = account?.plan === "pro" && !lifetime;
  return (
    <View style={{ flexDirection: wide ? "row" : "column", flexWrap: "wrap", gap: space.lg }}>
      <Card title="Lifetime" badge="Best value" price={prices.lifetime ?? FALLBACK_PRICE.lifetime} period="once, for life" featured wide={wide}
        blurb="Pay once and keep everything, including every feature we add."
        items={[...everything(limits), "No monthly bill, ever"]}
        state={lifetime ? "yours" : "buy"} cta={`Get Lifetime for ${prices.lifetime ?? FALLBACK_PRICE.lifetime}`}
        note={monthly ? "Switching from monthly? Your monthly plan stops at the end of the month you've paid for." : undefined}
        busy={busy === "lifetime"} disabled={Boolean(busy)} onBuy={() => onBuy("lifetime")} />
      <Card title="Monthly" price={prices.pro ?? FALLBACK_PRICE.pro} period="a month" wide={wide}
        blurb="Everything in Snapfront. Cancel any time."
        items={everything(limits)}
        state={monthly ? "yours" : lifetime ? "covered" : "buy"} cta={`Start monthly for ${prices.pro ?? FALLBACK_PRICE.pro}/month`}
        busy={busy === "pro"} disabled={Boolean(busy)} onBuy={() => onBuy("pro")} />
    </View>
  );
}

function Card({ title, badge, price, period, blurb, items, state, cta, note, featured, busy, disabled, onBuy, wide }: {
  title: string; badge?: string; price: string; period: string; blurb: string; items: string[]; state: "buy" | "yours" | "covered"; cta: string; note?: string;
  featured?: boolean; busy: boolean; disabled: boolean; onBuy: () => void; wide?: boolean;
}) {
  const c = useColors();
  return (
    <View style={{ flexGrow: 1, flexBasis: wide ? 300 : undefined, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: featured ? 2 : 1, borderColor: featured ? c.accent : c.line, padding: space.lg, gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 26, color: c.ink }}>{title}</Text>
        {state === "yours" || badge ? (
          <View style={{ backgroundColor: state === "yours" ? c.sunk : c.accent, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: state === "yours" ? c.good : c.onAccent }}>{state === "yours" ? "Your plan" : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={{ color: c.ink }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 34 }}>{price}</Text>
        <Text style={[type.body, { color: c.muted }]}>  {period}</Text>
      </Text>
      <Body muted>{blurb}</Body>
      <View style={{ gap: 8 }}>
        {items.map((f) => (
          <View key={f} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <Ionicons name="checkmark-circle" size={18} color={c.accent} style={{ marginTop: 2 }} />
            <Text style={[type.body, { color: c.ink, flex: 1 }]}>{f}</Text>
          </View>
        ))}
      </View>
      {note && state === "buy" ? <Text style={[type.small, { color: c.muted }]}>{note}</Text> : null}
      {state === "buy" ? <Button label={cta} variant={featured ? "primary" : "secondary"} loading={busy} disabled={disabled} onPress={onBuy} /> : null}
      {state === "covered" ? <Text style={[type.small, { color: c.muted }]}>Included in your Lifetime plan.</Text> : null}
    </View>
  );
}
