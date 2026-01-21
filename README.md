# Convex Skills

An OpenCode plugin that provides two skills for AI assistants working with Convex.

## Skills

### `convex-docs`
A **token-efficient** sitemap of all Convex documentation pages. The skill explains how to construct URLs so LLMs can fetch any doc page as markdown.

- Auto-updates from the Convex sitemap on OpenCode startup
- Only updates when the sitemap has actually changed

### `convex-rules`
Minimal coding rules and patterns for generating correct Convex code. Covers:

- Function definitions with validators
- Database access patterns
- Query and mutation rules
- Actions, HTTP endpoints, crons
- TypeScript best practices

## Installation

Add to your OpenCode config plugin array:

```
"@spoons-and-mirrors/skill-convex-docs@latest"
```
