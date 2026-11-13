<!-- BEGIN:global-skills-integration -->
# Shared Agent Skills and MCPs

At the start of work, read this project's existing instructions and inspect its actual stack and task. Project-specific requirements take precedence over shared guidance.

- Shared skills: `../../TOOLS/Global_Skills`. Choose only the relevant `SKILL.md` files for the current stack and task; read their linked references only when needed. Do not load every skill or claim a skill was used if it was unavailable.
- Project guidance: read `../../TOOLS/Global_Skills/Project_Skills/Aeorax-Live/best_skill.md` when it exists.
- MCP sources and setup notes: `../../TOOLS/MCP`. Use an MCP only when the current agent shows that server as available and its capability helps the task. For browser flows/performance use Playwright or Chrome DevTools; for search visibility/indexing use Google Search Console; for other services use their relevant configured MCP. A folder or config entry alone does not prove a server is connected.
- Keep changes within the requested project and its existing architecture. Do not change production systems, deploy, alter live data, or perform external write actions unless the user requested that action.
- Run tests or verification commands only when the user explicitly requests testing or verification. Never add or run tests otherwise.
<!-- END:global-skills-integration -->
