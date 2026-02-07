# CLAUDE.md - STAR Coach Development Guide

## Project Overview

STAR Coach is an AI-powered interview preparation tool that helps candidates develop compelling STAR (Situation, Task, Action, Result) answers for job interviews.

**Core concept**: Upload a job description → AI extracts key competencies → Guided conversation to flesh out relevant experiences → Polished STAR answers tailored to what the interviewer is assessing.

**Forked from**: Jironaut (ticket quality improvement tool)
**Shared pattern**: Conversational extraction → structured refinement
**Key difference**: Domain switched from "ticket anatomy" to "competency frameworks"

## What We Keep from Jironaut

- Conversational UI components and flow
- Progressive disclosure pattern
- Question/answer refinement loops
- Basic project structure (React + Node.js)
- Iteration and improvement mechanics

## What Changes

- **System prompts**: From ticket anatomy → competency extraction and STAR frameworks
- **Question templates**: From intent/outcome/constraints → situation/task/action/result
- **Input**: Job description instead of ticket description
- **Output**: Structured STAR answers instead of improved tickets
- **Domain knowledge**: Interview competency frameworks instead of agile/ticket best practices

## Development Philosophy

This is a **coaching tool**, not a content generator:
- Guide users to identify their best experiences
- Help them articulate impact clearly
- Coach the "so what?" - why their story matters to this specific role
- Improve their thinking, don't do it for them

## Typical User Journey

1. Upload job description
2. AI identifies 4-6 key competencies being assessed
3. For each competency:
   - AI asks targeted questions to surface relevant experiences
   - Progressive conversation to extract situation/task/action/result
   - Refinement: "What was the measurable impact?" "How does this relate to their requirements?"
4. Generate polished STAR answer
5. Allow iteration and improvement

## Technical Stack

Same as Jironaut:
- React frontend
- Node.js backend
- OpenAI API for conversational AI
- (Add deployment details as they're configured)

## Key Files to Update

- System prompts: Replace ticket anatomy with competency frameworks
- Question templates: Swap Jira-focused questions for STAR extraction
- UI copy: Rebrand from "ticket improvement" to "interview prep"
- package.json: Update name, description
- README.md: Reflect new purpose

## BlogLog Integration

Use BlogLog CLI for development documentation:
```bash
bloglog "Initialized STAR Coach fork from Jironaut"
bloglog "Replaced ticket prompts with competency extraction"
```

## Immediate Next Steps

1. Update branding and copy throughout
2. Replace Jironaut system prompts with STAR-focused prompts
3. Adapt question flow for job description → competency → experience extraction
4. Test with Ian's Product Change Manager interview prep
5. Deploy as separate app on curiouscoach.tools

## Success Criteria

- Extracts relevant competencies from real job descriptions
- Asks questions that surface authentic experiences
- Helps users articulate impact and relevance
- Produces STAR answers that feel personal, not templated
- Actually useful for Ian's current interview prep (dogfooding validation)
