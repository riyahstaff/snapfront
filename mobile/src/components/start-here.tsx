// "Start here": a one-question-at-a-time quiz, the personal plan it makes, and the home-screen card that
// either invites people to take it or shows how far along their plan they are.
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui";
import { startPlanApi, type StartPlan, type StartQuestion } from "@/lib/api";
import { alpha, fonts, radius, space, type, useColors } from "@/lib/theme";

/** One question per screen, big tappable answers, a progress bar and a way back. */
export function StartQuiz({ questions, initial = {}, busy, onDone }: { questions: StartQuestion[]; initial?: Record<string, string>; busy?: boolean; onDone: (answers: Record<string, string>) => void }) {
  const c = useColors();
  const [answers, setAnswers] = useState<Record<string, string>>(initial);
  const [i, setI] = useState(0);
  const q = questions[i];
  const pick = (id: string) => {
    const next = { ...answers, [q.id]: id };
    setAnswers(next);
    if (i < questions.length - 1) setTimeout(() => setI(i + 1), 160);
    else onDone(next);
  };
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {i > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Previous question" onPress={() => setI(i - 1)} hitSlop={10} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="chevron-back" size={18} color={c.muted} /><Text style={[type.small, { color: c.muted }]}>Back</Text>
            </Pressable>
          ) : <View />}
          <Text style={[type.small, { color: c.muted }]}>Question {i + 1} of {questions.length}</Text>
        </View>
        <View style={{ height: 6, borderRadius: 6, backgroundColor: c.sunk, overflow: "hidden" }}>
          <View style={{ width: `${Math.round(((i + (answers[q.id] ? 1 : 0)) / questions.length) * 100)}%`, height: "100%", backgroundColor: c.brand }} />
        </View>
      </View>
      <Text accessibilityRole="header" style={[type.title, { color: c.ink, fontSize: 26, lineHeight: 32 }]}>{q.title}</Text>
      <View style={{ gap: space.sm }} accessibilityRole="radiogroup">
        {q.options.map((o) => {
          const on = answers[q.id] === o.id;
          return (
            <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ selected: on, disabled: busy }} accessibilityLabel={`${o.label}. ${o.hint}`} disabled={busy} onPress={() => pick(o.id)}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderRadius: radius.md, borderWidth: on ? 2 : 1, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.sunk : c.surface, opacity: pressed ? 0.85 : 1 })}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: c.ink }}>{o.label}</Text>
                <Text style={[type.small, { color: c.muted }]}>{o.hint}</Text>
              </View>
              {busy && on ? <ActivityIndicator color={c.accent} /> : <Ionicons name={on ? "checkmark-circle" : "chevron-forward"} size={22} color={on ? c.accent : c.muted} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** The plan as a checklist: tick steps off, open the tool, or watch the lesson. */
export function StartPlanView({ plan, onToggle, onRedo }: { plan: StartPlan; onToggle: (id: string, done: boolean) => void; onRedo: () => void }) {
  const c = useColors();
  const done = plan.steps.filter((s) => s.done).length;
  const nextId = plan.steps.find((s) => !s.done)?.id;
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 2, color: c.brand }}>YOUR PLAN</Text>
        <Text accessibilityRole="header" style={[type.title, { color: c.ink, fontSize: 28, lineHeight: 33 }]}>{plan.title}</Text>
        <Text style={[type.body, { color: c.muted }]}>{plan.summary}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: 4 }}>
          <View style={{ flex: 1, height: 8, borderRadius: 8, backgroundColor: c.sunk, overflow: "hidden" }}>
            <View style={{ width: `${Math.round((done / plan.steps.length) * 100)}%`, height: "100%", backgroundColor: c.good }} />
          </View>
          <Text style={[type.small, { color: c.muted }]}>{done} of {plan.steps.length} done</Text>
        </View>
      </View>
      {plan.steps.map((s, n) => {
        const next = s.id === nextId;
        return (
          <View key={s.id} style={{ flexDirection: "row", gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: next ? 2 : 1, borderColor: next ? c.accent : c.line, backgroundColor: c.surface, opacity: s.done ? 0.7 : 1 }}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(s.done) }} accessibilityLabel={`Mark "${s.title}" ${s.done ? "not done" : "done"}`} onPress={() => onToggle(s.id, !s.done)} hitSlop={8}
              style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: s.done ? c.good : c.line, backgroundColor: s.done ? c.good : "transparent", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
              {s.done ? <Ionicons name="checkmark" size={18} color={c.dark ? "#0B1B14" : "#FFFFFF"} /> : <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: c.muted }}>{n + 1}</Text>}
            </Pressable>
            <View style={{ flex: 1, gap: 6 }}>
              {next ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5, color: c.brand }}>DO THIS NEXT</Text> : null}
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: c.ink, textDecorationLine: s.done ? "line-through" : "none" }}>{s.title}</Text>
              <Text style={[type.body, { color: c.muted }]}>{s.why}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: 4 }}>
                <Button label={s.action} variant={next ? "primary" : "secondary"} onPress={() => router.push(s.route as Href)} />
                {s.lesson && !s.route.startsWith("/lesson/") ? <Button label="Watch the lesson" variant="ghost" onPress={() => router.push(`/lesson/${s.lesson}` as Href)} /> : null}
              </View>
            </View>
          </View>
        );
      })}
      <Button label="Answer the questions again" variant="ghost" onPress={onRedo} />
    </View>
  );
}

/** On Home: "New here? Start here" until someone has a plan; then their progress and next step. */
export function StartHereCard() {
  const c = useColors();
  const [plan, setPlan] = useState<StartPlan | null | undefined>(undefined);
  useFocusEffect(useCallback(() => { startPlanApi.get().then((r) => setPlan(r.plan)).catch(() => setPlan(null)); }, []));
  if (plan === undefined) return null;
  const done = plan?.steps.filter((s) => s.done).length ?? 0;
  if (plan && done === plan.steps.length) return null;   // finished: the card steps aside
  const next = plan?.steps.find((s) => !s.done);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={plan ? `Your plan: ${done} of ${plan.steps.length} done. Next: ${next?.title}` : "New here? Start here"} onPress={() => router.push("/start")}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: c.brand,
        backgroundColor: hovered ? c.sunk : alpha(c.brand, c.dark ? 0.1 : 0.07), opacity: pressed ? 0.9 : 1 })}>
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.brand, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={plan ? "map-outline" : "compass-outline"} size={24} color="#11151B" />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: c.ink }}>{plan ? `Your plan · ${done} of ${plan.steps.length} done` : "New here? Start here"}</Text>
        <Text style={[type.small, { color: c.muted }]} numberOfLines={2}>{plan ? `Next: ${next?.title}` : "Answer 5 quick questions and get a step-by-step plan made for you."}</Text>
      </View>
      <Ionicons name="arrow-forward" size={20} color={c.ink} />
    </Pressable>
  );
}
