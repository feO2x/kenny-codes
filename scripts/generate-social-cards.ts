import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { DEFAULT_PARSE_FRONT_MATTER, parseMarkdownFile } from "@docusaurus/utils";
import React from "react";
import satori from "satori";
import sharp from "sharp";

import {
  CARD_HEIGHT,
  CARD_WIDTH,
  ARROW_HEIGHT,
  CONTENT_META_HEIGHT,
  DOCS_SECTION_HEIGHT,
  STATEMENT,
  SocialCard,
  TEXT_WIDTH,
  arrowSvg,
  createMeasurer,
  fitText,
  fitTitle,
  type ChackPart,
  type GuidedCodingPhase,
  type SocialCardModel,
  type TextMeasurer,
} from "./social-card-template";

/**
 * This script generates all build-time social cards for blog posts, events, and docs pages.
 *
 * High-level flow:
 * 1. Discover markdown / MDX content files.
 * 2. Read their frontmatter and derive the data needed for a card.
 * 3. Render the card with Satori and encode it as JPEG with Sharp.
 * 4. Write the JPEG into `static/img/social-cards/`.
 * 5. Update markdown frontmatter so Docusaurus uses the generated card.
 *
 * The script is deterministic on purpose. Generated files are committed to git,
 * so identical content should always result in identical images.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, "../blog");
const EVENTS_DIR = path.join(__dirname, "../events");
const DOCS_DIR = path.join(__dirname, "../docs");
const STATIC_DIR = path.join(__dirname, "../static");
const OUTPUT_DIR = path.join(STATIC_DIR, "img/social-cards");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
/**
 * Cards are written as JPEG because they contain a photo and gradients, which
 * PNG compresses poorly (about 0.7 MB per card as PNG versus about 70 KB as
 * JPEG).
 */
const CARD_EXTENSION = ".jpg";
/**
 * Cards used to be written as PNG. Frontmatter that still points at the old
 * managed PNG path is migrated to the JPEG path instead of being treated as a
 * custom image, and stale PNG cards are removed.
 */
const LEGACY_CARD_EXTENSION = ".png";
const JPEG_OPTIONS = { quality: 88, mozjpeg: true } as const;
const DEFAULT_SOCIAL_CARD_PATH = path.join(
  STATIC_DIR,
  `img/kenny-codes-social-card${CARD_EXTENSION}`
);
const LOGO_PATH = path.join(STATIC_DIR, "img/logo-dark.svg");
const PHOTO_PATH = path.join(STATIC_DIR, "img/kenny-smiles.jpg");
/**
 * The social-card renderer uses repo-local font files so builds do not depend
 * on OS-specific system font locations. They are the static instances of Mona
 * Sans, the site's typeface, from https://github.com/github/mona-sans (v2.0.27),
 * checked into `scripts/assets/fonts/` unmodified together with their license.
 * Satori cannot read the variable WOFF2 files the site uses.
 */
const TEMPLATE_PATH = path.join(__dirname, "social-card-template.tsx");
const FONT_ASSETS_DIR = path.join(__dirname, "assets/fonts");
const FONTS = [
  { file: "MonaSans-Regular.ttf", name: "Mona Sans", weight: 400 },
  { file: "MonaSans-Medium.ttf", name: "Mona Sans", weight: 500 },
  { file: "MonaSans-SemiBold.ttf", name: "Mona Sans", weight: 600 },
  {
    file: "MonaSansSemiExpanded-SemiBold.ttf",
    name: "Mona Sans SemiExpanded",
    weight: 600,
  },
] as const;
/**
 * Bump this value to regenerate every card. Changes to this script, the
 * template, the fonts, the logo and the portrait already do so: they are part
 * of each card's hash. The manifest stores this value together with per-item
 * hashes.
 */
const TEMPLATE_VERSION = "2026-11-20-v1";
const CONCURRENCY = 4;

type ContentKind = "blog" | "events" | "docs";

/**
 * Frontmatter as Docusaurus parses it, so the cards read the same values the
 * pages do.
 */
