const maxSignupAttemptsPerHour = 5;

export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function isValidEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value)); }
export function isSignupAttemptAllowed(attemptCount: number) { return attemptCount < maxSignupAttemptsPerHour; }
export function isValidBooleanChoice(value: string) { return value === "yes" || value === "no"; }
