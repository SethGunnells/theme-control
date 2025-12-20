import nord from "./nord";
import rosepine from "./rosepine.ts";
import type { Appearance, Themes } from "../../themes.ts";

export interface ThemeColors {
  button_background_active: string;
  button_background_hover: string;
  frame: string;
  icons: string;
  popup: string;
  popup_border: string;
  popup_highlight: string;
  popup_text: string;
  sidebar: string;
  sidebar_highlight: string;
  sidebar_text: string;
  tab_background_text: string;
  tab_background_separator: string;
  tab_selected: string;
  tab_text: string;
  toolbar: string;
  toolbar_field: string;
  toolbar_field_border_focus: string;
  toolbar_field_highlight: string;
  toolbar_field_text: string;
}

const browserThemes: Record<
  Themes<Appearance>,
  Partial<Record<Appearance, ThemeColors>>
> = {
  rosepine,
  nord,
};

export default browserThemes;
