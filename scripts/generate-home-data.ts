import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_PARSE_FRONT_MATTER, normalizeTags } from "@docusaurus/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, "../blog");
const EVENTS_DIR = path.join(__dirname, "../events");
const OUTPUT_FILE = path.join(__dirname, "../src/data/home-data.json");

type Frontmatter = Record<string, unknown>;

interface ContentItem {
  title: string;
  date: string;
  link: string;
  excerpt: string;
  tags?: string[];
  /** Tag page slugs exactly as Docusaurus derives them, e.g. ".NET" -> "net". */
  tagSlugs?: string[];
  type?: string;
  location?: string;
  duration?: string;
  language?: string;
  country?: string;
  event?: string;
  cancelled?: boolean;
}

type HomeEvent = Omit<ContentItem, "excerpt">;

interface HomeData {
  recentPosts: ContentItem[];
  /**
   * Every event, newest first. Which ones are upcoming depends on the visitor's date, so the
   * home page classifies them in the browser instead of relying on a build-time shortlist.
   */
  events: HomeEvent[];
  venues: string[];
}

/** Front matter parsed exactly as Docusaurus parses it (YAML via gray-matter). */
async function parseFrontmatter(fileContent: string, filePath: string): Promise<Frontmatter> {
  const { frontMatter } = await DEFAULT_PARSE_FRONT_MATTER({ fileContent, filePath });
  return frontMatter;
}

/** YAML turns some scalars into dates or numbers; the home data keeps plain strings. */
function text(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/** The events plugin has no tags.yml, so every tag is inline and Docusaurus kebab-cases it. */
function tagSlugs(tags: string[] | undefined, source: string): string[] | undefined {
  if (!tags) return undefined;
  return normalizeTags({
    options: { tags: null, onInlineTags: "ignore" },
    source,
    frontMatterTags: tags,
    tagsBaseRoutePath: "/",
    tagsFile: null,
  }).map((tag) => tag.permalink.replace(/^\//, ""));
}

function getExcerpt(content: string): string {
  const parts = content.split("<!-- truncate -->");
  let excerpt = parts[0].replace(/^---\n[\s\S]*?\n---/, "").trim();
  // Ignore top-level MDX imports/exports so generated previews stay content-focused.
  excerpt = excerpt.replace(/^(?:(?:import|export)\s.+;\n)+/u, "").trim();
  // Remove markdown headings for cleaner excerpt
  excerpt = excerpt.replace(/^#+\s/gm, "");
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

async function readAllContent(dir: string, type: string): Promise<ContentItem[]> {
  if (!fs.existsSync(dir)) return [];

  const files = getAllFiles(dir);
  const items = await Promise.all(
    files.map(async (file) => {
      const content = fs.readFileSync(file, "utf8");
      const data = await parseFrontmatter(content, file);
      const filename = path.basename(file);
      const folderName = path.basename(path.dirname(file));

      // Try to find date
      let date = text(data.date);
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

      if (!date) {
        throw new Error(`No date found for ${file}. Add a 'date' field in frontmatter or use YYYY-MM-DD in filename/folder.`);
      }

      // Title
      const title = text(data.title) || filename.replace(/\.mdx?$/, "");

      // Slug
      let slug = text(data.slug);
      if (!slug) {
        // Fallback if no slug provided
        slug = filename.replace(/\.mdx?$/, "");
        // If file is index.md, use folder name
        if (slug === "index") slug = folderName;
      }

      // Link
      const link = `/${type}/${slug}`;

      const excerpt = getExcerpt(content);

      const tags = Array.isArray(data.tags) ? data.tags.map((tag) => String(tag)) : undefined;
      return {
        title,
        date,
        link,
        excerpt,
        tags,
        // Only events: the blog has a tags.yml whose permalinks this helper does not read.
        tagSlugs: type === "events" ? tagSlugs(tags, link) : undefined,
        type: text(data.type),
        location: text(data.location),
        duration: text(data.duration),
        language: text(data.language),
        country: text(data.country),
        event: text(data.event),
        ...(data.cancelled === true ? { cancelled: true } : {}),
      };
    }),
  );

  // Sort desc
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items;
}


// Strips years and seasons so "BASTA! Spring 2024" and "BASTA! Autumn 2024" count as one venue.
function normalizeVenue(event: string): string {
  return event
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\b(Spring|Autumn|Fall|Summer|Winter)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Venues ordered by how often Kenny spoke there; one-off formats such as
// webinars or lectures are left out because they are not recognizable venues.
function rankVenues(events: ContentItem[]): string[] {
  const counts = new Map<string, number>();
  for (const item of events) {
    if (!item.event || item.cancelled) continue;
    const venue = normalizeVenue(item.event);
    if (/webinar|lecture|linkedin/i.test(venue)) continue;
    counts.set(venue, (counts.get(venue) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([venue]) => venue);
}

async function main(): Promise<void> {
  const allPosts = await readAllContent(BLOG_DIR, "blog");
  const allEvents = await readAllContent(EVENTS_DIR, "events");

  const output: HomeData = {
    recentPosts: allPosts.slice(0, 4),
    events: allEvents.map(({ excerpt: _excerpt, ...event }) => event),
    venues: rankVenues(allEvents),
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Generated ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
