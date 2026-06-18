export type AccountKind = "startup" | "company";

export type OnboardingAnswers = {
  /** Why they're joining */
  goal: "pitch" | "review" | "both" | "explore";
  /** How mature the organization is */
  stage: "idea" | "early_startup" | "growing_business" | "established_enterprise";
  teamSize: "solo" | "small" | "medium" | "large";
  /** Do they already sell to other businesses at scale? */
  hasPayingCustomers: boolean;
  /** Corporate email domain (not gmail/yahoo etc.) */
  corporateEmail: boolean;
  companyNameProvided: boolean;
};

export type ClassificationResult = {
  recommended: AccountKind;
  confidence: "high" | "medium" | "low";
  startupScore: number;
  companyScore: number;
  reasons: string[];
};

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "live.com", "icloud.com", "proton.me", "protonmail.com", "mail.com",
]);

export function isCorporateEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return !PERSONAL_EMAIL_DOMAINS.has(domain);
}

/**
 * Scores answers to recommend Startup vs Enterprise (company).
 * Users can always override — this only suggests the right path.
 */
export function classifyAccount(answers: OnboardingAnswers): ClassificationResult {
  let startupScore = 0;
  let companyScore = 0;
  const reasons: string[] = [];

  switch (answers.goal) {
    case "pitch":
      startupScore += 4;
      reasons.push("You want to pitch an idea — typical for founders.");
      break;
    case "review":
      companyScore += 4;
      reasons.push("You want to review startups — typical for enterprises.");
      break;
    case "both":
      startupScore += 1;
      companyScore += 1;
      break;
    case "explore":
      break;
  }

  switch (answers.stage) {
    case "idea":
    case "early_startup":
      startupScore += 3;
      reasons.push("Early-stage builders usually join as startups.");
      break;
    case "growing_business":
      startupScore += 1;
      companyScore += 2;
      break;
    case "established_enterprise":
      companyScore += 4;
      reasons.push("Established organizations usually join as enterprises.");
      break;
  }

  switch (answers.teamSize) {
    case "solo":
      startupScore += 2;
      break;
    case "small":
      startupScore += 1;
      break;
    case "medium":
      companyScore += 2;
      break;
    case "large":
      companyScore += 3;
      break;
  }

  if (answers.hasPayingCustomers) {
    companyScore += 2;
    reasons.push("You already have paying customers — often an enterprise validator.");
  } else {
    startupScore += 1;
  }

  if (answers.corporateEmail) {
    companyScore += 2;
  } else {
    startupScore += 1;
  }

  if (answers.companyNameProvided) {
    companyScore += 1;
  }

  const recommended: AccountKind = companyScore > startupScore ? "company" : "startup";
  const diff = Math.abs(companyScore - startupScore);
  const confidence = diff >= 4 ? "high" : diff >= 2 ? "medium" : "low";

  return {
    recommended,
    confidence,
    startupScore,
    companyScore,
    reasons: reasons.slice(0, 3),
  };
}

export const ACCOUNT_LABELS: Record<AccountKind, { title: string; subtitle: string; badge: string }> = {
  startup: {
    title: "Startup",
    subtitle: "Pitch your idea, get validated by real enterprises, and grow your network.",
    badge: "Founder",
  },
  company: {
    title: "Enterprise",
    subtitle: "Discover startups, review pitches in your industry, and find your next partner.",
    badge: "Validator",
  },
};
