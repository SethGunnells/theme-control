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

Currently supported applications:
- `bat`: Default config path is `~/.config/bat/config`

Example:
```toml
[apps]
enabled = ["bat"]

[apps.bat]
configPath = "/custom/path/to/bat/config"
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
