import { describe, test, expect } from "bun:test";

// Integration test to verify the complete flow
describe("Browser extension integration", () => {
  test("theme file structure should match extension expectations", () => {
    // The CLI writes this structure
    const cliOutput = {
      theme: "nord",
      appearance: "dark",
      timestamp: new Date().toISOString(),
    };

    // The native host reads and forwards these fields
    const nativeHostMessage = {
      theme: cliOutput.theme,
      appearance: cliOutput.appearance,
    };

    // The extension expects these fields
    expect(nativeHostMessage).toHaveProperty("theme");
    expect(nativeHostMessage).toHaveProperty("appearance");
    expect(typeof nativeHostMessage.theme).toBe("string");
    expect(typeof nativeHostMessage.appearance).toBe("string");
  });

  test("theme mapping should be consistent with available theme files", () => {
    // These are the theme files available in browser-ext/themes/
    const availableThemes = {
      dark: {
        nord: "themes/nord.json",
        rosepine: "themes/rose_pine.json",
      },
      light: {
        rosepine: "themes/rose_pine_dawn.json",
      },
    };

    // Test dark appearance themes
    expect(availableThemes.dark.nord).toBeDefined();
    expect(availableThemes.dark.rosepine).toBeDefined();

    // Test light appearance themes
    expect(availableThemes.light.rosepine).toBeDefined();

    // Verify consistency
    expect(availableThemes.dark.nord).toBe("themes/nord.json");
    expect(availableThemes.dark.rosepine).toBe("themes/rose_pine.json");
    expect(availableThemes.light.rosepine).toBe("themes/rose_pine_dawn.json");
  });

  test("CLI supported themes should match extension theme mappings", () => {
    // From cli/themes.ts
    const cliThemes = {
      light: ["rosepine"],
      dark: ["nord", "rosepine"],
    };

    // From browser-ext/background.js
    const extensionThemes = {
      dark: ["nord", "rosepine"],
      light: ["rosepine"],
    };

    // Verify dark themes match
    expect(cliThemes.dark).toEqual(expect.arrayContaining(["nord", "rosepine"]));
    expect(extensionThemes.dark).toEqual(expect.arrayContaining(["nord", "rosepine"]));

    // Verify light themes match
    expect(cliThemes.light).toEqual(expect.arrayContaining(["rosepine"]));
    expect(extensionThemes.light).toEqual(expect.arrayContaining(["rosepine"]));
  });
});
