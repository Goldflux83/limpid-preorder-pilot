export const content = { nl: { pilot: "pilot", privacy: "Privacyverklaring", participantFooter: "Pilot van Limpid & Co in opdracht van NS Retail" }, en: { pilot: "pilot", privacy: "Privacy statement", participantFooter: "A Limpid & Co pilot commissioned by NS Retail" } } as const;
export type Locale = keyof typeof content;
