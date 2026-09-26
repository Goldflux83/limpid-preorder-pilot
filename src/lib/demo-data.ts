export type Station = { code: "AMF" | "GD"; name: string; openingHours: string; orderingOpen: boolean };
export const stations: Station[] = [{ code: "AMF", name: "Amersfoort", openingHours: "ma–vr 06:30–19:00", orderingOpen: false }, { code: "GD", name: "Gouda", openingHours: "ma–vr 06:30–18:30", orderingOpen: false }];
export const products = ["Cappuccino", "Caffè latte", "Americano", "Espresso", "Thee", "Warme chocolademelk"];
export const demoParticipant = { firstName: "Deelnemer", code: "KA-7F4Q", variant: "V1", status: "actief", redemptions: 2, maxRedemptions: 10 };
