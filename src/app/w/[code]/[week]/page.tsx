import { notFound, redirect } from "next/navigation";
import { getWeeklyQuestionUrl } from "@/modules/participant_extensions/server";
import { validWeekNumber } from "@/modules/participant_extensions/policy";
import { normalizeParticipantCode } from "@/modules/participants/policy";
import { getActiveParticipantByCode } from "@/modules/participants/server";

export const dynamic = "force-dynamic";

export default async function WeeklyQuestionRedirect({ params }: { params: Promise<{ code: string; week: string }> }) {
  const { code: rawCode, week: rawWeek } = await params;
  const code = normalizeParticipantCode(rawCode);
  const week = validWeekNumber(rawWeek);
  const [participant, baseUrl] = await Promise.all([getActiveParticipantByCode(code), getWeeklyQuestionUrl()]);
  if (!participant || !week || !baseUrl) notFound();
  const target = new URL(baseUrl);
  target.searchParams.set("participant_code", code);
  target.searchParams.set("variant", participant.variant);
  target.searchParams.set("week", String(week));
  redirect(target.toString());
}
