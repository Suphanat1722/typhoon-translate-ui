// script.js (Refactored with disable/resend + timeout)
document.addEventListener('DOMContentLoaded', () => {
  const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';
  const DEFAULT_MODEL = 'scb10x/typhoon-translate-4b';
  const DEFAULT_SYSTEM_PROMPT = "You are a helpful translation assistant. Translate the user's text accurately while preserving all original Markdown formatting (like headings with #, bold with **, lists, etc.).";

  const messagesPanel = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const sendButton = chatForm.querySelector('button');
  const settingsButton = document.getElementById('settings-button');
  const themeSwitcher = document.getElementById('theme-switcher');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsButton = document.getElementById('close-settings-button');
  const saveSettingsButton = document.getElementById('save-settings-button');
  const modelNameInput = document.getElementById('model-name-input');
  const systemPromptInput = document.getElementById('system-prompt-input');

  let currentModel = DEFAULT_MODEL;
  let systemPrompt = DEFAULT_SYSTEM_PROMPT;
  let isProcessing = false;

  function initialize() {
    chatForm.addEventListener('submit', handleSubmit);
    themeSwitcher.addEventListener('click', toggleTheme);
    settingsButton.addEventListener('click', () => settingsModal.classList.add('visible'));
    closeSettingsButton.addEventListener('click', () => settingsModal.classList.remove('visible'));
    saveSettingsButton.addEventListener('click', saveSettings);

    messageInput.addEventListener('input', autoResizeInput);
    messageInput.addEventListener('keydown', handleEnterKey);

    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
    }

    loadSettings();
    toggleSendButtonState();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isProcessing) return;

    const userInput = messageInput.value.trim();
    if (!userInput) return;

    isProcessing = true;
    sendButton.disabled = true;
    messageInput.value = '';
    messageInput.style.height = 'auto';

    const botMessage = renderMessage('', 'bot', true);

    try {
      await streamOllamaResponse(userInput, botMessage);
    } catch (err) {
      botMessage.remove();
      const msg = err.message.includes('Failed to fetch')
        ? 'ไม่สามารถเชื่อมต่อ Ollama ได้ กรุณาตรวจสอบว่าโปรแกรมเปิดอยู่'
        : `เกิดข้อผิดพลาด: ${err.message}`;
      renderMessage(msg, 'bot', false, true);
    } finally {
      isProcessing = false;
      toggleSendButtonState();
    }
  }

  function handleEnterKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendButton.disabled) chatForm.dispatchEvent(new Event('submit'));
    }
  }

  function autoResizeInput() {
    messageInput.style.height = 'auto';
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    toggleSendButtonState();
  }

  function renderMessage(content, sender, loading = false, error = false) {
    const article = document.createElement('article');
    article.className = `message ${sender}-message`;

    const bubble = document.createElement('div');
    bubble.className = 'message-content';

    if (loading) {
      bubble.classList.add('loader');
      bubble.innerHTML = `<p><span></span><span class="dot1"></span><span class="dot2"></span></p>`;
    } else if (error) {
      bubble.classList.add('error-message');
      bubble.innerHTML = `<p><i class="fa-solid fa-triangle-exclamation"></i> ${content}</p>`;
    } else {
      bubble.innerHTML = marked.parse(content);
    }

    article.appendChild(bubble);
    messagesPanel.appendChild(article);
    scrollToBottom();

    if (sender === 'bot' && !loading && !error) {
      addCopyButton(article, content);
    }

    return article;
  }

  function addCopyButton(container, text) {
    const btn = document.createElement('button');
    btn.className = 'copy-button';
    btn.title = 'Copy Translation';
    btn.innerHTML = '<i class="fa-solid fa-copy"></i>';
    btn.onclick = () => {
      navigator.clipboard.writeText(text);
      showToast('คัดลอกคำแปลแล้ว!');
    };
    container.appendChild(btn);
  }

  function scrollToBottom() {
    messagesPanel.scrollTop = messagesPanel.scrollHeight;
  }

  function toggleSendButtonState() {
    sendButton.disabled = isProcessing || messageInput.value.trim() === '';
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    toast.addEventListener('animationend', () => toast.remove());
  }

  function loadSettings() {
    currentModel = localStorage.getItem('ollamaModelName') || DEFAULT_MODEL;
    systemPrompt = localStorage.getItem('ollamaSystemPrompt') || DEFAULT_SYSTEM_PROMPT;
    modelNameInput.value = currentModel;
    systemPromptInput.value = systemPrompt;
  }

  function saveSettings() {
    currentModel = modelNameInput.value.trim() || DEFAULT_MODEL;
    systemPrompt = systemPromptInput.value.trim() || DEFAULT_SYSTEM_PROMPT;
    localStorage.setItem('ollamaModelName', currentModel);
    localStorage.setItem('ollamaSystemPrompt', systemPrompt);
    settingsModal.classList.remove('visible');
    showToast('บันทึกการตั้งค่าแล้ว');
  }

  function toggleTheme() {
    const dark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  async function streamOllamaResponse(userInput, botMessageEl) {
    const contentEl = botMessageEl.querySelector('.message-content');
    contentEl.innerHTML = `
      <div class="original-text-display">${userInput}</div>
      <div class="translation-output"></div>
    `;

    const outputEl = contentEl.querySelector('.translation-output');
    const isThai = /[ก-๙]/.test(userInput);
    const direction = isThai ? '[TH->EN]' : '[EN->TH]';
    const prompt = `${direction} ${userInput}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 100000); 

    const response = await fetch(OLLAMA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: currentModel,
        prompt,
        system: systemPrompt,
        stream: true,
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Ollama API responded with status ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            full += parsed.response;
            outputEl.innerHTML = marked.parse(full + ' ▌');
            scrollToBottom();
          }
        } catch (err) {
          console.error('JSON parse error:', err);
        }
      }
    }

    const cleaned = full.replace(/\[EN->TH\]|\[TH->EN\]/g, '').trim();
    outputEl.innerHTML = marked.parse(cleaned);
    addCopyButton(botMessageEl, cleaned);
  }

  initialize();
});
