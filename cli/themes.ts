const themes = {
  light: ["rosepine"],
  dark: ["nord", "rosepine"],
} as const;

export type Appearance = keyof typeof themes;
export type Themes<A extends Appearance> = (typeof themes)[A][number];

export type ThemeMap = {
  [A in Appearance]: {
    default: string;
  } & {
    [J in Themes<A>]?: string;
  };
};

export function assertTheme<A extends Appearance>(
  appearance: A,
  theme: string,
): asserts theme is Themes<A> {
  const validThemes = themes[appearance] as readonly string[];

  if (!validThemes.includes(theme)) {
    throw new Error(
      `Invalid theme '${theme}' for appearance '${appearance}'. Valid themes: ${validThemes.join(", ")}`,
    );
  }
}
