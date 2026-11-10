import { expect, test } from "bun:test";
import { loadConfig, redactUrl } from "../src/config.ts";

test("RPC_URL wins, public RPC is the fallback", () => {
  expect(loadConfig({ RPC_URL: "https://rpc.example/?api-key=k" }).rpcUrl).toBe("https://rpc.example/?api-key=k");
  expect(loadConfig({}).rpcUrl).toBe("https://api.mainnet-beta.solana.com");
  expect(loadConfig({ RPC_RPS: "nope", PORT: "4000" })).toMatchObject({ rpcRps: 8, port: 4000, cacheDir: ".cache" });
});

test("S3_BUCKET switches the cache to a bucket, under CACHE_PREFIX", () => {
  expect(loadConfig({}).cacheBucket).toBeNull();
  expect(loadConfig({ CACHE_PREFIX: "p/" }).cacheBucket).toBeNull();
  expect(loadConfig({ S3_BUCKET: " stuff ", CACHE_PREFIX: " p/cache/ " }).cacheBucket).toEqual({ name: "stuff", prefix: "p/cache/" });
});

test("a bucket without CACHE_PREFIX is an error, not a silent default", () => {
  expect(() => loadConfig({ S3_BUCKET: "stuff" })).toThrow("No cache set up");
  expect(() => loadConfig({ S3_BUCKET: "stuff", CACHE_PREFIX: "  " })).toThrow("CACHE_PREFIX is empty");
});

test("redactUrl never shows a key in the query or the path", () => {
  expect(redactUrl("https://mainnet.helius-rpc.com/?api-key=secret")).toBe("https://mainnet.helius-rpc.com/<redacted>");
  expect(redactUrl("https://x.quiknode.pro/secret/")).toBe("https://x.quiknode.pro/<redacted>");
  expect(redactUrl("https://api.mainnet-beta.solana.com")).toBe("https://api.mainnet-beta.solana.com");
  expect(redactUrl("not a url secret")).toBe("<redacted>");
});
