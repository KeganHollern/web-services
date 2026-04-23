# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Two top-level apps sharing one deployment:

- `server/` — Go (Echo) backend. Serves the built SPA from `dist/` AND exposes `/api/*` routes.
- `web/` — React 19 + TypeScript SPA built with Vite. Output lands in `web/dist/`, which the Go binary serves at runtime.
- `Dockerfile` at the repo root is a multi-stage build that produces a single Alpine image containing both.

There is no root-level package manager — all commands run inside `server/` or `web/`.

## Commands

**Frontend (`cd web`):**
- `npm run dev` — Vite dev server. Proxies `/api` → `http://localhost` (port 80), so the Go server must be running on :80 for API calls to work in dev.
- `npm run build` — runs `tsc -b` (project-referenced build across [tsconfig.app.json](web/tsconfig.app.json) and [tsconfig.node.json](web/tsconfig.node.json)) then `vite build`.
- `npm run lint` — ESLint across the project.
- `npm test` — Vitest (runs once, non-watch). Single file: `npx vitest run path/to/file.test.ts`. Single test: add `-t "test name"`.

**Backend (`cd server`):**
- `go run main.go` — starts Echo on `:80`. Requires env `upload_password` (see [.vscode/launch.json](.vscode/launch.json) — uses `"localhost"` for local dev).
- `go test ./...` — all tests. Single package: `go test ./api/editor`. Single test: `go test ./api/editor -run TestName`.
- No lint command is wired up; the `.claude/hooks/golangci-lint.sh` hook runs `golangci-lint` automatically on edited `.go` files (see Automation below).

**Combined dev (VS Code):** the `Compound` launch config in [.vscode/launch.json](.vscode/launch.json) starts `Launch Server` + `Web UI` together.

## Architecture essentials

### Subdomain-based SPA routing
One SPA, many services. [main.tsx](web/src/main.tsx) mounts a single `<DomainRouter />` ([web/src/pages/domain-router.tsx](web/src/pages/domain-router.tsx)) which reads a subdomain from `SubdomainProvider` and dispatches to a per-service router: `HomeRouter`, `BlogRouter`, `SecretRouter`, `EditRouter`, `SwapRouter`, `UploadRouter`, `ShareRouter`. Adding a new service = adding a folder under `web/src/pages/<name>/`, exporting a `<NameRouter>`, and wiring it into the `switch` in `GetPageRouter`.

### Zero-trust server
This is a core design invariant, not a nice-to-have. The server stores/relays ciphertext only and never holds key material:

- **`/api/secret`** — one-time secrets. Payload is already encrypted client-side; server just stores the blob until retrieval. Key lives in the URL fragment.
- **`/api/share`** — two-peer WebSocket relay for screen-share / P2P signaling. See [server/api/share/README.md](server/api/share/README.md). Server forwards opaque frames verbatim, never parses, never logs payloads.
- **`/api/editor/ws/:id`** — collaborative Yjs/Monaco editor over WebSocket. Uses CRDT updates.
- **`/api/upload`** — password-gated file upload (the one non-zero-trust service; gated by `upload_password` env).

When touching any of these, keep payloads opaque on the server side. If you find yourself adding JSON parsing or logging of bytes the client sent, stop and reconsider.

### Storage: Mongo-or-memory with a common interface
Each API package (`secret`, `editor`) defines a store interface in `store.go` and ships two implementations: `memory_store.go` and `mongo_store.go`. [main.go](server/main.go) tries MongoDB first (via `db.Connect()` reading `MONGO_URI` / `MONGO_DB`) and falls back to in-memory if either is unset or connection fails. Memory-only means data does not survive restarts — this is documented, intentional, and visible to users only via the warning log on startup. The `share` package is in-memory only by design (see its README).

### Frontend conventions
- Path alias: `@/` → `web/src/` (configured in [vite.config.ts](web/vite.config.ts) and `tsconfig.*.json`).
- UI components: shadcn/ui generated into [web/src/components/ui/](web/src/components/ui/); app-level components live directly under [web/src/components/](web/src/components/). Tailwind v4 via `@tailwindcss/vite`.
- Wallet stack for `/swap`: RainbowKit + wagmi + viem + Uniswap + Aave SDKs. `vite-plugin-node-polyfills` is loaded specifically because these SDKs need Node built-ins in the browser.
- Blog posts are MDX files under [web/src/pages/blog/posts/YYYY/](web/src/pages/blog/posts/). They're discovered at build time via `import.meta.glob` in [web/src/pages/blog/posts/index.ts](web/src/pages/blog/posts/index.ts) — no manual registration. Frontmatter is parsed with `gray-matter`. A custom SQF grammar ([web/src/pages/blog/sqf-grammar.ts](web/src/pages/blog/sqf-grammar.ts)) is wired into Shiki for Arma 3 code samples. Use the `write-blog-post` skill when authoring/updating posts.

## Automation

`.claude/settings.json` registers **PostToolUse hooks** that run after any `Write | Edit | MultiEdit`:

- `.claude/hooks/golangci-lint.sh` — on `.go` files: runs `golangci-lint run --fix` on the enclosing package, filters output to the edited file, blocks with errors if any remain. The hook does not revert the edit.
- `.claude/hooks/typescript-check.sh` — on `.ts`/`.tsx` files: runs `tsc -b --noEmit` from the nearest tsconfig, filters output to the edited file, blocks with errors if any remain.

Both are "block with feedback" — Claude will receive the errors and is expected to fix them before continuing. Don't disable or circumvent these without a reason.

## Issue-driven automation (CI)

[.github/workflows/claude.yml](.github/workflows/claude.yml) runs `anthropics/claude-code-action@v1` in two agent-mode jobs:

- `auto-resolve-issue` fires when the repo owner opens an issue, OR when the repo owner comments `@claude` on an existing issue (re-trigger). It attempts to open a PR closing the issue, and labels that PR `claude`.
- `pr-follow-up` fires on comments/reviews against `claude`-labeled PRs when the sender is the repo owner, and either pushes fixes or replies in-thread.

All triggers are gated to the repo owner — non-owners cannot invoke Claude via this workflow. The `claude` label must exist in the repo — if missing, create it with `gh label create claude --color 5319E7`.
