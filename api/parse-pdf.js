// Vercel Serverless Function for PDF text extraction via Claude
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
    const { pdfBase64, filename } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    // Validate base64 size (rough check - 10MB file = ~13.3MB base64)
    if (pdfBase64.length > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'PDF file too large. Maximum size is 10MB.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64
                }
              },
              {
                type: 'text',
                text: `Extract all text content from this job description document.

Rules:
- Return ONLY the extracted text, no commentary or explanations
- Preserve paragraph structure with blank lines between sections
- Preserve bullet points and numbered lists
- Remove headers/footers if they're just page numbers or company logos
- If the document contains multiple job listings, extract all of them
- Clean up any OCR artifacts or formatting issues

Return the clean, readable text content.`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);

      // Check for specific error types
      if (response.status === 400) {
        return res.status(400).json({
          error: 'Could not read PDF. The file may be corrupted, password-protected, or contain only images without text.'
        });
      }

      return res.status(response.status).json({
        error: `Failed to process PDF: ${response.status}`
      });
    }

    const data = await response.json();

    const textContent = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    if (!textContent.trim()) {
      return res.status(400).json({
        error: 'No text content could be extracted from this PDF.'
      });
    }

    return res.status(200).json({ text: textContent.trim() });

  } catch (error) {
    console.error('Parse PDF API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Increase body size limit for PDF uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb'
    }
  }
};
