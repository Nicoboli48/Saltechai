module.exports = async function handler(req, res) {
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
                text: `You are DocuSmart, an AI document analysis assistant for small businesses. Analyze this document (${fileName || 'document'}) and provide a structured summary.\n\nPlease extract and present:\n\nVendor: [vendor/supplier name]\nDate: [invoice or document date]\nTotal: [total amount due]\n\nLine Items:\n[list each line item with description and amount]\n\nPayment Terms: [if mentioned]\n\nFull Summary:\n[2-3 sentence summary of what this document is and what action may be needed]\n\nFlags:\n[List any concerns such as: missing information, unusual amounts, duplicate charges, unclear descriptions, or anything a business owner should review. If nothing to flag, write "None identified."]\n\nBe concise, accurate, and helpful.`
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
    console.error('DocuSmart API error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
}
