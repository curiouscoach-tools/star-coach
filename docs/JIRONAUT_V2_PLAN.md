# Jironaut 2.0 - Coach Mode Implementation Plan

**Version:** 2.0
**Status:** Planning
**Created:** 2026-01-27

---

## Vision

Jironaut 2.0 shifts from **assessing ticket quality** (reactive) to **guiding ticket creation** (proactive).

> "Coach, not critic — guide good thinking rather than scoring bad tickets."

The goal is **clarity over completeness**:
- Easy to write
- Easy to read (under ~60 seconds)
- Clear enough for a team to start meaningful work

### Two Modes

| Mode | Purpose | Interface |
|------|---------|-----------|
| **Coach** (new) | Guide users through creating clear tickets | Chat + live ticket preview |
| **Classic** (existing) | Analyze existing tickets against DoR | Form + scored results |

Both modes will coexist as tabs in the same application.

---

## Design Principles

From [GUIDED_PROMPTING_FRAMEWORK.md](../GUIDED_PROMPTING_FRAMEWORK.md):

1. **Coach, not critic** — guide good thinking rather than scoring bad tickets
2. **Progressive disclosure** — start with the minimum, add depth only if needed
3. **Outcome over activity** — focus on value and change, not task lists
4. **Human-readable** — optimised for people, not Jira fields

### Core Questions

A strong ticket should answer four questions:
1. Why are we doing this?
2. What will change as a result?
3. What does success look like?
4. What constraints or boundaries matter?

---

## Architecture

### Directory Structure

```
jironaut/
├── docs/
│   ├── JIRONAUT_V2_PLAN.md          # This document
│   └── ...
├── src/
│   ├── App.jsx                       # Shell with tab routing
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx            # Logo, nav tabs, about
│   │   │   ├── TabNav.jsx            # Coach | Classic toggle
│   │   │   └── TicketPreview.jsx     # Rendered ticket output (shared)
│   │   │
│   │   ├── coach/                    # NEW: Jironaut 2.0
│   │   │   ├── CoachView.jsx         # Split-view container
│   │   │   ├── ChatPanel.jsx         # Left side: conversation
│   │   │   ├── TicketPanel.jsx       # Right side: emerging ticket
│   │   │   ├── MessageBubble.jsx     # Chat message display
│   │   │   ├── QuestionCard.jsx      # Structured question with nudges
│   │   │   └── FormatSelector.jsx    # Output format options
│   │   │
│   │   └── classic/                  # EXISTING: Analyzer (ported)
│   │       └── ClassicView.jsx       # Current App.jsx logic, extracted
│   │
│   ├── hooks/
│   │   ├── useCoachConversation.js   # Chat state, message history
│   │   └── useTicketBuilder.js       # Emerging ticket state
│   │
│   └── utils/
│       ├── formatters.js             # User story, Gherkin, markdown converters
│       └── prompts.js                # System prompts for coach + analyzer
│
├── api/
│   ├── analyze.js                    # Existing analyzer endpoint
│   └── coach.js                      # New coach conversation endpoint
│
└── public/
    └── images/
        └── jironaut-logo.png
```

### Data Flow (Coach Mode)

```
User lands on Coach tab
        ↓
AI asks first question (Intent & Value)
        ↓
User responds in chat
        ↓
AI processes response:
  - Extracts key info → updates ticket preview
  - Decides: sufficient? or needs nudge?
        ↓
If sufficient → move to next section (Outcome, Scope, etc.)
If unclear → ask optional nudge question
        ↓
After all sections complete:
  - Generate full ticket draft
  - Show format options (User Story, Markdown, Gherkin)
  - User can edit directly in preview panel
        ↓
Export / Copy to clipboard
```

---

## Data Models

### Ticket State

```javascript
const ticketState = {
  // Core content (format-agnostic)
  intent: "",           // Why are we doing this?
  outcome: "",          // What will change?
  scope: {
    included: [],
    excluded: []
  },
  successCriteria: [],  // Array of criteria
  constraints: [],      // Dependencies, deadlines, etc.

  // Metadata
  ticketType: "story",  // story, bug, feature, task, spike, tech-debt
  workTypes: [],        // frontend, backend, etc.

  // Output preferences
  format: "structured", // structured, user-story, gherkin
};
```

### Conversation State

```javascript
const conversationState = {
  currentSection: "intent",  // intent, outcome, scope, success, constraints, complete
  messages: [
    {
      id: "uuid",
      role: "assistant" | "user",
      content: "string",
      timestamp: "ISO date",
      section: "intent"      // Which section this relates to
    }
  ],
  sectionStatus: {
    intent: "complete" | "in-progress" | "pending",
    outcome: "pending",
    scope: "pending",
    success: "pending",
    constraints: "pending"
  }
};
```

