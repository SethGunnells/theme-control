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

// Listen for messages from native messaging host
const port = browser.runtime.connectNative("themecontrol");
port.onMessage.addListener(async (message) => {
  if (message && message.theme && message.appearance) {
    await applyTheme(message.theme, message.appearance);
  } else {
    console.error(
      "Invalid message format. Expected: { theme: 'themeName', appearance: 'light|dark' }"
    );
  }
});

port.onDisconnect.addListener(() => {
  const error = browser.runtime.lastError;
  if (error) {
    console.error("Native messaging port disconnected:", error.message);
  }
});

// Also listen for extension messages (for reload events)
browser.runtime.onMessage.addListener(
  async (message, sender, sendResponse) => {
    if (
      message.action === "reloadTheme" &&
      message.theme &&
      message.appearance
    ) {
      await applyTheme(message.theme, message.appearance);
      sendResponse({ success: true });
    }
    return true; // Keep message channel open for async response
  }
);

console.log("Theme Control extension initialized");
