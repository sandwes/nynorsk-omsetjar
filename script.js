// ---------- Config ----------
const APERTIUM_ENDPOINT = "https://beta.apertium.org/apy/translate";
const DEBOUNCE_MS = 450;
const MAX_CHARS = 10000;

// ---------- Elements ----------
const sourceText = document.getElementById("sourceText");
const targetText = document.getElementById("targetText");
const charCount = document.getElementById("charCount");
const copyBtn = document.getElementById("copyBtn");
const copyStatus = document.getElementById("copyStatus");
const clearBtn = document.getElementById("clearBtn");
const swapBtn = document.getElementById("swapBtn");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("errorBox");
const langButtons = document.querySelectorAll(".lang-btn");

// ---------- State ----------
const state = {
  source: "nob",
  target: "nno",
};

let debounceTimer = null;
let activeController = null;

// ---------- Helpers ----------
function setActive(side, lang) {
  state[side] = lang;
  document.querySelectorAll(`.lang-btn[data-side="${side}"]`).forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
  // Prevent same-language on both sides — if a user clicks the same lang on
  // the opposite side, auto-swap the other side.
  const otherSide = side === "source" ? "target" : "source";
  if (state[otherSide] === lang) {
    state[otherSide] = lang === "nob" ? "nno" : "nob";
    document.querySelectorAll(`.lang-btn[data-side="${otherSide}"]`).forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === state[otherSide]);
    });
  }
  updateTextareaLang();
}

function updateTextareaLang() {
  sourceText.setAttribute("lang", state.source === "nob" ? "nb" : "nn");
  targetText.setAttribute("lang", state.target === "nob" ? "nb" : "nn");
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}

function setLoading(loading) {
  loader.hidden = !loading;
}

// ---------- Translate ----------
async function translate() {
  const q = sourceText.value;

  // Cancel any in-flight request
  if (activeController) activeController.abort();

  if (!q.trim()) {
    targetText.textContent = "";
    clearError();
    setLoading(false);
    return;
  }

  setLoading(true);
  clearError();

  const langpair = `${state.source}|${state.target}`;
  const body = new URLSearchParams();
  body.set("langpair", langpair);
  body.set("q", q);
  body.set("markUnknown", "no");

  activeController = new AbortController();

  try {
    const res = await fetch(APERTIUM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
      signal: activeController.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data || data.responseStatus !== 200) {
      const reason = (data && (data.explanation || data.message)) || `HTTP ${res.status}`;
      throw new Error(reason);
    }

    targetText.textContent = data.responseData.translatedText || "";
  } catch (err) {
    if (err.name === "AbortError") return; // superseded by a newer request
    console.error("Translation error:", err);
    showError(`Klarte ikkje å omsetja: ${err.message}. Prøv igjen om litt.`);
  } finally {
    setLoading(false);
  }
}

function scheduleTranslate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(translate, DEBOUNCE_MS);
}

// ---------- UI wiring ----------
sourceText.addEventListener("input", () => {
  const len = sourceText.value.length;
  charCount.textContent = len;
  charCount.style.color = len > MAX_CHARS * 0.95 ? "var(--accent)" : "";
  scheduleTranslate();
});

langButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setActive(btn.dataset.side, btn.dataset.lang);
    if (sourceText.value.trim()) translate();
  });
});

swapBtn.addEventListener("click", () => {
  const newSource = state.target;
  const newTarget = state.source;
  state.source = newSource;
  state.target = newTarget;

  langButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === state[btn.dataset.side]);
  });
  updateTextareaLang();

  // Also swap text: translated output becomes new source, source becomes target preview.
  const currentOutput = targetText.textContent;
  const currentInput = sourceText.value;
  if (currentOutput) {
    sourceText.value = currentOutput;
    targetText.textContent = currentInput;
    charCount.textContent = sourceText.value.length;
    translate();
  }
});

clearBtn.addEventListener("click", () => {
  sourceText.value = "";
  targetText.textContent = "";
  charCount.textContent = "0";
  clearError();
  sourceText.focus();
});

copyBtn.addEventListener("click", async () => {
  const text = targetText.textContent || "";
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "Kopiert!";
    copyStatus.classList.add("show");
    setTimeout(() => copyStatus.classList.remove("show"), 1500);
  } catch {
    // Fallback for older browsers / insecure contexts
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
    copyStatus.textContent = "Kopiert!";
    copyStatus.classList.add("show");
    setTimeout(() => copyStatus.classList.remove("show"), 1500);
  }
});

// Keyboard shortcut: Ctrl/Cmd + Enter → translate immediately
sourceText.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    clearTimeout(debounceTimer);
    translate();
  }
});

// Initialise lang attributes
updateTextareaLang();
