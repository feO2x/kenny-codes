import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import React from "react";
import satori from "satori";
import sharp from "sharp";

import {
  SocialCardTemplate,
  type SocialCardTemplateModel,
} from "./social-card-template";

/**
 * This script generates all build-time social cards for blog posts and events.
 *
 * High-level flow:
 * 1. Discover markdown / MDX content files.
 * 2. Read their frontmatter and derive the data needed for a card.
 * 3. Render a text overlay with Satori.
 * 4. Composite that overlay onto a shared background using Sharp.
 * 5. Write the PNG into `static/img/social-cards/`.
 * 6. Update markdown frontmatter so Docusaurus uses the generated card.
 *
 * The script is deterministic on purpose. Generated files are committed to git,
 * so identical content should always result in identical images.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const BLOG_DIR = path.join(__dirname, "../blog");
const EVENTS_DIR = path.join(__dirname, "../events");
const STATIC_DIR = path.join(__dirname, "../static");
const OUTPUT_DIR = path.join(STATIC_DIR, "img/social-cards");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
const DEFAULT_SOCIAL_CARD_PATH = path.join(STATIC_DIR, "img/kenny-codes-social-card.png");
const LOGO_PATH = path.join(STATIC_DIR, "img/logo-dark.svg");
const PHOTO_PATH = path.join(STATIC_DIR, "img/kenny-smiles.jpg");
/**
 * The social-card renderer uses repo-local font files so builds do not depend
 * on OS-specific system font locations. The files are checked into
 * `scripts/assets/fonts/` together with their upstream license text.
 */
const FONT_ASSETS_DIR = path.join(__dirname, "assets/fonts");
const FONT_REGULAR_PATH = path.join(FONT_ASSETS_DIR, "DejaVuSans.ttf");
const FONT_BOLD_PATH = path.join(FONT_ASSETS_DIR, "DejaVuSans-Bold.ttf");
/**
 * Bump this value whenever the rendering logic or visual design changes in a
 * way that should invalidate the cached images. The manifest stores this value
 * together with per-item hashes.
 */
const TEMPLATE_VERSION = "2026-03-22-v13";
const CONCURRENCY = 4;

type ContentKind = "blog" | "events";

/**
 * Minimal frontmatter representation used by this script.
 *
 * We intentionally keep parsing lightweight instead of pulling in a full YAML
 * parser because the project's frontmatter structure is simple and predictable.
 */
interface Frontmatter {
  [key: string]: string | string[] | undefined;
}

/**
 * Describes where the frontmatter block lives inside the original source file.
 *
 * This lets us replace only the frontmatter section while preserving the rest
 * of the file content exactly as it was.
 */
interface FrontmatterBlock {
  body: string;
  bodyStart: number;
  bodyEnd: number;
}

/**
 * Normalized content data used by the generator. The raw markdown file is
 * converted into this shape before any rendering starts.
 */
interface ContentItem {
  filePath: string;
  kind: ContentKind;
  slug: string;
  title: string;
  socialTitle?: string;
  date: string;
  tags: string[];
  type?: string;
  duration?: string;
  language?: string;
  location?: string;
  country?: string;
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
  logoDataUri: string;
  fonts: Array<{ name: string; data: Buffer; weight: 400 | 700; style: "normal" }>;
  baseTemplate: Buffer;
}

/**
 * Result of trying to ensure a markdown file points at its generated image.
 *
 * `custom-image` means the file already defines a different image and should be
 * left alone. That is the escape hatch for manual overrides.
 */
interface FrontmatterUpdateResult {
  content: string;
  status: "inserted" | "unchanged" | "custom-image";
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
 * Parses the top frontmatter block into a simple key/value object.
 *
 * The parser supports:
 * - scalar values
 * - inline arrays like `[a, b, c]`
 * - basic YAML list syntax using leading `-`
 *
 * This is intentionally a narrow parser tailored to the repository's content.
 */
function parseFrontmatter(content: string): Frontmatter {
  const block = getFrontmatterBlock(content);
  const lines = block.body.split("\n");
  const frontmatter: Frontmatter = {};
  let currentKey: string | null = null;

  for (const line of lines) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/u);
    if (pair) {
      const [, key, rawValue] = pair;
      if (rawValue.length === 0) {
        currentKey = key;
        continue;
      }

      frontmatter[key] = parseFrontmatterValue(rawValue);
      currentKey = key;
      continue;
    }