---

## Guided Prompt Flow

### Section 1: Intent & Value (Non-negotiable)

**Primary prompt:**
> What problem are we trying to solve, or what opportunity are we pursuing?

**Optional nudges (use only if needed):**
- Who is affected today?
- What is painful, slow, risky, or blocked right now?
- What happens if we don't do this?

**Coaching cue:**
> If this ticket disappeared, who would notice — and why?

### Section 2: Outcome

**Primary prompt:**
> When this work is complete, what will be different?

**Optional nudges:**
- What can users/teams do that they couldn't before?
- What stops happening?
- What becomes easier, faster, or safer?

**Anti-pattern to detect:**
- Listing implementation steps instead of outcomes

### Section 3: Scope & Boundaries

**Primary prompt:**
> What is in scope for this work item — and what is explicitly out of scope?

**Optional nudges:**
- Which systems, flows, or surfaces are included?
- Is this a thin slice or a full solution?
- What is intentionally deferred?

**Coaching cue:**
> What future question do you want this ticket to already have answered?

### Section 4: Success Criteria

**Primary prompt:**
> How will we know this has been successful?

**Optional nudges:**
- What must be true for us to say "yes, this worked"?
- What must not be broken?
- Is there a simple check or signal we'll look for?

**Guideline:**
- Prefer 3-5 clear statements over exhaustive acceptance criteria

### Section 5: Constraints & Context (Optional)

**Trigger prompt:**
> Is there anything the team should know before starting?

**Examples:**
- Dependencies on other teams or systems
- Deadlines, sequencing, or fixed events
- Compliance, accessibility, or architectural constraints
- Prior attempts or related work

**Rule of thumb:**
> If it doesn't affect decisions or execution, it doesn't belong here.

---

## Output Formats

The same ticket content can be rendered in multiple formats:

### Structured (Default)

```markdown
## Intent
Reduce checkout abandonment for guest users

## Outcome
Guest users can complete purchase without creating an account

## Scope
**In:** Payment flow, order confirmation
**Out:** Account creation, wishlists

## Success Criteria
- [ ] Guest checkout completes in under 60 seconds
- [ ] Order confirmation email sent without account
- [ ] No increase in payment failures
```

### User Story Format

```
As a guest shopper
I want to complete checkout without creating an account
So that I can purchase quickly without friction

Acceptance Criteria:
- Guest checkout completes in under 60 seconds
- Order confirmation email sent without account
- No increase in payment failures
```

### Gherkin Format

```gherkin
Feature: Guest Checkout
  As a guest shopper
  I want to complete checkout without creating an account
  So that I can purchase quickly without friction

  Scenario: Successful guest checkout
    Given I have items in my cart
    And I am not logged in
    When I proceed to checkout
    Then I can complete payment without account creation
    And I receive an order confirmation email
```

---

## Implementation Phases

### Phase 1: Foundation (Coach MVP)

**Goal:** Working chat interface that guides through the framework

- [ ] New project structure with tab navigation (Coach | Classic)
- [ ] Chat interface with basic conversation flow
- [ ] Ticket preview panel (read-only, structured format only)
- [ ] System prompt implementing the guided framework
- [ ] New `/api/coach` endpoint for conversation
- [ ] Basic state management for conversation + ticket

**Deliverable:** Can have a guided conversation that produces a ticket draft

### Phase 2: Polish & Formats

**Goal:** Production-ready coach experience

- [ ] Format selector (User Story, Gherkin, Markdown checkboxes)
- [ ] Editable ticket preview panel
- [ ] Copy to clipboard / export functionality
- [ ] Conversation history persistence (localStorage)
- [ ] Ticket type selection (Story, Bug, Feature, Task, Spike, Tech Debt)
- [ ] Work type context (Frontend, Backend, Full-stack, etc.)
- [ ] Responsive design for mobile

**Deliverable:** Fully functional coach mode with format flexibility

### Phase 3: Merge Classic

**Goal:** Unified application with both modes

- [ ] Port existing `App.jsx` analyzer logic to `ClassicView.jsx`
- [ ] Shared header/navigation component
- [ ] Consistent styling across tabs
- [ ] Shared "About" modal with both mode descriptions
- [ ] URL routing (`/coach`, `/classic`)

**Deliverable:** Single app with seamless tab switching

### Phase 4: Enhancements

