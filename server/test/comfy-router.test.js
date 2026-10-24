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
