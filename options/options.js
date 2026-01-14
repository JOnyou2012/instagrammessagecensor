const wordsEl = document.getElementById("words");
const statusEl = document.getElementById("status");

const DEFAULT_BANNED = ["badword1", "badword2", "badword3"];

const load = () => {
  chrome.storage.sync.get({ bannedWords: DEFAULT_BANNED }, (res) => {
    const list = res.bannedWords || [];
    wordsEl.value = list.join("\n");
  });
};

const save = () => {
  const raw = wordsEl.value
    .split(/\n+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  chrome.storage.sync.set({ bannedWords: raw }, () => {
    statusEl.textContent = "Saved";
    setTimeout(() => (statusEl.textContent = ""), 1200);
  });
};

document.getElementById("save").addEventListener("click", save);
load();
