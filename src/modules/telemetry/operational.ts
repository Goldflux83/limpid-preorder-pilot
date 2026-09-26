export type OperationalTelemetryEvent = {
  type: "server_started" | "server_action";
  action?: string;
  outcome?: "success" | "rejected" | "failed";
  duration_ms?: number;
};

export function createOperationalPayload(event: OperationalTelemetryEvent) {
  return {
    source: "limpid-preorder-pilot",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    release: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    occurred_at: new Date().toISOString(),
    ...event,
  };
}

export async function reportOperationalTelemetry(event: OperationalTelemetryEvent) {
  const endpoint = process.env.GOLDFLUX_TELEMETRY_ENDPOINT;
  const token = process.env.GOLDFLUX_TELEMETRY_TOKEN;
  if (!endpoint || !token) return;
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(createOperationalPayload(event)),
      signal: AbortSignal.timeout(500),
      cache: "no-store",
    });
  } catch {
    // Operational telemetry is deliberately best-effort.
  }
}
