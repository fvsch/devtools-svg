/**
 * Open a port to connect to background script
 */
const tabId = browser.devtools.inspectedWindow.tabId;
const port = browser.runtime.connect();

let panelIsEmpty = true;
const mainContainer = document.querySelector(".Content");
const asideContainer = document.querySelector(".Sidebar");
const asideFrame = document.querySelector(".ImageFull-frame");
const asideInfo = document.querySelector(".ImageFull-info");
const toolbar = document.querySelector(".Toolbar");
const searchStyles = document.querySelector("#search-styles");
const searchInput = document.querySelector(".Toolbar-search input");

toolbar.addEventListener("click", event => {
  const btnSel = ".Toolbar-styles button";
  const btn = event.target.closest(btnSel);
  if (btn === null) return;
  // Switch button states
  const currentBtn = toolbar.querySelector(btnSel + "[aria-selected=true]");
  if (currentBtn && currentBtn !== btn) {
    currentBtn.removeAttribute("aria-selected");
    btn.setAttribute("aria-selected", "true");
  }
  // Apply styles
  document.body.setAttribute("style", btn.getAttribute("style"));
});

searchInput.addEventListener("input", event => {
  const val = event.target.value.trim().toLowerCase();
  if (val) {
    searchStyles.textContent = `
      .ImageList-icon:not([data-search*="${val}"]) {
        display: none !important;
      }
    `;
  } else {
    searchStyles.textContent = "";
  }
});

/**
 * Show a SVG element in the sidebar
 * @param {Element} li
 */
function selectIcon(li) {
  const current = mainContainer.querySelector(".ImageList-icon.selected");
  if (current && current !== li) {
    current.classList.remove("selected");
  }
  li.classList.add("selected");
  asideFrame.innerHTML = li.innerHTML;
  const { name, size } = li.dataset;
  asideInfo.innerHTML = `<table>
    <tr><td>Name</td><td>${name}</td></tr>
    <tr><td>Size</td><td>${size > 1000
      ? (size / 1000).toFixed(1) + "&nbsp;kB"
      : size + "&nbsp;B"}</td></tr>
  </table>`;
  asideContainer.hidden = false;
}

/**
 * Tell bg script to inject content script in current tab
 */
port.postMessage({
  tabId: tabId,
  registerPort: true,
  injectScript: "/devtools/content.js"
});

// Test: show found symbols
port.onMessage.addListener(msg => {
  if (!msg.result || msg.result.items.length === 0) {
    return;
  }
  const { type, location, items } = msg.result;
  const label = type === "symbol" ? "&lt;symbol>" : "&lt;svg>";
  const itemsHtml = items.map(item => {
    const { name, content, id, size } = item;
    return `<li class="ImageList-icon svgWrapper"
      data-name="${name}" data-size="${size}" data-search="${name.toLowerCase()}">
      ${type === "symbol"
        ? `<svg>${content}<use xlink:href="#${id}"></use></svg>`
        : `${content}`}</li>`;
  });
  const html = `<section>
    <h2 class="Header">
      <span class="Header-type">${label}</span>
      <span class="Header-url">${location}</span>        
    </h2>
    <ul class="ImageList">
      ${items.length ? itemsHtml.join("") : `<li><i>No content found.</i></li>`}
    </ul>
  </section>`;

  if (panelIsEmpty) {
    // Remove placeholder
    //mainContainer.innerHTML = html;
    mainContainer.innerHTML = html;
    // Select first icon
    const first = mainContainer.querySelector(".ImageList-icon");
    if (first) selectIcon(first);
    // Listen for selections
    mainContainer.addEventListener("click", event => {
      const icon = event.target.closest(".ImageList-icon");
      if (icon) selectIcon(icon);
    });
    panelIsEmpty = false;
  } else {
    mainContainer.insertAdjacentHTML("beforeend", html);
  }
});
