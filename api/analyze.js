export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contentBlock, fileName } = req.body;

  if (!contentBlock) {
    return res.status(400).json({ error: 'No document provided' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              contentBlock,
              {
                type: 'text',
                text: `You are DocuSmart, an AI document analysis assistant for small businesses. Analyze this document (${fileName || 'document'}) and provide a structured summary.

Please extract and present:

Vendor: [vendor/supplier name]
Date: [invoice or document date]
Total: [total amount due]

Line Items:
[list each line item with description and amount]

Payment Terms: [if mentioned]

Full Summary:
[2-3 sentence summary of what this document is and what action may be needed]

Flags:
[List any concerns such as: missing information, unusual amounts, duplicate charges, unclear descriptions, or anything a business owner should review. If nothing to flag, write "None identified."]

Be concise, accurate, and helpful. Format clearly so a busy small business owner can scan it quickly.`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API error');
    }

    const data = await response.json();
    const result = data.content?.[0]?.text || 'No analysis returned.';

    return res.status(200).json({ result });

  } catch (err) {
    console.error('DocuSmart API error:',
