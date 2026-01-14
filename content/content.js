// Content script to block Instagram messages containing banned words before they send.
(() => {
  const DEFAULT_BANNED = [
    "badword1",
    "badword2",
    "badword3"
  ];

  let bannedWords = new Set(DEFAULT_BANNED);
  let warningNode = null;

  const normalize = (text) => text.toLowerCase().trim();

  const hasBannedWord = (text) => {
    const t = normalize(text);
    for (const word of bannedWords) {
      if (word && t.includes(word)) return true;
    }
    return false;
  };

  const renderWarning = (anchor) => {
    if (!warningNode) {
      warningNode = document.createElement("div");
      warningNode.style.position = "absolute";
      warningNode.style.right = "12px";
      warningNode.style.bottom = "12px";
      warningNode.style.padding = "8px 12px";
      warningNode.style.background = "rgba(255, 69, 58, 0.9)";
      warningNode.style.color = "white";
      warningNode.style.borderRadius = "8px";
      warningNode.style.fontSize = "12px";
      warningNode.style.fontWeight = "600";
      warningNode.style.zIndex = "2147483647";
      warningNode.textContent = "Message blocked: banned word detected.";
    }
    const rect = anchor.getBoundingClientRect();
    warningNode.style.position = "fixed";
    warningNode.style.left = `${Math.min(rect.left + rect.width - 200, rect.left + 16)}px`;
    warningNode.style.top = `${rect.bottom - 48}px`;
    if (!warningNode.isConnected) document.body.appendChild(warningNode);
  };

  const hideWarning = () => {
    if (warningNode?.isConnected) warningNode.remove();
  };

  const checkAndMaybeBlock = (event, inputEl) => {
    const text = inputEl.innerText || inputEl.value || "";
    if (hasBannedWord(text)) {
      event.preventDefault();
      event.stopPropagation();
      renderWarning(inputEl);
      return true;
    }
    hideWarning();
    return false;
  };

  const attachGuards = (inputEl) => {
    if (inputEl.dataset.igCensorAttached === "1") return;
    inputEl.dataset.igCensorAttached = "1";

    inputEl.addEventListener("keydown", (event) => {
      const isEnter = event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey;
      if (isEnter) {
        checkAndMaybeBlock(event, inputEl);
      }
    }, true);

    inputEl.addEventListener("input", () => {
      const text = inputEl.innerText || inputEl.value || "";
      if (!hasBannedWord(text)) hideWarning();
    });
  };

  const scanForInputs = () => {
    const candidates = document.querySelectorAll("textarea[aria-label='Message'], div[role='textbox']");
    candidates.forEach((node) => attachGuards(node));
  };

  const observer = new MutationObserver(() => scanForInputs());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scanForInputs();

  const loadBannedWords = () => {
    if (!chrome?.storage?.sync) return;
    chrome.storage.sync.get({ bannedWords: DEFAULT_BANNED }, (res) => {
      bannedWords = new Set((res.bannedWords || []).map(normalize));
    });
  };

  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync" && changes.bannedWords) {
        const next = changes.bannedWords.newValue || DEFAULT_BANNED;
        bannedWords = new Set(next.map(normalize));
      }
    });
  }

  loadBannedWords();
})();
