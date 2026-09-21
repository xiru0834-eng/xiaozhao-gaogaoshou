import type { Zone } from "../shared/schedule-contract.ts";

export function normalizeTimeQuotes(quotes: string[]): string[] {
  return quotes.map(quote => quote.replace(
    /(20\d{2})年(\d{1,2})月(\d{1,2})日/g,
    (_, y, m, d) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")} `,
  ));
}

// A date and clock must occur together, not in different appointments or quotes.
// Ambiguous/time-first phrasing stays for human review instead of guessing a link.
export function hasTimeEvidence(quotes: string[], date: string, time?: string): boolean {
  return quotes.some((quote) => {
    const dates = [...quote.matchAll(/(?<!\d)20\d{2}-\d{2}-\d{2}(?!\d)/g)];
    return dates.some((match, index) => {
      if (match[0] !== date) return false;
      if (!time) return true;
      const segment = quote.slice(match.index! + date.length, dates[index + 1]?.index);
      return [...segment.matchAll(/(?<!\d)\d{2}:\d{2}(?!\d)/g)].some(
        (clock) => clock[0] === time,
      );
    });
  });
}

export function hasZoneEvidence(quote: string, zone: Zone): boolean {
  return {
    "Asia/Shanghai": /北京|中国标准|\b(?:UTC|GMT)\s*\+\s*0?8(?::00)?(?![\d:])/i,
    "Australia/Sydney": /悉尼|Sydney|AEST|AEDT/i,
    UTC: /\bUTC\b(?!\s*[+-]\s*\d)|协调世界时/i,
  }[zone].test(quote);
}
