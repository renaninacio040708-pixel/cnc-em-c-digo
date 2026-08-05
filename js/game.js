// Motor do jogo: trilha estilo Duolingo, desafios de digitar/alterar código, XP, estrelas.

const STORAGE_KEY = "aprendaC_v2";

function defaultState() { return { unlocked: 1, xp: 0, stars: {} }; }

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      // Mescla com o padrão pra cobrir save antigo/incompleto (ex: {} ou faltando "stars").
      return Object.assign(defaultState(), parsed, { stars: Object.assign({}, parsed.stars) });
    } catch (e) { /* JSON corrompido, recomeça */ }
  }
  return defaultState();
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = loadState();
let session = null; // sessão de jogo em andamento (não persistida)

const el = (sel) => document.querySelector(sel);
const app = () => el("#app");

function rankFromXp(xp) {
  if (xp >= 300) return "Mestre C";
  if (xp >= 180) return "Programador";
  if (xp >= 90) return "Aprendiz avançado";
  if (xp >= 30) return "Aprendiz";
  return "Estagiário";
}

function normalizeCode(str) {
  return str.replace(/\s+/g, " ").trim();
}
function normalizeAnswer(str) {
  return str.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
}
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Cresce o textarea de código conforme o conteúdo (cola de textos longos, respostas grandes).
function autoGrow(ta) {
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + "px";
}

// ---------- TELA: TRILHA (mapa em estilo Duolingo) ----------

function renderMap() {
  session = null;
  const totalStars = Object.values(state.stars).reduce((a, b) => a + b, 0);
  const maxStars = SESSIONS.length * 3;

  const playableNodes = SESSIONS.map((s, i) => {
    const locked = s.id > state.unlocked;
    const stars = state.stars[s.id] || 0;
    const side = i % 3 === 0 ? "center" : (i % 3 === 1 ? "left" : "right");
    const current = s.id === state.unlocked;
    // Caso especial: a última sessão jogável não "desbloqueia a próxima" (não existe),
    // então ela continuaria marcada como current pra sempre. Troca o selo por "concluído".
    const isLastFinished = current && stars > 0;
    let badge = "";
    if (isLastFinished) badge = '<span class="current-badge done">🏆 CONCLUÍDO</span>';
    else if (current) badge = '<span class="current-badge">JOGAR</span>';
    return `
      <div class="trail-node-wrap ${side}">
        <button class="trail-node ${locked ? 'locked' : ''} ${current ? 'current' : ''}" data-session="${s.id}" ${locked ? 'disabled' : ''}>
          <span class="trail-node-icon">${locked ? '🔒' : s.icon}</span>
          ${badge}
        </button>
        <div class="trail-node-label">
          <div class="trail-node-title">${s.title}</div>
          ${!locked ? `<div class="trail-stars">${[1,2,3].map(n => `<span class="${n <= stars ? 'star-on' : 'star-off'}">★</span>`).join("")}</div>` : ''}
        </div>
      </div>`;
  }).join("");

  const roadmapNodes = ROADMAP.map((r, i) => {
    const side = (SESSIONS.length + i) % 3 === 0 ? "center" : ((SESSIONS.length + i) % 3 === 1 ? "left" : "right");
    return `
      <div class="trail-node-wrap ${side}">
        <button class="trail-node roadmap" disabled>
          <span class="trail-node-icon">${r.icon}</span>
        </button>
        <div class="trail-node-label">
          <div class="trail-node-title dim">${r.title}</div>
          <div class="trail-stars dim">🚧 em breve</div>
        </div>
      </div>`;
  }).join("");

  app().innerHTML = `
    <header class="topbar">
      <div class="brand">🔧 Aprenda C</div>
      <div class="hud">
        <span class="hud-item">⭐ ${totalStars}/${maxStars}</span>
        <span class="hud-item">✨ ${state.xp} XP</span>
      </div>
    </header>
    <div class="rank-banner">Patente atual: <b>${rankFromXp(state.xp)}</b></div>
    <main class="trail">
      <div class="trail-line"></div>
      ${playableNodes}
      <div class="roadmap-divider">🚧 Próximos capítulos do curso</div>
      ${roadmapNodes}
    </main>
    <footer class="foot-note">Baseado no curso "C Programming Full Course" · progresso salvo neste dispositivo.</footer>
  `;

  document.querySelectorAll(".trail-node:not(.locked):not(.roadmap)").forEach((btn) => {
    btn.addEventListener("click", () => startSession(Number(btn.dataset.session)));
  });
}

// ---------- TELA: INTRODUÇÃO DA SESSÃO ----------

function startSession(sessionId) {
  const s = SESSIONS.find((x) => x.id === sessionId);
  session = { s, index: 0, challengeStars: [] };
  renderIntro();
}

