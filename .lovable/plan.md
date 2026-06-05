
# Startup Enterprise — Production Hardening (All-in-one)

You chose: **Lovable Emails**, **manual payments only** (no JazzCash/Stripe), **all 9 sections in one pass**. Heads-up: this is a very large diff (~40 new files, ~10 migrations, 8 edge functions). I'll preserve all existing flows but please budget time to QA after.

---

## Section 1 — Security & Compliance
- Migration: rate-limit table `rate_limits(user_id, action, window_start, count)` + `check_rate_limit(_uid, _action, _max, _window)` SQL function. Enforce **10 pitches/hour** via BEFORE INSERT trigger on `pitches`. (Auth login/IP rate limits are handled by Supabase Auth's built-in limits — I'll document, not duplicate.)
- New pages: `/privacy` (full policy), cookie consent banner component (localStorage `cookie_consent=accepted|declined`, gates analytics).
- New page: `/settings/account` with Delete + Download buttons.
- Edge functions: `delete-account` (verify JWT, cascade delete in correct order, then `auth.admin.deleteUser`), `export-user-data` (returns JSON of all user-owned rows).
- RLS audit migration: tighten `notifications` (already owner-only ✓), `pitch_payments` (drop participant SELECT, restrict to payer + admin), confirm `messages`/`pitches`/`ratings` participant-only. Add missing DELETE policies as `false`.
- `AttachmentsPanel`: regenerate signed URLs (1h) on every mount via `createSignedUrl`.

## Section 2 — Email (Lovable Emails)
- Run email infra setup + scaffold transactional templates.
- 12 React Email templates in `_shared/transactional-email-templates/`: welcome-startup, welcome-company, pitch-received, interest-shown, pitch-passed, message-received, stage4-unlocked, sla-day5, sla-day7-company, sla-day7-startup, sla-day14-admin, payment-confirmed, payment-rejected, rating-reminder.
- Migration: `user_notification_prefs(user_id, key, enabled)` + `sla_emails_sent(pitch_id, kind, sent_at)` for dedupe + `partial_refund_flagged boolean` on `pitch_payments` + `response_rate int default 100` on `profiles`.
- Edge function `send-app-email` thin wrapper that checks prefs then invokes `send-transactional-email`.
- DB triggers (in existing notify_* functions) call edge function via `pg_net` for: pitch_received, interest_shown, pitch_passed, message_received, payment_verified, payment_rejected, stage_4_unlocked.
- Edge function `sla-cron` scheduled hourly via `pg_cron` — scans open/uninterested pitches, sends day-5/7/14 emails, sets `partial_refund_flagged`, decrements `response_rate`, dedup via `sla_emails_sent`.
- Edge function `rating-reminder-cron` hourly — finds Stage-4 threads where first message ≥48h ago and rating not yet submitted by participant.
- New page `/settings/notifications` with toggles per email type.

## Section 3 — Payments (manual only, no gateway)
- Skip JazzCash/Stripe per your choice. Keep existing transaction-ID flow, relabel as "Bank transfer (manual review)".
- New page `/settings/billing`: plan, quota, payment history, invoice download.
- Edge function `generate-invoice`: HTML→PDF (using `@react-pdf/renderer` via `npm:` specifier or simple HTML-to-PDF via `pdf-lib`). Stores PDF in `pitch-files/invoices/{user}/{payment}.pdf`. Triggered automatically when admin verifies; URL stored on payment row.
- Migration: `audit_log(actor_id, action, target_type, target_id, notes, created_at)`, `partial_refund_flagged` already added in §2; add admin "Mark refunded" action that writes audit_log (manual cash refund).
- New `/payment/failed` screen with retry CTA.

