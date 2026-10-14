// The open-source voice (Kokoro-82M) runs in its own process: it brings its own ONNX runtime, which
// must not share a process with the photo cut-out model's runtime. narrated.js starts this on first
// use and sends one job per line: {id, text, voice, out}. Audio is written to `out` as raw 32-bit
// float samples; the reply is {id, rate, length} or {id, error}. Exits after 10 idle minutes.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const cacheDir = process.argv[2];
let tts = null;
async function engine() {
  if (tts) return tts;
  const tf = await import("@huggingface/transformers");
  if (cacheDir) tf.env.cacheDir = cacheDir;
  const { KokoroTTS } = await import("kokoro-js");
  tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });
  return tts;
}
let idle = null;
const resetIdle = () => { clearTimeout(idle); idle = setTimeout(() => process.exit(0), 10 * 60e3); };
resetIdle();
let chain = Promise.resolve();
readline.createInterface({ input: process.stdin }).on("line", (lineText) => {
  chain = chain.then(async () => {
    let job;
    try { job = JSON.parse(lineText); } catch { return; }
    resetIdle();
    try {
      const a = await (await engine()).generate(String(job.text || ""), { voice: job.voice });
      const samples = a.audio instanceof Float32Array ? a.audio : Float32Array.from(a.audio);
      fs.mkdirSync(path.dirname(job.out), { recursive: true });
      fs.writeFileSync(job.out, Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
      process.stdout.write(`${JSON.stringify({ id: job.id, rate: a.sampling_rate, length: samples.length })}\n`);
    } catch (e) {
      process.stdout.write(`${JSON.stringify({ id: job.id, error: String(e?.message || e).slice(0, 300) })}\n`);
    }
  });
});
