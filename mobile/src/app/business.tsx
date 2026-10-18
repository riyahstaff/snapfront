// Sales & profit: the seller's back office. Overview (profit and loss, chart, traffic, products,
// Stripe balance), every sale, every customer (tags and notes), and expenses, with CSV exports.
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Notice, Segmented } from "@/components/ui";
import { ApiError, business, type BizBalance, type BizCustomer, type BizExpense, type BizSale, type BizSummary } from "@/lib/api";
import { fonts, radius, space, type, useColors } from "@/lib/theme";

type Tab = "overview" | "sales" | "customers" | "expenses";
const RANGES = [{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }, { value: "365", label: "Year" }, { value: "all", label: "All time" }] as const;
type RangeId = (typeof RANGES)[number]["value"];
const money = (n: number) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string | null) => (iso ? new Date(iso.replace(" ", "T") + (iso.includes("Z") ? "" : "Z")).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");
const signed = (n: number) => (n < 0 ? `−${money(-n)}` : money(n));
const errText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export default function BusinessScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<RangeId>("30");
  const [exportError, setExportError] = useState<string | null>(null);

  async function exportCsv(kind: "sales" | "customers" | "expenses") {
    try {
      const { url } = await business.exportLink(kind, { range });
      await Linking.openURL(url);
      setExportError(null);
    } catch (e) { setExportError(errText(e, "Couldn't make the file. Try again.")); }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: space.xl, gap: space.xl, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: space.md }}>
        <Segmented value={tab} onChange={setTab} options={[{ value: "overview", label: "Overview" }, { value: "sales", label: "Sales" }, { value: "customers", label: "Customers" }, { value: "expenses", label: "Expenses" }]} />
        {tab !== "customers" ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {RANGES.map((r) => (
              <Pressable key={r.value} onPress={() => setRange(r.value)} accessibilityRole="button" accessibilityState={{ selected: range === r.value }}
                style={{ paddingHorizontal: 14, height: 34, borderRadius: radius.pill, justifyContent: "center", borderWidth: 1, borderColor: range === r.value ? c.accent : c.line, backgroundColor: range === r.value ? c.accent : "transparent" }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: range === r.value ? c.onAccent : c.muted }}>{r.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
      <Notice text={exportError} tone="error" />
      {tab === "overview" ? <Overview range={range} wide={wide} onTab={setTab} /> : null}
      {tab === "sales" ? <Sales range={range} onExport={() => exportCsv("sales")} /> : null}
      {tab === "customers" ? <Customers wide={wide} onExport={() => exportCsv("customers")} /> : null}
      {tab === "expenses" ? <Expenses range={range} onExport={() => exportCsv("expenses")} /> : null}
    </ScrollView>
  );
}


/* ---------------- Overview ---------------- */
function Overview({ range, wide, onTab }: { range: RangeId; wide: boolean; onTab: (t: Tab) => void }) {
  const c = useColors();
  const [data, setData] = useState<BizSummary | null>(null);
  const [bal, setBal] = useState<BizBalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    let alive = true;
    setLoading(true); setError(null);
    business.summary({ range }).then((d) => alive && setData(d)).catch((e) => alive && setError(errText(e, "Couldn't load your numbers."))).finally(() => alive && setLoading(false));
    business.balance().then((b) => alive && setBal(b)).catch(() => {});
    return () => { alive = false; };
  }, [range]));

  if (!data) return loading ? <ActivityIndicator color={c.accent} /> : <Notice text={error} tone="error" />;
  const t = data.totals, p = data.pnl;
  const empty = t.orders === 0 && p.expenses === 0;
  return (
    <View style={{ gap: space.xl }}>
      <Notice text={error} tone="error" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
        <Tile label="Revenue" value={money(t.revenue)} sub={`${t.orders} order${t.orders === 1 ? "" : "s"}`} wide={wide} />
        <Tile label="Net profit" value={signed(t.net_profit)} sub={t.revenue > 0 ? `${t.margin}% margin` : "after fees, costs and expenses"} tone={t.net_profit < 0 ? "bad" : t.net_profit > 0 ? "good" : undefined} wide={wide} />
        <Tile label="Average order" value={money(t.average_order)} sub={`${t.customers} customer${t.customers === 1 ? "" : "s"}`} wide={wide} />
        <Tile label="Conversion" value={`${t.conversion}%`} sub={`${t.visitors} visitor${t.visitors === 1 ? "" : "s"}`} wide={wide} />
      </View>

      <Card title={data.series.bucket === "day" ? "Day by day" : data.series.bucket === "week" ? "Week by week" : "Month by month"}>
        <TrendChart points={data.series.points} bucket={data.series.bucket} />
      </Card>

      <View style={{ flexDirection: wide ? "row" : "column", gap: space.xl, alignItems: "flex-start" }}>
        <Card title="Profit and loss" style={{ flex: wide ? 1 : undefined, width: wide ? undefined : "100%" }}>
          <Line label="Product sales" value={money(p.gross_sales)} />
          {p.discounts ? <Line label="Discounts" value={`−${money(p.discounts)}`} /> : null}
          {p.shipping_charged ? <Line label="Shipping charged" value={money(p.shipping_charged)} /> : null}
          <Line label="Revenue" value={money(p.revenue)} strong />
          <Line label={`Refunds${p.refunded_orders ? ` (${p.refunded_orders})` : ""}`} value={`−${money(p.refunds)}`} />
          <Line label="Stripe fees" value={`−${money(p.stripe_fees)}`} hint={p.estimated_fee_orders ? `${p.estimated_fee_orders} estimated until Stripe reports them` : undefined} />
          <Line label="Product costs" value={`−${money(p.product_costs)}`} hint={data.missing_costs ? `${data.missing_costs} product${data.missing_costs === 1 ? " has" : "s have"} no cost yet` : undefined} />
          <Line label="Expenses" value={`−${money(p.expenses)}`} action={{ label: "Add", onPress: () => onTab("expenses") }} />
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          <Line label="Net profit" value={signed(p.net_profit)} strong tone={p.net_profit < 0 ? "bad" : "good"} />
          {p.tax_collected ? <Text style={[type.small, { color: c.muted }]}>Sales tax collected ({money(p.tax_collected)}) isn&apos;t counted as revenue. It&apos;s owed to the state.</Text> : null}
        </Card>
        <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : "100%", gap: space.xl }}>
          <BalanceCard bal={bal} />
          <Card title="Customers">
            <Line label="Bought in this period" value={String(t.customers)} />
            <Line label="New" value={String(t.new_customers)} />
            <Line label="Returning" value={String(t.returning_customers)} />
            <Button label="See all customers" variant="ghost" onPress={() => onTab("customers")} />
          </Card>
        </View>
      </View>

      {empty ? (
        <Notice text="No sales in this period yet. Share your store link, then check back here for revenue, profit and customers." />
      ) : null}

      <Card title="Products">
        {data.products.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ minWidth: 640, flexGrow: 1 }}>
              <Row cells={["Product", "Visitors", "Sold", "Conversion", "Revenue", "Profit"]} header />
              {data.products.map((pr) => (
                <Row key={pr.id} onPress={() => router.push({ pathname: "/product/[id]", params: { id: pr.id } })}
                  cells={[pr.title, String(pr.visitors), String(pr.units), `${pr.conversion}%`, money(pr.revenue), signed(pr.profit)]} />
              ))}
            </View>
          </ScrollView>
        ) : <Text style={[type.body, { color: c.muted }]}>Product numbers appear once people visit or buy.</Text>}
        {data.missing_costs ? <Text style={[type.small, { color: c.muted }]}>Add what each product costs you (open a product, then Cost per item) so profit is exact.</Text> : null}
      </Card>

      <Card title="Where visitors come from">
        {data.sources.length ? data.sources.map((s) => {
          const max = data.sources[0].visitors || 1;
          return (
            <View key={s.source} style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={[type.body, { color: c.ink, textTransform: "capitalize" }]}>{s.source}</Text>
                <Text style={[type.body, { color: c.muted, fontVariant: ["tabular-nums"] }]}>{s.visitors}</Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: c.sunk, overflow: "hidden" }}>
                <View style={{ width: `${Math.max(2, (s.visitors / max) * 100)}%`, height: "100%", borderRadius: 3, backgroundColor: c.accent }} />
              </View>
            </View>
          );
        }) : <Text style={[type.body, { color: c.muted }]}>No visits in this period yet.</Text>}
      </Card>
    </View>
  );
}

