export const STAGES = [
  "prospect",
  "contacted",
  "replied",
  "onboarded",
  "active",
  "passed",
] as const;
export type Stage = (typeof STAGES)[number];
export const FOUNDING_SEATS = 25;
