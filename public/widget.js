(function () {
  // 1. Config Resolution (Global or Script Params)
  let config = window.ChatbotConfig;
  if (!config) {
    const script = document.currentScript || document.querySelector('script[src*="widget.js"]');
    if (script) {
      try {
        const src = script.src;
        // Parse query params manually or via URL
        const questionMark = src.indexOf('?');
        if (questionMark !== -1) {
          const params = new URLSearchParams(src.slice(questionMark));
          const id = params.get('id');
          const key = params.get('key');
          if (id) {
            config = { connectionId: id, password: key, apiUrl: null };
          }
        }
      } catch (e) { console.error("Config parse error", e); }
    }
  }
  window.ChatbotConfig = config; // Expose for debugging

  if (!config || !config.connectionId) {
    console.error("❌ ChatbotConfig missing");
    return;
  }

  // Determine Base URL (Config > Script Origin > Current Origin)
  let baseUrl = config.apiUrl || config.backendUrl;
  if (!baseUrl) {
    const script = document.currentScript || document.querySelector('script[src*="widget.js"]');
    if (script && script.src) {
      if (script.src.startsWith('http')) {
        baseUrl = new URL(script.src).origin;
      } else if (script.src.startsWith('//')) {
        baseUrl = window.location.protocol + script.src;
        baseUrl = new URL(baseUrl).origin;
      }
    }

    // Final fallback to the current document origin if still empty (common for relative scripts)
    if (!baseUrl) {
      baseUrl = window.location.origin;
    }
  }
  baseUrl = baseUrl.replace(/\/$/, "");

  // --- HANDSHAKE ---
  (async function handshake() {
    if (config.password) {
      try {
        // Adjust path if needed. Assuming /api/v1/widget/hello
        fetch(`${baseUrl}/api/v1/widget/hello`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionId: config.connectionId,
            password: config.password,
            origin: window.location.origin,
            pageTitle: document.title
          })
        }).then(r => r.json()).then(d => {
          if (d.ok) console.log("🤝 Handshake Verified");
          else console.warn("Handshake Failed:", d.error);
        }).catch(e => console.error("Handshake Network Error", e));
      } catch (e) { }
    }
  })();

  // Session Persistence (DISABLED per user request to start fresh on load)
  const sessionKey = `chat_session_${config.connectionId}`;
  // Always generate a new session ID when the script loads
  let sessionId = "widget-" + Math.random().toString(36).slice(2);
  sessionStorage.setItem(sessionKey, sessionId);

  // Create container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.right = "20px";
  container.style.zIndex = "2147483647"; // Max Safe Integer for CSS
  document.body.appendChild(container);

  // Expose Feedback Function to Shadow DOM
  container.submitFeedback = async (index, rating, btn) => {
    // Visual Feedback
    const parent = btn.parentElement;
    Array.from(parent.children).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Call API
    try {
      await fetch(`${baseUrl}/api/v1/chat/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messageIndex: index,
          rating
        })
      });
      console.log("Feedback sent:", rating);
    } catch (e) { console.error("Feedback failed", e); }
  };

  // Anti-Removal Protection (Host frameworks like React might wipe the body)
  const observer = new MutationObserver((mutations) => {
    if (!document.body.contains(container)) {
      // console.warn("Widget removed by host. Re-attaching...");
      document.body.appendChild(container);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Shadow DOM
  const shadow = container.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host {
        /* Premium Design Tokens */
        --if-primary: #6d5dfc;
        --if-primary-glow: rgba(109, 93, 252, 0.4);
        --if-bg-glass: rgba(255, 255, 255, 0.75);
        --if-bg-glass-dark: rgba(17, 24, 39, 0.8);
        --if-text: #1f2937;
        --if-text-mute: #6b7280;
        --if-border: rgba(255, 255, 255, 0.4);
        --if-border-dark: rgba(255, 255, 255, 0.1);
        --if-shadow: 0 20px 50px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.05);
        --if-radius: 24px;
        --if-font: 'Inter', system-ui, -apple-system, sans-serif;
        
        --transition-fluid: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        --transition-spring: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      @media (prefers-color-scheme: dark) {
        :host {
          --if-bg-glass: var(--if-bg-glass-dark);
          --if-text: #f9fafb;
          --if-text-mute: #9ca3af;
          --if-border: var(--if-border-dark);
        }
      }

      * { box-sizing: border-box; }

      /* --- Launch Button --- */
      #btn {
        width: 68px;
        height: 68px;
        border-radius: 22px;
        background: var(--if-primary);
        color: #fff;
        font-size: 28px;
        border: none;
        cursor: pointer;
        box-shadow: 0 12px 32px var(--if-primary-glow);
        transition: var(--transition-spring);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: 0;
        z-index: 2;
      }
      #btn:hover {
        transform: translateY(-6px) rotate(4deg) scale(1.05);
        box-shadow: 0 16px 40px var(--if-primary-glow);
      }
      #btn:active { transform: scale(0.95); }
      #btn-logo { width: 100%; height: 100%; object-fit: cover; }

      /* --- Welcome Bubble --- */
      #welcome-bubble {
        position: absolute;
        right: 0;
        bottom: 85px;
        background: var(--if-bg-glass);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: var(--if-text);
        padding: 14px 22px;
        border-radius: 20px;
        box-shadow: var(--if-shadow);
        max-width: 280px;
        font-family: var(--if-font);
        font-size: 14px;
        font-weight: 500;
        border: 1px solid var(--if-border);
        opacity: 0;
        transform: translateY(15px);
        transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        pointer-events: none;
        cursor: pointer;
        z-index: 1;
      }
      #welcome-bubble.is-visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      #welcome-bubble:hover { transform: translateY(-3px); }

      /* --- Chat Panel --- */
      #panel {
        position: fixed;
        bottom: 100px;
        right: 20px;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 140px);
        background: var(--if-bg-glass);
        backdrop-filter: blur(25px) saturate(160%);
        -webkit-backdrop-filter: blur(25px) saturate(160%);
        border-radius: var(--if-radius);
        display: flex;
        flex-direction: column;
        box-shadow: var(--if-shadow);
        font-family: var(--if-font);
        overflow: hidden;
        border: 1px solid var(--if-border);
        opacity: 0;
        transform: translateY(30px) scale(0.96);
        visibility: hidden;
        transition: var(--transition-fluid);
        z-index: 10;
      }
      #panel.is-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        visibility: visible;
      }

      /* --- Header --- */
      #header {
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 14px;
        background: rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }
      
      /* Unified Single Logo/Avatar */
      #header-identity {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        background: var(--if-primary);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.3rem;
        box-shadow: 0 6px 16px var(--if-primary-glow);
        flex-shrink: 0;
        overflow: hidden;
      }
      #header-identity img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      #header-info { flex: 1; }
      #header-name {
        font-weight: 750;
        font-size: 17px;
        letter-spacing: -0.4px;
        color: var(--if-text);
        margin-bottom: 2px;
      }
      #header-status {
        font-size: 12px;
        color: var(--if-text-mute);
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
      }
      #status-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 10px #10b981;
        animation: pulse 2.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(0.85); }
      }
      #close-btn {
        background: rgba(0, 0, 0, 0.06);
        border: none;
        color: var(--if-text-mute);
        width: 36px;
        height: 36px;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: var(--transition-fluid);
      }
      #close-btn:hover {
        background: rgba(0, 0, 0, 0.1);
        color: var(--if-text);
        transform: rotate(90deg);
      }

      /* --- Messages --- */
      #messages {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
        scrollbar-width: thin;
        scrollbar-color: rgba(0,0,0,0.1) transparent;
      }
      #messages::-webkit-scrollbar { width: 5px; }
      #messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }

      .msg {
        max-width: 88%;
        animation: msgEnter 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        opacity: 0;
        transform: translateY(15px);
      }
      @keyframes msgEnter {
        to { opacity: 1; transform: translateY(0); }
      }
      .msg.user { margin-left: auto; }
      
      .msg-bubble {
        padding: 14px 18px;
        border-radius: 20px;
        line-height: 1.6;
        font-size: 14.5px;
        font-weight: 500;
        word-wrap: break-word;
        position: relative;
      }
      .msg.user .msg-bubble {
        background: var(--if-primary);
        color: white;
        border-bottom-right-radius: 4px;
        box-shadow: 0 10px 20px var(--if-primary-glow);
      }
      .msg.bot .msg-bubble {
        background: rgba(255, 255, 255, 0.85);
        color: var(--if-text);
        border-bottom-left-radius: 4px;
        border: 1px solid var(--if-border);
        box-shadow: 0 4px 15px rgba(0,0,0,0.03);
      }

      /* --- Input Area --- */
      #input-area {
        padding: 20px 24px;
        background: rgba(255, 255, 255, 0.2);
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        gap: 12px;
        align-items: center;
      }
      #text {
        flex: 1;
        background: rgba(255, 255, 255, 0.6);
        border: 1px solid var(--if-border);
        padding: 14px 20px;
        border-radius: 18px;
        outline: none;
        font-size: 14px;
        font-family: var(--if-font);
        color: var(--if-text);
        transition: var(--transition-fluid);
      }
      #text:focus {
        background: white;
        border-color: var(--if-primary);
        box-shadow: 0 0 0 4px var(--if-primary-glow);
      }
      .send {
        width: 48px;
        height: 48px;
        background: var(--if-primary);
        color: white;
        border: none;
        border-radius: 15px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--transition-spring);
        box-shadow: 0 8px 16px var(--if-primary-glow);
      }
      .send svg { width: 22px; height: 22px; }
      .send:hover { transform: scale(1.08) rotate(-5deg); }
      .send:active { transform: scale(0.92); }

      /* --- Typing Indicator --- */
      .typing {
        display: flex;
        gap: 4px;
        padding: 12px 18px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 18px;
        width: fit-content;
        border: 1px solid var(--if-border);
      }
      .typing span {
        width: 7px;
        height: 7px;
        background: var(--if-primary);
        border-radius: 50%;
        animation: typingBounce 1.4s infinite ease-in-out;
      }
      .typing span:nth-child(2) { animation-delay: 0.2s; }
      .typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typingBounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40% { transform: translateY(-6px); opacity: 1; }
      }

      /* Markdown & Content */
      .msg-bubble p { margin: 0 0 10px 0; }
      .msg-bubble p:last-child { margin: 0; }
      .msg-bubble b { font-weight: 750; }
      .msg-bubble a { color: var(--if-primary); text-decoration: none; font-weight: 600; }
      .msg-bubble a:hover { text-decoration: underline; }

      .msg-bubble pre {
        background: #0f172a;
        color: #e2e8f0;
        padding: 16px;
        border-radius: 12px;
        overflow-x: auto;
        margin: 12px 0;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 13px;
        line-height: 1.5;
      }
      
      .code-copy {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255,255,255,0.1);
        border: none;
        color: #94a3b8;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .code-copy:hover { background: rgba(255,255,255,0.2); color: white; }

      /* Suggestion Buttons */
      #suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 0 24px 16px 24px;
      }
      .suggestion-btn {
        background: rgba(109, 93, 252, 0.08);
        border: 1px solid rgba(109, 93, 252, 0.2);
        color: var(--if-primary);
        padding: 8px 16px;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition-fluid);
      }
      .suggestion-btn:hover {
        background: var(--if-primary);
        color: white;
        transform: translateY(-2px);
      }
    </style>

    <div id="welcome-bubble">
      <span id="bubble-text">Hi! How can I help you today?</span>
    </div>
    
    <button id="btn" aria-label="Open Chat">
      <div id="btn-content">
        <span id="btn-icon">💬</span>
      </div>
    </button>

    <div id="panel">
      <div id="header">
        <div id="header-identity">A</div>
        <div id="header-info">
          <div id="header-name">AI Assistant</div>
          <div id="header-status"><span id="status-dot"></span> Online</div>
        </div>
        <button id="close-btn" aria-label="Close Chat">✕</button>
      </div>
      <div id="messages" role="log" aria-live="polite"></div>
      <div id="suggestions"></div>
      <div id="input-area">
        <input id="text" placeholder="Type a message..." autocomplete="off" />
        <button class="send" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  `;

  const btn = shadow.querySelector("#btn");
  const panel = shadow.querySelector("#panel");
  const closeBtn = shadow.querySelector("#close-btn");
  const messages = shadow.querySelector("#messages");
  const suggestionsContainer = shadow.querySelector("#suggestions");
  const input = shadow.querySelector("#text");
  const sendBtn = shadow.querySelector(".send");
  const headerIdentity = shadow.querySelector("#header-identity");
  const headerName = shadow.querySelector("#header-name");
  // --- IDENTITY LOGIC ---
  function updateIdentity(name, logoUrl) {
    if (name) {
      headerName.textContent = name;
      const initial = name[0].toUpperCase();
      headerIdentity.textContent = initial;
    }
    if (logoUrl) {
      headerIdentity.innerHTML = `<img src="${logoUrl}" alt="Logo" onerror="this.parentElement.textContent='${headerName.textContent[0] || 'A'}'" />`;
    }
  }

  // Auto-extract knowledge base from host website
  async function autoExtractKnowledgeBase() {
    const storageKey = `chatbot_kb_extracted_${config.connectionId}`;
    if (localStorage.getItem(storageKey)) return;

    try {
      const hostUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/v1/connections/${config.connectionId}/auto-extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: hostUrl })
      });

      const data = await response.json();
      if (data.status === "initialized" && data.bot_identity) {
        const iden = data.bot_identity;
        localStorage.setItem(storageKey, "true");
        if (iden.welcomeMessage) bubbleText.textContent = iden.welcomeMessage;
        updateIdentity(iden.name, iden.logoUrl);
      }
    } catch (error) { }
  }

  setTimeout(() => autoExtractKnowledgeBase(), 1000);

  // --- MARKDOWN & UI HELPERS ---
  function parseMarkdown(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code Blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const id = 'code-' + Math.random().toString(36).substr(2, 9);
      return `<div style="position:relative">
        <button class="code-copy" onclick="this.getRootNode().host.copyCode('${id}')">Copy</button>
        <pre><code id="${id}" class="language-${lang}">${code.trim()}</code></pre>
      </div>`;
    });

    // Bold/Italic/Inline Code
    html = html.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    html = html.replace(/\*([^*]+)\*/g, '<i>$1</i>');
    html = html.replace(/`([^`]+)`/g, '<code class="inline">$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    return html.replace(/\n/g, '<br>');
  }

  container.copyCode = (id) => {
    const el = shadow.querySelector(`#${id}`);
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      const btnEl = el.closest('div').querySelector('.code-copy');
      const old = btnEl.innerText;
      btnEl.innerText = 'Copied!';
      setTimeout(() => btnEl.innerText = old, 2000);
    }
  };

  function scrollToBottom() {
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }

  function showSuggestions(list) {
    suggestionsContainer.innerHTML = "";
    if (!list || list.length === 0) return;
    list.forEach(s => {
      const b = document.createElement("button");
      b.className = "suggestion-btn";
      b.textContent = s;
      b.onclick = () => sendMessage(s);
      suggestionsContainer.appendChild(b);
    });
  }

  async function sendMessage(textOverride) {
    const text = textOverride || input.value.trim();
    if (!text) return;

    // 1. User Message
    const userDiv = document.createElement("div");
    userDiv.className = "msg user";
    userDiv.innerHTML = `<div class="msg-bubble">${parseMarkdown(text)}</div>`;
    messages.appendChild(userDiv);
    input.value = "";
    showSuggestions([]);
    scrollToBottom();

    // 2. Setup Bot Message Placeholder
    const botDiv = document.createElement("div");
    botDiv.className = "msg bot";
    botDiv.innerHTML = `<div class="msg-bubble typing"><span></span><span></span><span></span></div>`;
    messages.appendChild(botDiv);
    scrollToBottom();

    const bubbleContent = botDiv.querySelector(".msg-bubble");
    let fullText = "";

    try {
      const response = await fetch(`${baseUrl}/api/v1/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          connectionId: config.connectionId,
          sessionId,
          url: window.location.href
        })
      });

      if (!response.ok) throw new Error();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "");
            if (dataStr === "[DONE]") break;

            try {
              const data = JSON.parse(dataStr);
              if (data.token) {
                fullText += data.token;
                const parts = fullText.split("|||");
                bubbleContent.innerHTML = parseMarkdown(parts[0]);
                if (parts[1]) showSuggestions(parts[1].split("|").filter(s => s.trim()));
                scrollToBottom();
              }
            } catch (e) { }
          }
        }
      }
    } catch (e) {
      bubbleContent.innerHTML = "⚠️ Connection lost. Please try again.";
    }
  }

  sendBtn.onclick = () => sendMessage();
  input.onkeydown = e => e.key === "Enter" && sendMessage();

  // Load welcome data
  fetch(`${baseUrl}/api/v1/chat/welcome/${config.connectionId}`)
    .then(r => r.json())
    .then(data => {
      updateIdentity(data.assistantName, data.logoUrl);
      if (data.welcomeMessage) bubbleText.textContent = data.welcomeMessage;
    }).catch(() => { });

  window.ChatbotDebug = () => {
    console.log("🤖 Config:", config);
    console.log("🤖 Backend:", baseUrl);
  };
})();