function BalanceCard({ bal }: { bal: BizBalance | null }) {
  const c = useColors();
  return (
    <Card title="Stripe balance">
      {!bal ? <ActivityIndicator color={c.accent} /> : !bal.connected ? (
        <>
          <Text style={[type.body, { color: c.muted }]}>Connect Stripe to take payments. Your balance and payouts show here.</Text>
          <Button label="Connect Stripe" variant="secondary" onPress={() => router.push("/store")} />
        </>
      ) : bal.error ? <Text style={[type.body, { color: c.muted }]}>{bal.error}</Text> : (
        <>
          <Line label="Available" value={money(bal.available ?? 0)} strong />
          <Line label="On the way" value={money(bal.pending ?? 0)} />
          {bal.payouts?.length ? (
            <View style={{ gap: 6, marginTop: 4 }}>
              <Text style={[type.label, { color: c.muted }]}>Recent payouts to your bank</Text>
              {bal.payouts.slice(0, 4).map((po) => <Line key={po.id} label={`${po.arrival_date ? when(po.arrival_date) : ""} · ${po.status.replace("_", " ")}`} value={money(po.amount)} />)}
            </View>
          ) : null}
          <Text style={[type.small, { color: c.muted }]}>Stripe pays out to your bank automatically. Change the schedule in your Stripe dashboard.</Text>
          <Button label="Open Stripe" variant="ghost" onPress={() => Linking.openURL(bal.dashboard_url || "https://dashboard.stripe.com/")} />
        </>
      )}
    </Card>
  );
}

