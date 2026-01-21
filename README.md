# Convex Docs Skill

An opencode plugin that loads a `skill` for AI assistants to get up-to-date Convex documentation links. The skill provides a **token efficient** sitemap for all Convex documentation pages.

## What it does

- Fetches the latest Convex docs sitemap on opencode startup
- Update the SKILL.md file if the sitemap has changed
- Registers a `convex-docs` skill for LLMs to use

## Installation

Add to your OpenCode config plugin array:

```
"@spoons-and-mirrors/skill-convex-docs@latest"
```
