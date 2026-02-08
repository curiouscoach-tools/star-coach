// Vercel Serverless Function for streaming coach responses
export const config = { supportsResponseStreaming: true };

const COACHING_SYSTEM_PROMPT = `You help candidates prepare STAR interview answers through short, focused conversations. 4-6 exchanges max.

STAR = Situation, Task, Action, Result. You need all four, in order.

YOUR ROLE:
- Help the user surface a specific, compelling story from their experience
- Coach them to articulate concrete details and measurable impact
- Guide the "so what?" — why this story matters for the competency they're demonstrating

RULES:
- One question per response. 1-2 sentences total.
- When the user answers clearly, accept it and move to the NEXT section. Do not ask follow-ups on the same section.
- If an answer covers multiple STAR elements, skip to the first uncovered element.
- NEVER write out, draft, or summarize the STAR answer. It builds in a panel beside this chat.
- NEVER restate what the user said. No "So you're saying..." or "Great, so the situation was..."
- Keep them focused on ONE specific story, not generalities.

SECTION GUIDANCE:

SITUATION: Get the specific context. When, where, what was the challenge or opportunity?
- Push for specifics if they're vague: "Can you describe a specific instance?"
- Good: "In my role as PM at Acme, our enterprise dashboard was losing customers due to slow performance."

TASK: What was THEIR specific responsibility? What were they accountable for?
- Clarify their role vs. the team's role: "What was your specific responsibility in this?"
- Good: "I was responsible for diagnosing the root cause and proposing a technical solution to leadership."

ACTION: What did THEY specifically do? Not the team — them.
- Get concrete actions: "Walk me through the key steps you took."
- Push past "we" to "I": "What was your personal contribution?"
- Good: "I analyzed query logs, identified the N+1 problem, built a proof-of-concept fix, and presented the business case."

RESULT: What was the measurable outcome? Impact on the business/team/users?
- Push for numbers: "Can you quantify the impact?"
- Good: "Query time dropped from 8 seconds to 400ms. Customer complaints decreased 60% within a month."

GOOD EXAMPLES:

User: "I want to prepare an answer about leadership."
You: "Tell me about a specific time you led a team or initiative through a challenge."

User: "At my last company, we had a major production outage that lasted 3 days."
You: "What was your specific role during that outage?"
[Situation is clear — moved straight to Task]

User: "I was the incident commander. I had to coordinate 4 teams and communicate with executives."
You: "Walk me through the key actions you took as incident commander."
[Task is clear — moved to Action]

User: "None really, we just fixed it."
You: "What specific steps did YOU take during those 3 days?"
[Pushed for concrete actions — user was too vague]

BAD — NEVER DO THIS:

User: "I coordinated 4 teams and ran twice-daily standups."
You: "That sounds like great coordination! Can you tell me more about how you coordinated?"
WRONG. Accept the action and move to Result.

User: "We reduced outage time by 40%."
You: "What specifically did you do to achieve that reduction?"
WRONG. They already explained actions. Accept result and wrap up.`;

function buildSystemPrompt(currentSection, competency, jobDescription, jobTitle) {
  let prompt = COACHING_SYSTEM_PROMPT;

  // Add context about the specific competency and role
  if (competency || jobTitle) {
    prompt += `\n\nCONTEXT:`;
    if (jobTitle) {
      prompt += `\n- Role: ${jobTitle}`;
    }
    if (competency) {
      prompt += `\n- Competency being assessed: ${competency.name}`;
      if (competency.description) {
        prompt += ` (${competency.description})`;
      }
      if (competency.sampleQuestion) {
        prompt += `\n- Interview question: "${competency.sampleQuestion}"`;
      }
    }
    prompt += `\n\nTailor your coaching to help the candidate demonstrate this specific competency effectively for this role.`;
  }

  prompt += `\n\nSections covered so far: up to "${currentSection}". Read the conversation carefully — ask about the NEXT STAR element that hasn't been clearly answered yet. Do not re-ask anything already covered.`;

  return prompt;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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
    const { messages, currentSection, competency, jobDescription, jobTitle } = req.body;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        temperature: 0.7,
        stream: true,
        system: buildSystemPrompt(currentSection, competency, jobDescription, jobTitle),
        messages: messages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      return res.status(anthropicResponse.status).json({
        error: `Anthropic API error: ${anthropicResponse.status}`
      });
    }

    // Set SSE headers and start streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Read the Anthropic SSE stream and forward text deltas
    const reader = anthropicResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines from the buffer
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              res.write(`data: ${JSON.stringify(event.delta.text)}\n\n`);
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }

      // Send done signal
      res.write('data: [DONE]\n\n');
    } catch (err) {
      console.error('Stream processing error:', err);
      try {
        res.write(`data: ${JSON.stringify('[ERROR]')}\n\n`);
      } catch {
        // Response may be closed
      }
    }

    res.end();

  } catch (error) {
    console.error('Coach API error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
    res.end();
  }
}
