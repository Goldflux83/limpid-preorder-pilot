export const participantCodePattern = /^[A-HJ-NP-Z2-9]{2}-[A-HJ-NP-Z2-9]{4}$/;
export const redemptionLimitPerAmsterdamDay = 3;
export const participantMutationLimitPerHour = 20;

export function normalizeParticipantCode(value: string) {
  return value.trim().toUpperCase();
}

export function isParticipantCode(value: string) {
  return participantCodePattern.test(normalizeParticipantCode(value));
}

export function canRecordRedemption(count: number) {
  return count < redemptionLimitPerAmsterdamDay;
}

export function isParticipantMutationAllowed(attemptCount: number) {
  return attemptCount < participantMutationLimitPerHour;
}
