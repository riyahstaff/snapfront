import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice, Pill, Segmented } from "@/components/ui";
import { api, ApiError, money, type Address, type Fulfillment, type Order } from "@/lib/api";
import { radius, space, type, useColors } from "@/lib/theme";

const when = (iso: string | null) => (iso ? new Date(iso.replace(" ", "T") + "Z").toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "");
const addressLines = (a: Address | null) =>
  a ? [a.line1, a.line2, [a.city, a.state, a.postal_code].filter(Boolean).join(" "), a.country].filter(Boolean) as string[] : [];

export default function OrdersScreen() {
  const c = useColors();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"todo" | "all">("todo");
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setOrders(await api.orders()); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't load orders."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Paid orders with something to ship are the seller's to-do list; digital-only orders deliver themselves.
  const needsShipping = (o: Order) => o.status === "paid" && o.items.some((i) => i.kind === "physical");
  const shown = filter === "todo" ? orders.filter(needsShipping) : orders;
  const revenue = orders.filter((o) => o.status !== "canceled").reduce((s, o) => s + o.total, 0);

  async function fulfill(o: Order) {
    setBusy(o.id); setError(null);
    try { const next = await api.fulfillOrder(o.id); setOrders((list) => list.map((x) => (x.id === o.id ? next : x))); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't update the order."); }
    finally { setBusy(null); }
  }

  async function supplier(o: Order) {
    setBusy(`s:${o.id}`); setError(null);
    try { const next = await api.orderSupplier(o.id); setOrders((list) => list.map((x) => (x.id === o.id ? next : x))); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't reach CJ. Try again."); }
    finally { setBusy(null); }
  }

  return (
    <FlatList
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: space.lg, gap: space.md }}
      data={shown}
      keyExtractor={(o) => o.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.sm }}>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Stat label="Orders" value={String(orders.filter((o) => o.status !== "canceled").length)} />
            <Stat label="Sales" value={money(revenue)} />
            <Stat label="To ship" value={String(orders.filter(needsShipping).length)} />
          </View>
          <Segmented value={filter} onChange={setFilter} options={[{ value: "todo", label: "To ship" }, { value: "all", label: "All orders" }]} />
          <Notice text={error} tone="error" />
        </View>
      }
      ListEmptyComponent={loading ? null : (
        <View style={{ alignItems: "center", gap: space.sm, padding: space.xl, borderWidth: 2, borderStyle: "dashed", borderColor: c.line, borderRadius: radius.lg }}>
          <Ionicons name={filter === "todo" ? "checkmark-done" : "receipt-outline"} size={28} color={c.muted} />
          <Text style={[type.heading, { color: c.ink }]}>{filter === "todo" ? "Nothing to ship" : "No orders yet"}</Text>
          <Text style={[type.small, { color: c.muted, textAlign: "center" }]}>
            {filter === "todo" ? "Paid orders with physical items show up here until you mark them shipped." : "Share your store link and orders will appear here as they're paid."}
          </Text>
        </View>
      )}
      renderItem={({ item: o }) => {
        const expanded = open === o.id;
        const count = o.items.reduce((s, i) => s + i.qty, 0);
        return (
          <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, overflow: "hidden" }}>
            <Pressable onPress={() => setOpen(expanded ? null : o.id)} accessibilityRole="button" accessibilityState={{ expanded }}
              accessibilityLabel={`Order from ${o.customer_name || o.email || "a buyer"}, ${money(o.total)}, ${o.status}`}
              style={{ padding: space.md, gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
                <Text numberOfLines={1} style={[type.label, { color: c.ink, flex: 1 }]}>{o.customer_name || o.email || "Buyer"}</Text>
                <Text style={[type.label, { color: c.ink, fontVariant: ["tabular-nums"] }]}>{money(o.total)}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Pill text={o.status === "paid" ? (needsShipping(o) ? "To ship" : "Paid") : o.status === "fulfilled" ? "Shipped" : "Canceled"} tone={o.status === "paid" && needsShipping(o) ? "flash" : o.status === "fulfilled" ? "good" : "neutral"} />
                <Text style={[type.small, { color: c.muted, flex: 1 }]} numberOfLines={1}>{count} item{count === 1 ? "" : "s"} · {when(o.paid_at || o.created_at)}</Text>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={c.muted} />
              </View>
            </Pressable>
            {expanded ? (
              <View style={{ borderTopWidth: 1, borderColor: c.line, padding: space.md, gap: space.md }}>
                <View style={{ gap: 6 }}>
                  {o.items.map((i, n) => (
                    <View key={n} style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
                      <Text style={[type.small, { color: c.ink, flex: 1 }]}>{i.qty} × {i.title}{i.variant ? ` (${i.variant})` : ""}{i.kind === "digital" ? " · download" : ""}</Text>
                      <Text style={[type.small, { color: c.ink }]}>{money(i.unit * i.qty)}</Text>
                    </View>
                  ))}
                  {o.discount ? <Line label={`Discount${o.discount_code ? ` (${o.discount_code})` : ""}`} value={`−${money(o.discount)}`} /> : null}
                  {o.shipping ? <Line label="Shipping" value={money(o.shipping)} /> : null}
                  {o.tax ? <Line label="Tax" value={money(o.tax)} /> : null}
                </View>
                {o.shipping_address ? (
                  <View style={{ gap: 2 }}>
                    <Text style={[type.label, { color: c.ink }]}>Ship to</Text>
                    <Text selectable style={[type.small, { color: c.ink }]}>{[o.customer_name, ...addressLines(o.shipping_address)].filter(Boolean).join("\n")}</Text>
                  </View>
                ) : null}
                {o.email ? <Text selectable style={[type.small, { color: c.muted }]}>{o.email}</Text> : null}
                {o.supplier || o.fulfillments?.length ? <SupplierBox o={o} busy={busy === `s:${o.id}`} onAction={() => supplier(o)} /> : null}
                {o.tracking && !o.supplier ? (
                  <Button label={`Track package ${o.tracking.number}`} variant="secondary" onPress={() => WebBrowser.openBrowserAsync(o.tracking!.url)} />
                ) : null}
                {needsShipping(o) ? <Button label="Mark as shipped" variant={o.supplier ? "ghost" : "primary"} loading={busy === o.id} onPress={() => fulfill(o)} /> : null}
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}

const PAY: Record<string, { text: string; button: string; url: string }> = {
  cj: { text: "Pay for it in CJ (My CJ, then Orders) so it ships.", button: "Open CJ to pay", url: "https://cjdropshipping.com/" },
  printful: { text: "Confirm it in Printful (Orders) so it’s printed and shipped.", button: "Open Printful", url: "https://www.printful.com/dashboard" },
  aliexpress: { text: "Pay for it in your AliExpress account (My Orders) so it ships.", button: "Open AliExpress", url: "https://www.aliexpress.com/p/order/index.html" },
};
function statusText(f: Fulfillment) {
  switch (f.status) {
    case "needs_key": return `Waiting for your ${f.name} account. Connect ${f.name} in Store settings and this order is sent automatically.`;
    case "sending": return `Sending this order to ${f.name}…`;
    case "awaiting_payment": return `Placed with ${f.name} and waiting for you. ${PAY[f.supplier]?.text ?? ""}`;
    case "sent": return `${f.name} has it and is getting it ready. Tracking appears here once it ships.`;
    case "shipped": return `${f.name} shipped it to your buyer.`;
    case "delivered": return "Delivered to your buyer.";
    case "failed": return `${f.name} didn’t accept this order.${f.error ? ` ${f.error}` : ""}`;
    case "canceled": return `${f.name} canceled this order. Check your ${f.name} account for details.`;
    default: return f.status;
  }
}

/** Each supplier's part of the order (older servers only send `supplier`). */
function SupplierBox({ o, busy, onAction }: { o: Order; busy: boolean; onAction: () => void }) {
  const c = useColors();
  const list: Fulfillment[] = o.fulfillments ?? (o.supplier ? [{ supplier: "cj", name: o.supplier.name, status: o.supplier.status, order_id: o.supplier.order_id, error: o.supplier.error, tracking: o.tracking }] : []);
  const canRefresh = list.some((f) => ["failed", "awaiting_payment", "sent", "shipped"].includes(f.status));
  return (
    <View style={{ gap: space.sm }}>
      {list.map((f) => (
        <View key={f.supplier} style={{ gap: space.sm, backgroundColor: c.sunk, borderRadius: radius.md, padding: space.md }}>
          <Text style={[type.label, { color: c.ink }]}>Fulfilled by {f.name}{f.order_id ? ` · order ${f.order_id}` : ""}</Text>
          <Text style={[type.small, { color: f.status === "failed" ? c.bad : c.ink }]}>{statusText(f)}</Text>
          {f.tracking ? (
            <Button label={`Track package ${f.tracking.number}`} variant="secondary" onPress={() => WebBrowser.openBrowserAsync(f.tracking!.url)} />
          ) : null}
          {f.status === "needs_key" ? <Button label={`Connect ${f.name}`} variant="secondary" onPress={() => router.push("/settings")} /> : null}
          {f.status === "awaiting_payment" && PAY[f.supplier] ? (
            <Button label={PAY[f.supplier].button} variant="secondary" onPress={() => WebBrowser.openBrowserAsync(PAY[f.supplier].url)} />
          ) : null}
        </View>
      ))}
      {canRefresh ? <Button label={list.some((f) => f.status === "failed") ? "Try sending again" : "Check for updates"} variant="ghost" loading={busy} onPress={onAction} /> : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md, gap: 2 }}>
      <Text style={[type.heading, { color: c.ink, fontVariant: ["tabular-nums"] }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[type.small, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.md }}>
      <Text style={[type.small, { color: c.muted }]}>{label}</Text>
      <Text style={[type.small, { color: c.muted }]}>{value}</Text>
    </View>
  );
}
