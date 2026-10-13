export const THEME_ROTATION_MS = 5000;
export type RotationState = { focused: boolean; active: boolean; visible: boolean; paused: boolean; reduceMotion: boolean | null; screenReader: boolean | null; count: number };
export function allowsThemeRotation(state: RotationState): boolean {
  return state.focused && state.active && state.visible && !state.paused && state.reduceMotion === false && state.screenReader === false && state.count > 1;
}
export function nextThemeIndex(index: number, count: number, direction = 1): number {
  if (!Number.isInteger(count) || count < 1) return 0;
  const bounded = Number.isFinite(index) ? Math.floor(index) : 0;
  return ((bounded + direction) % count + count) % count;
}
export function carouselInViewport(top: number, height: number, scrollY: number, viewport: number): boolean {
  if (height <= 0 || viewport <= 0) return false;
  const overlap = Math.min(top + height, scrollY + viewport) - Math.max(top, scrollY);
  return overlap >= Math.min(height, viewport) * 0.5;
}
/** One timer only; native route, visibility and preference changes stop it immediately. */
export function createThemeRotation(tick: () => void = () => {}, clock = {
  setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
  clearInterval: (timer: ReturnType<typeof setInterval>) => clearInterval(timer),
}) {
  let timer: ReturnType<typeof setInterval> | null = null;
  let callback = tick;
  const stop = () => { if (timer !== null) clock.clearInterval(timer); timer = null; };
  return {
    setTick(fn: () => void) { callback = fn; },
    update(state: RotationState) {
      if (!allowsThemeRotation(state)) { stop(); return; }
      if (timer === null) timer = clock.setInterval(() => callback(), THEME_ROTATION_MS);
    },
    stop,
  };
}
/** A default device store is not evidence that a user has already built anything. */
export function homePrimaryAction(draftStep: number | null, hasProducts: boolean | null, hasDesign: boolean) {
  const returning = Boolean(draftStep || hasProducts || hasDesign);
  return { label: returning ? "Continue my storefront" : "Snap a product", route: returning ? "/storefront-setup" as const : "/snap" as const, returning };
}
