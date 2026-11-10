const PUBLIC_RPC = "https://api.mainnet-beta.solana.com";

export type Config = {
  rpcUrl: string;
  rpcRps: number;
  rpcConcurrency: number;
  cacheDir: string;
  // Set: the cache lives in this S3/R2 bucket under `prefix` (credentials from S3_* variables) and
  // cacheDir is unused.
  cacheBucket: { name: string; prefix: string } | null;
  port: number;
  publicUrl: string | null;
};

export function loadConfig(env: Record<string, string | undefined> = Bun.env): Config {
  return {
    // RPC_URL carries the provider key (e.g. Helius `?api-key=`), so it is a secret.
    rpcUrl: env.RPC_URL?.trim() || PUBLIC_RPC,
    rpcRps: positiveNumber(env.RPC_RPS, 8),
    rpcConcurrency: positiveNumber(env.RPC_CONCURRENCY, 4),
    cacheDir: env.CACHE_DIR?.trim() || ".cache",
    cacheBucket: cacheBucket(env),
    port: positiveNumber(env.PORT, 3000),
    // Site origin for share-card URLs. Unset: taken from each request's host.
    publicUrl: env.PUBLIC_URL?.trim().replace(/\/+$/, "") || null,
  };
}

// Use this whenever an RPC URL could end up in a log line or an error message. Providers put the
// key in the query (Helius) or the path (QuickNode, Alchemy), so only the host is kept.
export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    const hasSecretPart = (u.pathname !== "/" && u.pathname !== "") || u.search !== "";
    return `${u.protocol}//${u.host}${hasSecretPart ? "/<redacted>" : ""}`;
  } catch {
    return "<redacted>";
  }
}

// The prefix keeps the cache apart from anything else in the bucket. There is no default: a wrong
// one silently starts an empty cache, so a missing one stops the app instead.
function cacheBucket(env: Record<string, string | undefined>): Config["cacheBucket"] {
  const name = env.S3_BUCKET?.trim();
  if (!name) return null;
  const prefix = env.CACHE_PREFIX?.trim();
  if (!prefix) {
    throw new Error("No cache set up: S3_BUCKET is set but CACHE_PREFIX is empty. Set CACHE_PREFIX to the cache's path in the bucket, e.g. dtp-checker/cache/.");
  }
  return { name, prefix };
}

function positiveNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? n : fallback;
}
