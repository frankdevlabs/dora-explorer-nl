/**
 * Pure field validation for the RoI workbench — shared by the UI and
 * scripts/verify-roi.ts. Mirrors the ESA data-quality checks that failed
 * most registers in the 2024 dry run: LEI syntax/checksum, ISO country
 * codes, closed-list membership, mandatory completeness.
 */
import type { RoiColumn } from "./schema";

/** ISO 3166-1 alpha-2 (officially assigned), plus EL/UK conventions used in EU reporting. */
const ISO_COUNTRIES = new Set(
  (
    "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
    "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
    "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
    "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT " +
    "MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
    "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG " +
    "UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW EL UK"
  ).split(" "),
);

/** ISO 17442 LEI: 20 chars, alphanumeric, valid ISO 7064 mod-97-10 checksum. */
export function isValidLei(value: string): boolean {
  const lei = value.trim().toUpperCase();
  if (!/^[A-Z0-9]{18}[0-9]{2}$/.test(lei)) return false;
  // mod 97-10 over the digit-expanded string (A=10 … Z=35)
  let remainder = 0;
  for (const ch of lei) {
    const part = /[0-9]/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const d of part) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

export function isValidCountry(value: string): boolean {
  return ISO_COUNTRIES.has(value.trim().toUpperCase());
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;
  return !Number.isNaN(Date.parse(value.trim()));
}

export interface FieldIssue {
  code: string;
  severity: "fout" | "ontbreekt";
  message: string;
}

/**
 * Validate one field value against its column definition. Empty values are
 * only flagged when the column is unconditionally mandatory (conditional
 * "Verplicht indien …" columns can't be checked without the condition).
 */
export function validateField(
  column: RoiColumn,
  value: string,
  closedList?: string[],
): FieldIssue | null {
  const v = value.trim();
  if (v === "") {
    if (column.mandatory) {
      return { code: column.code, severity: "ontbreekt", message: "Verplicht veld is leeg." };
    }
    return null;
  }
  if (/lei/i.test(column.label) && column.soort === "Alfanumeriek" && /^\S{15,25}$/.test(v)) {
    // columns whose label names a LEI get the checksum test
    if (/\bLEI\b/.test(column.label) && !isValidLei(v)) {
      return {
        code: column.code,
        severity: "fout",
        message: "Geen geldige LEI (20 tekens, ISO 17442-checksum).",
      };
    }
  }
  if (column.soort === "Land" && !isValidCountry(v)) {
    return {
      code: column.code,
      severity: "fout",
      message: "Geen geldige ISO 3166-1 alpha-2 landcode.",
    };
  }
  if (column.soort === "Datum" && !isValidDate(v)) {
    return { code: column.code, severity: "fout", message: "Datum moet JJJJ-MM-DD zijn." };
  }
  if (column.soort === "Monetair" && !/^\d+([.,]\d+)?$/.test(v)) {
    return { code: column.code, severity: "fout", message: "Monetair veld: alleen een bedrag." };
  }
  if (closedList && closedList.length > 0) {
    const num = v.match(/^(\d+)/)?.[1];
    const ok =
      closedList.includes(v) ||
      (num !== undefined && closedList.some((o) => o.startsWith(`${num}.`)));
    if (!ok) {
      return {
        code: column.code,
        severity: "fout",
        message: `Waarde buiten de gesloten lijst (${closedList.map((o) => o.split(".")[0]).join("/")}).`,
      };
    }
  }
  return null;
}
