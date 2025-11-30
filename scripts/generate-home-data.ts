import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, "../blog");
const EVENTS_DIR = path.join(__dirname, "../events");
const OUTPUT_FILE = path.join(__dirname, "../src/data/home-data.json");

interface Frontmatter {
  [key: string]: string | string[];
}

interface ContentItem {
  title: string;
  date: string;
  link: string;
  excerpt: string;
  tags?: string[];
  type?: string;
  location?: string;
  duration?: string;
  language?: string;
  country?: string;
  event?: string;
}

interface HomeData {
  recentPosts: ContentItem[];
  recentEvents: ContentItem[];
}

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter: Frontmatter = {};
  const lines = match[1].split("\n");
  let currentKey: string | null = null;

  for (const line of lines) {
    const pair = line.split(":");
    if (pair.length >= 2) {
      const key = pair[0].trim();
      const value = pair.slice(1).join(":").trim();

      if (value) {
        // Remove quotes and brackets roughly
        let cleanValue: string | string[] = value.replace(/^['"]|['"]$/g, "");
        if (cleanValue.startsWith("[") && cleanValue.endsWith("]")) {
          // Simple array parsing
          cleanValue = cleanValue
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim());
        }
        frontmatter[key] = cleanValue;
        currentKey = key;
      } else {
        currentKey = key; // list start
      }
    } else if (line.trim().startsWith("-") && currentKey) {
      // List item
      if (!Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey] = [];
      }
      (frontmatter[currentKey] as string[]).push(
        line.trim().substring(1).trim()
      );
    }
  }
  return frontmatter;
}

function getExcerpt(content: string): string {
  const parts = content.split("<!-- truncate -->");
  let excerpt = parts[0].replace(/^---\n[\s\S]*?\n---/, "").trim();
  // Remove markdown headings for cleaner excerpt
  excerpt = excerpt.replace(/#+\s/g, "");
  // Remove links [text](url) -> text
  excerpt = excerpt.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  return excerpt.substring(0, 200) + (excerpt.length > 200 ? "..." : "");
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      if (file.endsWith(".md") || file.endsWith(".mdx")) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

function processContent(dir: string, type: string): ContentItem[] {
  if (!fs.existsSync(dir)) return [];

  const files = getAllFiles(dir);
  const items = files
    .map((file) => {
      const content = fs.readFileSync(file, "utf8");
      const data = parseFrontmatter(content);
      const filename = path.basename(file);
      const folderName = path.basename(path.dirname(file));

      // Try to find date
      let date = data.date as string | undefined;
      if (!date) {
        // Try filename: YYYY-MM-DD-...
        const match = filename.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) {
          date = match[1];
        } else {
          // Try foldername
          const matchFolder = folderName.match(/^(\d{4}-\d{2}-\d{2})/);
          if (matchFolder) date = matchFolder[1];
        }
      }

      // Title
      const title = (data.title as string) || filename.replace(/\.mdx?$/, "");

      // Slug
      let slug = data.slug as string | undefined;
      if (!slug) {
        // Fallback if no slug provided
        slug = filename.replace(/\.mdx?$/, "");
        // If file is index.md, use folder name
        if (slug === "index") slug = folderName;
      }

      // Link
      const link = `/${type}/${slug}`;

      const excerpt = getExcerpt(content);

      return {
        title,
        date: date!,
        link,
        excerpt,
        tags: data.tags as string[] | undefined,
        type: data.type as string | undefined,
        location: data.location as string | undefined,
        duration: data.duration as string | undefined,
        language: data.language as string | undefined,
        country: data.country as string | undefined,
        event: data.event as string | undefined,
      };
    })
    .filter((item) => !!item.date) as ContentItem[]; // Must have date to sort

  // Sort desc
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Return 4 items for events, 3 for blog posts
  const count = type === "events" ? 4 : 3;
  return items.slice(0, count);
}

const recentPosts = processContent(BLOG_DIR, "blog");
const recentEvents = processContent(EVENTS_DIR, "events");

const output: HomeData = {
  recentPosts,
  recentEvents,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
console.log(`Generated ${OUTPUT_FILE}`);
