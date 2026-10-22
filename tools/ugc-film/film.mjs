// Which film these tools work on: FILM=ugc (default, scenes.mjs → out/) or another, e.g.
// FILM=shorts (scenes-shorts.mjs → out-shorts/). Every tool reads its scenes and folder from here.
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const FILM = (process.env.FILM || "ugc").replace(/[^a-z0-9-]/gi, "");
export const OUT = path.join(here, FILM === "ugc" ? "out" : `out-${FILM}`);
const mod = await import(FILM === "ugc" ? "./scenes.mjs" : `./scenes-${FILM}.mjs`);
export const { SCENES, LOOK } = mod;
// Words and names that differ per film (the UGC film's are the defaults).
export const META = {
  name: "ugc-film", academy: "ugc-income", eyebrow: "SNAPFRONT ACADEMY · UGC", tag: "Get paid for UGC videos.", cta: "Open the UGC creator kit",
  chapters: [["hook", "What UGC is and how you get paid"], ["two-ways", "Two ways: you on camera, or an AI avatar"], ["gear", "Gear: your phone is enough"], ["formats", "Formats brands buy"],
    ["hooks", "Hooks: win the first 3 seconds"], ["scripts", "Scripts in Snapfront"], ["shoot", "Filming tips"], ["avatar", "AI avatars in Snapfront"], ["avatar-rules", "Avatar rules: label it, no fake claims"],
    ["portfolio", "Your UGC portfolio page"], ["rates", "What to charge"], ["find", "Finding brands and pitching"], ["deliver", "Delivering like a pro"], ["amazon", "Amazon Influencer Program"], ["end", "Your first step"]],
  ...(mod.META || {}),
};
