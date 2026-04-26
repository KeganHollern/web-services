import mdx from "@mdx-js/rollup";
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from "node:fs/promises";
import path from "path";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import sharp from "sharp";
import { defineConfig, type Plugin } from 'vite';
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Emits .webp siblings for PNG/JPEG files in the build output. Runs after
// ViteImageOptimizer has compressed the originals, so the .webp is encoded
// from the already-optimized source. Skipped when the .webp would be larger.
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
            const webpPath = full.replace(/\.(png|jpe?g)$/i, '.webp');
            const webpBuffer = await sharp(full).webp({ quality: 80 }).toBuffer();
            const originalSize = (await fs.stat(full)).size;
            if (webpBuffer.byteLength < originalSize) {
              await fs.writeFile(webpPath, webpBuffer);
            }
          }
        }
        await walk(outDir);
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