**Goal:** Power features for teams

- [ ] Custom DoR upload (adapts coaching questions)
- [ ] Ticket type-specific guidance paths
- [ ] Export to Jira-compatible formats
- [ ] Session save/resume
- [ ] Team templates / presets
- [ ] (Parked) Self-assessment option from Writing Gym patterns

**Deliverable:** Team-ready tool with customization

---

## System Prompt (Coach Mode)

```
You are a coach helping me write a clear Jira work item.

Use the following framework as a guide, not a rigid form:

1. INTENT & VALUE (always ask first)
   - What problem are we solving, or what opportunity are we pursuing?
   - Only ask follow-ups if the answer is unclear

2. OUTCOME (what changes)
   - When this work is complete, what will be different?
   - Watch for: listing tasks instead of outcomes

3. SCOPE & BOUNDARIES
   - What is in scope? What is explicitly out of scope?
   - Only dig deeper if boundaries seem unclear

4. SUCCESS CRITERIA
   - How will we know this has been successful?
   - Aim for 3-5 clear statements, not exhaustive lists

5. CONSTRAINTS (optional)
   - Only ask if there might be dependencies, deadlines, or special requirements

GUIDELINES:
- Ask only the questions needed to improve clarity
- Prefer fewer questions when answers are clear
- Focus on outcomes, not implementation details
- If something is unclear, ask one clarifying question before moving on
- Maintain a conversational, coaching tone — not an interrogation

After each user response, update your understanding of the ticket and either:
- Ask the next relevant question, OR
- Provide a brief acknowledgment and move to the next section

When all sections are sufficiently clear, generate the complete ticket draft.
```

---

## Technical Notes

### API Design

**POST /api/coach**

Request:
```json
{
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "ticketState": { ... },
  "ticketType": "story",
  "customDoR": null | "string"
}
```

Response:
```json
{
  "message": "Assistant's next message",
  "ticketUpdates": {
    "intent": "extracted intent if mentioned",
    "outcome": null
  },
  "suggestedSection": "outcome",
  "isComplete": false
}
```

### State Management

- Use React hooks (`useState`, `useReducer`) for conversation state
- Consider `useReducer` for complex ticket state updates
- localStorage for session persistence
- No external state library needed at this scale

### Shared Components

Components that work for both Coach and Classic:
- `Header` — logo, navigation, about button
- `TicketPreview` — renders ticket in selected format
- `FormatSelector` — dropdown/tabs for output format
- `TicketTypeSelector` — story, bug, feature, etc.

---

## Development Workflow

### BlogLog Integration

We use [BlogLog](https://github.com/ianhomer/bloglog) to track development progress alongside git commits. This creates a timeline of work that captures not just code changes, but the thinking, wins, and blockers along the way.

**Initialize at project start:**
```bash
bl init --win "Starting Jironaut 2.0 development!"
```

**Daily workflow commands:**

| Command | When to use |
|---------|-------------|
| `bl commit "message"` | Instead of `git commit -m "message"` — commits AND logs to timeline |
| `bl note "message"` | Capturing thoughts, decisions, or context |
| `bl win "message"` | Celebrating progress — feature complete, bug fixed, insight gained |
| `bl blocker "message"` | Recording obstacles — useful for retros and context |

**Examples during development:**
```bash
# Starting a feature
bl note "exploring chat interface patterns from writing-gym"

# Making progress
bl commit "add ChatPanel component with message history"
bl win "basic conversation flow working end-to-end"

# Hitting issues
bl blocker "Claude API response parsing inconsistent with streaming"

# Completing a phase
bl win "Phase 1 complete - coach MVP functional"
bl commit "complete Phase 1: coach mode foundation"
```

**Important:** Always use `bl commit` instead of `git commit -m` to ensure the timeline captures the full development story.

---

## References

- [GUIDED_PROMPTING_FRAMEWORK.md](../GUIDED_PROMPTING_FRAMEWORK.md) — The coaching philosophy
- [Writing Gym](../../writing-gym/) — Inspiration for AI coaching patterns
- [Current README.md](../README.md) — Existing feature documentation

---

## Open Questions

1. **Conversation length** — How many back-and-forths before we risk user fatigue? Target: 4-6 exchanges for a complete ticket.

2. **Partial completion** — What if user wants to export before all sections are done? Allow with warning?

3. **Edit vs. regenerate** — If user edits the preview directly, should that update the conversation context?

4. **Classic mode link** — Should Coach offer "Run through Classic analyzer" as a final validation step?

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-27 | Initial plan created |
