import { randomBytes } from "crypto";

const codeCharacters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const exportDatasets = ["stations", "products", "participants", "orders", "redemptions", "daily_questions", "vouchers", "events"] as const;
export type ExportDataset = (typeof exportDatasets)[number];

export function generateParticipantCode(random = randomBytes) {
  const value = random(6);
  const characters = [...value].map((byte) => codeCharacters[byte % codeCharacters.length]).join("");
  return `${characters.slice(0, 2)}-${characters.slice(2)}`;
}

export function parseProductOptions(value: string) {
  return value.split(",").map((option) => option.trim()).filter(Boolean);
}

export function isExportDataset(value: string): value is ExportDataset {
  return exportDatasets.includes(value as ExportDataset);
}
