import { notFound, redirect } from "next/navigation";
import { markWeeklyQuestionComplete } from "@/modules/participant_extensions/server";
import { validWeekNumber } from "@/modules/participant_extensions/policy";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode } from "@/modules/participants/server";

export const dynamic = "force-dynamic";

export default async function WeeklyQuestionComplete({ params }: { params: Promise<{ code: string; week: string }> }) {
  const { code: rawCode, week: rawWeek } = await params;
  const code = normalizeParticipantCode(rawCode);
  const week = validWeekNumber(rawWeek);
  const participant = await getActiveParticipantByCode(code);
  if (!participant || !week) notFound();
  await markWeeklyQuestionComplete(participant.id, week);
  redirect(`/k/${code}`);
}
