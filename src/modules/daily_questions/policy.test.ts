import { describe, expect, it } from "vitest";
import { validDailyQuestionInput } from "./policy";

describe("daily question input", () => {
  it("accepts no collection without follow-up fields", () => {
    expect(validDailyQuestionInput({ collected: false, stationId: null, addOn: null, feeling: null })).toBe(true);
  });

  it("requires every follow-up field when coffee was collected", () => {
    expect(validDailyQuestionInput({ collected: true, stationId: "station", addOn: "food", feeling: 5 })).toBe(true);
    expect(validDailyQuestionInput({ collected: true, stationId: "station", addOn: "food", feeling: null })).toBe(false);
    expect(validDailyQuestionInput({ collected: false, stationId: "station", addOn: null, feeling: null })).toBe(false);
  });
});