/* A single-series bar chart. One hue; tap or hover a bar for its value. */
function TrendChart({ points, bucket }: { points: BizSummary["series"]["points"]; bucket: string }) {
  const c = useColors();
  const [metric, setMetric] = useState<"revenue" | "profit" | "orders" | "visitors">("revenue");
  const [active, setActive] = useState<number | null>(null);
  const vals = points.map((p) => p[metric]);
  const max = Math.max(...vals.map((v) => Math.max(v, 0)), 0);
  const min = Math.min(...vals, 0);
  const span = max - min || 1;
  const H = 180;
  const zeroY = (max / span) * H;
  const fmt = (v: number) => (metric === "revenue" || metric === "profit" ? (v < 0 ? `−${money(-v)}` : money(v)) : String(v));
  const label = (period: string) => (bucket === "month" ? new Date(`${period}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" })
    : new Date(`${period}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }));
  const shown = active != null ? points[active] : null;
  return (
    <View style={{ gap: space.md }}>
      <Segmented value={metric} onChange={(m) => { setMetric(m); setActive(null); }} options={[{ value: "revenue", label: "Revenue" }, { value: "profit", label: "Profit" }, { value: "orders", label: "Orders" }, { value: "visitors", label: "Visitors" }]} />
      <View style={{ minHeight: 22 }}>
        <Text style={[type.body, { color: c.muted }]}>
          {shown ? <><Text style={{ color: c.ink, fontFamily: fonts.bodyBold }}>{fmt(shown[metric])}</Text>  {bucket === "week" ? "week of " : ""}{label(shown.period)}</>
            : <>Total <Text style={{ color: c.ink, fontFamily: fonts.bodyBold }}>{fmt(vals.reduce((a, b) => a + b, 0))}</Text>. Tap a bar for its value.</>}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ height: H, justifyContent: "space-between", alignItems: "flex-end", width: 56 }}>
          <Text style={[type.small, { color: c.muted }]}>{fmt(max)}</Text>
          <Text style={[type.small, { color: c.muted }]}>{fmt(min)}</Text>
        </View>
        <View style={{ flex: 1, height: H, flexDirection: "row", alignItems: "stretch", gap: points.length > 60 ? 1 : 2, borderBottomWidth: min < 0 ? 0 : 1, borderColor: c.line }}>
          {points.map((p, i) => {
            const v = p[metric];
            const h = Math.max(v === 0 ? 0 : 2, (Math.abs(v) / span) * H);
            return (
              <Pressable key={p.period} onPress={() => setActive(active === i ? null : i)} onHoverIn={() => setActive(i)} onHoverOut={() => setActive(null)}
                accessibilityLabel={`${label(p.period)}: ${fmt(v)}`} style={{ flex: 1, height: H, position: "relative" }}>
                <View style={{ position: "absolute", left: 0, right: 0, top: v >= 0 ? zeroY - h : zeroY, height: h,
                  borderTopLeftRadius: v >= 0 ? 4 : 0, borderTopRightRadius: v >= 0 ? 4 : 0, borderBottomLeftRadius: v < 0 ? 4 : 0, borderBottomRightRadius: v < 0 ? 4 : 0,
                  backgroundColor: v < 0 ? c.bad : active === i ? c.accentHover : c.accent, opacity: active == null || active === i ? 1 : 0.55 }} />
              </Pressable>
            );
          })}
        </View>
      </View>
      {points.length ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginLeft: 64 }}>
          <Text style={[type.small, { color: c.muted }]}>{label(points[0].period)}</Text>
          <Text style={[type.small, { color: c.muted }]}>{label(points[points.length - 1].period)}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ---------------- Sales ---------------- */
