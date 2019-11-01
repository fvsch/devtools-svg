/*
 * This script is run whenever the devtools are open
 */

const panels = browser.devtools.panels;
let theme = browser.devtools.panels.themeName;

panels.create("SVG", iconName(theme), "./panel/panel.html").then(panel => {
  panel.onShown.addListener(onPanelShown);
});

panels.onThemeChanged.addListener(name => {
  theme = name;
});

// Set theme class
function onPanelShown(panelWindow) {
  panelWindow.document.documentElement.className = themeClass(theme);
}

function iconName(themeName) {
  return `./img/panel-${themeName === "dark" ? "white" : "black"}.svg`;
}

function themeClass(themeName) {
  return `theme-${themeName === "dark" ? "dark" : "light"}`;
}
