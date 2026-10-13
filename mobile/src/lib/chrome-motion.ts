import { Animated, Easing } from "react-native";

export type MotionState = { focused: boolean; active: boolean; reduceMotion: boolean | null; paused: boolean };
export function allowsChromeMotion(state: MotionState): boolean {
  return state.focused && state.active && state.reduceMotion === false && !state.paused;
}

/** Only decorative pixels move. Caller owns event subscriptions; this controller owns animation cleanup. */
export function createChromeMotion() {
  const entrance = new Animated.Value(1);
  const drift = new Animated.Value(0);
  let entered = false;
  let running = false;
  let intro: Animated.CompositeAnimation | null = null;
  let loop: Animated.CompositeAnimation | null = null;
  function stop() {
    running = false;
    intro?.stop(); loop?.stop(); intro = null; loop = null;
    entrance.setValue(1); drift.setValue(0);
  }
  function update(state: MotionState) {
    if (!allowsChromeMotion(state)) { stop(); return; }
    if (running) return;
    running = true;
    if (!entered) {
      entered = true;
      entrance.setValue(0);
      intro = Animated.timing(entrance, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true, isInteraction: false });
      intro.start();
    }
    loop = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
      Animated.timing(drift, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
  }
  return { entrance, drift, update, stop };
}
