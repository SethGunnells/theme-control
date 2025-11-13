#!/usr/bin/env node

// Native messaging host for Theme Control browser extension
// This script communicates with the browser extension using stdin/stdout
// It watches for theme changes and notifies the extension

const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to theme state file
const THEME_FILE = path.join(os.homedir(), '.config', 'theme-control', 'current-theme.json');

// Send message to stdout (to browser extension)
function sendMessage(message) {
  const messageStr = JSON.stringify(message);
  const messageLength = Buffer.byteLength(messageStr);
  
  const buffer = Buffer.alloc(4 + messageLength);
  buffer.writeUInt32LE(messageLength, 0);
  buffer.write(messageStr, 4);
  
  process.stdout.write(buffer);
}

// Read current theme from file
function readCurrentTheme() {
  try {
    if (fs.existsSync(THEME_FILE)) {
      const content = fs.readFileSync(THEME_FILE, 'utf-8');
      const data = JSON.parse(content);
      return { theme: data.theme, appearance: data.appearance };
    }
  } catch (error) {
    console.error('Error reading theme file:', error.message);
  }
  return null;
}

// Main logic
function main() {
  // Send initial theme
  const initialTheme = readCurrentTheme();
  if (initialTheme) {
    sendMessage(initialTheme);
  }
  
  // Watch for theme file changes
  let lastTheme = initialTheme ? JSON.stringify(initialTheme) : null;
  
  // Ensure directory exists
  const themeDir = path.dirname(THEME_FILE);
  if (!fs.existsSync(themeDir)) {
    fs.mkdirSync(themeDir, { recursive: true });
  }
  
  // Watch for file changes
  fs.watch(themeDir, (eventType, filename) => {
    if (filename === path.basename(THEME_FILE)) {
      const currentTheme = readCurrentTheme();
      const currentThemeStr = currentTheme ? JSON.stringify(currentTheme) : null;
      if (currentTheme && currentThemeStr !== lastTheme) {
        lastTheme = currentThemeStr;
        sendMessage(currentTheme);
      }
    }
  });
  
  // Keep process alive
  process.stdin.resume();
}

main();
