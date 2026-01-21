# Convex Docs Skill

An [OpenCode](https://opencode.ai) plugin that provides AI assistants with up-to-date Convex documentation links.

## What it does

- Fetches the latest Convex docs sitemap on startup
- Parses and organizes documentation URLs by category
- Registers a `convex-docs` skill that helps AI access documentation as markdown

## Installation

Add to your OpenCode plugins directory:

```
~/.config/opencode/plugin/convex-skill-updater/
```

## Usage

Once installed, invoke the skill in OpenCode:

```
/skill convex-docs
```

The skill provides organized links to all Convex documentation pages. All pages can be fetched as markdown by appending `.md` to the URL:

```
https://docs.convex.dev/quickstart/react.md
```

## Development

```bash
# Run directly with Bun
bun run index.ts
```

## License

MIT
