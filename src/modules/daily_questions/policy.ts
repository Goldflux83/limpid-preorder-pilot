export type DailyQuestionInput = {
  collected: boolean;
  stationId: string | null;
  addOn: string | null;
  feeling: number | null;
};

export function validDailyQuestionInput(input: DailyQuestionInput) {
  if (!input.collected) return !input.stationId && !input.addOn && !input.feeling;
  return Boolean(input.stationId) && ["nothing", "food", "other"].includes(input.addOn ?? "") && Number.isInteger(input.feeling) && input.feeling! >= 1 && input.feeling! <= 5;
}
