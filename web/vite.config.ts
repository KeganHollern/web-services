import mdx from "@mdx-js/rollup";
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from "path";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

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
      },
      '/copilotkit': {
        target: "http://localhost:4000/copilotkit",
        changeOrigin: true,
      },
    }
  }
})
