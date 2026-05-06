## Overview

This is a very large scope (4-stage gated conversations, anti-spam rules, SLA timer, ratings, notifications, payments, rebrand). Trying to ship it all in one pass will produce broken code. I'll deliver it in **3 phases**, each independently usable. You approve, I build Phase 1, then we iterate.

---

## Phase 1 — Core fix (THIS PASS)

Solves your immediate pain: *"startup can't see who responded or what they wrote."*

1. **Rebrand**: Change "PitchBridge" → "Startup Enterprise" everywhere (landing, navbar, footer, `<title>`, meta, emails copy).
2. **Restructured pitch form**: Replace free-text with fixed fields — Problem (200), Solution (200), Pitch Type (Sell/Investment/Network), Short Note (300). Target a specific company (new `target_company_id` column + company picker).
3. **Stage 1 → Stage 2 flow**:
   - Startup picks a company, submits structured pitch.
   - Block resubmit to same company within 90 days of Pass.
   - One open pitch per (startup, company) pair.
4. **Company response = binary only**: Show Interest (green) / Pass (grey). Remove the free-text response modal. Pass → close pitch + notify. Interest → unlock thread.
5. **Conversation thread (Stage 3 basic)**: New `messages` table. Both sides can see each other's identity (name, company), and read all messages in a chat-bubble UI. **Content filter** blocks emails, PK/intl phone numbers, WhatsApp/Telegram/Zoom/Meet/LinkedIn/social URLs. 500-char cap, 10-msg-per-side cap.
6. **Notifications**: Bell icon in navbar with unread count. Notification types for this phase: Pitch Sent, Interest Shown, Pass, Message Received.
7. **Sign-up T&C checkbox**: Add "I agree to Terms & Conditions" gate on both register pages, with full T&C text on `/terms`.
8. **Pitch counter widget**: "X of Y pitches used this month" (Basic 5 / Pro 15 / Premium ∞), enforced server-side via DB function.

**DB changes**: add `target_company_id` to pitches, restructure pitch fields, add `messages` table, `notifications` table, `pitch_response` simplified to `interested|pass`, monthly-pitch-count RPC, similarity check stub.

---

## Phase 2 — Payments, Stage 4, SLA (NEXT PASS)

- Manual payment status flow (PKR 15K to unlock Stage 3 messaging fully; PKR 20K total for Stage 4).
- Blurred-thread overlay + "Complete Payment to Unlock" button.
- Stage 4: lift caps, file attachments (Supabase Storage, 10MB PDF/img), contact card with verified email/phone + copy buttons, "Schedule Meeting" date/time picker.
- 7-day SLA countdown badges, day-5 / day-7 / day-14 reminder notifications, partial-refund flag at day 14, response-rate penalty.
- Email notifications via edge function.

## Phase 3 — Reputation + polish (FINAL PASS)

- Rating modal (3 sliders 1-3) for both sides, triggered 48h after first Stage 4 message when ≥3 messages exchanged.
- Rating badges + warning badge (<1.5) on profile cards.
- Duplicate-pitch similarity scoring (trigram / pg_trgm) at 70% threshold.
- Pitch-limit-warning notification at 80%.
- Bottom-nav mobile collapse polish, empty states, loading skeletons sweep.

---

## Technical notes (Phase 1)

- New tables: `messages(id, pitch_id, sender_id, body, created_at, read_at)`, `notifications(id, user_id, type, title, body, link, read_at, created_at)`.
- Alter `pitches`: add `target_company_id uuid`, `problem text`, `solution text`, `short_note text`; keep legacy `title`/`description` filled from problem+solution for back-compat.
- Alter `pitch_responses` decision enum: keep `interested`, rename `declined`→`pass` (or accept both).
- RLS: messages visible only to pitch's startup + target company once Interest shown. Notifications visible only to owner.
- Content filter: pure regex util in `src/lib/contentFilter.ts`, applied client-side before insert AND server-side via a `BEFORE INSERT` trigger that raises exception on match.
- Monthly limit: SQL function `can_startup_pitch(uid)` checking count this calendar month vs plan tier.
- Realtime: enable on `messages` + `notifications`.

## Out of scope for Phase 1 (deferred to 2/3)

Payments gating, blur overlay, file attachments, meeting scheduler, SLA timers + refunds, ratings, similarity check, email delivery, response-rate penalties.

---

**Approve to proceed with Phase 1.** I'll ship it end-to-end (migration → UI → notification bell → rebrand) in one go.