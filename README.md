# Lystic's Web Platform

Hi! I got bored at work and decided I wanted to expand my personal web services and make them open source.

The goal is to create zero-trust systems where any data which hits my servers is completely encrypted on the client side.

Feel free to open a PR and make changes, but if you do anything complex I won't understand it and won't merge it!

## Architecture

- **Frontend** — React + TypeScript SPA built with Vite (`web/`)
- **Backend** — Go server using Echo, serves the SPA and API routes (`server/`)
- **Docker** — Multi-stage Dockerfile builds both frontend and backend into a single Alpine image

## Services

| Service | Status | Description |
|---------|--------|-------------|
| home | Done | Homepage |
| blog | Done | Personal blog (MDX) |
| secret | Done | Zero-trust secret sharing (client-side encryption) |
| edit | Done | Collaborative markdown editor |
| swap | Done | Fee-less Uniswap frontend alternative + Aave lending |
| upload | WIP | Password-protected file uploader |

## Dependencies

MongoDB is used for persistent secret storage but is **optional**. If the `MONGO_URI` and `MONGO_DB` environment variables are not set, the server falls back to in-memory storage (secrets won't survive restarts).

## Configuration

See [server/README.md](server/README.md) for server configuration.
See [web/README.md](web/README.md) for frontend configuration.

## TODO

- p2p screen sharing (using Chrome API & WebRTC to avoid sending data to the server)
- file converter (ideally in-browser using WebAssembly)
- enable mongodb secret sharing and horizontal scaling
- enable mongodb for editor
- support horizontal scaling for pods w/ collaborative editor
- reimagine the "upload" functionality
- put PING game on the website & add a leaderboard

Feel free to add a PR suggesting new services!

## Blog Post Migration TODO

Posts that need updating from legacy format to modern MDX style.

### Full migration needed (legacy WordPress/HTML format)

- [ ] 2016/Advanced script variable hiding — needs: frontmatter
- [ ] 2016/ArmA 3 UI Execution Exploit - In Detail — needs: frontmatter, HTML→markdown, Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks
- [ ] 2016/Blocking Scripted Remote Execution — needs: frontmatter, HTML→markdown, Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks
- [ ] 2016/CSharp Arma Extension command parsing — needs: frontmatter, HTML→markdown, Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks
- [ ] 2016/Draw3D Interactive Menu — needs: frontmatter, HTML→markdown, Gyazo→lystic images, WordPress markup cleanup ([embed]), code screenshots→code blocks
- [ ] 2016/Having AI run after and kill you — needs: frontmatter, HTML→markdown, Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks
- [ ] 2016/How do Anticheats work — needs: frontmatter, HTML→markdown (ol/li/strong/em/hr), Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks
- [ ] 2016/How to detect hint menus — needs: frontmatter, HTML→markdown, Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks
- [ ] 2016/Manipulating vehicle locality — needs: frontmatter, HTML→markdown (ol/li), Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks
- [ ] 2016/Securing publicVariableEventHandlers — needs: frontmatter, HTML→markdown (ol/li), Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks
- [ ] 2016/Server password bruteforcing — needs: frontmatter, HTML→markdown (a/strong), Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks
- [ ] 2016/What do cheaters use on ArmA 3 servers — needs: frontmatter, HTML→markdown (a/strong/em/hr), Gyazo→lystic images, WordPress markup cleanup, code screenshots→code blocks

### Partial migration needed

- [ ] 2017/Hardware Packet Monitor - Raspberry PI — needs: frontmatter, HTML→markdown (blockquote/a/strong/em/video)
- [ ] 2017/extDB2 Exploit And Why You Should Use SQL_CUSTOM_V2 — needs: HTML img→markdown, WordPress classes cleanup, code screenshots→code blocks (has TODOs in file)
- [ ] 2021/Executing SQF Without Allocating Memory — needs: HTML div/iframe→YouTube component or markdown
- [ ] 2021/CallExtension in DayZ — needs: HTML `<b>`→markdown `**bold**`

### Content WIP / Incomplete

- [ ] 2022/DMA Code Execution — marked "THIS ARTICLE IS INCOMPLETE AND NEEDS REVIEWED"
- [ ] 2026/Creating Your First PCB — stub only, `visible: false`, no content, description is "TODO"
