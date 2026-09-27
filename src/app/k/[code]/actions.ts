"use server";

import { redirect } from "next/navigation";
import { reportOperationalTelemetry } from "@/modules/telemetry/operational";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode, recordParticipantRedemption } from "@/modules/participants/server";

export async function registerRedemption(formData: FormData) {
  const code = normalizeParticipantCode(String(formData.get("code") ?? ""));
  const stationId = String(formData.get("stationId") ?? "");
  const participant = await getActiveParticipantByCode(code);
  if (!participant || !stationId) redirect(`/k/${code}`);
  const recorded = await recordParticipantRedemption(
    participant.id,
    stationId,
    String(formData.get("addOn") ?? "")
  );
  void reportOperationalTelemetry({
    type: "server_action",
    action: "participant_redemption_recorded",
    outcome: recorded ? "success" : "rejected",
  });
  redirect(`/k/${code}${recorded ? "" : "?status=unavailable"}`);
}
