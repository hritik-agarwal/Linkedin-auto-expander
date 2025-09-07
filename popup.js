// Constants

const IDS = {
  STATUS_TEXT: "status-text",
  EXPAND_BTN: "expand-btn",
  DARK_MODE_BTN: "dark-mode-btn",
};

const MESSAGES = {
  ENABLE_EXPAND: "enable-expand",
};

const DB = {
  ENABLE_EXPAND: "enableExpand",
};

// Functions

async function getDB(keys) {
  return await chrome.storage.local.get(keys);
}

async function setDB(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes("linkedin.com")) return null;
  return tab;
}

async function getCookie(name) {
  const tab = await getCurrentTab();
  if (!tab) return;
  return await chrome.cookies.get({ url: tab.url, name });
}

async function setCookie(name, value) {
  const tab = await getCurrentTab();
  if (!tab) return;
  for (const domain of [".linkedin.com", ".www.linkedin.com"]) {
    await chrome.cookies.set({ url: tab.url, name, value, domain, path: "/" });
  }
}

async function sendMsg(action) {
  const tab = await getCurrentTab();
  if (!tab) return;
  return await chrome.tabs.sendMessage(tab.id, { action });
}

async function reloadPage() {
  const tab = await getCurrentTab();
  if (!tab) return;
  await chrome.tabs.reload(tab.id);
}

async function enableExpandHelper() {
  const result = await getDB([DB.ENABLE_EXPAND]);
  const isExpandEnabled = result[DB.ENABLE_EXPAND] != false;
  await setDB(DB.ENABLE_EXPAND, !isExpandEnabled);
  document.getElementById(IDS.EXPAND_BTN).className = !isExpandEnabled
    ? "btn primary"
    : "btn secondary";
  await sendMsg(MESSAGES.ENABLE_EXPAND);
}

async function enableDarkMode() {
  const cookie = await getCookie("li_theme");
  const currentTheme = cookie ? cookie.value : "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  await setCookie("li_theme", newTheme);
  document.getElementById(IDS.DARK_MODE_BTN).className =
    newTheme == "light" ? "btn secondary" : "btn primary";
  setTimeout(reloadPage, 1000);
}

async function updateUI() {
  const result = await getDB([DB.ENABLE_EXPAND]);
  const isExpandEnabled = result[DB.ENABLE_EXPAND] != false;
  document.getElementById(IDS.EXPAND_BTN).className = isExpandEnabled
    ? "btn primary"
    : "btn secondary";
  const cookie = await getCookie("li_theme");
  const currentTheme = cookie ? cookie.value : "light";
  document.getElementById(IDS.DARK_MODE_BTN).className =
    currentTheme == "light" ? "btn secondary" : "btn primary";
}

// Listeners

document.addEventListener("DOMContentLoaded", async () => {
  await updateUI();
  document
    .getElementById(IDS.EXPAND_BTN)
    .addEventListener("click", enableExpandHelper);
  document
    .getElementById(IDS.DARK_MODE_BTN)
    .addEventListener("click", enableDarkMode);
});
