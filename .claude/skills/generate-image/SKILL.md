---
name: generate-image
description: Generate images via xAI's Grok Imagine API and save them to /tmp/. Use when asked to generate, create, render, draw, or make an image, picture, illustration, cover, mockup, diagram, or artwork.
---

# Skill: Generate Image

Generate images on demand via xAI's Grok Imagine API. The skill is **generic** — use it for any image generation need (blog covers, mockups, diagrams, illustrations, hero images, social cards, etc.). It is not blog-specific.

## When this skill triggers

Invoke when the user asks for things like:

- "Generate an image of …"
- "Create / make / render / draw a picture of …"
- "Make a cover image for …"
- "I need an illustration / mockup / diagram of …"
- "Render a hero image / social card / thumbnail …"

## Output location

The skill writes to `/tmp/<slug>-<timestamp>.<ext>` (or `/tmp/<slug>-<timestamp>-<index>.<ext>` when generating multiple). It prints absolute paths to stdout, one per line.

The extension is auto-detected from the decoded image's magic bytes — typically `.jpg` (xAI returns JPEG in practice) but PNG / WEBP / GIF are also handled.

**You (the invoking Claude) are responsible for moving / renaming the file** to wherever the actual task needs it. For example:

- Blog post cover → `web/public/blog/<slug>/cover.png`
- Generic asset → wherever the user asked for it

Do not move the file unless the user's task requires it. If they just asked for an image, leaving it at the printed `/tmp/` path and reporting the path is enough.

## Setup

The skill reads `XAI_API_KEY` from the environment and fails fast if it's unset. The user must export it themselves — for example, in `~/.zshrc`:

```sh
export XAI_API_KEY=xai-...
```

**Do not modify the user's shell profile or `.claude/settings.json` automatically.** If the env var is missing, surface the error from the script (which already explains how to set it) and stop.

## Usage

Run the script. The prompt may be passed positionally or via `--prompt`:

```sh
.claude/skills/generate-image/generate.sh "a moody cyberpunk skyline at dusk, neon reflections on wet pavement"
```

```sh
.claude/skills/generate-image/generate.sh \
    --prompt "isometric diagram of a zero-trust relay server" \
    --aspect-ratio 16:9 \
    --resolution 2k \
    --name relay-diagram
```

Capture the printed path(s) — that's where the image landed.

## Arguments

| Arg | Required | Default | Notes |
| --- | --- | --- | --- |
| `prompt` (positional or `--prompt`) | yes | — | The text prompt. |
| `--model` | no | `grok-imagine-image-pro` | Override to fall back to `grok-imagine-image` or use a future model without editing this skill. |
| `--aspect-ratio` | no | `auto` | One of: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`, `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`, `auto`. |
| `--resolution` | no | `1k` | `1k` or `2k`. |
| `--n` | no | `1` | Number of images, 1–10. Each is written to a separate `/tmp/<slug>-<timestamp>-<i>.png`. |
| `--name` | no | derived from prompt | Filename slug. The script lowercases it and replaces non-alphanumerics with `-`. |

## Behavior contract

- Uses `response_format: b64_json` so images are decoded locally — no dependence on temporary URLs that expire.
- Detects the file format from magic bytes after decoding and uses the correct extension (`.jpg`, `.png`, `.webp`, `.gif`).
- On HTTP 4xx/5xx, the script prints the response body to stderr and exits non-zero so failures are debuggable.
- Exits non-zero with a readable message if `XAI_API_KEY` is unset, if `prompt` is empty, or if `--n` is out of range.
- No external dependencies beyond `bash`, `curl`, `jq`, and `base64` (all already on the dev machine).

## What this skill does NOT do

- Does not move files out of `/tmp/`. The caller decides where the image belongs.
- Does not register itself with any other skill or hook. Invocation is on-demand.
- Does not write secrets or keys anywhere. The API key lives only in the user's environment.
