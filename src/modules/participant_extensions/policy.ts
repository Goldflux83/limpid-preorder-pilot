export function validWeekNumber(value: string) {
  const week = Number(value);
  return Number.isInteger(week) && week >= 1 && week <= 53 ? week : null;
}

export function canUploadCardPhoto(recentUploadCount: number) {
  return recentUploadCount === 0;
}

export function validCardPhoto(file: File) {
  return file.size > 0 && file.size <= 5 * 1024 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

export function stampCardProgress(stampCount: number) {
  return (2 + stampCount) % 12;
}

export function currentIsoWeek(now = new Date()) {
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
}
