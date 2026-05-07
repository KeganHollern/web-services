import mdx from "@mdx-js/rollup";
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import matter from "gray-matter";
import fs from "node:fs/promises";
import path from "path";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import sharp from "sharp";
import { defineConfig, type Plugin } from 'vite';
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Emits resized .webp variants for PNG/JPEG files in the build output. Runs
// after ViteImageOptimizer has compressed the originals, so each .webp is
// encoded from the already-optimized source. For each input we emit one
// variant per width in WEBP_VARIANT_WIDTHS, skipping widths larger than the
// source (no upscaling) and skipping any output that ends up larger than the
// original.
const WEBP_VARIANT_WIDTHS = [384, 768, 1280] as const;

function emitWebpVariants(): Plugin {
  return {
    name: 'emit-webp-variants',
    apply: 'build',
    closeBundle: {
      // Run after ViteImageOptimizer has finished compressing originals.
      order: 'post',
      sequential: true,
      async handler() {
        const outDir = path.resolve(__dirname, 'dist');
        async function walk(dir: string): Promise<void> {
          let entries;
          try {
            entries = await fs.readdir(dir, { withFileTypes: true });
          } catch {
            return;
          }
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await walk(full);
              continue;
            }
            if (!/\.(png|jpe?g)$/i.test(entry.name)) continue;
            const originalSize = (await fs.stat(full)).size;
            const srcWidth = (await sharp(full).metadata()).width ?? 0;
            for (const width of WEBP_VARIANT_WIDTHS) {
              if (srcWidth && width > srcWidth) continue;
              const variantPath = full.replace(/\.(png|jpe?g)$/i, `-${width}.webp`);
              const buffer = await sharp(full)
                .resize({ width, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
              if (buffer.byteLength < originalSize) {
                await fs.writeFile(variantPath, buffer);
              }
            }
          }
        }
        await walk(outDir);
      },
    },
  };
}

// Generates web/dist/rss.xml from MDX frontmatter under src/pages/blog/posts.
// Mirrors the visibility/slug/description filter used by the runtime post
// loader so the feed and the rendered blog stay in sync.
function generateRssFeed(): Plugin {
  const SITE = 'https://lystic.dev';
  const escapeXml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const cdata = (s: string): string =>
    `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

  return {
    name: 'generate-rss-feed',
    apply: 'build',
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        const postsDir = path.resolve(__dirname, 'src/pages/blog/posts');
        const outDir = path.resolve(__dirname, 'dist');

        const mdxFiles: string[] = [];
        async function walk(dir: string): Promise<void> {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) await walk(full);
            else if (entry.isFile() && entry.name.endsWith('.mdx')) mdxFiles.push(full);
          }
        }
        await walk(postsDir);

        type Item = { slug: string; title: string; description: string; date: Date };
        const items: Item[] = [];

        for (const file of mdxFiles) {
          const raw = await fs.readFile(file, 'utf8');
          const { data } = matter(raw);

          const visible = data.visible ?? true;
          if (!visible) continue;

          const slug: string = data.slug ?? path.basename(file, '.mdx');
          const description: string = (data.description ?? '').toString().trim();
          if (!slug || !description) continue;

          const title: string = data.title ?? slug.replaceAll('-', ' ');
          const rawDate = data.date;
          const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
          if (Number.isNaN(date.getTime())) continue;

          items.push({ slug, title, description, date });
        }

        items.sort((a, b) => b.date.getTime() - a.date.getTime());

        const lastBuildDate = new Date().toUTCString();
        const itemsXml = items.map((it) => {
          const link = `${SITE}/blog/${it.slug}`;
          return `    <item>
      <title>${escapeXml(it.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${it.date.toUTCString()}</pubDate>
      <description>${cdata(it.description)}</description>
    </item>`;
        }).join('\n');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Lystic Blog</title>
    <link>${SITE}/blog</link>
    <description>Posts from Lystic on security, reverse engineering, and software development.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>
`;

        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(path.join(outDir, 'rss.xml'), xml);
      },
    },
  };
}

