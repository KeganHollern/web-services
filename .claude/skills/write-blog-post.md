# Skill: Write Blog Post

Write blog posts for lystic.dev matching Kegan's established voice and conventions.

## File Location & Naming

- Posts live in `web/src/pages/blog/posts/<YEAR>/`
- Filename format: `<N>. <Title>.mdx` where N is the next sequential number for that year
- Extension is always `.mdx`

## Frontmatter

```yaml
---
title: Full Post Title
description: |
    Copy of the opening 1-2 sentences of the post verbatim.
    This displays as a preview on the main blog listing page.
slug: kebab-case-slug
visible: true
---
```

- `title`: Full title, title case
- `description`: Multi-line using `|` pipe syntax. This is an **exact copy** of the first 1-2 sentences of the post body. It displays on the main page as a preview snippet. Keep to 1-2 sentences max.
- `slug`: kebab-case, used as the URL path
- `visible`: Set to `false` for drafts; omit or set `true` for published posts

## Post Structure

1. **H1 Title** - `# Title` matching the frontmatter title exactly
2. **Optional epigraph** - A blockquote (`>`) with a relevant quote, definition, or callout. Not every post has one, but many do.
3. **Opening hook** - 1-3 paragraphs establishing personal context and the problem. Always first person. The first 1-2 sentences here must match the `description` frontmatter exactly.
4. **Section breaks** - Use `---` horizontal rules to separate major sections (typically 2-5 per post)
5. **Technical body** - Problem exploration, code examples, implementation details
6. **Closing** - Brief, casual, 1-3 sentences. Often starts with "Anyway" or "That's it!"
7. **Reference links block** - All links collected at the bottom inside `{/* reference links */}` or `{/* references */}`

### Important structural notes

- Do NOT use `##` or deeper subheadings. Sections are separated by `---` horizontal rules and natural paragraph breaks only.
- The only heading in the entire post is the single `# Title` at the top.

## Writing Voice

### Tone
- **Conversational and direct** - Write like you're explaining to a friend who has some technical background
- **First person** - "I", "my", "we" (inclusive). Position as learner/builder sharing discoveries
- **Informal but not sloppy** - Contractions are fine ("I've", "can't", "don't"). No corporate jargon.
- **Confident but honest** - State facts directly. Acknowledge limitations openly ("This isn't flawless.", "I am not an expert on...")
- **Enthusiastic about building** - Genuine interest comes through. "I opted to...", "so I decided..."

### Patterns to follow
- Lead with personal context: why you're working on this, what led here
- Explain the "why" before the "how"
- Use italics for emphasis and introducing key terms: _Radar_, _customer_, _vendor_
- Use **bold** for important tool/concept names: **DMA cheat**, **Proto definitions**
- Use backticks for code identifiers: `GameWorld`, `NtDll`, `localhost`
- Short numbered or bulleted lists (1-6 items) for steps, options, or trade-offs
- Rhetorical questions to transition between sections: "So how do you protect yourself?"

### Patterns to avoid
- No trailing summaries or "In conclusion" sections
- No filler phrases ("In this blog post, I will...", "Let's dive in...")
- No excessive enthusiasm or hype language
- No emoji except sparingly in closings (one is fine)
- No self-referential meta-commentary about the post itself

## Code Blocks

- Use fenced code blocks with language specified: ```go, ```js, ```cpp, ```asm, ```text, etc.
- Code serves both educational and illustrative purposes
- Include meaningful inline comments in code, especially for non-obvious operations
- After a code block, briefly explain what it does in plain prose (1-3 sentences)
- Show real, working code from the actual project - not toy examples

## Links & References

- Use markdown reference-style links throughout the post: `[Link Text]` in body
- Collect ALL link definitions at the bottom of the file in an MDX comment block:
  ```
  {/* reference links */}
  [Link Text]: https://example.com
  [Another Link]: https://example.com/path
  ```
- Link to GitHub repos, official docs, Wikipedia for concepts, and relevant tools
- Don't over-link; link terms on first meaningful use

## Images

- Use standard markdown: `![alt](url)`
- Host on `ss.lystic.zip` if available, or use placeholder URLs for drafts
- Use sparingly (1-3 per post) for screenshots, diagrams, or UI references
- Alt text should be short and descriptive

## Closing Style

Keep it brief and casual. Examples of typical closings:
- "Anyway, that's it. Stay safe."
- "That's it! It's actually quite simple."
- "Anyway I thought this project was quite fun."
- Short reflection on what was learned + hint at future direction

## Length

- Typical range: 500-3000 words
- Shorter posts (500-800 words) for focused observations or security advisories
- Longer posts (1500-3000 words) for deep technical walkthroughs with multiple code examples
- Let the content dictate the length - don't pad or truncate artificially

## Topics & Domain

Posts typically cover: reverse engineering, security research, game modding, low-level systems (DMA, PCIe, FPGA), game engine internals (Unity, Enfusion), cryptocurrency/Web3, and systems programming. The audience has technical background but may not know the specific domain.
