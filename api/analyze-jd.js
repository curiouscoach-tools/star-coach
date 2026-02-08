// Vercel Serverless Function for job description analysis
export default async function handler(req, res) {
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
    const { jobDescription } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 50) {
      return res.status(400).json({ error: 'Please provide a job description (at least 50 characters)' });
    }

    const systemPrompt = `You analyze job descriptions to identify key competencies that will likely be assessed in behavioral interviews.

Your task:
1. Identify the job title from the description
2. Extract 4-8 key competencies the role requires
3. For each competency, generate a sample STAR interview question

COMPETENCY GUIDELINES:
- Focus on behavioral competencies (leadership, problem-solving, communication) not technical skills
- Prioritize competencies that are explicitly mentioned or strongly implied
- Include both obvious and subtle competencies (e.g., "fast-paced environment" suggests "working under pressure")
- Order by likely importance to the interviewer

QUESTION GUIDELINES:
- Questions should be specific to the role/industry when possible
- Use standard behavioral interview format: "Tell me about a time when..."
- Make questions answerable with a single, specific story

OUTPUT FORMAT:
Respond with ONLY a JSON object. No markdown, no backticks.

{
  "jobTitle": "extracted or inferred job title",
  "competencies": [
    {
      "id": "unique-kebab-case-id",
      "name": "Competency Name",
      "description": "Brief explanation of why this matters for the role",
      "sampleQuestion": "Tell me about a time when..."
    }
  ]
}

EXAMPLE:

Job description mentions: "Lead cross-functional teams... work with senior stakeholders... ambiguous requirements... tight deadlines"

{
  "jobTitle": "Product Manager",
  "competencies": [
    {
      "id": "leadership",
      "name": "Leadership",
      "description": "Leading cross-functional teams to deliver product outcomes",
      "sampleQuestion": "Tell me about a time you led a team through a challenging product launch."
    },
    {
      "id": "stakeholder-management",
      "name": "Stakeholder Management",
      "description": "Working effectively with senior executives and diverse stakeholders",
      "sampleQuestion": "Tell me about a time you had to manage conflicting priorities from different stakeholders."
    },
    {
      "id": "ambiguity",
      "name": "Navigating Ambiguity",
      "description": "Making progress when requirements are unclear or changing",
      "sampleQuestion": "Tell me about a time you had to make a decision with incomplete information."
    },
    {
      "id": "delivering-results",
      "name": "Delivering Under Pressure",
      "description": "Meeting tight deadlines while maintaining quality",
      "sampleQuestion": "Tell me about a time you had to deliver something on a very tight deadline."
    }
  ]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2048,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Analyze this job description and extract key competencies:\n\n${jobDescription}`
          }
        ]
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
      console.error('Failed to parse analysis response:', cleanedText);
      return res.status(500).json({
        error: 'Failed to parse competency analysis'
      });
    }

    // Validate the response structure
    if (!parsedResponse.jobTitle || !Array.isArray(parsedResponse.competencies)) {
      return res.status(500).json({
        error: 'Invalid analysis response structure'
      });
    }

    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('Analyze JD API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
