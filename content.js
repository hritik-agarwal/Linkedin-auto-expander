// Constants

const MESSAGES = {
  ENABLE_EXPAND: "enable-expand",
};

const DB = {
  ENABLE_EXPAND: "enableExpand",
};

// Variables

let observer = null;

// Functions

async function getDB(keys) {
  return await chrome.storage.local.get(keys);
}

async function setDB(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

function clickAllMoreButtons() {
  Array.from(document.querySelectorAll("button"))
    .filter((btn) => {
      const text = btn.innerText.trim().toLowerCase();
      return new Set([
        "…more",
        "…show more",
        "… show more",
        "…see more",
        "… see more",
      ]).has(text);
    })
    .forEach((btn) => {
      const postContainer = btn.closest("div, span");
      if (postContainer) postContainer.style.outline = "none";
      btn.click();
    });
}

function setupMutationObserver(enableExpand) {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (!enableExpand) return;
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            clickAllMoreButtons();
          }
        });
      }
    });
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  clickAllMoreButtons();
}

async function rerunExpandHelper() {
  const result = await getDB([DB.ENABLE_EXPAND]);
  const isExpandEnabled = result[DB.ENABLE_EXPAND] != false;
  console.log({ isExpandEnabled });
  setupMutationObserver(isExpandEnabled);
}

// Listeners

rerunExpandHelper();

chrome.runtime.onMessage.addListener((request, _) => {
  if (request.action === MESSAGES.ENABLE_EXPAND) {
    rerunExpandHelper();
  }
});