function renderIntro() {
  const { s } = session;
  app().innerHTML = `
    <header class="topbar">
      <button class="btn-back" id="back-map">←</button>
      <div class="brand">${s.icon} ${s.title}</div>
      <div></div>
    </header>
    <main class="lesson">
      <div class="chapter-ref">${s.chapterRef}</div>
      <h1>${s.title}</h1>
      <div class="explanation">${s.intro}</div>
      <button class="btn-primary" id="start-challenges">Começar a digitar →</button>
    </main>
  `;
  el("#back-map").addEventListener("click", renderMap);
  el("#start-challenges").addEventListener("click", renderChallenge);
}

// ---------- TELA: DESAFIO ----------

function renderChallenge() {
  const { s, index } = session;
  const ch = s.phases[index];
  session.hintUsed = false;
  session.attempts = 0;

  const dots = s.phases.map((_, i) =>
    `<span class="dot ${i < index ? 'done' : ''} ${i === index ? 'active' : ''}"></span>`
  ).join("");

  let body = "";
  if (ch.type === "code") {
    body = `
      <p class="instruction">${escapeHtml(ch.instruction)}</p>
      <div class="code-box">
        ${ch.context_before ? `<pre class="code-fixed">${escapeHtml(ch.context_before)}</pre>` : ""}
        <textarea id="code-input" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off" rows="${Math.max(1, (ch.seed || ch.target).split("\n").length)}">${escapeHtml(ch.seed)}</textarea>
        ${ch.context_after ? `<pre class="code-fixed">${escapeHtml(ch.context_after)}</pre>` : ""}
      </div>
      <button class="btn-primary" id="submit-code">Rodar código ▶</button>
    `;
  } else if (ch.type === "mcq") {
    body = `
      <p class="instruction">${escapeHtml(ch.q)}</p>
      <div class="options">${ch.options.map((opt, i) => `<button class="option-btn" data-i="${i}">${escapeHtml(opt)}</button>`).join("")}</div>
    `;
  } else {
    body = `
      <p class="instruction">${escapeHtml(ch.q)}</p>
      <input type="text" id="text-answer" class="text-input" autocomplete="off" autocapitalize="off" placeholder="Digite sua resposta" />
      <button class="btn-primary" id="submit-answer">Confirmar</button>
    `;
  }

  app().innerHTML = `
    <header class="topbar">
      <button class="btn-back" id="back-map">←</button>
      <div class="brand">${s.icon} ${s.title}</div>
      <div></div>
    </header>
    <main class="challenge">
      <div class="progress-dots">${dots}</div>
      ${body}
      <div id="output-box" class="output-box" style="display:none"></div>
      <div id="feedback" class="feedback"></div>
      <button class="btn-hint" id="hint-btn">💡 Dica</button>
    </main>
  `;

  el("#back-map").addEventListener("click", renderMap);
  el("#hint-btn").addEventListener("click", () => {
    session.hintUsed = true;
    const fb = el("#feedback");
    fb.className = "feedback hint";
    fb.textContent = "💡 " + ch.hint;
  });

  if (ch.type === "code") {
    el("#submit-code").addEventListener("click", () => checkCode(ch));
    const ta = el("#code-input");
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = ta.selectionStart, end = ta.selectionEnd;
        ta.value = ta.value.slice(0, start) + "    " + ta.value.slice(end);
        ta.selectionStart = ta.selectionEnd = start + 4;
      }
    });
    ta.addEventListener("input", () => autoGrow(ta));
    autoGrow(ta);
  } else if (ch.type === "mcq") {
    document.querySelectorAll(".option-btn").forEach((btn) => {
      btn.addEventListener("click", () => checkGeneric(Number(btn.dataset.i) === ch.answer, btn));
    });
  } else {
    const submit = () => checkGeneric(normalizeAnswer(el("#text-answer").value) === normalizeAnswer(ch.answer));
    el("#submit-answer").addEventListener("click", submit);
    el("#text-answer").addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  }
}

function checkCode(ch) {
  const val = el("#code-input").value;
  const isCorrect = normalizeCode(val) === normalizeCode(ch.target);
  const fb = el("#feedback");
  const outBox = el("#output-box");

  session.attempts += 1;

  if (isCorrect) {
    if (ch.expectedOutput === "") {
      outBox.style.display = "block";
      outBox.innerHTML = `<div class="output-label">Saída do programa:</div><pre class="output-text">(nada é impresso — a condição deu falsa)</pre>`;
    } else if (ch.expectedOutput !== null && ch.expectedOutput !== undefined) {
      outBox.style.display = "block";
      outBox.innerHTML = `<div class="output-label">Saída do programa:</div><pre class="output-text">${escapeHtml(ch.expectedOutput)}</pre>`;
    } else {
      outBox.style.display = "block";
      outBox.innerHTML = `<div class="output-label">✅ Código válido (sem saída nessa etapa).</div>`;
    }
    fb.className = "feedback correct";
    fb.textContent = "✅ Certinho!";
    el("#code-input").disabled = true;
    el("#submit-code").remove();
    advanceButton();
  } else {
    fb.className = "feedback wrong";
    fb.textContent = session.attempts >= 3
      ? "❌ Ainda não bateu. Aqui está a resposta certa — compare com a sua:"
      : "❌ Quase lá — confira ponto e vírgula, aspas e nomes.";
    if (session.attempts >= 3) {
      outBox.style.display = "block";
      outBox.innerHTML = `<pre class="output-text">${escapeHtml(ch.target)}</pre>`;
      el("#code-input").disabled = true;
      el("#submit-code").remove();
      advanceButton();
    }
  }
}

