# Theme Control Browser Extension

This browser extension allows Firefox to automatically update its theme based on the theme-control CLI application.

## How It Works

1. The extension reads theme files from its `themes/` directory
2. The CLI writes the current theme name to `~/.config/theme-control/current-theme.json`
3. A native messaging host monitors this file and notifies the extension when it changes
4. The extension loads and applies the appropriate theme

## Installation

### 1. Install the Extension

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Navigate to the `browser-ext` directory and select `manifest.json`

For permanent installation, the extension needs to be signed and distributed through addons.mozilla.org.

### 2. Install the Native Messaging Host

The native messaging host is a small Node.js script that bridges communication between the CLI and the browser extension.

1. Make the host script executable:
   ```bash
   chmod +x browser-ext/native-messaging-host/themecontrol-host.js
   ```

2. Copy the host script to a location in your PATH (e.g., `/usr/local/bin`):
   ```bash
   sudo cp browser-ext/native-messaging-host/themecontrol-host.js /usr/local/bin/themecontrol-host
   ```

3. Install the native messaging host manifest for Firefox:
   
   **On macOS:**
   ```bash
   mkdir -p ~/Library/Application\ Support/Mozilla/NativeMessagingHosts/
   cp browser-ext/native-messaging-host/themecontrol.json ~/Library/Application\ Support/Mozilla/NativeMessagingHosts/
   ```
   
   **On Linux:**
   ```bash
   mkdir -p ~/.mozilla/native-messaging-hosts/
   cp browser-ext/native-messaging-host/themecontrol.json ~/.mozilla/native-messaging-hosts/
   ```

4. Update the `path` in the manifest to point to your installation:
   ```bash
   # Edit the manifest file
   nano ~/.mozilla/native-messaging-hosts/themecontrol.json
   # or on macOS:
   nano ~/Library/Application\ Support/Mozilla/NativeMessagingHosts/themecontrol.json
   ```

## Usage

Once installed, the extension will automatically update when you run:

```bash
bun run main.ts dark nord
```

or

```bash
bun run main.ts light rosepine
```

The CLI will:
1. Update the themes for your configured applications (bat, delta, helix)
2. Write the current theme info (theme name, appearance, and timestamp) to `~/.config/theme-control/current-theme.json`
3. The native messaging host will detect the change and notify the extension with both the theme name and appearance
4. The extension will load the appropriate theme file based on the theme name and appearance, then apply it

## Supported Themes

The extension maps theme names and appearances to specific theme files:

- **Dark themes:**
  - `nord` → `themes/nord.json`
  - `rosepine` → `themes/rose_pine.json`

- **Light themes:**
  - `rosepine` → `themes/rose_pine_dawn.json`

Note: The same theme name (`rosepine`) maps to different files based on the appearance (light/dark).

## Troubleshooting

### Extension not connecting to native host

Check the browser console (F12 > Console) for error messages. Common issues:

1. Native messaging host script is not executable
2. Manifest path in the JSON file doesn't match the actual script location
3. Node.js is not installed or not in PATH

### Theme not updating

1. Check that the CLI is writing to `~/.config/theme-control/current-theme.json`
2. Check that the native messaging host is running (it should start automatically)
3. Check the browser console for errors

## Development

To test changes to the extension:

1. Make your changes to `background.js` or theme files
2. In Firefox, go to `about:debugging` > This Firefox
3. Find "Theme Control - Browser Extension" and click "Reload"

## Architecture

```
CLI (main.ts)
    ↓ writes
current-theme.json
    ↓ watches
Native Messaging Host (themecontrol-host.js)
    ↓ sends message
Browser Extension (background.js)
    ↓ reads
Theme Files (themes/*.json)
    ↓ applies
Firefox Theme API
```
