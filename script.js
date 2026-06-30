const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');

if (chatMessages && chatForm && userInput) {
  const welcomeMessage = {
    role: 'bot',
    text: 'Hello! I can help you find scholarships, government support, health camps, and emergency contacts. What would you like to know today?'
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatBotMessage(text) {
    const content = String(text || '').trim();
    if (!content) {
      return '<p class="empty-state">No response yet.</p>';
    }

    const lines = content.split(/\n/);
    const parts = [];
    let paragraphLines = [];
    let listItems = [];
    let listType = null;

    const flushParagraph = () => {
      if (paragraphLines.length) {
        parts.push(`<p>${paragraphLines.join(' ')}</p>`);
        paragraphLines = [];
      }
    };

    const flushList = () => {
      if (!listItems.length) return;

      const tag = listType === 'numbered' ? 'ol' : 'ul';
      const items = listItems.map((item) => `<li>${item}</li>`).join('');
      parts.push(`<${tag}>${items}</${tag}>`);
      listItems = [];
      listType = null;
    };

    const formatInline = (line) => {
      const escaped = escapeHtml(line);
      return escaped
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      if (/^#{1,3}\s+/.test(line)) {
        flushParagraph();
        flushList();
        const level = Math.min(line.match(/^#+/)[0].length, 3);
        const heading = line.replace(/^#{1,3}\s+/, '');
        parts.push(`<h${level}>${formatInline(heading)}</h${level}>`);
        return;
      }

      if (/^[-*•]\s+/.test(line)) {
        flushParagraph();
        listType = listType || 'bullet';
        listItems.push(formatInline(line.replace(/^[-*•]\s+/, '')));
        return;
      }

      if (/^\d+\.\s+/.test(line)) {
        flushParagraph();
        listType = listType === 'bullet' ? 'bullet' : 'numbered';
        listItems.push(formatInline(line.replace(/^\d+\.\s+/, '')));
        return;
      }

      flushList();
      paragraphLines.push(formatInline(line));
    });

    flushParagraph();
    flushList();
    return parts.join('');
  }

  function addMessage(text, role = 'bot') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    if (role === 'bot') {
      messageEl.innerHTML = `<div class="message-content">${formatBotMessage(text)}</div>`;
    } else {
      messageEl.textContent = text;
    }

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const question = userInput.value.trim();
    if (!question) return;

    addMessage(question, 'user');
    userInput.value = '';

    const typing = document.createElement('div');
    typing.className = 'message bot';
    typing.textContent = 'Thinking...';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const apiUrl = window.location.hostname === 'localhost'
        ? '/api/chat'
        : '/api/chat';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: question })
      });

      const data = await response.json();
      typing.remove();
      if (!response.ok) {
        addMessage(data.reply || 'Server returned an error. Check the terminal logs.', 'bot');
      } else {
        addMessage(data.reply || 'Sorry, I could not generate a response.', 'bot');
      }
    } catch (error) {
      typing.remove();
      addMessage(`Sorry, the AI service is currently unavailable: ${error.message}`, 'bot');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    addMessage(welcomeMessage.text, welcomeMessage.role);

    chatForm.addEventListener('submit', handleSubmit);

    document.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        userInput.value = chip.dataset.prompt;
        userInput.focus();
      });
    });
  });
}
