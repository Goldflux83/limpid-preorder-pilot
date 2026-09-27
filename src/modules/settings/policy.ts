export const featureKeys = ["ordering", "store_screen", "digital_stamps", "card_photos", "email_delivery"] as const;
export type FeatureKey = (typeof featureKeys)[number];
export type FeatureFlags = Record<FeatureKey, boolean>;
export const defaultFeatureFlags: FeatureFlags = { ordering: false, store_screen: true, digital_stamps: false, card_photos: false, email_delivery: false };
export function isFeatureKey(value: string): value is FeatureKey { return featureKeys.includes(value as FeatureKey); }
export const manageableFeatureKeys = ["ordering", "store_screen"] as const;
export function isManageableFeatureKey(value: string): value is (typeof manageableFeatureKeys)[number] { return manageableFeatureKeys.includes(value as (typeof manageableFeatureKeys)[number]); }
