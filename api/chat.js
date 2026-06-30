require('dotenv').config();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';

  if (!apiKey) {
    return res.status(500).json({ reply: 'AI service is not configured yet.' });
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for a community help chatbot. Provide concise and supportive answers about scholarships, government schemes, health camps, and emergency help.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('NVIDIA API error:', data);
      return res.status(502).json({ reply: 'The AI service is currently unavailable.' });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || null;
    return res.status(200).json({ reply: reply || 'Sorry, I could not generate a response.' });
  } catch (error) {
    console.error('AI request failed:', error);
    return res.status(500).json({ reply: 'The AI service is currently unavailable.' });
  }
};
