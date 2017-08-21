const THIS_URL = document.location.origin + document.location.pathname;

/**
 * Remove most whitespace in SVG markup so we can compare different SVG elements
 * and only send one back to the devtools panel when they match
 * @param {string} markup
 * @return {string}
 */
function minimizeSvgWhitespace(markup) {
  return markup.replace(/\s+/g, " ").replace(/> </g, "><");
}

function getSymbols(root) {
  return Array.from(root.querySelectorAll("symbol[id]"))
    .filter(el => el.id)
    .map(el => ({
      id: el.id,
      name: "#" + el.id,
      content: minimizeSvgWhitespace(el.outerHTML)
    }));
}

function getVisibleSvg(root) {
  const knownContent = [];
  return Array.from(root.querySelectorAll("svg"))
    .map(el => {
      // Minify source and try to avoid working twice on similar SVG images
      // (e.g. images duplicated in rows of content)
      const content = minimizeSvgWhitespace(el.outerHTML);
      if (knownContent.includes(content)) return null;
      knownContent.push(content);
      // Only work on displayed SVG elements (if more performant,
      // might be a good idea to move this test before the outerHTML one)
      const { width, height } = el.getBoundingClientRect();
      if (width < 4 || height < 4) return;
      // Also bail if the image contains <symbol> or <use> elements
      if (el.querySelector("symbol, use")) return;
      // Still there? It’s a keeper. But how can we name it?
      let name = "svg" + (el.id ? "#" + el.id : "");
      if (el.className) {
        name += Array.from(el.classList).map(c => "." + c).join("");
      }
      return { name, content, width, height };
    })
    .filter(item => item != null);
}

browser.runtime.sendMessage({
  result: {
    type: "symbol",
    location: THIS_URL,
    items: getSymbols(document)
  }
});

browser.runtime.sendMessage({
  result: {
    type: "svg",
    location: THIS_URL,
    items: getVisibleSvg(document.body)
  }
});

const remoteDocs = [];
Array.from(document.querySelectorAll("svg use")).forEach(el => {
  const href = el.href.baseVal.trim();
  if (!href || href.indexOf("#") <= 0) return;
  const svgUrl = new URL(href.split("#")[0], THIS_URL).href;
  if (remoteDocs.includes(svgUrl)) {
    return;
  } else {
    remoteDocs.push(svgUrl);
    fetch(svgUrl).then(resp => resp.text()).then(svgText => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      if (svgDoc.documentElement.nodeName !== "svg") return;
      browser.runtime.sendMessage({
        result: {
          type: "symbol",
          location: svgUrl,
          items: getSymbols(svgDoc)
        }
      });
    });
  }
});
