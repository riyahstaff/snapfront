import React, { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/ui";
import { HomeDashboard } from "@/components/home-dashboard";
import { api, type StoreTheme } from "@/lib/api";
import { account, useMe } from "@/lib/account-store";
import { loadStorefrontDraft } from "@/lib/storefront-draft";
import { space } from "@/lib/theme";

export default function HomeScreen() {
  const me = useMe();
  const [themes, setThemes] = useState<StoreTheme[] | null>(null);
  const [draftState, setDraftState] = useState<{ storeId: string; step: number | null; hasProducts: boolean | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [viewport, setViewport] = useState({ y: 0, height: 0 });
  const generation = useRef(0);
  const currentStoreId = me?.id;
  useFocusEffect(useCallback(() => {
    void attempt;
    void currentStoreId;
    const request = ++generation.current;
    const revision = api.storeRevision();
    let alive = true;
    setLoading(true); setError(null);
    async function load() {
      const catalog = api.themes().then((next) => { if (alive) setThemes(next); }).catch(() => { if (alive) setError("Theme discovery couldn’t refresh. Your creative tools are still available."); });
      const workspace = account.refresh().then(async (seller) => {
        if (!alive || revision !== api.storeRevision() || account.get()?.id !== seller.id) return;
        const [saved, products] = await Promise.all([
          loadStorefrontDraft(seller.id),
          api.products(seller.id).then((list) => list.length > 0).catch(() => null),
        ]);
        if (alive && request === generation.current && revision === api.storeRevision() && account.get()?.id === seller.id) setDraftState({ storeId: seller.id, step: saved?.step ?? null, hasProducts: products });
      }).catch(() => { if (alive) setError("Your workspace couldn’t refresh. Open My store or retry when you have a connection."); });
      await Promise.all([catalog, workspace]);
      if (alive && request === generation.current) setLoading(false);
    }
    void load();
    return () => { alive = false; generation.current++; };
  }, [attempt, currentStoreId]));
  const current = draftState?.storeId === me?.id ? draftState : null;
  return <Screen onLayout={(event) => setViewport((value) => ({ ...value, height: event.nativeEvent.layout.height }))}
    onScroll={(event) => { const y = event.nativeEvent.contentOffset.y; setViewport((value) => value.y === y ? value : { ...value, y }); }}>
    <HomeDashboard me={me} themes={themes} draftStep={current?.step ?? null} hasProducts={current?.hasProducts ?? null}
      viewport={{ ...viewport, y: viewport.y - space.lg }} loading={loading} error={error} onRetry={() => setAttempt((value) => value + 1)} />
  </Screen>;
}
