"use server";

import { redirect } from "next/navigation";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode, isParticipantMutationAllowedForRequest } from "@/modules/participants/server";
import { uploadCardPhoto } from "@/modules/participant_extensions/server";
import { validCardPhoto } from "@/modules/participant_extensions/policy";

export async function submitCardPhoto(formData: FormData) {
  const code = normalizeParticipantCode(String(formData.get("code") ?? ""));
  const participant = await isParticipantMutationAllowedForRequest(code) ? await getActiveParticipantByCode(code) : null;
  const file = formData.get("photo");
  if (!participant || !(file instanceof File) || !validCardPhoto(file)) redirect(`/k/${code}/card-photo?status=unavailable`);
  const uploaded = await uploadCardPhoto(participant.id, file);
  redirect(`/k/${code}/card-photo?status=${uploaded ? "success" : "unavailable"}`);
}
