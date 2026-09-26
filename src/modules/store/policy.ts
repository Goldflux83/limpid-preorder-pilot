const maxPinAttemptsPerHour = 5;
const sessionTouchIntervalMs = 5 * 60 * 1000;

export function isPinAttemptAllowed(attemptCount: number) { return attemptCount < maxPinAttemptsPerHour; }
export function shouldTouchSession(lastSeenAt: string, now = new Date()) { return now.getTime() - new Date(lastSeenAt).getTime() >= sessionTouchIntervalMs; }
export function matchesStationCode(sessionStationCode: string, requestedStationCode: string) { return sessionStationCode === requestedStationCode.toUpperCase(); }
export function isValidStationPin(pin: string) { return /^\d{4}$/.test(pin); }
export function isOrderOverdue(slotStart: string, now = new Date()) { return now.getTime() >= new Date(slotStart).getTime() + 10 * 60 * 1000; }
export function remainingPauseSeconds(endsAt: string, now = new Date()) { return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now.getTime()) / 1000)); }
export function dailyLogHref(baseUrl: string, stationCode: string) { const url = new URL(baseUrl); url.searchParams.set("station", stationCode); return url.toString(); }
