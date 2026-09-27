import { notFound, redirect } from "next/navigation";
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
  redirect(`/k/${code}?week=received`);
}
