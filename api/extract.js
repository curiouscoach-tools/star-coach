// Vercel Serverless Function for STAR answer extraction
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { messages, currentSection } = req.body;

    const systemPrompt = `Extract STAR interview answer components from a coaching conversation. You receive the FULL conversation each time. Populate as many fields as possible, as early as possible. A rough extraction now is better than a perfect one later — you get the full conversation again next turn to refine.

FIELDS:
- situation: 1-3 sentences. The specific context — when, where, what was the challenge or opportunity. Include enough detail for the interviewer to understand the stakes.
- task: 1-2 sentences. The candidate's SPECIFIC responsibility or accountability. What were THEY supposed to do? Not the team — them.
- action: 2-4 sentences. The concrete steps the candidate personally took. Use "I" not "we". Be specific about their individual contribution.
- result: 1-3 sentences. The measurable outcome and business impact. Include numbers, percentages, or concrete improvements where possible.
- competency: The skill or competency this story demonstrates (e.g., "leadership", "problem-solving", "stakeholder management").

RULES:
- Extract from hints and implications, not just explicit statements.
- Write in first person ("I") as if the candidate would say it in an interview.
- Polish the language slightly — make it interview-ready, not a transcript.
- Keep each section concise and impactful.
- null means genuinely ZERO signal anywhere in the conversation — not even a hint.

suggestedSection: next STAR element that needs MORE information.
situation → task → action → result → complete.
"complete" when all four STAR elements have content.

EXAMPLE 1 — After 2 exchanges:

User: "I want to prepare something about leadership."
Coach: "Tell me about a specific time you led a team through a challenge."
User: "At my last company, our enterprise dashboard was losing customers because it took 8+ seconds to load. I was the tech lead responsible for fixing it."

{"starUpdates":{"situation":"As tech lead at my previous company, our enterprise dashboard was experiencing severe performance issues — page loads took over 8 seconds, and we were losing customers as a result.","task":"I was responsible for diagnosing the root cause and leading the technical solution.","action":null,"result":null,"competency":"leadership"},"suggestedSection":"action","isComplete":false}

Situation and Task are clear. Action not yet discussed.

EXAMPLE 2 — After 4 exchanges with full STAR:

User: "I analyzed query logs, found an N+1 problem, built a proof-of-concept, and presented the business case to leadership. Got approval in one meeting."
Coach: "What was the measurable impact?"
User: "Query time dropped from 8 seconds to 400ms. Customer complaints about performance dropped 60% in the first month."

{"starUpdates":{"situation":"As tech lead at my previous company, our enterprise dashboard was experiencing severe performance issues — page loads took over 8 seconds, and we were losing customers as a result.","task":"I was responsible for diagnosing the root cause and leading the technical solution to recover customer trust.","action":"I analyzed query logs and identified an N+1 database problem as the root cause. I built a proof-of-concept fix and presented the business case to leadership, securing approval in a single meeting.","result":"Query response time improved from 8 seconds to 400ms — a 95% reduction. Customer complaints about performance dropped 60% within the first month.","competency":"leadership"},"suggestedSection":"complete","isComplete":true}

All STAR elements complete with concrete, interview-ready language.

Respond with ONLY a JSON object. No markdown, no backticks.
{"starUpdates":{"situation":"...or null","task":"...or null","action":"...or null","result":"...or null","competency":"...or null"},"suggestedSection":"...","isComplete":false}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 768,
        temperature: 0,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(response.status).json({
        error: `Anthropic API error: ${response.status}`
      });
    }

    const data = await response.json();

    const textContent = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    const cleanedText = textContent
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse extraction response:', cleanedText);
      parsedResponse = {
        starUpdates: null,
        suggestedSection: currentSection,
        isComplete: false
      };
    }

    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('Extract API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
