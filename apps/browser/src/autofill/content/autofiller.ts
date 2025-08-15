import { setupExtensionDisconnectAction } from "../utils";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadAutofiller);
} else {
  loadAutofiller();
}

function loadAutofiller() {
  let pageHref: null | string = null;
  let filledThisHref = false;
  let delayFillTimeout: number;
  let doFillInterval: number | NodeJS.Timeout;
  const handleExtensionDisconnect = () => {
    clearDoFillInterval();
    clearDelayFillTimeout();
  };
  const handleExtensionMessage = (message: any) => {
    if (message.command === "fillForm" && pageHref === message.url) {
      filledThisHref = true;
    }
  };

  setupExtensionEventListeners();
  triggerUserFillOnLoad();

  function triggerUserFillOnLoad() {
    clearDoFillInterval();
    doFillInterval = setInterval(() => doFillIfNeeded(), 500);
  }

  function doFillIfNeeded(force = false) {
    if (force || pageHref !== window.location.href) {
      if (!force) {
        // Some websites are slow and rendering all page content. Try to fill again later
        // if we haven't already.
        filledThisHref = false;
        clearDelayFillTimeout();
        delayFillTimeout = window.setTimeout(() => {
          if (!filledThisHref) {
            doFillIfNeeded(true);
          }
        }, 1500);
      }

      pageHref = window.location.href;
      const msg: any = {
        command: "bgCollectPageDetails",
        sender: "autofiller",
      };

      void chrome.runtime.sendMessage(msg);
    }
  }

  function clearDoFillInterval() {
    if (doFillInterval) {
      window.clearInterval(doFillInterval);
    }
  }

  function clearDelayFillTimeout() {
    if (delayFillTimeout) {
      window.clearTimeout(delayFillTimeout);
    }
  }

  function setupExtensionEventListeners() {
    setupExtensionDisconnectAction(handleExtensionDisconnect);
    chrome.runtime.onMessage.addListener(handleExtensionMessage);
  }
}
