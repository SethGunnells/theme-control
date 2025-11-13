// Map of theme names and appearances to their file paths
const THEME_FILES = {
  dark: {
    nord: "themes/nord.json",
    rosepine: "themes/rose_pine.json",
  },
  light: {
    rosepine: "themes/rose_pine_dawn.json",
  },
};

// Load theme from file system
async function loadTheme(themeName, appearance) {
  const appearanceThemes = THEME_FILES[appearance];
  if (!appearanceThemes) {
    console.error(`Unknown appearance: ${appearance}`);
    return null;
  }

  const themeFile = appearanceThemes[themeName];
  if (!themeFile) {
    console.error(
      `Unknown theme: ${themeName} for appearance: ${appearance}`
    );
    return null;
  }

  try {
    const url = browser.runtime.getURL(themeFile);
    const response = await fetch(url);
    const theme = await response.json();
    return theme;
  } catch (error) {
    console.error(`Failed to load theme ${themeName}:`, error);
    return null;
  }
}

// Apply theme to browser
async function applyTheme(themeName, appearance) {
  const theme = await loadTheme(themeName, appearance);
  if (theme) {
    await browser.theme.update(theme);
    console.log(`Applied theme: ${themeName} (${appearance})`);
  }
}

// Check for theme updates from the native messaging host
async function checkForThemeUpdate() {
  try {
    const response = await browser.runtime.sendNativeMessage(
      "themecontrol",
      { action: "getTheme" }
    );

    if (response && response.theme && response.appearance) {
      await applyTheme(response.theme, response.appearance);
    } else if (response && response.error) {
      console.error("Error from native host:", response.error);
    }
  } catch (error) {
    // Native host not available or error occurred
    console.error("Failed to check for theme update:", error);
  }
}

// Check for theme updates on startup
checkForThemeUpdate();

// Check for theme updates periodically (every 5 seconds)
setInterval(checkForThemeUpdate, 5000);

// Also listen for extension messages (for manual reload)
browser.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    if (message.action === "reloadTheme") {
      await checkForThemeUpdate();
      sendResponse({ success: true });
    }
    return true; // Keep message channel open for async response
  }
);

console.log("Theme Control extension initialized");
