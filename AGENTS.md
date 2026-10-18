<!-- BEGIN:global-skills-integration -->
# Global Skills Integration

Shared skills are located at:
../Global_Skills

Before substantial work:
1. Inspect this project's actual technology stack.
2. Load only relevant skills from ../Global_Skills according to GLOBAL_SKILL_ROUTER.md.
3. Use Project-Architecture for structural decisions and module placement.
4. Use Database-Safety before running migrations or making schema changes.
5. Use Auth-RBAC-Multitenancy for sensitive tenant-scoped backend logic.
6. Use Testing before declaring implementation complete.
7. Check ../Global_Skills/Project_Skills/Aeorax-Live/best_skill.md if it exists.
8. Project-specific rules override shared skills.
9. Never change deployment architecture unless explicitly requested.
<!-- END:global-skills-integration -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
