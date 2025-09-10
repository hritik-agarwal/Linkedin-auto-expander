// Variables

let intersectionObserver = null;
let lastClickTime = 0;
let clickThrottleDelay = 1000;

// Functions

function isMoreButton(btn) {
  const text = btn.innerText.trim().toLowerCase();
  return new Set([
    "…more",
    "…show more",
    "… show more",
    "…see more",
    "… see more",
  ]).has(text);
}

function isClickableMoreButton(btn) {
  if (!isMoreButton(btn)) return false;
  if (btn.closest("a[href]")) return false;
  const role = btn.getAttribute("role");
  const typeAttr = btn.getAttribute("type");
  if (
    (role && role.toLowerCase() === "link") ||
    (typeAttr && typeAttr.toLowerCase() === "link")
  ) {
    return false;
  }
  return true;
}

function isButtonInViewport(btn) {
  const rect = btn.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  const topThreshold = windowHeight * 0.15;
  const bottomThreshold = windowHeight * 0.7;
  return (
    rect.top >= topThreshold &&
    rect.bottom <= bottomThreshold &&
    rect.left >= 0 &&
    rect.right <= windowWidth
  );
}

function clickButton(btn) {
  const now = Date.now();
  if (now - lastClickTime < clickThrottleDelay) return false;
  const postContainer = btn.closest("div, span");
  if (postContainer) postContainer.style.outline = "none";
  btn.click();
  lastClickTime = now;
  return true;
}

function setupIntersectionObserver() {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const btn = entry.target;
        if (!entry.isIntersecting || !isClickableMoreButton(btn)) return;
        setTimeout(() => {
          if (!isButtonInViewport(btn)) return;
          const clicked = clickButton(btn);
          if (!clicked) return;
          intersectionObserver.unobserve(btn);
        }, 1000 + Math.random() * 300);
      });
    },
    {
      root: null,
      rootMargin: "-15% 0px -30% 0px",
      threshold: 0.1,
    }
  );
  observeExistingButtons();
}

function observeExistingButtons() {
  const buttons = Array.from(document.querySelectorAll("button"));
  buttons.forEach((btn) => {
    if (isClickableMoreButton(btn)) {
      btn.setAttribute("data-linkedin-enhancer-observed", "true");
      intersectionObserver.observe(btn);
    }
  });
}

function startScrollBasedScan() {
  let scrollTimeout;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (intersectionObserver) {
        const buttons = Array.from(document.querySelectorAll("button"));
        buttons.forEach((btn) => {
          if (isClickableMoreButton(btn)) {
            const isObserved = btn.hasAttribute(
              "data-linkedin-enhancer-observed"
            );
            if (!isObserved) {
              btn.setAttribute("data-linkedin-enhancer-observed", "true");
              intersectionObserver.observe(btn);
            }
          }
        });
      }
    }, 1000);
  });
}

async function initializeSmartExpander() {
  setupIntersectionObserver();
  startScrollBasedScan();
  window.addEventListener("resize", scheduleDebugUpdate, { passive: true });
}

initializeSmartExpander();
