import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { type DailyQuestionInput, validDailyQuestionInput } from "./policy";

export async function getDailyQuestionAnswered(participantId: string) {
  const { data } = await createSupabaseAdminClient().rpc("daily_question_answered_today", {
    p_participant_id: participantId,
  });
  return data === true;
}

export async function recordDailyQuestion(participantId: string, input: DailyQuestionInput) {
  if (!validDailyQuestionInput(input)) return false;
  const { error } = await createSupabaseAdminClient().rpc("record_daily_question", {
    p_participant_id: participantId,
    p_collected: input.collected,
    p_station_id: input.stationId,
    p_add_on: input.addOn,
    p_feeling: input.feeling,
  });
  return !error;
}
