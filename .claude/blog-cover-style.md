# Blog cover-image style reference

Canonical specification for cover images on lystic.dev blog posts. All covers
share one aesthetic so the index reads as a coherent set.

## Style anchor (verbatim)

Prepend this string to every per-post image prompt. Do not paraphrase.

> High-contrast stenciled propaganda-poster illustration, two-tone palette of
> off-white and a single bold red-orange accent on charcoal, halftone and paper
> texture, bold silhouette focal motif, no text, no letters, no logos, no
> symbols.

## Per-post prompt structure

```
<style anchor> Subject: <topic-specific motif distilled from the post's title,
frontmatter description, and a skim of the body>.
```

Keep the `Subject:` clause concrete and visual — name the silhouette(s), the
action, and where the red-orange accent lands. Do not name brands or include
any text the model could try to letter on the cover.

## Generation knobs

Invoke via `.claude/skills/generate-image/generate.sh`:

- `--aspect-ratio 16:9` — fits the in-page hero and OG/Twitter card layout.
- `--resolution 2k`
- `--name <slug>-cover` — slug matches the post's frontmatter `slug`.
- Default model (`grok-imagine-image-pro`).

## Output convention

- File: `web/public/blog/<slug>/cover.png`
- Frontmatter: `image: /blog/<slug>/cover.png`

The `image` field is parsed in `web/src/pages/blog/posts/index.ts` and flows
through `<Post>` → `<PageMeta>` → `og:image` / `twitter:image` automatically.

## Pointer for future tickets

When wiring this style into `.claude/skills/write-blog-post/`, pull the style
anchor from this file rather than re-deriving it. This file is the single
source of truth.
