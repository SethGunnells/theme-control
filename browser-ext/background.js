const port = browser.runtime.connectNative("themecontrol");

port.onDisconnect.addListener((p) => {
  console.log("Disconnecting...");
  console.log(p);
});

port.onMessage.addListener((theme) => {
  browser.theme.update(theme);
});
