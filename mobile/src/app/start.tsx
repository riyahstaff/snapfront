// "Start here": take the quiz (or arrive with answers from the public home page) and get a personal plan.
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Notice } from "@/components/ui";
import { StartPlanView, StartQuiz } from "@/components/start-here";
import { ApiError, startPlanApi, type StartPlan, type StartQuestion } from "@/lib/api";
import { space, useColors } from "@/lib/theme";

export default function StartScreen() {
  const c = useColors();
  // Answers from the public home page arrive in question order, e.g. ?a=beginner,none,no,none,few
  const { a } = useLocalSearchParams<{ a?: string }>();
  const [questions, setQuestions] = useState<StartQuestion[] | null>(null);
  const [plan, setPlan] = useState<StartPlan | null>(null);
  const [redo, setRedo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const used = useRef(false);

  const save = useCallback(async (answers: Record<string, string>) => {
    setBusy(true); setError(null);
    try { setPlan((await startPlanApi.save(answers)).plan); setRedo(false); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Couldn't make your plan. Try again."); }
    finally { setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    startPlanApi.get().then((r) => {
      setQuestions(r.questions); setPlan(r.plan);
      // Arriving with answers from the public home page: make (or remake) the plan once.
      const vals = a ? String(a).split(",") : [];
      if (!used.current && vals.length === r.questions.length) {
        used.current = true;
        save(Object.fromEntries(r.questions.map((q, i) => [q.id, vals[i]])));
      }
    }).catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load Start here."));
  }, [a, save]));

  const toggle = async (id: string, done: boolean) => {
    setPlan((p) => (p ? { ...p, steps: p.steps.map((s) => (s.id === id ? { ...s, done } : s)) } : p));
    try { setPlan((await startPlanApi.step(id, done)).plan); } catch { setError("Couldn't save that. Try again."); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: 80 }}>
      <View style={{ width: "100%", maxWidth: 720, alignSelf: "center", padding: space.xl, gap: space.lg }}>
        <Notice text={error} tone="error" />
        {!questions ? <ActivityIndicator color={c.accent} />
          : plan && !redo ? <StartPlanView plan={plan} onToggle={toggle} onRedo={() => setRedo(true)} />
          : <StartQuiz questions={questions} initial={plan?.answers} busy={busy} onDone={save} />}
      </View>
    </ScrollView>
  );
}
