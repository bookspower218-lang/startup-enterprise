// Detects forbidden contact-sharing patterns prior to Stage 4.
const PATTERNS: { re: RegExp; label: string }[] = [
  { re: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, label: "email address" },
  { re: /(\+?\d[\d\s\-().]{7,}\d)/, label: "phone number" },
  { re: /(wa\.me|whatsapp|t\.me|telegram|zoom\.us|meet\.google|calendly\.com|linkedin\.com|instagram\.com|facebook\.com|twitter\.com|x\.com\/|tiktok\.com)/i, label: "external link" },
];

export function detectForbidden(text: string): string | null {
  for (const p of PATTERNS) if (p.re.test(text)) return p.label;
  return null;
}

export const STAGE_BLOCK_MESSAGE =
  "Direct contact sharing is not allowed at this stage. Complete payment to unlock full contact details.";
