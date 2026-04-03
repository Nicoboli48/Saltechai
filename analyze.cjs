module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contentBlock, fileName } = req.body;
  if (!contentBlock) return res.status(400).json({ error: 'No document provided' });

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
        messages: [{
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: `You are DocuSmart. Analyze this document (${fileName || 'document'}) and provide:\n\nVendor: [name]\nDate: [date]\nTotal: [amount]\n\nLine Items:\n[each item and cost]\n\nPayment Terms: [if mentioned]\n\nFull Summary:\n[2-3 sentences]\n\nFlags:\n[any concerns or "None identified."]`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const result = data.content?.[0]?.text || 'No analysis returned.';
    return res.status(200).json({ result });

  } catch (err) {
    console.error('DocuSmart error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
};
