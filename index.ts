import type { Plugin } from "@opencode-ai/plugin"
import { readFile, writeFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const sitemapUrl = "https://docs.convex.dev/sitemap.xml"

type Orders = {
  groupOrder: string[]
  groupLabels: Record<string, string>
  itemOrder: Record<string, string[]>
}

const parseTimestamp = (value: string | undefined) => {
  if (!value) return null
  const normalized = value.trim().replace(" UTC", "Z").replace(" ", "T")
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatUtc = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(
    date.getUTCHours(),
  )}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`
}

const parseExistingOrders = (content: string): Orders => {
  const lines = content.split(/\r?\n/)
  const groupOrder: string[] = []
  const groupLabels: Record<string, string> = {}
  const itemOrder: Record<string, string[]> = {}
  let currentGroup: string | null = null

  const addItems = (group: string, line: string) => {
    const items = line
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    if (!itemOrder[group]) itemOrder[group] = []
    for (const item of items) {
      if (!itemOrder[group].includes(item)) itemOrder[group].push(item)
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      currentGroup = null
      continue
    }
    if (trimmed.startsWith("CORE ")) {
      currentGroup = "__core__"
      if (!groupOrder.includes("__core__")) groupOrder.push("__core__")
      continue
    }
    const headingMatch = trimmed.match(/^([A-Z0-9 ]+) \/([^/]+)\/$/)
    if (headingMatch) {
      const label = headingMatch[1].trim()
      const segment = headingMatch[2].trim()
      currentGroup = segment
      if (!groupOrder.includes(segment)) groupOrder.push(segment)
      groupLabels[segment] = label
      continue
    }
    if (currentGroup) {
      addItems(currentGroup, trimmed)
    }
  }

  return { groupOrder, groupLabels, itemOrder }
}

const wrapList = (items: string[], maxLen = 100) => {
  const lines: string[] = []
  let line = ""
  for (const item of items) {
    if (!line) {
      line = item
      continue
    }
    const candidate = `${line}, ${item}`
    if (candidate.length <= maxLen) {
      line = candidate
    } else {
      lines.push(line)
      line = item
    }
  }
  if (line) lines.push(line)
  return lines.join("\n")
}

const sortByOrder = (items: string[], preferred: string[] = []) => {
  const preferredSet = new Set(preferred)
  const ordered = preferred.filter((item) => items.includes(item))
  const rest = items.filter((item) => !preferredSet.has(item)).sort()
  return [...ordered, ...rest]
}

const extractLastMod = (xml: string) => {
  const lastmodRegex = /<lastmod>([^<]+)<\/lastmod>/g
  let match: RegExpExecArray | null
  let newest: Date | null = null
  while ((match = lastmodRegex.exec(xml))) {
    const date = new Date(match[1])
    if (!Number.isNaN(date.getTime())) {
      if (!newest || date > newest) newest = date
    }
  }
  return newest
}

const extractUrls = (xml: string) => {
  const urls: string[] = []
  const locRegex = /<loc>([^<]+)<\/loc>/g
  let match: RegExpExecArray | null
  while ((match = locRegex.exec(xml))) {
    urls.push(match[1])
  }
  return urls
}

const compactifyItems = (items: string[], depth = 0): string[] => {
  // Check for standalone index first
  const hasStandaloneIndex = items.includes("index")
  const itemsToProcess = items.filter((i) => i !== "index")
  
  // Group items by their prefix (first path segment)
  const prefixGroups: Record<string, string[]> = {}
  const standalone: string[] = []

  for (const item of itemsToProcess) {
    const slashIdx = item.indexOf("/")
    if (slashIdx === -1) {
      standalone.push(item)
    } else {
      const prefix = item.slice(0, slashIdx)
      const rest = item.slice(slashIdx + 1)
      if (!prefixGroups[prefix]) prefixGroups[prefix] = []
      prefixGroups[prefix].push(rest)
    }
  }

  // Build compact output: index first (if exists), then standalone, then prefix groups
  const result: string[] = []
  
  // Add standalone index first
  if (hasStandaloneIndex) {
    result.push("index")
  }
  
  // Add other standalone items (sorted)
  result.push(...standalone.sort())
  
  // Add prefix groups with recursive compactification
  for (const [prefix, suffixes] of Object.entries(prefixGroups).sort(([a], [b]) => a.localeCompare(b))) {
    // Recursively compactify suffixes that may have nested prefixes
    const compacted = depth < 2 ? compactifyItems(suffixes, depth + 1) : suffixes.sort()
    
    // First item keeps the prefix, rest are just suffixes
    const [first, ...rest] = compacted
    result.push(`${prefix}/${first}`)
    result.push(...rest)
  }

  return result
}

const DEFAULT_INTRO = `ALL PAGES ARE ACCESSIBLE AS MARKDOWN, WHICH IS THE VERSION YOU MUST ACCESS AND NOT THE HTML PAGE!!!
LIKE SO: https://docs.convex.dev/quickstart/react.md`

const extractIntro = (content: string): string => {
  // Extract text between frontmatter and <convex-docs-list>
  const afterFrontmatter = content.replace(/^---[\s\S]*?---\n*/, "")
  const match = afterFrontmatter.match(/^([\s\S]*?)<convex-docs-list>/m)
  return match ? match[1].trim() : DEFAULT_INTRO
}

const buildSkillContent = (items: {
  updatedAt: Date
  core: string[]
  groups: Record<string, string[]>
  orders: Orders
  intro: string
}) => {
  const { updatedAt, core, groups, orders, intro } = items
  const lines: string[] = []
  lines.push("---")
  lines.push("name: convex-docs")
  lines.push("description: Get convex documentation LINKS so you can fetch them as markdown")
  lines.push("metadata:")
  lines.push(`  updated: ${formatUtc(updatedAt)}`)
  lines.push("---")
  lines.push("")
  lines.push(intro)
  lines.push("")
  lines.push("<convex-docs-list>")
  lines.push("")
  lines.push("CORE https://docs.convex.dev/")
  lines.push(wrapList(core))
  lines.push("")

  const groupNames = Object.keys(groups)
  const orderedGroups = sortByOrder(groupNames, orders.groupOrder.filter((item) => item !== "__core__"))
  for (const group of orderedGroups) {
    const label = orders.groupLabels[group] ?? group.toUpperCase().replace(/-/g, " ")
    const compactItems = compactifyItems(groups[group])
    lines.push(`${label} /${group}/`)
    lines.push(wrapList(compactItems, 100))
    lines.push("")
  }

  lines.push("</convex-docs-list>")

  return `${lines.join("\n").trimEnd()}\n`
}

const updateSkill = async (skillPath: string) => {
  const existing = await readFile(skillPath, "utf8")
  const existingUpdated = parseTimestamp(existing.match(/updated:\s*(.+)/)?.[1])
  const orders = parseExistingOrders(existing)

  const response = await fetch(sitemapUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`)
  }
  const xml = await response.text()
  const sitemapUpdated = extractLastMod(xml) ?? parseTimestamp(response.headers.get("last-modified") ?? undefined)

  if (existingUpdated && sitemapUpdated && sitemapUpdated <= existingUpdated) {
    return
  }

  const urls = extractUrls(xml)
  
  // First pass: collect all paths and identify sections (paths with children)
  const singleSegmentPaths = new Set<string>()
  const multiSegmentPaths: { group: string; rest: string; hasTrailingSlash: boolean }[] = []
  const trailingSlashSections = new Set<string>()
  
  for (const url of urls) {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      continue
    }
    if (parsed.host !== "docs.convex.dev") continue
    let pathname = parsed.pathname
    const hasTrailingSlash = pathname.endsWith("/")
    pathname = pathname.replace(/\.md$/, "")
    const trimmed = pathname.replace(/\/+$/, "").replace(/^\//, "")
    
    if (!trimmed) {
      singleSegmentPaths.add("home")
      continue
    }
    
    const segments = trimmed.split("/")
    
    if (segments.length === 1) {
      singleSegmentPaths.add(segments[0])
      if (hasTrailingSlash) trailingSlashSections.add(segments[0])
      continue
    }
    
    const group = segments[0]
    let rest = segments.slice(1).join("/")
    if (!rest) rest = "index"
    if (hasTrailingSlash && !rest.endsWith("/index")) rest = `${rest}/index`
    multiSegmentPaths.push({ group, rest, hasTrailingSlash })
  }
  
  // Second pass: build groups from multi-segment paths
  const groupMap: Record<string, Set<string>> = {}
  const sectionsWithChildren = new Set<string>()
  
  for (const { group, rest } of multiSegmentPaths) {
    sectionsWithChildren.add(group)
    if (!groupMap[group]) groupMap[group] = new Set()
    groupMap[group].add(rest)
  }
  
  // Add "index" for sections that have a single-segment page (e.g., /agents as index for /agents/*)
  for (const section of sectionsWithChildren) {
    if (singleSegmentPaths.has(section) || trailingSlashSections.has(section)) {
      groupMap[section].add("index")
    }
  }
  
  // CORE = single-segment paths that have NO children (true standalone pages)
  const coreItems = [...singleSegmentPaths].filter((item) => !sectionsWithChildren.has(item))
  const core = sortByOrder(coreItems, orders.itemOrder.__core__ ?? [])
  
  const groups: Record<string, string[]> = {}
  for (const [group, set] of Object.entries(groupMap)) {
    groups[group] = sortByOrder([...set], orders.itemOrder[group] ?? [])
  }

  const updatedAt = sitemapUpdated ?? new Date()
  const intro = extractIntro(existing)
  const nextContent = buildSkillContent({ updatedAt, core, groups, orders, intro })

  // Compare content excluding the timestamp to avoid unnecessary I/O
  const stripTimestamp = (content: string) => content.replace(/^\s*updated:\s*.+$/m, "")
  if (stripTimestamp(nextContent) === stripTimestamp(existing)) {
    return
  }

  await writeFile(skillPath, nextContent, "utf8")
}

export const ConvexSkillUpdater: Plugin = async () => {
  const pluginDir = dirname(fileURLToPath(import.meta.url))
  // When running from dist/, SKILL.md is in parent directory
  const skillPath = join(pluginDir, "..", "SKILL.md")

  try {
    await updateSkill(skillPath)
  } catch {
    // Silently fail - skill will use existing content
  }

  // Read the skill content and register it
  const skillContent = await readFile(skillPath, "utf8")
  // Strip frontmatter to get just the content
  const contentWithoutFrontmatter = skillContent.replace(/^---[\s\S]*?---\n*/, "")

  return {
    config: async (input) => {
      ;(input as any).skill["convex-docs"] = {
        description: "Get convex documentation LINKS so you can fetch them as markdown",
        content: contentWithoutFrontmatter,
      }
    },
  }
}

// Auto-run when executed directly (Bun-specific)
if ((import.meta as any).main) {
  await ConvexSkillUpdater({} as any)
}
