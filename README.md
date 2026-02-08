# STAR Coach

AI-powered interview preparation tool that helps candidates develop compelling STAR (Situation, Task, Action, Result) answers for behavioral interviews.

## What It Does

1. **Upload a job description** - Paste text or upload .txt, .docx, .pdf, or .pptx files
2. **Get tailored competencies** - AI extracts 4-8 key competencies the role requires
3. **Guided coaching** - Work through each competency with an AI coach that helps you surface specific experiences and articulate impact
4. **Polished answers** - Your STAR answer builds in real-time as you talk, ready to copy and practice

## Features

- **Smart JD analysis** - Identifies both obvious and subtle competencies from job descriptions
- **Conversational coaching** - Short, focused exchanges (4-6 turns) that get to the point
- **Real-time extraction** - STAR answer populates as you speak, no manual formatting
- **Session persistence** - Progress saved to localStorage, pick up where you left off
- **Multi-format export** - Copy individual answers or export all at once

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **AI**: Claude API (Anthropic)
- **Document parsing**: mammoth.js (Word), JSZip (PowerPoint), Claude vision (PDF)

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/curiouscoach-tools/star-coach.git
cd star-coach

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### Environment Variables

Create a `.env` file with:

```
ANTHROPIC_API_KEY=your_api_key_here
```

### Development

```bash
# Run with Vite (frontend only)
npm run dev

# Run with Vercel CLI (frontend + API)
vercel dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Deployment

Designed for Vercel deployment:

```bash
vercel --prod
```

Ensure `ANTHROPIC_API_KEY` is set in your Vercel project environment variables.

## Project Structure

```
star-coach/
├── api/                    # Vercel serverless functions
│   ├── analyze-jd.js       # Job description analysis
│   ├── coach.js            # Streaming conversation
│   ├── extract.js          # STAR answer extraction
│   └── parse-pdf.js        # PDF text extraction
├── src/
│   ├── components/
│   │   ├── coach/          # Chat and STAR panel components
│   │   ├── JobInput.jsx    # File upload and JD input
│   │   ├── CompetencyReview.jsx
│   │   ├── SessionProgress.jsx
│   │   └── ExportPanel.jsx
│   ├── hooks/
│   │   ├── useInterviewSession.js  # Session state management
│   │   ├── useCoachConversation.js # Chat logic
│   │   └── useStarBuilder.js       # STAR answer state
│   └── utils/
│       └── documentParser.js       # Client-side doc parsing
└── public/
```

## License

MIT

## Part of Curious Coach Tools

A collection of AI-powered coaching tools at [curiouscoach.tools](https://curiouscoach.tools)