interface Frontmatter {
  [key: string]: unknown;
}

/**
 * Describes where the frontmatter block lives inside the original source file.
 *
 * This lets us replace only the frontmatter section while preserving the rest
 * of the file content exactly as it was.
 */
interface FrontmatterBlock {
  body: string;
  /** The file's line ending, kept when the block is rewritten. */
  eol: string;
  bodyStart: number;
  bodyEnd: number;
}

/**
 * Normalized content data used by the generator. The raw markdown file is
 * converted into this shape before any rendering starts. It holds only what a
 * card shows, so the hash changes only when the card would.
 */
interface ContentItem {
  filePath: string;
  kind: ContentKind;
  slug: string;
  title: string;
  socialTitle?: string;
  /** Blog posts and events only. */
  date?: string;
  type?: string;
  event?: string;
}

/**
 * Small cache manifest written next to the generated images.
 *
 * Each slug maps to a content hash. If both the per-item hash and the template
 * version match, we can safely reuse the existing image file.
 */
interface SocialCardManifest {
  templateVersion: string;
  items: Record<string, string>;
}

/**
 * Preloaded binary assets needed during rendering.
 */
interface SocialCardAssets {
  logo: string;
  portrait: string;
  fonts: Array<{
    name: string;
    data: Buffer;
    weight: 400 | 500 | 600;
    style: "normal";
  }>;
  /** Measures the title face, for line breaking. */
  measureTitle: TextMeasurer;
  /** Measures the medium body face, for the site card's statement. */
  measureBody: TextMeasurer;
  /** A hash of the fonts, the logo and the portrait, for the cache. */
  digest: string;
}

/**
 * Result of trying to ensure a markdown file points at its generated image.
 *
 * `custom-image` means the file already defines a different image and should be
 * left alone. That is the escape hatch for manual overrides. `migrated` means
 * the file pointed at the legacy PNG path of its generated card and now points
 * at the current one.
 */
interface FrontmatterUpdateResult {
  content: string;
  status: "inserted" | "migrated" | "unchanged" | "custom-image";
}

/**
 * Reads a required file and throws a clearer error message if the file is
 * missing. This is especially useful for vendored font assets because missing
 * fonts would otherwise fail with a low-level ENOENT error.
 */
