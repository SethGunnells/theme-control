# theme-control

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Configuration

The configuration file is located at `~/.config/theme-control/config.toml` by default. You can override this location using the `TC_CONFIG_PATH` environment variable.

See `config.example.toml` for an example configuration file.

### Applications

You can configure which applications to manage and their config file locations in the `[apps]` section:

- `enabled`: Array of application names to manage. If not specified, all supported applications will be managed.
- `<app>.configPath`: Custom path to the application's config file. If not specified, the default path will be used.
- `<app>.themesPath`: Custom path to the application's themes directory. If not specified, the default path will be used.

Currently supported applications:

- `bat`: Default config path is `~/.config/bat/config`, default themes path is `~/.config/bat/themes/`
- `delta`: Default config path is `~/.gitconfig` (uses bat themes)
- `helix`: Default config path is `~/.config/helix/config.toml`
- `kitty`: Uses the `kitten theme` command (no config path needed)

Example:

```toml
[apps]
enabled = ["bat", "delta", "helix", "kitty"]

[apps.bat]
configPath = "/custom/path/to/bat/config"
themesPath = "/custom/path/to/bat/themes"

[apps.delta]
configPath = "/custom/path/to/.gitconfig"

[apps.helix]
configPath = "/custom/path/to/helix/config.toml"

[apps.kitty]
# Kitty has no custom configuration needed
```

### Command Line Options

- `--update-themes`: Force update application themes even if they already exist

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
