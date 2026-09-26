const maxPinAttemptsPerHour = 5;
const sessionTouchIntervalMs = 5 * 60 * 1000;

export function isPinAttemptAllowed(attemptCount: number) { return attemptCount < maxPinAttemptsPerHour; }
export function shouldTouchSession(lastSeenAt: string, now = new Date()) { return now.getTime() - new Date(lastSeenAt).getTime() >= sessionTouchIntervalMs; }
export function matchesStationCode(sessionStationCode: string, requestedStationCode: string) { return sessionStationCode === requestedStationCode.toUpperCase(); }