    const listItem = line.match(/^\s*-\s+(.*)$/u);
    if (listItem && currentKey) {
      const existing = frontmatter[currentKey];
      const nextValue = stripWrappingQuotes(listItem[1].trim());
      if (Array.isArray(existing)) {
        existing.push(nextValue);
      } else {
        frontmatter[currentKey] = [nextValue];
      }
    }
  }

  return frontmatter;
}

/**
 * Parses one frontmatter value from its textual representation.
 */
function parseFrontmatterValue(rawValue: string): string | string[] {
  const trimmed = rawValue.trim();

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
      return [];
    }

    return inner.split(",").map((entry) => stripWrappingQuotes(entry.trim()));
  }

  return stripWrappingQuotes(trimmed);
}

/**
 * Removes one layer of wrapping single or double quotes from a value.
 */
function stripWrappingQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/gu, "");
}

/**
 * Extracts the first frontmatter block from the beginning of a file.
 *
 * The returned indices point to the frontmatter body only, not the surrounding
 * `---` delimiters.
 */
function getFrontmatterBlock(content: string): FrontmatterBlock {
  const match = content.match(/^---\n([\s\S]*?)\n---/u);
  if (!match || match.index !== 0) {
    throw new Error("Expected a frontmatter block at the top of the file.");
  }

  return {
    body: match[1],
    bodyStart: 4,
    bodyEnd: match[0].length - 4,
  };
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
 * Resolves the publication date for one content item.
 *
 * Priority:
 * 1. explicit `date` in frontmatter
 * 2. date prefix in the file name
 * 3. date prefix in the parent directory name
 */
function deriveDate(filePath: string, frontmatter: Frontmatter): string {
  const explicitDate = frontmatter.date;
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
 * Resolves the slug for one content item.
 *
 * Priority:
 * 1. explicit `slug` in frontmatter
 * 2. file name without extension
 * 3. parent folder name for `index.md` / `index.mdx`
 */
function deriveSlug(filePath: string, frontmatter: Frontmatter): string {
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
 * Reads one string-array field from the parsed frontmatter object.
 */
function getStringArrayField(frontmatter: Frontmatter, key: string): string[] {
  const value = frontmatter[key];
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

/**
 * Converts all markdown files below a content root into normalized `ContentItem`
 * objects.
 */
async function discoverContent(dirPath: string, kind: ContentKind): Promise<ContentItem[]> {
  const files = await getAllMarkdownFiles(dirPath);

  return Promise.all(
    files.map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf8");
      const frontmatter = parseFrontmatter(content);

      return {
        filePath,
        kind,
        slug: deriveSlug(filePath, frontmatter),
        title: getStringField(frontmatter, "title") ?? path.basename(filePath, path.extname(filePath)),
        socialTitle: getStringField(frontmatter, "socialTitle"),
        date: deriveDate(filePath, frontmatter),
        tags: getStringArrayField(frontmatter, "tags"),
        type: getStringField(frontmatter, "type"),
        duration: getStringField(frontmatter, "duration"),
        language: getStringField(frontmatter, "language"),
        location: getStringField(frontmatter, "location"),
        country: getStringField(frontmatter, "country"),
        event: getStringField(frontmatter, "event"),
      };
    })
  );
}

/**
 * Converts a content slug into a file-system-safe PNG file name.
 */
function slugToFileName(slug: string): string {
  return slug.replace(/^\/+|\/+$/gu, "").replace(/\//gu, "-");
}

/**
 * Returns the public site path used in frontmatter and final HTML metadata.
 */
function getManagedImagePath(slug: string): string {
  return `/img/social-cards/${slugToFileName(slug)}.png`;
}

/**
 * Calculates a stable content hash for one card input.
 *
 * If any of these values change, the corresponding image must be regenerated.
 */
function hashItem(item: ContentItem): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        templateVersion: TEMPLATE_VERSION,
        kind: item.kind,
        slug: item.slug,
        title: item.title,
        socialTitle: item.socialTitle,
        date: item.date,
        tags: item.tags,
        type: item.type,
        duration: item.duration,
        language: item.language,
        location: item.location,
        country: item.country,
        event: item.event,
      })
    )
    .digest("hex");
}

/**
 * Formats the card date in the short English style used by the design.
 */
function formatDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Shortens long supporting strings such as conference names.
 */