function Sales({ range, onExport }: { range: RangeId; onExport: () => void }) {
  const c = useColors();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "unfulfilled" | "fulfilled" | "refunded">("all");
  const [data, setData] = useState<{ total: number; orders: BizSale[]; page: number; page_size: number } | null>(null);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      business.sales({ range, q: q.trim() || undefined, status: status === "all" ? undefined : status, page })
        .then((d) => alive && setData(d)).catch((e) => alive && setError(errText(e, "Couldn't load sales.")));
    }, q ? 300 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [range, q, status, page]);
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, alignItems: "center" }}>
        <Search value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search by name, email, product or order" />
        <Button label="Export CSV" variant="secondary" icon={<Ionicons name="download-outline" size={18} color={c.ink} />} onPress={onExport} />
      </View>
      <Segmented value={status} onChange={(s) => { setStatus(s); setPage(0); }} options={[{ value: "all", label: "All" }, { value: "unfulfilled", label: "To ship" }, { value: "fulfilled", label: "Shipped" }, { value: "refunded", label: "Refunds" }]} />
      <Notice text={error} tone="error" />
      {!data ? <ActivityIndicator color={c.accent} /> : !data.orders.length ? (
        <Text style={[type.body, { color: c.muted }]}>{q ? "No sales match that search." : "No sales in this period yet."}</Text>
      ) : (
        <View style={{ gap: space.sm }}>
          <Text style={[type.small, { color: c.muted }]}>{data.total} sale{data.total === 1 ? "" : "s"}</Text>
          {data.orders.map((o) => <SaleRow key={o.id} o={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} />)}
          {data.total > (data.page + 1) * data.page_size || data.page > 0 ? (
            <View style={{ flexDirection: "row", gap: space.sm, justifyContent: "center" }}>
              <Button label="Newer" variant="ghost" disabled={data.page === 0} onPress={() => setPage((p) => Math.max(0, p - 1))} />
              <Button label="Older" variant="ghost" disabled={data.total <= (data.page + 1) * data.page_size} onPress={() => setPage((p) => p + 1)} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function SaleRow({ o, open, onToggle }: { o: BizSale; open: boolean; onToggle: () => void }) {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, overflow: "hidden" }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ padding: space.lg, flexDirection: "row", gap: space.md, alignItems: "center" }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[type.heading, { color: c.ink }]} numberOfLines={1}>{o.customer_name || o.email || "Customer"}</Text>
          <Text style={[type.small, { color: c.muted }]} numberOfLines={1}>{when(o.paid_at)} · {o.items.map((i) => `${i.qty}× ${i.title}`).join(", ")}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={[type.heading, { color: c.ink, fontVariant: ["tabular-nums"] }]}>{money(o.total)}</Text>
          <Text style={[type.small, { color: o.status.includes("refund") ? c.bad : o.profit < 0 ? c.bad : c.good }]}>{o.status.includes("refund") ? o.status : `${signed(o.profit)} profit`}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={c.muted} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.lg, gap: 6, borderTopWidth: 1, borderColor: c.sunk, paddingTop: space.md }}>
          {o.items.map((i, n) => <Line key={n} label={`${i.qty}× ${i.title}${i.variant ? ` (${i.variant})` : ""}`} value="" />)}
          <Line label="Paid" value={money(o.total)} />
          {o.discount ? <Line label={`Discount${o.discount_code ? ` (${o.discount_code})` : ""}`} value={`−${money(o.discount)}`} /> : null}
          {o.tax ? <Line label="Sales tax (owed to the state)" value={`−${money(o.tax)}`} /> : null}
          {o.refunded ? <Line label="Refunded" value={`−${money(o.refunded)}`} /> : null}
          <Line label={`Stripe fee${o.fee_estimated ? " (estimated)" : ""}`} value={`−${money(o.fee)}`} />
          <Line label="Item cost" value={`−${money(o.cost)}`} />
          <Line label="Profit" value={signed(o.profit)} strong tone={o.profit < 0 ? "bad" : "good"} />
          <Text style={[type.small, { color: c.muted }]}>{o.email} · Order {o.id}</Text>
          <Button label="Open in Orders" variant="ghost" onPress={() => router.push("/orders")} />
        </View>
      ) : null}
    </View>
  );
}

