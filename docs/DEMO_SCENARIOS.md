# Demo & Testing Scenarios

Example opening messages to test different coaching paths. Copy-paste these into the chat to exercise the full range of prompt behaviours.

---

## 1. Right-Sized (Normal Flow)

These give enough to start but need the coach to guide through remaining sections.

### 1a. Dashboard Performance

> Our dashboard search takes 8+ seconds to return results. Users on the Enterprise plan are hitting this multiple times a day and we're getting support tickets about it weekly.

**Expected:** Coach acknowledges the clear intent, moves quickly to outcome. Should complete in 4-5 exchanges.

### 1b. Onboarding Drop-off

> We're losing about 40% of new users during onboarding. They sign up but never complete their first project setup. The analytics show most of them drop off at the "invite team members" step.

**Expected:** Intent is clear with data. Coach should ask about outcome — what does a fixed onboarding look like?

### 1c. Mobile Notifications

> Customers have been asking for push notifications on mobile. Right now they only get email alerts when something needs their attention, and they're missing time-sensitive approvals.

**Expected:** Clear problem and who's affected. Coach moves to outcome, then scope (which notifications? all or a subset?).

---

## 2. Verbose (Skip-Ahead)

These front-load so much detail that the coach should skip past multiple sections.

### 2a. CSV Export — Nearly Complete

> We need to add CSV export to the reporting dashboard. When it's done, users will be able to download any report as a CSV file. Scope is just the three main report types — pipeline, activity, and forecast. The custom reports builder is out of scope for now. Success looks like: the export button appears on all three report pages, the CSV downloads within 5 seconds for up to 10k rows, and the column headers match what's shown on screen.

**Expected:** Intent, outcome, scope, and success criteria are all covered. Coach should acknowledge the completeness and ask only about constraints, or go straight to "good ticket, ready to use."

### 2b. SSO Integration — Everything Provided

> Our enterprise customers need SAML SSO. Without it we can't close deals over $50k — it's a procurement blocker. The outcome is that enterprise admins can configure SAML in our settings panel and their team members can log in via their IdP without creating a separate password. In scope: SAML 2.0, Okta and Azure AD as initial IdPs, auto-provisioning of users on first login. Out of scope: SCIM provisioning, custom IdP support, and group-based role mapping (those are follow-ups). Success criteria: admin can complete SAML config in under 10 minutes, users can SSO login, existing password-based users are unaffected. Constraint: must be done before March 1 for the Acme Corp renewal.

**Expected:** This covers everything. Coach should recognise it's complete in one exchange. No questions needed — just confirm the ticket is ready.

---

## 3. Sketchy (Needs Probing)

These are vague or incomplete. The coach should ask clarifying questions.

### 3a. Vague Request

> We need to improve the settings page.

**Expected:** Coach should probe for intent — what's wrong with it? Who's affected? What prompted this?

### 3b. Solution Without Problem

> Can we add a Redis cache to the API?

**Expected:** Coach should redirect from solution to problem — what's slow? What are users experiencing? The "why" is missing.

### 3c. One Word

> Permissions.

**Expected:** Coach needs to draw out what this means. Is it a bug? A new feature? What about permissions?

---

## 4. Anti-Pattern Triggers

These test whether the coach correctly redirects bad patterns.

### 4a. Task List Instead of Outcome

> When it's done, we'll have: 1) updated the database schema, 2) added the new API endpoint, 3) written the migration script, 4) updated the frontend components, and 5) added tests.

**Expected:** Coach should gently redirect — "Those are implementation steps. What changes for users when all five are done?"

### 4b. Everything Is In Scope

> Everything related to billing is in scope.

**Expected:** Coach should push for boundaries — what specifically? Which billing flows? What's deferred?

### 4c. Acceptance Criteria Overload

> Success means: the button is blue (#0066CC), it's 42px tall, it has 16px padding, it uses the Inter font at 14px, it has a 4px border radius, it transitions opacity on hover over 200ms, it's positioned 24px from the right edge...

**Expected:** Coach should redirect toward outcome-level criteria, not pixel specs.

---

## 5. Multi-Item (Redirect to Focus)

### 5a. Three Things at Once

> We need to fix the login bug, add dark mode, and update the pricing page.

**Expected:** Coach should redirect — "That's three pieces of work. Which one matters most right now? Let's give it a clear ticket."

---

## 6. Quick Follow-Up Responses

Use these as replies during a conversation to test pacing.

| When the coach asks about... | Reply with | Expected behaviour |
|-----|-----|-----|
| Outcome | "Users can do X" | Accept and move to scope |
| Scope | "Just the main page for now" | Accept and move to success |
| Success criteria | "It works and nothing breaks" | Gently probe for 1-2 more specific criteria |
| Constraints | "Nope" | Wrap up immediately |
| Anything | "Yes, that's right" | Don't restate — ask next question or advance |
| Anything | "Exactly" | Same as above — move forward |

---

## Testing Checklist

- [ ] Streaming: text appears word-by-word, not all at once
- [ ] Cursor: pulsing indicator visible during stream, disappears after
- [ ] Spinner: "Thinking..." shows briefly before first byte, then disappears
- [ ] Ticket panel: updates after each coaching exchange
- [ ] Section indicator: advances as conversation progresses
- [ ] Pacing: complete ticket in 4-6 exchanges for right-sized input
- [ ] Skip-ahead: verbose input skips past covered sections
- [ ] One-shot: fully specified input completes in 1-2 exchanges
- [ ] Anti-patterns: task lists redirected, vague scope challenged
- [ ] Reset: clears conversation, ticket panel, and section state
- [ ] Input disabled during streaming, re-enabled after
