/**
 * Open a port to connect to background script
 */
const tabId = browser.devtools.inspectedWindow.tabId;
const port = browser.runtime.connect();

/**
 * Tell bg script to inject content script in current tab
 */
port.postMessage({
  tabId: tabId,
  registerPort: true,
  injectScript: "/content/findSymbols.js"
});

// Test: show found symbols
port.onMessage.addListener(msg => {
  if (!msg.result) {
    return;
  }
  const { type, location, items } = msg.result;
  const itemsHtml = items.map(item => {
    return type === "symbol"
      ? `<svg>${item.content}<use xlink:href="#${item.id}"></use></svg><span>${item.name}</span>`
      : `${item.content}<span>${item.name}</span>`;
  });
  document.body.insertAdjacentHTML(
    "beforeend",
    `<section>
      <h2 class="Header">${type.toUpperCase()} - ${location}</h2>
      <ul class="ImageList">
        ${items.length
          ? itemsHtml.map(h => `<li>${h}</li>`).join("")
          : `<li><i>No content found.</i></li>`}
      </ul>
    </section>`
  );
});