/* ---------------- Customers ---------------- */
function Customers({ wide, onExport }: { wide: boolean; onExport: () => void }) {
  const c = useColors();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "spent" | "orders">("recent");
  const [tag, setTag] = useState<string | null>(null);
  const [data, setData] = useState<{ total: number; stats: { customers: number; repeat: number; lifetime_value: number }; tags: string[]; customers: BizCustomer[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => business.customers({ q: q.trim() || undefined, sort, tag: tag ?? undefined })
      .then((d) => alive && setData(d)).catch((e) => alive && setError(errText(e, "Couldn't load customers."))), q ? 300 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [q, sort, tag, rev]);
  return (
    <View style={{ gap: space.lg }}>
      {data ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
          <Tile label="Customers" value={String(data.stats.customers)} wide={wide} />
          <Tile label="Repeat buyers" value={String(data.stats.repeat)} sub={data.stats.customers ? `${Math.round((data.stats.repeat / data.stats.customers) * 100)}% come back` : undefined} wide={wide} />
          <Tile label="Average lifetime spend" value={money(data.stats.lifetime_value)} wide={wide} />
        </View>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, alignItems: "center" }}>
        <Search value={q} onChange={setQ} placeholder="Search by name, email or tag" />
        <Button label="Export CSV" variant="secondary" icon={<Ionicons name="download-outline" size={18} color={c.ink} />} onPress={onExport} />
      </View>
      <Segmented value={sort} onChange={setSort} options={[{ value: "recent", label: "Recent" }, { value: "spent", label: "Top spenders" }, { value: "orders", label: "Most orders" }]} />
      {data?.tags.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {data.tags.map((t) => <Chip key={t} label={t} on={tag === t} onPress={() => setTag(tag === t ? null : t)} />)}
        </View>
      ) : null}
      <Notice text={error} tone="error" />
      {!data ? <ActivityIndicator color={c.accent} /> : !data.customers.length ? (
        <Text style={[type.body, { color: c.muted }]}>{q || tag ? "No customers match." : "Customers appear here after their first purchase."}</Text>
      ) : data.customers.map((cu) => (
        <CustomerRow key={cu.email} cu={cu} open={open === cu.email} onToggle={() => setOpen(open === cu.email ? null : cu.email)} onSaved={() => setRev((r) => r + 1)} />
      ))}
    </View>
  );
}

