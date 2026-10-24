import { test } from "node:test";
import assert from "node:assert/strict";
import * as comfy from "../src/comfy-router.js";

test("Comfy catalog uses server-side key and does not start generation", async () => {
  const old = process.env.COMFY_API_KEY;
  process.env.COMFY_API_KEY = "test-secret";
  const requests = [];
  comfy.setComfyFetch(async (url, opts) => {
    requests.push({ url, opts });
    return { ok: true, json: async () => ({ data: [{ id: "example/model" }], has_more: false }) };
  });
  try {
    const results = await comfy.listModels({ limit: 12 });
    assert.equal(results.data[0].id, "example/model");
    assert.equal(requests[0].url, "https://api.comfy.org/v2/models?limit=12");
    assert.equal(requests[0].opts.headers["X-API-Key"], "test-secret");
    assert.equal(requests[0].opts.method, undefined);
    assert.equal(comfy.generationEnabled(), false);
    await comfy.modelSchema("example/model");
    assert.equal(requests[1].url, "https://api.comfy.org/v2/models/example/model/openapi.json");
    await assert.rejects(comfy.modelSchema("not-valid"), /canonical/);
  } finally {
    if (old === undefined) delete process.env.COMFY_API_KEY;
    else process.env.COMFY_API_KEY = old;
  }
});

test("Comfy Wan 2.6 submits one queued job and polls its native video URL", async () => {
  const oldKey = process.env.COMFY_API_KEY, oldOn = process.env.COMFY_ROUTER_ENABLED;
  process.env.COMFY_API_KEY = "test-secret";
  process.env.COMFY_ROUTER_ENABLED = "true";
  const calls = [];
  const ok = (status, payload) => ({
    ok: status >= 200 && status < 300, status,
    json: async () => payload,
  });
  const jobId = "e5c81244-184c-4c39-b77a-7c1a0cb38b16";
  comfy.setComfyFetch(async (url, opts) => {
    calls.push({ url, opts });
    if (url.endsWith("/requests") && opts.method === "POST")
      return ok(201, { request_id: jobId });
    if (url.endsWith("/status")) return ok(200, { status: "COMPLETED" });
    if (url.endsWith("/" + jobId)) return ok(200, { output: { video_url: "https://cdn.example.test/ad.mp4" } });
    throw new Error("Unexpected Comfy request " + url);
  });
  try {
    const r = await comfy.submitProductVideo({
      image: "https://snapfront.app/img/product.jpg",
      prompt: "Slow cinematic product push-in",
      idempotencyKey: "1e3c9638-683a-4961-9e39-29579216e8a9",
    });
    assert.equal(r.requestId, jobId);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.comfy.org/v2/models/wan/wan2.6-i2v/requests");
    assert.equal(calls[0].opts.headers["Idempotency-Key"], "1e3c9638-683a-4961-9e39-29579216e8a9");
    assert.deepEqual(JSON.parse(calls[0].opts.body), {
      input: { prompt: "Slow cinematic product push-in", img_url: "https://snapfront.app/img/product.jpg" },
      parameters: { duration: 5, resolution: "720P" },
    });
    const result = await comfy.pollProductVideo(jobId);
    assert.deepEqual(result, { status: "COMPLETED", output: { video_url: "https://cdn.example.test/ad.mp4" } });
    assert.equal(calls.length, 3); // submit once, read status, collect the already accepted result
  } finally {
    if (oldKey === undefined) delete process.env.COMFY_API_KEY;
    else process.env.COMFY_API_KEY = oldKey;
    if (oldOn === undefined) delete process.env.COMFY_ROUTER_ENABLED;
    else process.env.COMFY_ROUTER_ENABLED = oldOn;
  }
});

test("Comfy does not re-submit when the first submission's outcome is uncertain", async () => {
  const oldKey = process.env.COMFY_API_KEY, oldOn = process.env.COMFY_ROUTER_ENABLED;
  process.env.COMFY_API_KEY = "test-secret";
  process.env.COMFY_ROUTER_ENABLED = "true";
  let calls = 0;
  comfy.setComfyFetch(async () => { calls += 1; throw new Error("network dropped"); });
  try {
    await assert.rejects(comfy.submitProductVideo({
      image: "https://snapfront.app/img/product.jpg",
      prompt: "Gentle slow motion",
      idempotencyKey: "0f94acf3-6da2-4a61-a1a0-f0ed6c7b2c38",
    }), /uncertain/);
    assert.equal(calls, 1);
  } finally {
    if (oldKey === undefined) delete process.env.COMFY_API_KEY;
    else process.env.COMFY_API_KEY = oldKey;
    if (oldOn === undefined) delete process.env.COMFY_ROUTER_ENABLED;
    else process.env.COMFY_ROUTER_ENABLED = oldOn;
  }
});


