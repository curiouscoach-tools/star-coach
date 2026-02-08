# CLAUDE.md - STAR Coach Development Guide

## Project Overview

STAR Coach is an AI-powered interview preparation tool that helps candidates develop compelling STAR (Situation, Task, Action, Result) answers for behavioral interviews.

**Live site**: https://star-coach.curiouscoach.tools

**Core flow**: Upload job description → AI extracts key competencies → Guided coaching per competency → Polished STAR answers

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **AI**: Claude API (Anthropic) - claude-3-5-haiku for speed
- **Document parsing**: mammoth.js (Word), JSZip (PowerPoint), Claude vision (PDF)
- **State**: React hooks + localStorage persistence

## Project Structure

```
star-coach/
├── api/                          # Vercel serverless functions
│   ├── analyze-jd.js             # Extract competencies from JD
│   ├── coach.js                  # Streaming conversation (SSE)
│   ├── extract.js                # Extract STAR components from chat
│   └── parse-pdf.js              # PDF text extraction via Claude
├── src/
│   ├── components/
│   │   ├── coach/
│   │   │   ├── ChatPanel.jsx     # Conversation UI
│   │   │   ├── CoachView.jsx     # Main coaching view
│   │   │   ├── MessageBubble.jsx # Chat message component
│   │   │   └── StarPanel.jsx     # STAR answer display
│   │   ├── JobInput.jsx          # File upload + paste input
│   │   ├── CompetencyReview.jsx  # Select competencies to prep
│   │   ├── SessionProgress.jsx   # Progress bar + navigation
│   │   └── ExportPanel.jsx       # View/copy all answers
│   ├── hooks/
│   │   ├── useInterviewSession.js  # Session state + localStorage
│   │   ├── useCoachConversation.js # Chat logic + streaming
│   │   └── useStarBuilder.js       # STAR answer state
│   ├── utils/
│   │   └── documentParser.js     # Client-side doc parsing
│   └── App.jsx                   # Session flow orchestration
├── STAR_COACH.md                 # Standalone prompt for AI projects
└── public/
    └── images/
```

## Key Concepts

### Session Phases

The app moves through phases stored in `useInterviewSession`:

1. `input` - User uploads/pastes job description
2. `review` - User selects which competencies to prepare
3. `coaching` - Working through STAR for each competency
4. `complete` - All answers ready, export view

### Dual-Model Architecture

Two API calls happen during coaching:

1. **coach.js** (streaming) - Conversational responses, one question at a time
2. **extract.js** (background) - Extracts STAR components from conversation, updates panel

This separation keeps the coach focused on asking good questions while extraction happens independently.

### Document Parsing Strategy

| Format | Method | Reason |
|--------|--------|--------|
| .txt | FileReader | Native, trivial |
| .docx | mammoth.js | Fast, reliable, no API cost |
| .pptx | JSZip + XML | Lightweight, PPTX is just zipped XML |
| .pdf | Claude API | Best quality for complex layouts |

## Development Philosophy

This is a **coaching tool**, not a content generator:
- Guide users to identify their best experiences
- Help them articulate impact clearly
- Coach the "so what?" - why their story matters to this specific role
- Keep conversations short (4-6 exchanges per competency)
- Never write the answer for them mid-conversation

## Common Tasks

### Running locally

```bash
# Frontend only
npm run dev

# Frontend + API (required for full functionality)
vercel dev
```

### Deploying

```bash
vercel --prod
```

### Testing file uploads

Example JDs are in `public/Example JDs/` (gitignored). Test with various formats.

## BlogLog Integration

Use BlogLog CLI for development tracking:

```bash
bl win "Description of what you shipped"
bl commit "Commit message"
```

## Standalone Prompt

`STAR_COACH.md` contains a standalone version of the coaching logic that can be used as project instructions in Claude or other AI tools. Users can add their CV for personalized coaching.
