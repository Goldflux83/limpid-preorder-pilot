export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportOperationalTelemetry } = await import("@/modules/telemetry/operational");
    void reportOperationalTelemetry({ type: "server_started" });
  }
}
