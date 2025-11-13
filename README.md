# Flyfree

> A CLI tool for managing LLM Provider configurations for AI agents like Claude Code and Codex

Flyfree (自由翱翔) helps you easily manage and switch between different LLM provider configurations across multiple AI coding agents.

## 📖 Documentation

- 📑 **[Project Overview & Features](docs/FEATURED.md)** - Comprehensive project introduction
- 📘 **[User Guide](docs/USER_GUIDE.md)** - Complete usage documentation
- ⚡ **[Quick Reference](docs/QUICK_REFERENCE.md)** - Command cheat sheet
- 🔌 **[Built-in Providers](docs/BUILTIN_PROVIDERS.md)** - Internal provider system guide

## Features

- 🔄 Subscribe to provider configurations via URL or built-in providers
- 🎯 Interactive configuration switching
- ⚡ Quick provider switching with `set` command
- 🔄 Configuration backup and restore functionality
- 🧹 Safe configuration reset with backup protection
- 📦 Support for multiple agents (Claude Code, Codex, etc.)
- 🔒 JSON Schema validation
- 🎨 Beautiful CLI interface
- 🔌 Built-in provider support with `ff://` protocol
- 📋 Agent selection with `--select` option
- 🔢 Automatic backup management (max 10 backups per agent)

## Installation

```bash
npm install -g flyfree
```

Or use directly with npx:

```bash
npx flyfree <command>
```

## Quick Start

### 1. Subscribe to a Provider

```bash
# Subscribe to an external provider configuration
ff sub https://your-provider.com/config

# Subscribe with a custom alias
ff sub https://your-provider.com/config -a my-provider

# Subscribe and automatically apply configuration
ff sub https://your-provider.com/config --auto

# Subscribe to a built-in provider (using ff:// protocol)
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu --auto
ff sub 'ff://openrouter?key=YOUR_API_KEY' -a openrouter --auto
```

### 2. List Subscriptions

```bash
# List all subscribed providers
ff list

# Or use the short alias
ff ls
```

### 3. Switch Configurations

```bash
# Interactive configuration switching
ff switch

# Or use the short alias
ff s
```

### 4. Unsubscribe

```bash
# Unsubscribe from a provider (with confirmation)
ff unsub myProvider

# Force unsubscribe without confirmation
ff unsub myProvider --force
```

## Commands

### `ff sub <url> [options]`

Subscribe to a provider configuration.

**Arguments:**

- `url` - The subscription URL

**Options:**

- `-a, --alias <name>` - Set provider alias name
- `--auto` - Automatically apply configuration without confirmation

**Example:**

```bash
ff sub https://example.com/config -a myProvider --auto
```

### `ff list` (alias: `ff ls`)

List all subscribed providers and their status.

This command displays:

- All subscribed providers
- Subscription status (success/failed/pending)
- Last update time
- Supported agents
- Currently active configurations

**Example:**

```bash
ff list
```

### `ff switch` (alias: `ff s`)

Interactively switch between provider configurations.

This command will:

1. Display all subscribed providers
2. Let you select a provider
3. Show available agents for that provider
4. Apply the selected agent configuration (with confirmation)

### `ff set <agent> <provider>`

Quickly switch agent provider configuration.

**Arguments:**

- `agent` - The agent name to switch
- `provider` - The target provider name

**Example:**

```bash
# Switch claude-code to use ZhiPu provider
ff set claude-code ZhiPu

# Switch claude-code to use OpenRouter provider
ff set claude-code OpenRouter
```

### `ff reset [agent] [options]`

Reset agent configurations to empty state.

**Arguments:**

- `agent` - The agent name to reset (optional, will show interactive selection)

**Options:**

- `-f, --force` - Force reset without confirmation

**Example:**

```bash
# Interactive selection of agents to reset
ff reset

# Reset specific agent with confirmation
ff reset claude-code

# Force reset without confirmation
ff reset claude-code --force
```

### `ff restore [agent] [options]`

Restore agent configurations from backups.

**Arguments:**

- `agent` - The agent name to restore (optional, will show interactive selection)

**Options:**

- `-l, --list` - List all available backups

**Example:**

```bash
# List all backups
ff restore --list

# Interactive restore
ff restore

# Restore specific agent
ff restore claude-code
```

### `ff unsub <provider> [options]`

Unsubscribe from a provider.

**Arguments:**

- `provider` - The provider name to unsubscribe

**Options:**

- `-f, --force` - Force unsubscribe without confirmation

**Example:**

```bash
# With confirmation
ff unsub myProvider

# Without confirmation
ff unsub myProvider --force
```

**Note:** Unsubscribing will:

- Remove the provider configuration from `~/.ff/`
- Clear the provider from subscription list
- Clear affected agent settings
- NOT modify the actual agent configuration files

