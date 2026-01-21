#!/usr/bin/env bun
/**
 * Test script to validate all URLs in SKILL.md
 * Tries each URL as .md first, then without .md
 * Reports broken URLs that need to be fixed or removed
 */

import { readFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const BASE_URL = "https://docs.convex.dev"

interface UrlResult {
  url: string
  mdStatus: number | "error"
  htmlStatus?: number | "error"
  working: boolean
  workingUrl?: string
  mdWorks: boolean
}

const fetchStatus = async (url: string): Promise<number | "error"> => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(url, { 
      method: "HEAD", 
      signal: controller.signal,
      redirect: "follow"
    })
    clearTimeout(timeout)
    return response.status
  } catch {
    return "error"
  }
}

const parseSkillMd = (content: string): string[] => {
  const urls: string[] = []
  const lines = content.split(/\r?\n/)
  let currentPath: string | null = null
  let pathEndsDot = false
  let isCore = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("---") || trimmed.startsWith("<") || trimmed.startsWith("HOW TO") || trimmed.startsWith("-") || trimmed.startsWith("Example") || trimmed.startsWith("IMPORTANT") || trimmed.startsWith("FORMAT") || trimmed.startsWith("Items") || trimmed.startsWith("All pages")) {
      continue
    }

    // Check for CORE section
    if (trimmed.startsWith("CORE ")) {
      isCore = true
      currentPath = null
      continue
    }

    // Check for section header - can end with / or .
    // Examples: "DATABASE /database/" or "API CLASSES SERVER /api/classes/server."
    const slashMatch = trimmed.match(/^[A-Z0-9 ]+ (\/[^\/]+\/)$/)
    const dotMatch = trimmed.match(/^[A-Z0-9 ]+ (\/[^\s]+\.)$/)
    
    if (slashMatch) {
      currentPath = slashMatch[1]
      pathEndsDot = false
      isCore = false
      continue
    }
    
    if (dotMatch) {
      currentPath = dotMatch[1]
      pathEndsDot = true
      isCore = false
      continue
    }

    // Parse items (comma-separated)
    const items = trimmed.split(",").map(s => s.trim()).filter(Boolean)
    for (const item of items) {
      if (isCore) {
        // Core items: https://docs.convex.dev/<item>
        urls.push(`${BASE_URL}/${item}`)
      } else if (currentPath) {
        if (pathEndsDot) {
          // Dot-prefix path: https://docs.convex.dev/api/classes/server.Auth
          urls.push(`${BASE_URL}${currentPath}${item}`)
        } else {
          // Slash path: https://docs.convex.dev/database/schemas
          urls.push(`${BASE_URL}${currentPath}${item}`)
        }
      }
    }
  }

  return urls
}

const testUrl = async (baseUrl: string): Promise<UrlResult> => {
  const mdUrl = `${baseUrl}.md`
  const mdStatus = await fetchStatus(mdUrl)
  
  if (mdStatus === 200) {
    return { url: baseUrl, mdStatus, working: true, workingUrl: mdUrl, mdWorks: true }
  }

  // Try without .md
  const htmlStatus = await fetchStatus(baseUrl)
  if (htmlStatus === 200) {
    return { url: baseUrl, mdStatus, htmlStatus, working: true, workingUrl: baseUrl, mdWorks: false }
  }

  return { url: baseUrl, mdStatus, htmlStatus, working: false, mdWorks: false }
}

const main = async () => {
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const skillPath = join(scriptDir, "..", "SKILL.md")
  
  console.log("Reading SKILL.md...")
  const content = await readFile(skillPath, "utf8")
  
  console.log("Parsing URLs...")
  const urls = parseSkillMd(content)
  console.log(`Found ${urls.length} URLs to test\n`)

  const results: UrlResult[] = []
  const broken: UrlResult[] = []
  const noMdSupport: UrlResult[] = []

  // Test in batches of 10 for parallel execution
  const batchSize = 10
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(testUrl))
    
    for (const result of batchResults) {
      results.push(result)
      if (!result.working) {
        broken.push(result)
        console.log(`BROKEN: ${result.url} (md: ${result.mdStatus}, html: ${result.htmlStatus})`)
      } else if (!result.mdWorks) {
        noMdSupport.push(result)
        console.log(`NO .MD: ${result.url}`)
      } else {
        process.stdout.write(".")
      }
    }
  }

  console.log("\n\n=== SUMMARY ===")
  console.log(`Total URLs: ${urls.length}`)
  console.log(`Working with .md: ${results.filter(r => r.mdWorks).length}`)
  console.log(`Working without .md only: ${noMdSupport.length}`)
  console.log(`Completely broken: ${broken.length}`)

  if (noMdSupport.length > 0) {
    console.log("\n=== URLs that do NOT accept .md (html only) ===")
    for (const r of noMdSupport) {
      console.log(`  ${r.url.replace(BASE_URL + "/", "")}`)
    }
    console.log("\nThese should be excluded from SKILL.md or noted in the intro.")
  }

  if (broken.length > 0) {
    console.log("\n=== BROKEN URLs (neither .md nor html works) ===")
    for (const r of broken) {
      console.log(`  ${r.url.replace(BASE_URL + "/", "")} (md: ${r.mdStatus}, html: ${r.htmlStatus})`)
    }
  }

  // Exit with error if any broken
  if (broken.length > 0) {
    process.exit(1)
  }
}

main().catch(console.error)
