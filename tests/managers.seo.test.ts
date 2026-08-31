import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ALL_MANAGERS } from "../src/lib/managers";
import { ANSWERS } from "../src/lib/managers/answers";

const sitemap = readFileSync("public/sitemap.xml", "utf8");
const llms = readFileSync("public/llms.txt", "utf8");

// The SEO skill flags the sitemap as the file that silently rots: a new route
// ships, nobody adds the <url>, and the page is never crawled. Making that a
// test failure is the only thing that reliably stops it.
describe("managers section is discoverable", () => {
  it("lists every manager profile in the sitemap", () => {
    for (const m of ALL_MANAGERS) {
      expect(sitemap, `missing sitemap entry for /managers/${m.slug}`).toContain(
        `https://bountysounds.com/managers/${m.slug}<`,
      );
    }
  });

  it("lists every answer page in the sitemap", () => {
    for (const a of ANSWERS) {
      expect(sitemap, `missing sitemap entry for /music-management/${a.slug}`).toContain(
        `https://bountysounds.com/music-management/${a.slug}<`,
      );
    }
  });

  it("lists both hub pages in the sitemap", () => {
    expect(sitemap).toContain("https://bountysounds.com/managers<");
    expect(sitemap).toContain("https://bountysounds.com/music-management<");
  });

  it("lists every page in llms.txt for AI crawlers", () => {
    for (const m of ALL_MANAGERS) {
      expect(llms, `missing llms.txt entry for ${m.slug}`).toContain(`/managers/${m.slug}`);
    }
    for (const a of ANSWERS) {
      expect(llms, `missing llms.txt entry for ${a.slug}`).toContain(`/music-management/${a.slug}`);
    }
  });
});

describe("content invariants", () => {
  it("gives every page a unique slug", () => {
    const slugs = [...ALL_MANAGERS.map((m) => m.slug), ...ANSWERS.map((a) => a.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps meta descriptions inside the 160-character limit", () => {
    for (const page of [...ALL_MANAGERS, ...ANSWERS]) {
      expect(page.seo.description.length, `${page.slug} description too long`).toBeLessThanOrEqual(
        160,
      );
    }
  });

  it("keeps the short answer short enough to be quoted whole", () => {
    for (const a of ANSWERS) {
      expect(
        a.shortAnswer.split(/\s+/).length,
        `${a.slug} short answer is too long`,
      ).toBeLessThanOrEqual(90);
    }
  });

  it("sources every manager profile", () => {
    for (const m of ALL_MANAGERS) {
      expect(m.sources.length, `${m.slug} has no sources`).toBeGreaterThan(0);
      for (const s of m.sources) expect(s.url).toMatch(/^https?:\/\//);
    }
  });

  // Quotes are the easiest thing on the site to get sued over and the easiest
  // to fake. Every one must carry a speaker and a working source URL.
  it("attributes and sources every quote", () => {
    for (const m of ALL_MANAGERS) {
      if (!m.quote) continue;
      expect(m.quote.text.trim().length, `${m.slug} quote is empty`).toBeGreaterThan(0);
      expect(m.quote.speaker.trim().length, `${m.slug} quote has no speaker`).toBeGreaterThan(0);
      expect(m.quote.source.url, `${m.slug} quote source is not a URL`).toMatch(/^https?:\/\//);
      // Quotes are rendered inside curly quotes, so a straight double quote in
      // the text is a sign the line was pasted with its delimiters attached.
      expect(m.quote.text, `${m.slug} quote includes its own quote marks`).not.toMatch(
        /^["']|["']$/,
      );
    }
  });

  // Every profile carries a line, Max's included — his card is not a special
  // case on the wall.
  it("quotes every manager on the roster", () => {
    const missing = ALL_MANAGERS.filter((m) => !m.quote).map((m) => m.slug);
    expect(missing, "these profiles have no quote").toEqual([]);
  });

  it("only cross-links slugs that exist", () => {
    const managerSlugs = new Set(ALL_MANAGERS.map((m) => m.slug));
    const answerSlugs = new Set(ANSWERS.map((a) => a.slug));
    for (const a of ANSWERS) {
      for (const r of a.related) expect(answerSlugs, `${a.slug} → ${r}`).toContain(r);
      for (const m of a.managerExamples ?? [])
        expect(managerSlugs, `${a.slug} → ${m}`).toContain(m);
    }
  });
});