// Emits dist/blog/<slug>/index.html for each visible blog post by cloning
// dist/index.html and rewriting the SEO/OG/Twitter meta block with
// post-specific values. Crawlers (Discord/Slack/Twitter) don't run JS, so
// they only see static HTML — without this they'd get the default site meta
// for every blog URL. React 19's metadata hoisting handles non-crawler
// hydration on top of these.
function generateBlogMetaPages(): Plugin {
  const SITE = 'https://lystic.dev';
  const SITE_NAME = 'lystic.dev';
  const SITE_DEFAULT_OG_IMAGE = '/og-image.png';

  const escapeHtml = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const replaceMetaContent = (
    html: string,
    key: 'name' | 'property',
    attrVal: string,
    newContent: string,
  ): string => {
    const re = new RegExp(`(<meta\\s+${key}="${attrVal}"[^>]*?content=")[^"]*(")`);
    return html.replace(re, `$1${newContent}$2`);
  };

  return {
    name: 'generate-blog-meta-pages',
    apply: 'build',
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        const postsDir = path.resolve(__dirname, 'src/pages/blog/posts');
        const outDir = path.resolve(__dirname, 'dist');
        const indexPath = path.join(outDir, 'index.html');

        let baseHtml: string;
        try {
          baseHtml = await fs.readFile(indexPath, 'utf8');
        } catch {
          return;
        }

        const mdxFiles: string[] = [];
        async function walk(dir: string): Promise<void> {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) await walk(full);
            else if (entry.isFile() && entry.name.endsWith('.mdx')) mdxFiles.push(full);
          }
        }
        await walk(postsDir);

        for (const file of mdxFiles) {
          const raw = await fs.readFile(file, 'utf8');
          const { data } = matter(raw);

          const visible = data.visible ?? true;
          if (!visible) continue;

          const slug: string = data.slug ?? path.basename(file, '.mdx');
          const description: string = (data.description ?? '').toString().trim();
          if (!slug || !description) continue;

          const title: string = data.title ?? slug.replaceAll('-', ' ');
          const fullTitle =
            title === SITE_NAME || title.endsWith(` | ${SITE_NAME}`)
              ? title
              : `${title} | ${SITE_NAME}`;

          const url = `${SITE}/blog/${slug}`;
          const image: string | undefined = data.image;
          const resolvedImage = image
            ? image.startsWith('http')
              ? image
              : `${SITE}${image}`
            : `${SITE}${SITE_DEFAULT_OG_IMAGE}`;

          const fullTitleEsc = escapeHtml(fullTitle);
          const descriptionEsc = escapeHtml(description);
          const urlEsc = escapeHtml(url);
          const imageEsc = escapeHtml(resolvedImage);

          let html = baseHtml;
          html = html.replace(/<title>[^<]*<\/title>/, `<title>${fullTitleEsc}</title>`);
          html = replaceMetaContent(html, 'name', 'description', descriptionEsc);
          html = replaceMetaContent(html, 'property', 'og:title', fullTitleEsc);
          html = replaceMetaContent(html, 'property', 'og:description', descriptionEsc);
          html = replaceMetaContent(html, 'property', 'og:type', 'article');
          html = replaceMetaContent(html, 'property', 'og:image', imageEsc);
          html = replaceMetaContent(html, 'name', 'twitter:title', fullTitleEsc);
          html = replaceMetaContent(html, 'name', 'twitter:description', descriptionEsc);
          html = replaceMetaContent(html, 'name', 'twitter:image', imageEsc);

          const injection = `\n  <link rel="canonical" href="${urlEsc}" />\n  <meta property="og:url" content="${urlEsc}" />`;
          html = html.replace(
            /(<meta\s+name="twitter:image"[^>]*?\/>)/,
            `$1${injection}`,
          );

          const slugDir = path.join(outDir, 'blog', slug);
          await fs.mkdir(slugDir, { recursive: true });
          await fs.writeFile(path.join(slugDir, 'index.html'), html);
        }
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      enforce: 'pre', ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
        // rehypePlugins: [rehypeHighlight]
      })
    }, // compile mdx first
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
    nodePolyfills(),
    ViteImageOptimizer({
      // svgo is not a dependency; exclude SVGs to avoid a startup error.
      test: /\.(jpe?g|png|gif|tiff|webp|avif)$/i,
      png: { quality: 80, compressionLevel: 9 },
      jpeg: { quality: 80, mozjpeg: true },
      jpg: { quality: 80, mozjpeg: true },
      webp: { quality: 80 },
    }),
    emitWebpVariants(),
    generateRssFeed(),
    generateBlogMetaPages(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: "http://localhost",
        changeOrigin: true,
      }
    }
  }
})