## Built-in Providers

Flyfree includes built-in provider support using the `ff://` protocol. These providers don't require external API endpoints - the configuration is generated internally.

### Available Built-in Providers

#### 1. Z.AI (智谱 AI)

Subscribe to ZhiPu AI's API with Claude Code support:

```bash
ff sub 'ff://z.ai?key=YOUR_API_KEY' -a zhipu --auto
```

Supported agents:

- **claude-code**: Claude 3.5 Sonnet via ZhiPu's Anthropic-compatible endpoint
- **codex**: GPT-4 via ZhiPu's OpenAI-compatible endpoint

#### 2. OpenRouter

Subscribe to OpenRouter's API:

```bash
ff sub 'ff://openrouter?key=YOUR_API_KEY' -a openrouter --auto
```

Supported agents:

- **claude-code**: Anthropic Claude 3.5 Sonnet via OpenRouter

### Adding Custom Built-in Providers

You can extend the built-in provider system by registering new providers in [src/core/builtin-providers.ts](src/core/builtin-providers.ts):

```typescript
builtinProviders.register({
  id: "my-provider",
  name: "My Custom Provider",
  description: "My custom provider description",
  requiresApiKey: true,
  apiKeyParam: "key",

  handler: (params: BuiltinProviderParams): SubscribeResponse => {
    const apiKey = params.params.get("key");

    if (!apiKey) {
      throw new Error("API key is required");
    }

    return {
      name: "My Custom Provider",
      description: "Provider description",
      payload: {
        providers: [
          {
            name: "claude-code",
            hash: calculateObjectHash(setting),
            setting: {
              // Your configuration here
            },
          },
        ],
        functions: [],
      },
    };
  },
});
```

## Configuration Structure

Flyfree stores all configurations in `~/.ff/`:

```
~/.ff/
├── sub.json                    # Subscription information
├── backups/                    # Configuration backups
│   └── claude-code/
│       └── 1234567890.json
└── {provider-name}/
    ├── config.json             # Provider configuration
    ├── claude-code/
    │   └── config.json         # Claude Code agent config
    └── codex/
        └── config.json         # Codex agent config
```

### sub.json Structure

```json
{
  "subscribes": {
    "provider-name": {
      "sub_url": "https://example.com/config",
      "providers": ["claude-code", "codex"],
      "status": "success",
      "updated_at": 1234567890,
      "hash": "abc123...",
      "latest_response_message": ""
    }
  },
  "setting": {
    "claude-code": {
      "provider": "provider-name"
    }
  }
}
```

## Subscription Protocol

Providers should return a JSON response with the following structure:

```json
{
  "meta": {
    "code": "error code",
    "error": "error message"
  },
  "data": {
    "name": "provider-name",
    "description": "provider description",
    "payload": {
      "providers": [
        {
          "name": "claude-code",
          "hash": "config-hash",
          "setting": {
            // Agent-specific configuration
          }
        }
      ],
      "functions": ["balance", "usage"]
    }
  }
}

```

See [docs/protocol.md](docs/protocol.md) for detailed protocol specification.

## Supported Agents

Currently supported agents:

- **Claude Code** (`~/.claude/settings.json`)

You can add more agents by editing the path mapping in the source code.

## Environment Variables

- `DEBUG=1` - Enable debug logging

## Development

```bash
# Clone the repository
git clone https://github.com/llmapis/flyfree.git
cd flyfree

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js --help

# Watch mode for development
npm run dev
```

## Examples

### Example 1: Subscribe and Auto-Apply

```bash
# Subscribe to a provider and automatically apply all configurations
ff sub https://api.example.com/llm-config -a example --auto
```

### Example 2: Manual Configuration Switch

```bash
# Subscribe without auto-apply
ff sub https://api.example.com/llm-config

# Later, switch configurations interactively
ff switch
```

### Example 3: Multiple Providers

```bash
# Subscribe to multiple providers
ff sub https://provider-a.com/config -a providerA
ff sub https://provider-b.com/config -a providerB

# Switch between them
ff switch
```

## Backup and Safety

Flyfree automatically creates backups before modifying any agent configuration:

- Backups are stored in `~/.ff/backups/{agent-name}/{timestamp}.json`
- By default, the last 10 backups are kept
- Original configurations are never modified without confirmation (unless using `--auto`)

## Troubleshooting

### No config path mapping found

If you see this warning, it means the agent is not yet configured in Flyfree. You can:

1. Check if the agent is supported
2. Manually add the path mapping in the source code
3. Open an issue to request support for the agent

### Subscription failed

Common causes:

- Invalid URL or network issues
- Invalid JSON response format
- Server timeout

Enable debug mode to see detailed error information:

```bash
DEBUG=1 ff sub https://example.com/config
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

Created with ❤️ for the AI coding community
