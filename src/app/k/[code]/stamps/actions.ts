"use server";

import { redirect } from "next/navigation";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode, isParticipantMutationAllowedForRequest } from "@/modules/participants/server";
import { recordDigitalStamp } from "@/modules/participant_extensions/server";

export async function addDigitalStamp(formData: FormData) {
  const code = normalizeParticipantCode(String(formData.get("code") ?? ""));
  const participant = await isParticipantMutationAllowedForRequest(code) ? await getActiveParticipantByCode(code) : null;
  if (!participant) redirect(`/k/${code}/stamps`);
  const result = await recordDigitalStamp(participant.id, String(formData.get("stationId") ?? ""));
  redirect(`/k/${code}/stamps${result ? "?status=success" : "?status=unavailable"}`);
}
