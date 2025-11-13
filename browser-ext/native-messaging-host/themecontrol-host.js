#!/usr/bin/env node

// Native messaging host for Theme Control browser extension
// This script reads the current theme and sends it to the extension, then exits

const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to theme state file
const THEME_FILE = path.join(os.homedir(), '.config', 'theme-control', 'current-theme.json');

// Read message from stdin (sent by browser extension)
function readMessage() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;

    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        chunks.push(chunk);
        totalLength += chunk.length;

        // Check if we have the length header (4 bytes)
        if (totalLength >= 4 && chunks.length === 1) {
          const buffer = chunks[0];
          const messageLength = buffer.readUInt32LE(0);
          
          // Check if we have the full message
          if (totalLength >= 4 + messageLength) {
            const messageContent = buffer.slice(4, 4 + messageLength).toString();
            try {
              const message = JSON.parse(messageContent);
              resolve(message);
            } catch (error) {
              reject(error);
            }
            return;
          }
        }
      }
    });

    process.stdin.on('end', () => {
      resolve(null);
    });

    process.stdin.on('error', (error) => {
      reject(error);
    });
  });
}

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
    } else {
      return { error: 'Theme file not found' };
    }
  } catch (error) {
    return { error: `Error reading theme file: ${error.message}` };
  }
}

// Main logic
async function main() {
  try {
    // Read request from extension
    const request = await readMessage();
    
    // Read current theme from file
    const themeData = readCurrentTheme();
    
    // Send response back to extension
    sendMessage(themeData);
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    // Send error response
    sendMessage({ error: error.message });
    process.exit(1);
  }
}

main();
