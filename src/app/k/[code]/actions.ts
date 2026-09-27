"use server";

import { redirect } from "next/navigation";
import { reportOperationalTelemetry } from "@/modules/telemetry/operational";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode, isParticipantMutationAllowedForRequest, recordParticipantRedemption } from "@/modules/participants/server";
import { recordDailyQuestion } from "@/modules/daily_questions/server";

export async function registerRedemption(formData: FormData) {
  const code = normalizeParticipantCode(String(formData.get("code") ?? ""));
  const stationId = String(formData.get("stationId") ?? "");
  const participant = await isParticipantMutationAllowedForRequest(code) ? await getActiveParticipantByCode(code) : null;
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

export async function answerDailyQuestion(formData: FormData) {
  const code = normalizeParticipantCode(String(formData.get("code") ?? ""));
  const participant = await isParticipantMutationAllowedForRequest(code) ? await getActiveParticipantByCode(code) : null;
  const collected = formData.get("collected") === "yes";
  const recorded = participant && await recordDailyQuestion(participant.id, {
    collected,
    stationId: collected ? String(formData.get("stationId") ?? "") || null : null,
    addOn: collected ? String(formData.get("addOn") ?? "") || null : null,
    feeling: collected ? Number(formData.get("feeling")) : null,
  });
  void reportOperationalTelemetry({ type: "server_action", action: "daily_question_answered", outcome: recorded ? "success" : "rejected" });
  redirect(`/k/${code}${recorded ? "?daily=answered" : "?daily=unavailable"}`);
}