function checkGeneric(isCorrect, btnEl) {
  const fb = el("#feedback");
  session.attempts = (session.attempts || 0) + 1;
  const { s, index } = session;
  const ch = s.phases[index];

  if (isCorrect) {
    fb.className = "feedback correct";
    fb.innerHTML = `✅ Certo! ${ch.explain || ""}`;
    if (btnEl) btnEl.classList.add("correct-choice");
    document.querySelectorAll(".option-btn, #submit-answer, #text-answer").forEach((n) => n.disabled = true);
    advanceButton();
  } else {
    fb.className = "feedback wrong";
    if (btnEl) btnEl.classList.add("wrong-choice");
    if (session.attempts >= 3) {
      const correctText = ch.type === "mcq" ? ch.options[ch.answer] : ch.answer;
      fb.innerHTML = `❌ Ainda não bateu. Resposta certa: <b>${escapeHtml(correctText)}</b>`;
      if (ch.type === "mcq") {
        const correctBtn = document.querySelectorAll(".option-btn")[ch.answer];
        if (correctBtn) correctBtn.classList.add("correct-choice");
      }
      document.querySelectorAll(".option-btn, #submit-answer, #text-answer").forEach((n) => n.disabled = true);
      advanceButton();
    } else {
      fb.textContent = "❌ Não foi essa. Tenta de novo.";
    }
  }
}

function advanceButton() {
  const hintBtn = el("#hint-btn");
  if (hintBtn) hintBtn.disabled = true; // evita sobrescrever o feedback de certo/errado já finalizado

  const attempts = session.attempts || 1;
  let stars = 3;
  if (session.hintUsed) stars = 2;
  if (attempts > 1 && stars === 3) stars = 2;
  if (attempts > 2) stars = 1;
  session.challengeStars.push(stars);

  const { s, index } = session;
  const nextBtn = document.createElement("button");
  nextBtn.className = "btn-primary next-btn";
  nextBtn.textContent = (index + 1 < s.phases.length) ? "Próxima →" : "Finalizar sessão 🏁";
  nextBtn.addEventListener("click", () => {
    if (index + 1 < s.phases.length) {
      session.index += 1;
      renderChallenge();
    } else {
      finishSession();
    }
  });
  app().querySelector("main").appendChild(nextBtn);
}

function finishSession() {
  const { s, challengeStars } = session;
  const sessionStars = Math.min(...challengeStars);
  const fullXp = challengeStars.reduce((sum, st) => sum + (st === 3 ? 10 : st === 2 ? 6 : 3), 0);

  const prevStars = state.stars[s.id] || 0;
  const alreadyCleared = prevStars > 0;
  // Repetir uma sessão já concluída rende 30% do XP (evita farmar XP infinito, igual ao jogo CNC).
  const earnedXp = alreadyCleared ? Math.round(fullXp * 0.3) : fullXp;

  if (sessionStars > prevStars) state.stars[s.id] = sessionStars;
  state.xp += earnedXp;

  const wasCurrent = s.id === state.unlocked;
  if (wasCurrent && s.id < SESSIONS.length) state.unlocked = s.id + 1;
  saveState();

  const starIcons = [1,2,3].map(n => `<span class="${n <= sessionStars ? 'star-on big' : 'star-off big'}">★</span>`).join("");

  app().innerHTML = `
    <main class="result">
      <div class="result-emoji">${sessionStars === 3 ? '🏆' : sessionStars === 2 ? '🎉' : '👍'}</div>
      <h1>Sessão concluída!</h1>
      <div class="stars-row">${starIcons}</div>
      <p class="xp-earned">+${earnedXp} XP</p>
      ${wasCurrent && s.id < SESSIONS.length ? `<p class="unlock-msg">Nova sessão desbloqueada!</p>` : ""}
      ${alreadyCleared ? `<p class="replay-msg">Sessão repetida: XP reduzido (30%).</p>` : ""}
      <button class="btn-primary" id="to-map">Ver trilha</button>
    </main>
  `;
  el("#to-map").addEventListener("click", renderMap);
}

// ---------- INIT ----------
renderMap();
