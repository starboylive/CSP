require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function generateBotReply(message = '') {
  const text = (message || '').toLowerCase();

  if (text.includes('scholar')) {
    return 'You can check the Scholarships page for eligibility, deadlines, and application links.';
  }

  if (text.includes('scheme') || text.includes('government') || text.includes('benefit') || text.includes('pension') || text.includes('housing')) {
    return 'The Schemes page lists welfare and government support options you may qualify for.';
  }

  if (text.includes('health') || text.includes('camp') || text.includes('clinic') || text.includes('vaccin')) {
    return 'The Health Camps page shows local medical camps, vaccination drives, and wellness events.';
  }

  if (text.includes('emergency') || text.includes('helpline') || text.includes('urgent') || text.includes('police') || text.includes('ambulance')) {
    return 'Use the Emergency Contacts page for urgent helplines and local support numbers.';
  }

  return 'I can help with scholarships, government schemes, health camps, and emergency contacts. Tell me what you need and I will point you to the right page.';
}

async function getAiReply(message) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';

  if (!apiKey) {
    return null;
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
      return null;
    }

    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('AI request failed:', error);
    return null;
  }
}

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }

  const aiReply = await getAiReply(message);
  const reply = aiReply || generateBotReply(message);
  return res.json({ reply });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = { app, generateBotReply };