function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}\u2026`;
}

/**
 * Turns frontmatter tags like `cloud-native` into nicer card labels.
 */
function formatTag(tag: string): string {
  return tag.replace(/-/gu, " ");
}

/**
 * Maps normalized content into the text model expected by the visual template.
 */
function buildTemplateModel(item: ContentItem, assets: SocialCardAssets): SocialCardTemplateModel {
  const title = item.socialTitle?.trim() || item.title;
  const detailLabel = formatDate(item.date);

  if (item.kind === "blog") {
    return {
      contentKind: "blog",
      categoryLabel: "Blog Post",
      detailLabel,
      title,
      supportingLine: undefined,
      chips: item.tags.slice(0, 3).map(formatTag),
      footerLabel: "kenny-codes.net",
      logoDataUri: assets.logoDataUri,
    };
  }

  const supportingLine = item.event
    ? truncateText(item.event, 48)
    : [item.location, item.country].filter(Boolean).join(", ");
  const chips = [item.location, item.language, item.duration]
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);

  return {
    contentKind: "event",
    categoryLabel: item.type ?? "Event",
    detailLabel,
    title,
    supportingLine: supportingLine || undefined,
    chips,
    footerLabel: "kenny-codes.net",
    logoDataUri: assets.logoDataUri,
  };
}

/**
 * Loads all static assets needed for rendering.
 *
 * Fonts are loaded eagerly because Satori requires explicit font data instead
 * of reading system fonts by itself.
 */
async function loadAssets(): Promise<SocialCardAssets> {
  const [logo, regularFont, boldFont, baseTemplate] = await Promise.all([
    fs.readFile(LOGO_PATH, "utf8"),
    readRequiredFile(FONT_REGULAR_PATH, "regular social-card font"),
    readRequiredFile(FONT_BOLD_PATH, "bold social-card font"),
    createBaseTemplate(),
  ]);

  return {
    logoDataUri: `data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`,
    fonts: [
      { name: "DejaVu Sans", data: regularFont, weight: 400, style: "normal" },
      { name: "DejaVu Sans", data: boldFont, weight: 700, style: "normal" },
    ],
    baseTemplate,
  };
}

/**
 * Builds the shared image background used for all cards.
 *
 * The text overlay is rendered separately. This split keeps design work
 * manageable: background composition lives here, dynamic text layout lives in
 * the React template.
 */
async function createBaseTemplate(): Promise<Buffer> {
  const backgroundSvg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#081018" />
          <stop offset="58%" stop-color="#0d1623" />
          <stop offset="100%" stop-color="#101a28" />
        </linearGradient>
        <radialGradient id="glowA" cx="0.18" cy="0.22" r="0.62">
          <stop offset="0%" stop-color="rgba(49, 217, 208, 0.38)" />
          <stop offset="100%" stop-color="rgba(49, 217, 208, 0)" />
        </radialGradient>
        <radialGradient id="glowB" cx="0.72" cy="0.82" r="0.48">
          <stop offset="0%" stop-color="rgba(56, 126, 255, 0.22)" />
          <stop offset="100%" stop-color="rgba(56, 126, 255, 0)" />
        </radialGradient>
        <linearGradient id="divider" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(53, 216, 208, 0.78)" />
          <stop offset="100%" stop-color="rgba(73, 140, 255, 0.18)" />
        </linearGradient>
      </defs>
      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#bg)" />
      <rect x="0" y="0" width="780" height="${CARD_HEIGHT}" fill="url(#glowA)" />
      <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#glowB)" />
      <path d="M0 485 C200 430 370 405 640 456 C742 474 820 505 920 545 L920 630 L0 630 Z" fill="rgba(18, 31, 48, 0.84)" />
      <path d="M0 76 C140 38 270 24 384 42 C516 63 612 132 710 162 L710 208 C612 178 515 136 382 116 C261 99 141 110 0 144 Z" fill="rgba(43, 67, 97, 0.22)" />
      <rect x="716" y="0" width="4" height="${CARD_HEIGHT}" rx="2" fill="url(#divider)" />
    </svg>
  `;

  const photoOverlaySvg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="photoShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="rgba(6, 11, 18, 0.86)" />
          <stop offset="28%" stop-color="rgba(6, 11, 18, 0.34)" />
          <stop offset="100%" stop-color="rgba(6, 11, 18, 0.08)" />
        </linearGradient>
        <linearGradient id="photoTint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(55, 116, 255, 0.18)" />
          <stop offset="100%" stop-color="rgba(15, 24, 38, 0.44)" />
        </linearGradient>
      </defs>
      <rect x="720" y="0" width="480" height="${CARD_HEIGHT}" fill="url(#photoShade)" />
      <rect x="720" y="0" width="480" height="${CARD_HEIGHT}" fill="url(#photoTint)" />
      <circle cx="1125" cy="92" r="118" fill="rgba(53, 216, 208, 0.16)" />
    </svg>
  `;

  const photo = await sharp(PHOTO_PATH)
    .resize(480, CARD_HEIGHT, {
      fit: "cover",
      position: "centre",
    })
    .modulate({
      brightness: 0.96,
      saturation: 0.95,
    })
    .toBuffer();

  return sharp({
    create: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      channels: 4,
      background: "#071019",
    },
  })
    .composite([
      { input: Buffer.from(backgroundSvg), top: 0, left: 0 },
      { input: photo, top: 0, left: 720 },
      { input: Buffer.from(photoOverlaySvg), top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

/**
 * Renders the React overlay to SVG via Satori and then converts it to a PNG
 * buffer so Sharp can composite it.
 */
async function renderOverlay(
  model: SocialCardTemplateModel,
  assets: SocialCardAssets
): Promise<Buffer> {
  const svg = await satori(React.createElement(SocialCardTemplate, model), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: assets.fonts,
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * Generates the fallback site-wide social card used on pages that do not have
 * their own dedicated card.
 */
async function generateDefaultSiteCard(assets: SocialCardAssets): Promise<void> {
  const model: SocialCardTemplateModel = {
    contentKind: "blog",
    categoryLabel: "Kenny Codes",
    detailLabel: "AI, Cloud-Native, and .NET",
    title: "Distributed Systems, Software Architecture, and Guided Coding",
    supportingLine: "Blog posts, speaking events, and practical guidance by Kenny Pflug.",
    chips: ["Blog", "Events", "Guided Coding"],
    footerLabel: "kenny-codes.net",
    logoDataUri: assets.logoDataUri,
  };

  const overlay = await renderOverlay(model, assets);
  const image = await sharp(assets.baseTemplate)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer();

  await fs.writeFile(DEFAULT_SOCIAL_CARD_PATH, image);
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
 * - if the file uses a different image, we treat it as a custom override
 * - otherwise we insert the generated image path into the frontmatter
 */
function updateFrontmatterImage(content: string, managedImagePath: string): FrontmatterUpdateResult {
  const block = getFrontmatterBlock(content);
  const lines = block.body.split("\n");
  const imageIndex = lines.findIndex((line) => /^image:\s*/u.test(line));

  if (imageIndex >= 0) {
    const currentValue = normalizeImageValue(lines[imageIndex].replace(/^image:\s*/u, ""));
    if (currentValue === managedImagePath) {
      return {
        content,
        status: "unchanged",
      };
    }

    return {
      content,
      status: "custom-image",
    };
  }

  const insertAfterIndex = lines.findIndex((line) => /^socialTitle:\s*/u.test(line));
  const fallbackIndex = lines.findIndex((line) => /^title:\s*/u.test(line));
  const targetIndex =
    insertAfterIndex >= 0
      ? insertAfterIndex
      : fallbackIndex >= 0
        ? fallbackIndex
        : lines.length - 1;

  lines.splice(targetIndex + 1, 0, `image: ${managedImagePath}`);
  const updatedBlock = lines.join("\n");

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

  const [assets, previousManifest, blogItems, eventItems] = await Promise.all([
    loadAssets(),
    loadManifest(),
    discoverContent(BLOG_DIR, "blog"),
    discoverContent(EVENTS_DIR, "events"),
  ]);

  const items = [...blogItems, ...eventItems];
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
    const frontmatterResult = updateFrontmatterImage(content, managedImagePath);

    if (frontmatterResult.status === "custom-image") {
      skippedCustomImageCount += 1;
      return;
    }

    if (frontmatterResult.status === "inserted") {
      await fs.writeFile(item.filePath, frontmatterResult.content);
      updatedFrontmatterCount += 1;
    }

    const currentHash = hashItem(item);
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

    const model = buildTemplateModel(item, assets);
    const overlay = await renderOverlay(model, assets);
    const image = await sharp(assets.baseTemplate)
      .composite([{ input: overlay, top: 0, left: 0 }])
      .png()
      .toBuffer();

    await fs.writeFile(absoluteOutputPath, image);
    generatedCount += 1;
  });

  const desiredFiles = new Set(
    Object.keys(nextManifest.items).map((slug) => `${slugToFileName(slug)}.png`)
  );
  const existingOutputFiles = await fs.readdir(OUTPUT_DIR);
  let removedCount = 0;

  for (const fileName of existingOutputFiles) {
    if (!fileName.endsWith(".png")) {
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
