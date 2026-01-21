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
  let currentGroup: string | null = null
  let isCore = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("---") || trimmed.startsWith("<") || trimmed.startsWith("ALL PAGES")) {
      continue
    }

    // Check for CORE section
    if (trimmed.startsWith("CORE ")) {
      isCore = true
      currentGroup = null
      continue
    }

    // Check for group header like "DATABASE /database/"
    const groupMatch = trimmed.match(/^[A-Z0-9 ]+ \/([^/]+)\/$/)
    if (groupMatch) {
      currentGroup = groupMatch[1]
      isCore = false
      continue
    }

    // Parse items (comma-separated)
    const items = trimmed.split(",").map(s => s.trim()).filter(Boolean)
    for (const item of items) {
      if (isCore) {
        // Core items: https://docs.convex.dev/<item>.md
        urls.push(`${BASE_URL}/${item}`)
      } else if (currentGroup) {
        // Group items: https://docs.convex.dev/<group>/<item>.md
        urls.push(`${BASE_URL}/${currentGroup}/${item}`)
      }
    }
  }

  return urls
}

const testUrl = async (baseUrl: string): Promise<UrlResult> => {
  const mdUrl = `${baseUrl}.md`
  const mdStatus = await fetchStatus(mdUrl)
  
  if (mdStatus === 200) {
    return { url: baseUrl, mdStatus, working: true, workingUrl: mdUrl }
  }

  // Try without .md
  const htmlStatus = await fetchStatus(baseUrl)
  if (htmlStatus === 200) {
    return { url: baseUrl, mdStatus, htmlStatus, working: true, workingUrl: baseUrl }
  }

  return { url: baseUrl, mdStatus, htmlStatus, working: false }
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
  const mdFailed: UrlResult[] = []

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
      } else if (result.workingUrl && !result.workingUrl.endsWith(".md")) {
        mdFailed.push(result)
        console.log(`NO .MD: ${result.url} (works at ${result.workingUrl})`)
      } else {
        process.stdout.write(".")
      }
    }
  }

  console.log("\n\n=== SUMMARY ===")
  console.log(`Total URLs: ${urls.length}`)
  console.log(`Working: ${results.filter(r => r.working).length}`)
  console.log(`Broken: ${broken.length}`)
  console.log(`No .md (html only): ${mdFailed.length}`)

  if (broken.length > 0) {
    console.log("\n=== BROKEN URLs ===")
    for (const r of broken) {
      console.log(`  ${r.url}`)
    }
  }

  if (mdFailed.length > 0) {
    console.log("\n=== URLs without .md support ===")
    for (const r of mdFailed) {
      console.log(`  ${r.url} -> ${r.workingUrl}`)
    }
  }

  // Exit with error if any broken
  if (broken.length > 0) {
    process.exit(1)
  }
}

main().catch(console.error)