## Section 4 — Admin Panel
- New layout `/admin` with tabs: Roles, Users, Verification, Analytics, Audit, Moderation, Payments (existing).
- Migration: add `is_suspended boolean`, `is_verified boolean`, `verification_status text`, `verification_reason text` to `profiles`; `moderated_messages(pitch_id, sender_id, body, reason, created_at)`.
- Update `block_contact_sharing` trigger to log to `moderated_messages` before raising.
- Edge function `admin-action` (verifies admin role) for: grant/revoke admin, suspend/unsuspend, delete user, approve/reject company, dismiss/warn moderation, all writing to `audit_log`.
- AuthContext: block login when `is_suspended`.
- CSV export on Users/Pitches/Payments tables (client-side `Blob`).
- Analytics cards via SQL views/RPCs: `dau_mau()`, `funnel_rates()`, `revenue_this_month()`, `mrr()`, `avg_response_time()`.

## Section 5 — Ratings & Reputation
- Migration: `overall_rating numeric`, `response_rate int` on `profiles` + trigger on `pitch_ratings` to recompute `overall_rating` for ratee.
- Update Browse cards: 3 pill badges + ⭐ overall, response_rate badge, low-rating warning banner (<1.5), verified badge.
- Public profiles `/startup/:id` and `/company/:id` (see §7) include rating trend (recharts line, 90d), SLA compliance %, breakdowns.
- PitchThread: auto-show RatingPanel when `messages.length >= 3` & no existing rating from this user.

## Section 6 — UX Polish
- Skeletons replace all "Loading…" on Dashboard, Browse, PitchThread, Notifications, Admin tables.
- Reusable `<EmptyState svg cta>` component for Browse / Pitches / Inbox / Notifications.
- `<LockedOverlay>` blurred overlay for Stage 3/4 pre-payment with PaymentPanel CTA.
- Browse search + filters (industry, response-rate, verified, sort).
- `<MobileBottomNav>` (`md:hidden`) with 5 tabs + unread badge.
- Replace any `alert/confirm` with `sonner` toasts and a reusable `<ConfirmDialog>` (typed-name variant for delete).
- NewPitch: live char counters (red within 20), inline quota progress bar with amber@80%, upgrade modal@100%, duplicate-warning card driven by client-side `similarity` RPC pre-submit.
- Onboarding checklist banner on Dashboard (localStorage-dismissable, persists steps in profile).

## Section 7 — Profiles & Settings
- Migration: extend `profiles` with `logo_url`, `one_liner`, `stage`, `team_size`, `country`, `linkedin_url`, `hq_city`, `description`, `target_industries text[]`, `company_size`.
- New `pitch-files` subfolder `logos/` for uploads (signed for private; or new public bucket `logos`). Use new public bucket `public-assets` for logos.
- `/settings/profile` (role-aware form), `/settings/plan` (current plan, upgrade modal triggering manual payment), profile completeness bar.
- Public `/startup/:id` and `/company/:id` pages.

## Section 8 — Analytics
- `/analytics` route, role-aware. Recharts (already installed) for bar + funnel + histogram. Reads via RPCs `startup_stats(_uid)` and `company_stats(_uid)`.

## Section 9 — Final QA
- Manual sweep: 375px responsive, dark mode tokens-only, no console errors, RLS smoke test, signed-URL expiry, idempotent unlock (via `apply_payment_verification` already guards on status change), pg_trgm extension verified, cron job confirmed, cookie consent gate.

---

## Technical notes
- ~10 migrations, ~8 edge functions, ~25 new components/pages, ~15 edited files.
- All new colors via existing tokens in `index.css` / `tailwind.config.ts` — no hardcoded hex.
- Realtime channels keep unique per-mount IDs (existing pattern).
- Cron jobs use `pg_cron` + `pg_net` invoking edge functions with service role key in Vault.
- Account-deletion edge function deletes in dependency order: ratings → messages → attachments → meetings → payments → notifications → responses → pitches → user_roles → profile → auth user. Storage objects under user prefix purged via `storage.from('pitch-files').remove([...])`.
- Invoice PDF: use `npm:pdfkit@0.15` (lightweight, Deno-compatible) rather than headless Chrome.

## Risk & mitigation
- Volume of edits raises chance of breakage. After implementation I will: build, smoke-test routes, view runtime errors, and fix any compile issues before handoff.
- If anything blocks (e.g., DNS not yet verified for emails), I'll scaffold + deploy anyway; emails activate when DNS verifies — no rework needed.

**Approve to start the all-in-one build.**
