/* Mark extension context so CSS can target it */
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
  document.body.classList.add("is-extension");
}