test("Five Comfy engines send the correct native inputs and collect only video assets", async () => {
  const oldKey = process.env.COMFY_API_KEY, oldOn = process.env.COMFY_ROUTER_ENABLED;
  process.env.COMFY_API_KEY = "test-secret";
  process.env.COMFY_ROUTER_ENABLED = "true";
  const image = "https://snapfront.app/img/my-product.png", prompt = "Slow dolly toward product";
  const rid = "d759fcdb-73aa-4ed0-988d-b52b254512ab";
  const models = [
    ["wan/wan2.6-i2v", { input: { prompt, img_url: image }, parameters: { duration: 5, resolution: "720P" } },
      { output: { video_url: "https://cdn.test/wan26.mp4" } }],
    ["wan/wan2.7-i2v", { input: { prompt, media: [{ type: "first_frame", url: image }] }, parameters: { duration: 5, resolution: "720P" } },
      { output: { video_url: "https://cdn.test/wan27.mp4" } }],
    ["minimax/minimax-h3", { content: [{ type: "text", text: prompt }, { type: "image_url", role: "first_frame", image_url: { url: image } }], duration: 5, resolution: "768P" },
      { task: { status: "succeeded", content: { url: "https://cdn.test/minimax.mp4" } } }],
    ["byteplus/dreamina-seedance-2-5-260628", { content: [{ type: "text", text: prompt }, { type: "image_url", role: "first_frame", image_url: { url: image } }],
      duration: 5, ratio: "adaptive", resolution: "720p", generate_audio: false, output_format: "mp4" },
      { status: "succeeded", content: { video_url: "https://cdn.test/seedance.mp4", last_frame_url: "https://cdn.test/thumbnail.png" } }],
    ["kling/kling-video-o1", { prompt, image_list: [{ type: "first_frame", image_url: image }], duration: "5", mode: "std" },
      { code: 0, data: { task_status: "succeed", task_result: { videos: [{ url: "https://cdn.test/kling.mp4" }] } } }],
  ];
  const requests = [];
  const ok = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
  let native;
  comfy.setComfyFetch(async (url, opts) => {
    requests.push({ url, opts });
    if (opts.method === "POST") return ok(201, { request_id: rid });
    if (url.endsWith("/status")) return ok(200, { status: "COMPLETED" });
    return ok(200, native);
  });
  try {
    assert.equal(comfy.VIDEO_MODELS.length, 5);
    for (const [modelId, expected, result] of models) {
      native = result;
      const queued = await comfy.submitProductVideo({ modelId, image, prompt,
        idempotencyKey: "7083e164-1b7d-4828-80fa-0129bd299d35" });
      assert.equal(queued.requestId, rid);
      assert.deepEqual(JSON.parse(requests.at(-1).opts.body), expected);
      assert.equal(requests.at(-1).url, "https://api.comfy.org/v2/models/" + modelId + "/requests");
      const video = await comfy.pollProductVideo(rid, modelId);
      assert.equal(video.status, "COMPLETED");
      assert.match(video.output.video_url, /\.mp4$/);
    }
    await assert.rejects(comfy.submitProductVideo({ modelId: "bad/unknown", image, prompt,
      idempotencyKey: "7083e164-1b7d-4828-80fa-0129bd299d35" }), /not supported/);
    native = { content: { last_frame_url: "https://cdn.test/frame.png" }, status: "succeeded" };
    const bad = await comfy.pollProductVideo(rid, "byteplus/dreamina-seedance-2-5-260628");
    assert.equal(bad.status, "FAILED", "Never mistake a preview thumbnail for an MP4");
  } finally {
    if (oldKey === undefined) delete process.env.COMFY_API_KEY;
    else process.env.COMFY_API_KEY = oldKey;
    if (oldOn === undefined) delete process.env.COMFY_ROUTER_ENABLED;
    else process.env.COMFY_ROUTER_ENABLED = oldOn;
  }
});
