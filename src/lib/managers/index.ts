import { MANAGERS, type Manager } from "./roster";
import { MAX_FLOHR } from "./max";

export type { Manager, Source } from "./roster";
export type { Answer } from "./answers";

/**
 * The full roster, Max included. The historical entries stay in roster.ts
 * and Max stays in max.ts so the "only sourced claims" rule for his entry
 * can't quietly leak into the rest of the file.
 */
export const ALL_MANAGERS: Manager[] = [...MANAGERS, MAX_FLOHR];

/** Alphabetical by surname, which is how the roster page reads. */
export const ROSTER: Manager[] = [...ALL_MANAGERS].sort((a, b) =>
  a.sortName.localeCompare(b.sortName),
);

export function findManager(slug: string): Manager | undefined {
  return ALL_MANAGERS.find((m) => m.slug === slug);
}

export const ALL_MANAGER_SLUGS = ALL_MANAGERS.map((m) => m.slug);
