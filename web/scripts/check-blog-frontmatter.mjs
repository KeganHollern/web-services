import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = resolve(__dirname, "..", "src", "pages", "blog", "posts");

function findMdxFiles(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) out.push(...findMdxFiles(full));
        else if (st.isFile() && name.endsWith(".mdx")) out.push(full);
    }
    return out;
}

function validateDate(date) {
    if (date === undefined || date === null) return "missing";
    if (date instanceof Date) {
        return Number.isNaN(date.getTime()) ? "invalid Date value" : null;
    }
    if (typeof date !== "string") return `unexpected type (${typeof date})`;
    const trimmed = date.trim();
    if (trimmed === "") return "empty string";
    if (Number.isNaN(new Date(trimmed).getTime())) return `unparseable value: ${date}`;
    return null;
}

const files = findMdxFiles(POSTS_DIR);
const errors = [];

for (const file of files) {
    const rel = relative(POSTS_DIR, file);
    const raw = readFileSync(file, "utf8");
    let data;
    try {
        ({ data } = matter(raw));
    } catch (err) {
        errors.push(`${rel}: failed to parse frontmatter: ${err.message}`);
        continue;
    }
    const problem = validateDate(data.date);
    if (problem) errors.push(`${rel}: 'date' ${problem}`);
}

if (errors.length > 0) {
    const noun = errors.length === 1 ? "issue" : "issues";
    console.error(`\nBlog post frontmatter check failed (${errors.length} ${noun}):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error(
        "\nEvery .mdx post under web/src/pages/blog/posts must declare a non-empty 'date' in its YAML frontmatter.\n",
    );
    process.exit(1);
}

console.log(`Blog frontmatter check: ${files.length} post(s) OK.`);