function CustomerRow({ cu, open, onToggle, onSaved }: { cu: BizCustomer; open: boolean; onToggle: () => void; onSaved: () => void }) {
  const c = useColors();
  const [detail, setDetail] = useState<(BizCustomer & { orders_list: BizSale[] }) | null>(null);
  const [tags, setTags] = useState(cu.tags.join(", "));
  const [note, setNote] = useState(cu.note);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { if (open && !detail) business.customer(cu.email).then(setDetail).catch(() => {}); }, [open, detail, cu.email]);
  async function save() {
    setBusy(true); setMsg(null);
    try {
      const next = await business.updateCustomer(cu.email, { tags: tags.split(",").map((t) => t.trim()).filter(Boolean), note });
      setDetail(next); setTags(next.tags.join(", ")); setMsg("Saved"); onSaved();
    } catch (e) { setMsg(errText(e, "Couldn't save.")); }
    finally { setBusy(false); }
  }
  const input = { borderWidth: 1, borderColor: c.line, borderRadius: radius.sm, backgroundColor: c.bg, color: c.ink, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 15 };
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, overflow: "hidden" }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ padding: space.lg, flexDirection: "row", gap: space.md, alignItems: "center" }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.sunk, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.bodyBold, color: c.ink }}>{(cu.name || cu.email).trim().charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={[type.heading, { color: c.ink }]} numberOfLines={1}>{cu.name || cu.email}</Text>
            {cu.repeat ? <Chip label="Repeat" small /> : null}
            {cu.tags.slice(0, 3).map((t) => <Chip key={t} label={t} small />)}
          </View>
          <Text style={[type.small, { color: c.muted }]} numberOfLines={1}>{cu.email}{cu.location ? ` · ${cu.location}` : ""}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={[type.heading, { color: c.ink, fontVariant: ["tabular-nums"] }]}>{money(cu.spent)}</Text>
          <Text style={[type.small, { color: c.muted }]}>{cu.orders} order{cu.orders === 1 ? "" : "s"}</Text>
        </View>
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.lg, paddingTop: space.md, gap: space.md, borderTopWidth: 1, borderColor: c.sunk }}>
          <Line label="Customer since" value={when(cu.first_order)} />
          <Line label="Last order" value={when(cu.last_order)} />
          <View style={{ gap: 6 }}>
            <Text style={[type.label, { color: c.muted }]}>Tags (comma separated)</Text>
            <TextInput value={tags} onChangeText={setTags} placeholder="VIP, wholesale" placeholderTextColor={c.muted} style={input} accessibilityLabel="Tags" />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={[type.label, { color: c.muted }]}>Private note</Text>
            <TextInput value={note} onChangeText={setNote} multiline placeholder="Only you see this" placeholderTextColor={c.muted} style={[input, { minHeight: 70, textAlignVertical: "top" }]} accessibilityLabel="Note" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <Button label="Save" variant="secondary" loading={busy} onPress={save} />
            <Button label="Email customer" variant="ghost" onPress={() => Linking.openURL(`mailto:${cu.email}`)} />
            {msg ? <Text style={[type.small, { color: c.muted }]}>{msg}</Text> : null}
          </View>
          {detail?.orders_list.length ? (
            <View style={{ gap: 6 }}>
              <Text style={[type.label, { color: c.muted }]}>Orders</Text>
              {detail.orders_list.map((o) => <Line key={o.id} label={`${when(o.paid_at)} · ${o.items.map((i) => `${i.qty}× ${i.title}`).join(", ")}`} value={money(o.total)} />)}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/* ---------------- Expenses ---------------- */
const CATEGORY_NAMES: Record<string, string> = { ads: "Ads", supplies: "Supplies", shipping: "Shipping", software: "Software", fees: "Fees", other: "Other" };
function Expenses({ range, onExport }: { range: RangeId; onExport: () => void }) {
  const c = useColors();
  const [list, setList] = useState<BizExpense[] | null>(null);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("ads");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => business.expenses({ range }).then((d) => setList(d.expenses)).catch((e) => setError(errText(e, "Couldn't load expenses."))), [range]);
  useEffect(() => { load(); }, [load]);
  async function add() {
    setBusy(true); setError(null);
    try { await business.addExpense({ label, amount: Number(amount.replace(/[$,]/g, "")), category }); setLabel(""); setAmount(""); await load(); }
    catch (e) { setError(errText(e, "Couldn't add the expense.")); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    try { await business.deleteExpense(id); await load(); } catch (e) { setError(errText(e, "Couldn't remove it.")); }
  }
  const input = { borderWidth: 1, borderColor: c.line, borderRadius: radius.sm, backgroundColor: c.bg, color: c.ink, paddingHorizontal: 12, height: 46, fontFamily: fonts.body, fontSize: 15 };
  const total = (list || []).reduce((s, e) => s + e.amount, 0);
  return (
    <View style={{ gap: space.lg }}>
      <Card title="Add an expense">
        <Text style={[type.small, { color: c.muted }]}>Ads, packaging, samples, apps: anything you spend on the business. It comes off your profit for that day.</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          <TextInput value={label} onChangeText={setLabel} placeholder="What for? e.g. Instagram ads" placeholderTextColor={c.muted} style={[input, { flexGrow: 2, minWidth: 200 }]} accessibilityLabel="Expense" />
          <TextInput value={amount} onChangeText={setAmount} placeholder="Amount" placeholderTextColor={c.muted} keyboardType="decimal-pad" style={[input, { flexGrow: 1, minWidth: 110 }]} accessibilityLabel="Amount" />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(CATEGORY_NAMES).map(([id, name]) => <Chip key={id} label={name} on={category === id} onPress={() => setCategory(id)} />)}
        </View>
        <Button label="Add expense" loading={busy} disabled={!label.trim() || !amount.trim()} onPress={add} />
      </Card>
      <Notice text={error} tone="error" />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: space.sm }}>
        <Text style={[type.heading, { color: c.ink }]}>Total {money(total)}</Text>
        <Button label="Export CSV" variant="secondary" icon={<Ionicons name="download-outline" size={18} color={c.ink} />} onPress={onExport} />
      </View>
      {!list ? <ActivityIndicator color={c.accent} /> : !list.length ? <Text style={[type.body, { color: c.muted }]}>No expenses in this period.</Text> : list.map((e) => (
        <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[type.body, { color: c.ink }]}>{e.label}</Text>
            <Text style={[type.small, { color: c.muted }]}>{when(e.day)} · {CATEGORY_NAMES[e.category] || e.category}</Text>
          </View>
          <Text style={[type.heading, { color: c.ink, fontVariant: ["tabular-nums"] }]}>{money(e.amount)}</Text>
          <Pressable onPress={() => remove(e.id)} accessibilityRole="button" accessibilityLabel={`Remove ${e.label}`} hitSlop={10}><Ionicons name="trash-outline" size={18} color={c.muted} /></Pressable>
        </View>
      ))}
    </View>
  );
}

