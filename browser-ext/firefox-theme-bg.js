const port = browser.runtime.connectNative("themecontrol");

port.onMessage.addListener((theme) => {
  browser.theme.update(theme);
});