async function readRequiredFile(filePath: string, purpose: string): Promise<Buffer> {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Missing ${purpose} at ${filePath}.`);
    }

    throw error;
  }
}

/**
 * Removes one layer of wrapping single or double quotes from a value.
 */
function stripWrappingQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/gu, "");
}

const FRONTMATTER_PATTERN = /^---(\r?\n)([\s\S]*?)\r?\n---/u;

/** Whether the file starts with a frontmatter block. Docs pages may have none. */
function hasFrontmatter(content: string): boolean {
  return FRONTMATTER_PATTERN.test(content);
}

/** A YAML block scalar (`>-`, `|`, ...), whose value spans the following lines. */
function isBlockScalar(value: string): boolean {
  return /^[>|][+-]?\d?$/u.test(value);
}

/**
 * Extracts the first frontmatter block from the beginning of a file.
 *
 * The returned indices point to the frontmatter body only, not the surrounding
 * `---` delimiters.
 */
function getFrontmatterBlock(content: string): FrontmatterBlock {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) {
    throw new Error("Expected a frontmatter block at the top of the file.");
  }

  const [, eol, body] = match;
  const bodyStart = 3 + eol.length;
  return { body, eol, bodyStart, bodyEnd: bodyStart + body.length };
}

/**
 * Recursively discovers all markdown and MDX files below a directory.
 */
async function getAllMarkdownFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        return getAllMarkdownFiles(fullPath);
      }

      if (entry.isFile() && (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
        return [fullPath];
      }

      return [];
    })
  );

  return nested.flat().sort();
}

/**
 * Resolves the publication date for one blog post or event.
 *
 * Priority:
 * 1. explicit `date` in frontmatter
 * 2. date prefix in the file name
 * 3. date prefix in the parent directory name
 */
function deriveDate(filePath: string, frontmatter: Frontmatter): string {
  // YAML reads an unquoted date as a Date.
  const explicitDate = frontmatter.date;
  if (explicitDate instanceof Date) {
    return explicitDate.toISOString().slice(0, 10);
  }
  if (typeof explicitDate === "string" && explicitDate) {
    return explicitDate;
  }

  const basename = path.basename(filePath);
  const folderName = path.basename(path.dirname(filePath));
  const datePattern = /^(\d{4}-\d{2}-\d{2})/u;

  return (
    basename.match(datePattern)?.[1] ??
    folderName.match(datePattern)?.[1] ??
    (() => {
      throw new Error(`Could not derive a date for ${filePath}.`);
    })()
  );
}

/**
 * Resolves the slug for one content item, which names its card file.
 *
 * Blog posts and events:
 * 1. explicit `slug` in frontmatter
 * 2. file name without extension
 * 3. parent folder name for `index.md` / `index.mdx`
 *
 * Docs pages: `docs/` plus the path below `docs/`, without extension and
 * without a trailing `index`, e.g. `docs/chack/the-core`.
 */
function deriveSlug(filePath: string, frontmatter: Frontmatter, kind: ContentKind): string {
  if (kind === "docs") {
    const relative = path.relative(DOCS_DIR, filePath).replace(/\.mdx?$/u, "");
    return `docs/${relative
      .split(path.sep)
      .join("/")
      .replace(/\/?index$/u, "")}`;
  }

  const explicitSlug = frontmatter.slug;
  if (typeof explicitSlug === "string" && explicitSlug) {
    return explicitSlug.replace(/^\/+|\/+$/gu, "");
  }

  const basename = path.basename(filePath, path.extname(filePath));
  if (basename !== "index") {
    return basename;
  }

  return path.basename(path.dirname(filePath));
}

/**
 * Reads one scalar string field from the parsed frontmatter object.
 */
function getStringField(frontmatter: Frontmatter, key: string): string | undefined {
  const value = frontmatter[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Converts all markdown files below a content root into normalized `ContentItem`
 * objects.
 */
async function discoverContent(dirPath: string, kind: ContentKind): Promise<ContentItem[]> {
  const files = await getAllMarkdownFiles(dirPath);

  return Promise.all(
    files.map(async (filePath) => {
      const { frontMatter: frontmatter, contentTitle } = await parseMarkdownFile({
        filePath,
        fileContent: await fs.readFile(filePath, "utf8"),
        parseFrontMatter: DEFAULT_PARSE_FRONT_MATTER,
      });

      return {
        filePath,
        kind,
        slug: deriveSlug(filePath, frontmatter, kind),
        // The title Docusaurus shows: the frontmatter's, else the first heading, else the file name.
        title:
          getStringField(frontmatter, "title") ??
          contentTitle ??
          path.basename(filePath, path.extname(filePath)),
        socialTitle: getStringField(frontmatter, "socialTitle"),
        date: kind === "docs" ? undefined : deriveDate(filePath, frontmatter),
        type: getStringField(frontmatter, "type"),
        event: getStringField(frontmatter, "event"),
      };
    })
  );
}

/**
 * Converts a content slug into a file-system-safe card file name.
 */
function slugToFileName(slug: string): string {
  return slug.replace(/^\/+|\/+$/gu, "").replace(/\//gu, "-");
}

/**
 * Returns the public site path used in frontmatter and final HTML metadata.
 */
function getManagedImagePath(slug: string): string {
  return `/img/social-cards/${slugToFileName(slug)}${CARD_EXTENSION}`;
}

/**
 * Returns the path that `getManagedImagePath` produced before cards were
 * written as JPEG. Used to migrate existing frontmatter.
 */
function getLegacyManagedImagePath(slug: string): string {
  return `/img/social-cards/${slugToFileName(slug)}${LEGACY_CARD_EXTENSION}`;
}

/**
 * Calculates a stable hash of everything one card shows: the card model and
 * the assets and the code it is drawn with. If it changes, the image must be
 * regenerated.
 */
function hashCard(model: SocialCardModel, assets: SocialCardAssets): string {
  const { logo: _logo, portrait: _portrait, ...content } = model;
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        templateVersion: TEMPLATE_VERSION,
        assets: assets.digest,
        content,
      })
    )
    .digest("hex");
}

/**
 * Formats the card date in the long English style, e.g. "May 6, 2024".
 */
function formatDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Sets a line at the largest of `sizes` at which it fits the text column, and
 * shortens it with an ellipsis only if it does not fit at the smallest.
 */
function fitLine(
  value: string,
  measure: TextMeasurer,
  sizes: number[]
): { text: string; fontSize: number } {
  const fontSize =
    sizes.find((size) => measure(value, size) <= TEXT_WIDTH) ?? sizes[sizes.length - 1];
  let text = value;
  while (text.length > 1 && measure(`${text}\u2026`, fontSize) > TEXT_WIDTH) {
    text = text.slice(0, -1).trimEnd();
  }
  return {
    text: text === value ? value : `${text.replace(/[\s,.:;/-]+$/u, "")}\u2026`,
    fontSize,
  };
}

/** The docs sections and the method motif each one shows. */
const DOCS_SECTIONS: Array<
  | {
      prefix: string;
      section: string;
      method: "guided-coding";
      highlights: Record<string, GuidedCodingPhase>;
    }
  | {
      prefix: string;
      section: string;
      method: "chack";
      highlights: Record<string, ChackPart>;
    }
> = [
  {
    prefix: "docs/chack/dotnet",
    section: "CHACK in .NET",
    method: "chack",
    highlights: {
      "the-core": "core",
      "clients-and-sessions": "humble",
      testing: "tests",
      "composition-root": "root",
    },
  },
  {
    prefix: "docs/chack",
    section: "CHACK",
    method: "chack",
    highlights: {
      "the-core": "core",
      "humble-objects": "humble",
      "clients-and-sessions": "humble",
      "automated-tests": "tests",
      "composition-root": "root",
    },
  },
  {
    prefix: "docs/guided-coding",
    section: "Guided Coding & Guided Learning",
    method: "guided-coding",
    highlights: {
      "planning-phase": "planning",
      "automated-plan-review": "planning",
      "plan-structures": "planning",
      "finding-the-right-plan-size": "planning",
      "implementing-phase": "implementing",
      "guiding-phase": "guiding",
    },
  },
];

/**
 * Maps normalized content into the model of its card.
 */
function buildCardModel(item: ContentItem, assets: SocialCardAssets): SocialCardModel {
  const title = item.socialTitle?.trim() || item.title;
  const images = { logo: assets.logo, portrait: assets.portrait };

  if (item.kind === "docs") {
    const index = DOCS_SECTIONS.findIndex(
      ({ prefix }) => item.slug === prefix || item.slug.startsWith(`${prefix}/`)
    );
    const docs = DOCS_SECTIONS[index];
    if (!docs) {
      // A new docs folder: a card with the portrait until it gets a section and a motif.
      return {
        kind: "docs",
        ...images,
        section: "Documentation",
        title: fitTitle(title, assets.measureTitle, DOCS_SECTION_HEIGHT),
      };
    }
    const page = item.slug.slice(docs.prefix.length + 1);
    // A section's own page is titled like the section: name the enclosing one instead.
    const parent = DOCS_SECTIONS.slice(index + 1).find(({ prefix }) =>
      docs.prefix.startsWith(`${prefix}/`)
    );
    const section = title.startsWith(docs.section)
      ? (parent?.section ?? "Documentation")
      : docs.section;
    return {
      kind: "docs",
      ...images,
      section,
      title: fitTitle(title, assets.measureTitle, DOCS_SECTION_HEIGHT),
      motif:
        docs.method === "guided-coding"
          ? { method: "guided-coding", highlight: docs.highlights[page] }
          : { method: "chack", highlight: docs.highlights[page] },
    };
  }

  const date = formatDate(item.date ?? "");
  const [primary, secondary] =
    item.kind === "blog"
      ? ["Blog post by Kenny Pflug", date]
      : [
          (item.event ?? "Kenny Pflug").replace(/ - /gu, " \u2013 "),
          `${item.type ?? "Event"} on ${date}`,
        ];

  return {
    kind: "content",
    ...images,
    title: fitTitle(title, assets.measureTitle, CONTENT_META_HEIGHT),
    primary: fitLine(primary, assets.measureBody, [28, 26, 24]),
    secondary,
  };
}

/**
 * The card for the home page and for every page without a card of its own:
 * the greeting, the statement and the two methods of the home page.
 */
function buildSiteCardModel(assets: SocialCardAssets): SocialCardModel {
  const greeting = "Hi, I’m Kenny.";
  const greetingSize = [96, 92, 88, 84, 80, 76, 72].find(
    (size) => assets.measureTitle(greeting, size, -0.03) <= TEXT_WIDTH * 0.97
  );
  const statement = fitText(
    "I build cloud-native .NET systems and help teams stay in control when AI agents write the code.",
    {
      measure: assets.measureBody,
      maxWidth: STATEMENT.maxWidth,
      maxHeight: 4 * STATEMENT.lineHeight,
      sizes: [STATEMENT.fontSize],
      lineHeight: STATEMENT.lineHeight / STATEMENT.fontSize,
      tracking: STATEMENT.tracking,
    }
  );

  return {
    kind: "site",
    logo: assets.logo,
    portrait: assets.portrait,
    greetingSize: greetingSize ?? 72,
    statement: statement.lines,
  };
}

/**
 * Loads all static assets needed for rendering.
 *
 * Fonts are loaded eagerly because Satori requires explicit font data instead
 * of reading system fonts by itself. The portrait is cropped to the square the
 * card shows, at twice its size.
 */
async function loadAssets(): Promise<SocialCardAssets> {
  // The renderer silently drops an embedded SVG it cannot parse, so check them up front.
  await Promise.all(
    [true, false].map((isImplements) =>
      sharp(Buffer.from(arrowSvg(isImplements, ARROW_HEIGHT))).metadata()
    )
  );
  const [logo, portrait, ...fontData] = await Promise.all([
    fs.readFile(LOGO_PATH),
    // The home page's crop: object-position 60% 45% on the 1600 x 1200 photo.
    sharp(PHOTO_PATH)
      .extract({ left: 240, top: 0, width: 1200, height: 1200 })
      .resize(760, 760)
      .jpeg({ quality: 90 })
      .toBuffer(),
    ...FONTS.map((font) =>
      readRequiredFile(path.join(FONT_ASSETS_DIR, font.file), `social-card font ${font.file}`)
    ),
  ]);

  const fonts = FONTS.map((font, index) => ({
    name: font.name,
    data: fontData[index],
    weight: font.weight,
    style: "normal" as const,
  }));

  // The code that draws the cards belongs to the cache key too.
  const code = await Promise.all([__filename, TEMPLATE_PATH].map((file) => fs.readFile(file)));
  const digest = crypto.createHash("sha256");
  for (const data of [logo, portrait, ...fontData, ...code]) digest.update(data);

  return {
    digest: digest.digest("hex"),
    logo: `data:image/svg+xml;base64,${logo.toString("base64")}`,
    portrait: `data:image/jpeg;base64,${portrait.toString("base64")}`,
    fonts,
    measureTitle: createMeasurer(
      fontData[FONTS.findIndex((font) => font.name === "Mona Sans SemiExpanded")]
    ),
    measureBody: createMeasurer(fontData[FONTS.findIndex((font) => font.weight === 500)]),
  };
}

/**
 * Renders one card via Satori and encodes it as JPEG.
 */
async function renderCard(model: SocialCardModel, assets: SocialCardAssets): Promise<Buffer> {
  const svg = await satori(React.createElement(SocialCard, model), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: assets.fonts,
  });

  return sharp(Buffer.from(svg)).flatten({ background: "#0b1424" }).jpeg(JPEG_OPTIONS).toBuffer();
}

/**
 * Generates the fallback site-wide social card used on pages that do not have
 * their own dedicated card.
 */
async function generateDefaultSiteCard(assets: SocialCardAssets): Promise<void> {
  await fs.writeFile(
    DEFAULT_SOCIAL_CARD_PATH,
    await renderCard(buildSiteCardModel(assets), assets)
  );
}

/**
 * Normalizes the raw frontmatter value of an `image` field for comparisons.
 */
function normalizeImageValue(imageValue: string): string {
  return stripWrappingQuotes(imageValue.trim());
}

/**
 * Ensures the markdown frontmatter points at the generated social card.
 *
 * Important behavior:
 * - if the file already uses our managed path, we do nothing
 * - if the file uses the legacy PNG path of its card, we rewrite it
 * - if the file uses a different image, we treat it as a custom override
 * - otherwise we insert the generated image path into the frontmatter
 */
function updateFrontmatterImage(
  content: string,
  managedImagePath: string,
  legacyManagedImagePath: string
): FrontmatterUpdateResult {
  if (!hasFrontmatter(content)) {
    const eol = content.includes("\r\n") ? "\r\n" : "\n";
    return {
      content: `---${eol}image: ${managedImagePath}${eol}---${eol}${content}`,
      status: "inserted",
    };
  }

  const block = getFrontmatterBlock(content);
  const lines = block.body.split(block.eol);
  const imageIndex = lines.findIndex((line) => /^image:\s*/u.test(line));

  if (imageIndex >= 0) {
    const currentValue = normalizeImageValue(lines[imageIndex].replace(/^image:\s*/u, ""));
    if (currentValue === managedImagePath) {
      return {
        content,
        status: "unchanged",
      };
    }

    if (currentValue === legacyManagedImagePath) {
      lines[imageIndex] = `image: ${managedImagePath}`;
      return {
        content: `${content.slice(0, block.bodyStart)}${lines.join(block.eol)}${content.slice(block.bodyEnd)}`,
        status: "migrated",
      };
    }

    return {
      content,
      status: "custom-image",
    };
  }

  // After the (social) title if that is a one-line value; otherwise at the end of the block, so a
  // multi-line value is never split.
  const titleIndex = [/^socialTitle:\s*/u, /^title:\s*/u]
    .map((pattern) => lines.findIndex((line) => pattern.test(line)))
    .find((index) => index >= 0);
  const isOneLine =
    titleIndex !== undefined &&
    !isBlockScalar(lines[titleIndex].replace(/^\w+:\s*/u, "").trim()) &&
    !/^\s/u.test(lines[titleIndex + 1] ?? "");
  const targetIndex = isOneLine ? titleIndex : lines.length - 1;

  lines.splice(targetIndex + 1, 0, `image: ${managedImagePath}`);
  const updatedBlock = lines.join(block.eol);

  return {
    content: `${content.slice(0, block.bodyStart)}${updatedBlock}${content.slice(block.bodyEnd)}`,
    status: "inserted",
  };
}

/**
 * Reads the cache manifest if it exists. Missing manifest is treated as "empty
 * cache".
 */
async function loadManifest(): Promise<SocialCardManifest> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw) as SocialCardManifest;
    return {
      templateVersion: parsed.templateVersion ?? "",
      items: parsed.items ?? {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        templateVersion: "",
        items: {},
      };
    }

    throw error;
  }
}

/**
 * Executes async work with a simple concurrency limit.
 *
 * We use a small worker pool here to avoid spawning too many simultaneous Sharp
 * jobs while still keeping the overall run time low.
 */
async function runWithConcurrency<T>(
  values: T[],
  limit: number,
  worker: (value: T) => Promise<void>
): Promise<void> {
  const queue = [...values];
  const running = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) {
        return;
      }

      await worker(next);
    }
  });

  await Promise.all(running);
}

/**
 * Main entry point.
 *
 * This function ties together discovery, cache lookup, image generation,
 * frontmatter mutation, cleanup of stale files, and manifest writing.
 */
async function main(): Promise<void> {
  const startTime = performance.now();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const [assets, previousManifest, blogItems, eventItems, docsItems] = await Promise.all([
    loadAssets(),
    loadManifest(),
    discoverContent(BLOG_DIR, "blog"),
    discoverContent(EVENTS_DIR, "events"),
    discoverContent(DOCS_DIR, "docs"),
  ]);

  const items = [...blogItems, ...eventItems, ...docsItems];
  const nextManifest: SocialCardManifest = {
    templateVersion: TEMPLATE_VERSION,
    items: {},
  };

  let generatedCount = 0;
  let cachedCount = 0;
  let skippedCustomImageCount = 0;
  let updatedFrontmatterCount = 0;

  await runWithConcurrency(items, CONCURRENCY, async (item) => {
    const managedImagePath = getManagedImagePath(item.slug);
    const absoluteOutputPath = path.join(STATIC_DIR, managedImagePath.replace(/^\//u, ""));
    const content = await fs.readFile(item.filePath, "utf8");
    const frontmatterResult = updateFrontmatterImage(
      content,
      managedImagePath,
      getLegacyManagedImagePath(item.slug)
    );

    if (frontmatterResult.status === "custom-image") {
      skippedCustomImageCount += 1;
      return;
    }

    if (frontmatterResult.status === "inserted" || frontmatterResult.status === "migrated") {
      await fs.writeFile(item.filePath, frontmatterResult.content);
      updatedFrontmatterCount += 1;
    }

    const model = buildCardModel(item, assets);
    const currentHash = hashCard(model, assets);
    nextManifest.items[item.slug] = currentHash;

    const previousHash = previousManifest.items[item.slug];
    const outputAlreadyExists = await fs
      .access(absoluteOutputPath)
      .then(() => true)
      .catch(() => false);

    if (
      previousManifest.templateVersion === TEMPLATE_VERSION &&
      previousHash === currentHash &&
      outputAlreadyExists
    ) {
      cachedCount += 1;
      return;
    }

    await fs.writeFile(absoluteOutputPath, await renderCard(model, assets));
    generatedCount += 1;
  });

  const desiredFiles = new Set(
    Object.keys(nextManifest.items).map((slug) => `${slugToFileName(slug)}${CARD_EXTENSION}`)
  );
  const existingOutputFiles = await fs.readdir(OUTPUT_DIR);
  let removedCount = 0;

  for (const fileName of existingOutputFiles) {
    if (!fileName.endsWith(CARD_EXTENSION) && !fileName.endsWith(LEGACY_CARD_EXTENSION)) {
      continue;
    }

    if (!desiredFiles.has(fileName)) {
      await fs.unlink(path.join(OUTPUT_DIR, fileName));
      removedCount += 1;
    }
  }

  const sortedManifest: SocialCardManifest = {
    templateVersion: nextManifest.templateVersion,
    items: Object.fromEntries(
      Object.keys(nextManifest.items)
        .sort((left, right) => left.localeCompare(right))
        .map((slug) => [slug, nextManifest.items[slug]])
    ),
  };

  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(sortedManifest, null, 2)}\n`);
  await generateDefaultSiteCard(assets);

  const elapsedMs = Math.round(performance.now() - startTime);
  console.log(
    [
      `Generated ${generatedCount} social card(s).`,
      `Reused ${cachedCount} unchanged card(s).`,
      `Skipped ${skippedCustomImageCount} item(s) with custom image frontmatter.`,
      `Updated ${updatedFrontmatterCount} file(s) with managed image frontmatter.`,
      removedCount > 0 ? `Removed ${removedCount} stale card(s).` : null,
      `Completed in ${elapsedMs} ms.`,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
