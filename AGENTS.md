<!-- BEGIN:tools-ecosystem-integration -->
# Autonomous Tool, Skill & MCP Ecosystem

You are connected to the central developer toolkit located at `../TOOLS`.
ALWAYS resolve capabilities automatically based on user intent—NEVER require the user to specify tool or skill names manually.

### 1. Intent-to-Tool Auto-Routing Matrix
- **SEO & Search Visibility** ("SEO ठीक करो", "Google ranking", "schema", "meta tags", "sitemap", "site health"):
  - Automatically load: `../TOOLS/Global_Skills/seo-audit` & `../TOOLS/Global_Skills/beyondseo`
  - Structured Data / Rich Snippets: `../TOOLS/Global_Skills/schema` (JSON-LD)
  - AI & Answer Engine Visibility (ChatGPT, Perplexity): `../TOOLS/Global_Skills/ai-seo`
  - Scaled Template Pages: `../TOOLS/Global_Skills/programmatic-seo`
  - Live Google Search Console Data: Use MCP server `google-search-console`
- **Performance & Page Speed** ("स्पीड बढ़ाओ", "page load", "Core Web Vitals", "LCP", "CLS"):
  - Run Google Lighthouse audit: `lighthouse <url> --output=json`
  - Runtime DOM/Network inspection: Use MCP server `chrome-devtools`
  - Performance best practices: `../TOOLS/Global_Skills/Performance`
- **Security & Vulnerability Audit** ("सिक्योरिटी चेक", "auth check", "tenant isolation", "pentest"):
  - Comprehensive pre-flight security: `../TOOLS/Global_Skills/Production-Security-Audit`
  - Auth, RBAC & Multi-tenancy: `../TOOLS/Global_Skills/Auth-RBAC-Multitenancy`
  - Input hygiene & OWASP: `../TOOLS/Global_Skills/Security`
- **Reverse Engineering & Dynamic Analysis** ("reverse engineer", "inspect app", "disassemble"):
  - Advanced analysis MCP server: `../TOOLS/MCP/rea`
- **Multi-Agent Orchestration Swarms** ("multi-agent", "swarm", "autonomous feature"):
  - Autonomous coordination harness: `../TOOLS/Harnesses/ruflo`
- **Full-Stack Architecture & Frameworks**:
  - Auto-detect codebase tech and activate matching skill from `../TOOLS/Global_Skills/` (`NextJS`, `React`, `TypeScript`, `Prisma`, `PostgreSQL`, `Docker`, `Coolify`, `Railway`, `API-Backend`, `API-Contracts`).
- **Central Inventory & Ledger**:
  - Consult `../TOOLS/INVENTORY.md` for live capability descriptions, versions, and update statuses.

### 2. Autonomous Execution Guidelines
1. Do not ask the user which tool or skill to use; select the best matching capability from `../TOOLS` immediately.
2. Respect existing project architecture, conventions, and file structures.
3. Never alter production deployments or databases without explicit confirmation.
4. Run tests or verification commands only when explicitly requested.
<!-- END:tools-ecosystem-integration -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