/* ---------------- small pieces ---------------- */
function Tile({ label, value, sub, tone, wide }: { label: string; value: string; sub?: string; tone?: "good" | "bad"; wide: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexGrow: 1, flexBasis: wide ? 180 : "45%", backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, padding: space.lg, gap: 4 }}>
      <Text style={[type.small, { color: c.muted }]}>{label}</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.6, color: tone === "bad" ? c.bad : tone === "good" ? c.good : c.ink, fontVariant: ["tabular-nums"] }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {sub ? <Text style={[type.small, { color: c.muted }]}>{sub}</Text> : null}
    </View>
  );
}
function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: object }) {
  const c = useColors();
  return (
    <View style={[{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, padding: space.lg, gap: space.md }, style]}>
      <Text accessibilityRole="header" style={[type.title, { color: c.ink, fontSize: 20 }]}>{title}</Text>
      {children}
    </View>
  );
}
function Line({ label, value, strong, tone, hint, action }: { label: string; value: string; strong?: boolean; tone?: "good" | "bad"; hint?: string; action?: { label: string; onPress: () => void } }) {
  const c = useColors();
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
          <Text style={[strong ? type.heading : type.body, { color: c.ink, flexShrink: 1 }]}>{label}</Text>
          {action ? <Pressable onPress={action.onPress} hitSlop={8}><Text style={[type.small, { color: c.accent, textDecorationLine: "underline" }]}>{action.label}</Text></Pressable> : null}
        </View>
        <Text style={[strong ? type.heading : type.body, { color: tone === "bad" ? c.bad : tone === "good" ? c.good : c.ink, fontVariant: ["tabular-nums"] }]}>{value}</Text>
      </View>
      {hint ? <Text style={[type.small, { color: c.muted }]}>{hint}</Text> : null}
    </View>
  );
}
function Row({ cells, header, onPress }: { cells: string[]; header?: boolean; onPress?: () => void }) {
  const c = useColors();
  const body = (
    <View style={{ flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: c.sunk, gap: 8 }}>
      {cells.map((cell, i) => (
        <Text key={i} numberOfLines={1} style={[header ? type.label : type.body, { color: header ? c.muted : c.ink, flex: i === 0 ? 2.4 : 1, textAlign: i === 0 ? "left" : "right", fontVariant: ["tabular-nums"] }]}>{cell}</Text>
      ))}
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button">{body}</Pressable> : body;
}
function Search({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const c = useColors();
  return (
    <View style={{ flexGrow: 1, minWidth: 220, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: c.line, borderRadius: radius.pill, paddingHorizontal: 14, height: 46, backgroundColor: c.surface }}>
      <Ionicons name="search" size={18} color={c.muted} />
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.muted} autoCapitalize="none" style={{ flex: 1, color: c.ink, fontFamily: fonts.body, fontSize: 15, height: 44 }} accessibilityLabel={placeholder} />
    </View>
  );
}
function Chip({ label, on, onPress, small }: { label: string; on?: boolean; onPress?: () => void; small?: boolean }) {
  const c = useColors();
  const body = (
    <View style={{ paddingHorizontal: small ? 8 : 12, height: small ? 22 : 32, borderRadius: radius.pill, justifyContent: "center", borderWidth: 1, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : small ? c.sunk : "transparent" }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: small ? 11 : 13, color: on ? c.onAccent : c.muted }}>{label}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: Boolean(on) }}>{body}</Pressable> : body;
}
