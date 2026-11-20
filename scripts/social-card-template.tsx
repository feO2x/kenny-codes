import React from "react";

/**
 * The presentational part of the build-time social-card pipeline. It does two jobs:
 *
 * 1. It measures text with the real font metrics and breaks titles into balanced lines at the
 *    largest size that fits.
 * 2. It renders a card as a React tree that Satori turns into SVG.
 *
 * Everything is deterministic: the cards are committed to git, so the same content must always
 * produce the same image.
 *
 * The cards follow the site's home page: navy page colour, Mona Sans, the mint-to-blue brand
 * gradient on the one focal element, and the phase and category colours of Guided Coding and
 * CHACK.
 */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const PAD_X = 72;
const PAD_Y = 64;
/** The right column: the portrait, or the method motif on docs cards. */
const VISUAL_WIDTH = 380;
const COLUMN_GAP = 64;
/** The left column, where all text lives. */
export const TEXT_WIDTH = CARD_WIDTH - 2 * PAD_X - VISUAL_WIDTH - COLUMN_GAP;
const BRAND_ROW_HEIGHT = 48;

const TITLE_FONT = "Mona Sans SemiExpanded";
const TITLE_TRACKING = -0.025;
const TITLE_LINE_HEIGHT = 1.08;
const TITLE_SIZES = [76, 72, 68, 64, 60, 56, 52, 48, 44];

/** The site's dark theme, from `src/css/custom.css`. */
const color = {
  bg: "#0b1424",
  ink: "#e8eef8",
  muted: "#9eadc5",
  /** The site's `--kc-control-line`: outlines of neutral boxes and the process boundary. */
  line: "rgba(160, 185, 230, 0.5)",
  onTile: "#0c1a30",
  brand: "linear-gradient(135deg, #33ffdc 0%, #3393ff 100%)",
  brandText: "linear-gradient(100deg, #3393ff 0%, #33ffdc 100%)",
  blue: "linear-gradient(135deg, #7cbcff, #3393ff)",
  amber: "linear-gradient(135deg, #ffd780, #ffa63d)",
  violet: "linear-gradient(135deg, #b9a4ff, #8b6cff)",
  magenta: "linear-gradient(135deg, #ff9fd0, #ff5c9e)",
};

const PHASES = [
  { key: "planning", number: 1, label: "Plan", tile: color.blue },
  { key: "implementing", number: 2, label: "Implement", tile: color.amber },
  { key: "guiding", number: 3, label: "Guide", tile: color.violet },
] as const;

/** The four CHACK categories in the colours of the CHACK diagram. */
const CHACK_TILES = {
  core: color.brand,
  humble: color.violet,
  tests: color.magenta,
  root: color.amber,
} as const;

export type GuidedCodingPhase = (typeof PHASES)[number]["key"];
export type ChackPart = keyof typeof CHACK_TILES;

/* ---------- Text measurement ---------- */

/** Width of `text` in pixels at `fontSize`, with `tracking` in em per character. */
export interface TextMeasurer {
  (text: string, fontSize: number, tracking?: number): number;
  /** The characters of `text` the font has no glyph for; it would draw them as a placeholder. */
  missing(text: string): string[];
}

/**
 * Reads the advance widths of a TrueType font: `cmap` (format 4) maps characters to glyphs and
 * `hmtx` holds each glyph's width. Kerning is left out; the fitter keeps a small margin for it.
 */
export function createMeasurer(font: Buffer): TextMeasurer {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const tables: Record<string, number> = {};
  for (let index = 0; index < view.getUint16(4); index += 1) {
    const record = 12 + 16 * index;
    tables[font.toString("latin1", record, record + 4)] = view.getUint32(record + 8);
  }

  const unitsPerEm = view.getUint16(tables.head + 18);
  const metricCount = view.getUint16(tables.hhea + 34);
  const cmap = tables.cmap;
  let format4 = -1;
  for (let index = 0; index < view.getUint16(cmap + 2); index += 1) {
    const record = cmap + 4 + 8 * index;
    const subtable = cmap + view.getUint32(record + 4);
    const isUnicode = view.getUint16(record) === 0 || view.getUint16(record + 2) === 1;
    if (isUnicode && view.getUint16(subtable) === 4) {
      format4 = subtable;
      break;
    }
  }
  if (format4 < 0) {
    throw new Error("The social-card font has no Unicode cmap of format 4.");
  }

  const segments = view.getUint16(format4 + 6) / 2;
  const ends = format4 + 14;
  const starts = ends + 2 * segments + 2;
  const deltas = starts + 2 * segments;
  const ranges = deltas + 2 * segments;
  const glyphOf = (code: number): number => {
    for (let segment = 0; segment < segments; segment += 1) {
      if (code > view.getUint16(ends + 2 * segment)) continue;
      const start = view.getUint16(starts + 2 * segment);
      if (code < start) return 0;
      const delta = view.getInt16(deltas + 2 * segment);
      const range = view.getUint16(ranges + 2 * segment);
      if (range === 0) return (code + delta) & 0xffff;
      const glyph = view.getUint16(ranges + 2 * segment + range + 2 * (code - start));
      return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    }
    return 0;
  };

  const widths = new Map<string, number>();
  const advanceOf = (char: string): number => {
    let width = widths.get(char);
    if (width === undefined) {
      const glyph = glyphOf(char.codePointAt(0) ?? 0);
      width = view.getUint16(tables.hmtx + 4 * Math.min(glyph, metricCount - 1)) / unitsPerEm;
      widths.set(char, width);
    }
    return width;
  };

  const measure = (text: string, fontSize: number, tracking = 0) => {
    const chars = Array.from(text);
    const em = chars.reduce((total, char) => total + advanceOf(char), 0);
    return (em + tracking * Math.max(0, chars.length - 1)) * fontSize;
  };
  const missing = (text: string) =>
    [...new Set(Array.from(text))].filter(
      (char) => !/\s/u.test(char) && glyphOf(char.codePointAt(0) ?? 0) === 0
    );
  return Object.assign(measure, { missing });
}

/** Fails for text with characters the font lacks, such as emoji. */
export function assertGlyphs(text: string, measure: TextMeasurer): void {
  const missing = measure.missing(text);
  if (missing.length > 0) {
    throw new Error(`"${text}" contains characters Mona Sans cannot draw: ${missing.join(" ")}`);
  }
}

/* ---------- Line breaking ---------- */

const CONNECTOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

/** A word, or the part of a hyphenated word after a hyphen (glued to the part before). */
interface Unit {
  text: string;
  glued: boolean;
}

/** Names that must not break across lines. */
const UNBREAKABLE = [
  "ASP.NET Core",
  "EF Core",
  "Native AOT",
  "Guided Coding",
  "Guided Learning",
  "Humble Objects",
  "Composition Root",
  "Automated Tests",
  "Vibe Coding",
];

function unitsOf(text: string): Unit[] {
  const units: Unit[] = [];
  const glued = UNBREAKABLE.reduce(
    (all, name) => all.replaceAll(name, name.replace(/ /gu, "\u00a0")),
    text
  );
  for (const word of glued.split(/[ \t\n]+/u).filter(Boolean)) {
    // A dash between words ends the line before it, never starts one; " - " is set as " – ".
    if (/^[-–—]$/u.test(word) && units.length > 0) {
      units[units.length - 1].text += ` ${word === "-" ? "–" : word}`;
      continue;
    }
    word
      .split(/(?<=-)(?=\p{L})/u)
      .forEach((part, index) => units.push({ text: part, glued: index > 0 }));
  }
  return units;
}

function joinUnits(units: Unit[]): string {
  return units
    .map((unit, index) => (index > 0 && !unit.glued ? ` ${unit.text}` : unit.text))
    .join("");
}

const bare = (word: string) =>
  word.replace(/^[^\p{L}\p{N}&]+|[^\p{L}\p{N}&]+$/gu, "").toLowerCase();

/** How bad a line looks, apart from its fill. Lower is better. */
function linePenalty(
  units: Unit[],
  next: Unit | undefined,
  isFirst: boolean,
  isLast: boolean,
  wordCount: number
): number {
  const words = joinUnits(units).split(" ");
  const last = words[words.length - 1];
  let penalty = 0;
  if (next?.glued) penalty += 400; // breaks a hyphenated word
  if (!isLast && CONNECTOR_WORDS.has(bare(last))) penalty += 250;
  if (units[0].text === "&") penalty += 450; // "&" belongs to the line before
  if (next && /^\d/u.test(next.text)) penalty += 120; // keeps "Windows 10" together
  if (!isLast && /[:,–—]$/u.test(last)) penalty -= 60; // a natural pause
  // A lone short word on the last line; short titles may break where they like.
  if (isLast && wordCount > 3 && words.length === 1 && bare(last).length <= 8) penalty += 160;
  // A lone word between two lines: "Software / Applications" reads as a list, not a title.
  if (!isFirst && !isLast && units.length === 1 && !units[0].text.includes("\u00a0")) {
    penalty += 150;
  }
  return penalty;
}

export interface FittedText {
  lines: string[];
  fontSize: number;
  lineHeight: number;
}

/**
 * Breaks `units` into at most `maxLines` lines of at most `maxWidth`, so that the lines are about
 * equally full (like `text-wrap: balance`) and avoid bad breaks. Returns `undefined` if no break
 * fits.
 */
function breakLines(
  units: Unit[],
  maxLines: number,
  fits: (text: string) => number | undefined
): { lines: string[]; cost: number } | undefined {
  const count = units.length;
  // best[lines][end]: the cheapest way to set units 0..end-1 on `lines` lines.
  const best: { cost: number; from: number }[][] = Array.from({ length: maxLines + 1 }, () => []);
  best[0][0] = { cost: 0, from: -1 };
  for (let lines = 1; lines <= maxLines; lines += 1) {
    for (let end = 1; end <= count; end += 1) {
      for (let start = end - 1; start >= 0; start -= 1) {
        const previous = best[lines - 1][start];
        const slice = units.slice(start, end);
        const slack = fits(joinUnits(slice));
        if (slack === undefined) break;
        if (!previous) continue;
        const isLast = end === count;
        const fill = slack * slack * (isLast ? 80 : 400);
        const cost =
          previous.cost + fill + linePenalty(slice, units[end], start === 0, isLast, count) + 80;
        if (!best[lines][end] || cost < best[lines][end].cost) {
          best[lines][end] = { cost, from: start };
        }
      }
    }
  }

  let bestLines = 0;
  for (let lines = 1; lines <= maxLines; lines += 1) {
    if (
      best[lines][count] &&
      (!bestLines || best[lines][count].cost < best[bestLines][count].cost)
    ) {
      bestLines = lines;
    }
  }
  if (!bestLines) return undefined;

  const lines: string[] = [];
  for (let lines_ = bestLines, end = count; lines_ > 0; lines_ -= 1) {
    const { from } = best[lines_][end];
    lines.unshift(joinUnits(units.slice(from, end)));
    end = from;
  }
  return { lines, cost: best[bestLines][count].cost };
}

/**
 * Sets `text` at the largest of `sizes` that fits `maxWidth` and `maxHeight`, trading a slightly
 * smaller size for clearly better breaks.
 */
export function fitText(
  text: string,
  options: {
    measure: TextMeasurer;
    maxWidth: number;
    maxHeight: number;
    sizes: number[];
    lineHeight: number;
    tracking?: number;
    /** More lines than four read as a paragraph, not a title. */
    maxLines?: number;
  }
): FittedText {
  // Only plain white space collapses: a non-breaking space keeps two words together.
  assertGlyphs(text, options.measure);
  const units = unitsOf(text.replace(/[ \t\r\n]+/gu, " ").trim());
  let best: (FittedText & { cost: number }) | undefined;
  for (const fontSize of options.sizes) {
    const lineHeight = Math.round(fontSize * options.lineHeight);
    const maxLines = Math.min(options.maxLines ?? 4, Math.floor(options.maxHeight / lineHeight));
    if (maxLines < 1) continue;
    // Two percent of margin for kerning, which the measurer leaves out.
    const width = options.maxWidth * 0.98;
    const result = breakLines(units, maxLines, (line) => {
      const used = options.measure(line, fontSize, options.tracking);
      return used <= width ? 1 - used / width : undefined;
    });
    if (!result) continue;
    const cost = result.cost + (options.sizes[0] - fontSize) * 22;
    if (!best || cost < best.cost) {
      best = { lines: result.lines, fontSize, lineHeight, cost };
    }
  }
  if (!best) {
    throw new Error(`"${text}" does not fit on a social card. Give it a shorter socialTitle.`);
  }
  return {
    lines: best.lines,
    fontSize: best.fontSize,
    lineHeight: best.lineHeight,
  };
}

/** Fits a card title into the text column above `reserved` pixels of other content. */
export function fitTitle(title: string, measure: TextMeasurer, reserved: number): FittedText {
  return fitText(title, {
    measure,
    maxWidth: TEXT_WIDTH,
    maxHeight: CARD_HEIGHT - 2 * PAD_Y - BRAND_ROW_HEIGHT - 48 - reserved,
    sizes: TITLE_SIZES,
    lineHeight: TITLE_LINE_HEIGHT,
    tracking: TITLE_TRACKING,
  });
}

/* ---------- Card models ---------- */

interface CardAssets {
  logo: string;
  portrait: string;
}

/** The card for the home page and every page without a card of its own. */
export interface SiteCardModel extends CardAssets {
  kind: "site";
  greetingSize: number;
  statement: string[];
}

/** A blog post or an event: the title, what and when, and the portrait. */
export interface ContentCardModel extends CardAssets {
  kind: "content";
  title: FittedText;
  /** The event, or the author; shrunk to fit on one line. */
  primary: { text: string; fontSize: number };
  /** What it is, and when. */
  secondary: string;
}

/** A docs page: the section, the title, and the motif of its method. */
export interface DocsCardModel extends CardAssets {
  kind: "docs";
  section: string;
  title: FittedText;
  /** The method's motif; a section without one shows the portrait. */
  motif?:
    | { method: "guided-coding"; highlight?: GuidedCodingPhase }
    | { method: "chack"; highlight?: ChackPart };
}

export type SocialCardModel = SiteCardModel | ContentCardModel | DocsCardModel;

/** The two lines below a content card's title. */
const META = {
  gap: 30,
  primaryLineHeight: 36,
  secondaryGap: 6,
  secondarySize: 27,
  secondaryLineHeight: 34,
};
/** The section line above a docs card's title. */
const SECTION = { fontSize: 27, lineHeight: 34, gap: 22 };

/** Space the meta lines below a content card's title take, for `fitTitle`. */
export const CONTENT_META_HEIGHT =
  META.gap + META.primaryLineHeight + META.secondaryGap + META.secondaryLineHeight;
/** Space the section line above a docs card's title takes, for `fitTitle`. */
export const DOCS_SECTION_HEIGHT = SECTION.lineHeight + SECTION.gap;

export const STATEMENT = {
  tracking: -0.01,
  fontSize: 31,
  lineHeight: 41,
  maxWidth: TEXT_WIDTH,
};

/* ---------- Rendering ---------- */

function BrandRow({ logo }: { logo: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        height: `${BRAND_ROW_HEIGHT}px`,
      }}
    >
      <img src={logo} width={44} height={44} alt="" />
      <span
        style={{
          fontFamily: TITLE_FONT,
          fontSize: "27px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: color.ink,
        }}
      >
        Kenny Codes
      </span>
    </div>
  );
}

/** The home page's portrait: a squircle in a ring of the brand gradient. */
function Portrait({ src }: { src: string }) {
  const ring = 5;
  const inner = VISUAL_WIDTH - 2 * ring;
  return (
    <div
      style={{
        display: "flex",
        padding: `${ring}px`,
        borderRadius: `${Math.round(VISUAL_WIDTH * 0.31)}px`,
        backgroundImage: color.brand,
      }}
    >
      <img
        src={src}
        width={inner}
        height={inner}
        alt=""
        style={{
          borderRadius: `${Math.round(inner * 0.31) - 1}px`,
          objectFit: "cover",
        }}
      />
    </div>
  );
}

function Title({ title }: { title: FittedText }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {title.lines.map((line, index) => (
        <span
          key={index}
          style={{
            fontFamily: TITLE_FONT,
            fontSize: `${title.fontSize}px`,
            lineHeight: `${title.lineHeight}px`,
            fontWeight: 600,
            letterSpacing: `${TITLE_TRACKING}em`,
            color: color.ink,
            whiteSpace: "nowrap",
          }}
        >
          {line}
        </span>
      ))}
    </div>
  );
}

/** Small squares in the method's colours, like the step badges on the home page. */
function Swatches({ tiles }: { tiles: string[] }) {
  return (
    <div style={{ display: "flex", gap: "6px", width: `${4 * 18 + 3 * 6}px` }}>
      {tiles.map((tile, index) => (
        <div
          key={index}
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "5px",
            backgroundImage: tile,
          }}
        />
      ))}
    </div>
  );
}

function SiteText({ greetingSize, statement }: Pick<SiteCardModel, "greetingSize" | "statement">) {
  const methods = [
    {
      tiles: PHASES.map((phase) => phase.tile),
      name: "Guided Coding & Guided Learning",
    },
    {
      tiles: [CHACK_TILES.core, CHACK_TILES.humble, CHACK_TILES.tests, CHACK_TILES.root],
      name: "CHACK",
    },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          fontFamily: TITLE_FONT,
          fontSize: `${greetingSize}px`,
          lineHeight: `${Math.round(greetingSize * 1.12)}px`,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: color.ink,
        }}
      >
        <span>Hi, I’m&nbsp;</span>
        <span
          style={{
            backgroundImage: color.brandText,
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Kenny.
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: "18px" }}>
        {statement.map((line, index) => (
          <span
            key={index}
            style={{
              fontSize: `${STATEMENT.fontSize}px`,
              lineHeight: `${STATEMENT.lineHeight}px`,
              fontWeight: 500,
              letterSpacing: `${STATEMENT.tracking}em`,
              color: color.ink,
              whiteSpace: "nowrap",
            }}
          >
            {line}
          </span>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          marginTop: "40px",
        }}
      >
        {methods.map((method) => (
          <div key={method.name} style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <Swatches tiles={method.tiles} />
            <span
              style={{
                fontSize: "27px",
                lineHeight: "34px",
                fontWeight: 600,
                color: color.ink,
              }}
            >
              {method.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentText({
  title,
  primary,
  secondary,
}: Pick<ContentCardModel, "title" | "primary" | "secondary">) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Title title={title} />
      <span
        style={{
          marginTop: `${META.gap}px`,
          fontSize: `${primary.fontSize}px`,
          lineHeight: `${META.primaryLineHeight}px`,
          fontWeight: 500,
          color: color.ink,
          whiteSpace: "nowrap",
        }}
      >
        {primary.text}
      </span>
      <span
        style={{
          marginTop: `${META.secondaryGap}px`,
          fontSize: `${META.secondarySize}px`,
          lineHeight: `${META.secondaryLineHeight}px`,
          fontWeight: 500,
          color: color.muted,
        }}
      >
        {secondary}
      </span>
    </div>
  );
}

function DocsText({ section, title }: Pick<DocsCardModel, "section" | "title">) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: `${SECTION.fontSize}px`,
          lineHeight: `${SECTION.lineHeight}px`,
          fontWeight: 500,
          color: color.muted,
        }}
      >
        {section}
      </span>
      <div style={{ display: "flex", marginTop: `${SECTION.gap}px` }}>
        <Title title={title} />
      </div>
    </div>
  );
}

/** A box of the motifs: a colour tile, or an outline once another part is highlighted. */
function tileStyle(tile: string, active: boolean): React.CSSProperties {
  return active
    ? {
        backgroundImage: tile,
        color: color.onTile,
        border: "2px solid transparent",
      }
    : { border: `2px solid ${color.line}`, color: color.muted };
}

/** The three phases as on the home page: numbered squircle badges on a line. */
function GuidedCodingMotif({ highlight }: { highlight?: GuidedCodingPhase }) {
  const badge = 76;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {PHASES.map((phase, index) => {
        const active = !highlight || highlight === phase.key;
        return (
          <div key={phase.key} style={{ display: "flex", flexDirection: "column" }}>
            {index > 0 && (
              <div
                style={{
                  width: "3px",
                  height: "44px",
                  marginLeft: `${badge / 2 - 1.5}px`,
                  backgroundColor: color.line,
                }}
              />
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: `${badge}px`,
                  height: `${badge}px`,
                  borderRadius: "22px",
                  fontFamily: TITLE_FONT,
                  fontSize: "36px",
                  fontWeight: 600,
                  ...tileStyle(phase.tile, active),
                }}
              >
                {phase.number}
              </div>
              <span
                style={{
                  fontFamily: TITLE_FONT,
                  fontSize: "40px",
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  color: active ? color.ink : color.muted,
                }}
              >
                {phase.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * A vertical arrow as an SVG image, in the notation of the CHACK diagram: an open head for
 * "references", a dashed line with a hollow triangle for "implements".
 */
export function arrowSvg(isImplements: boolean, height: number): string {
  const line = `stroke="${color.muted}" stroke-width="3" stroke-linejoin="round"`;
  return isImplements
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="${height}" viewBox="0 0 16 ${height}"><path d="M8 0 V ${height - 12}" ${line} stroke-dasharray="5 4" stroke-linecap="butt" fill="none"/><path d="M2.5 ${height - 12} L8 ${height - 2} L13.5 ${height - 12} Z" ${line} fill="${color.bg}"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="${height}" viewBox="0 0 16 ${height}"><path d="M8 3 V ${height}" ${line} stroke-linecap="round" fill="none"/><path d="M2 9 L8 2 L14 9" ${line} stroke-linecap="round" fill="none"/></svg>`;
}

/** The arrow heights the CHACK motif uses, so the generator can check their SVG. */
export const ARROW_HEIGHT = 34;

function Arrow({ implements: isImplements, height }: { implements?: boolean; height: number }) {
  const svg = arrowSvg(Boolean(isImplements), height);
  return (
    <img
      src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
      width={16}
      height={height}
      alt=""
    />
  );
}

/** The CHACK map of the home page: Humble Objects outside, Core, Tests and Root below. */
function ChackMotif({ highlight }: { highlight?: ChackPart }) {
  const active = (part: ChackPart) => !highlight || highlight === part;
  const label: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: "14px",
    fontSize: "24px",
    lineHeight: "28px",
    fontWeight: 600,
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: `${VISUAL_WIDTH}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // Satori sizes boxes as content-box: the padding and border come on top.
          width: `${VISUAL_WIDTH - 2 * 16 - 2 * 2}px`,
          marginTop: "32px",
          padding: "42px 16px 22px",
          border: `2px dashed ${color.line}`,
          borderRadius: "18px",
        }}
      >
        <Arrow implements height={ARROW_HEIGHT} />
        <div
          style={{
            ...label,
            width: "100%",
            height: "112px",
            marginTop: "8px",
            fontFamily: TITLE_FONT,
            fontSize: "40px",
            letterSpacing: "-0.02em",
            ...tileStyle(CHACK_TILES.core, active("core")),
          }}
        >
          Core
        </div>
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-around",
            marginTop: "8px",
          }}
        >
          <Arrow height={ARROW_HEIGHT} />
          <Arrow height={ARROW_HEIGHT} />
        </div>
        <div
          style={{
            display: "flex",
            width: "100%",
            gap: "12px",
            marginTop: "8px",
          }}
        >
          <div
            style={{
              ...label,
              flex: 1,
              height: "84px",
              ...tileStyle(CHACK_TILES.tests, active("tests")),
            }}
          >
            Automated Tests
          </div>
          <div
            style={{
              ...label,
              flex: 1,
              height: "84px",
              ...tileStyle(CHACK_TILES.root, active("root")),
            }}
          >
            Composition Root
          </div>
        </div>
      </div>
      {/* After the boundary, so the boundary runs behind it. */}
      <div
        style={{
          ...label,
          position: "absolute",
          top: 0,
          left: `${(VISUAL_WIDTH - 250) / 2}px`,
          width: "250px",
          height: "64px",
          backgroundColor: color.bg,
          ...tileStyle(CHACK_TILES.humble, active("humble")),
        }}
      >
        Humble Objects
      </div>
    </div>
  );
}

/**
 * One card: the text on the left, starting at the top, and the brand row at the bottom, the only
 * part X's link overlay may cover. The portrait or the motif on the right lines up with the top
 * of the text.
 */
export function SocialCard(model: SocialCardModel) {
  let text: React.ReactNode;
  let visual: React.ReactNode;
  if (model.kind === "site") {
    text = <SiteText greetingSize={model.greetingSize} statement={model.statement} />;
    visual = <Portrait src={model.portrait} />;
  } else if (model.kind === "content") {
    text = <ContentText title={model.title} primary={model.primary} secondary={model.secondary} />;
    visual = <Portrait src={model.portrait} />;
  } else {
    text = <DocsText section={model.section} title={model.title} />;
    visual = !model.motif ? (
      <Portrait src={model.portrait} />
    ) : model.motif.method === "guided-coding" ? (
      <GuidedCodingMotif highlight={model.motif.highlight} />
    ) : (
      <ChackMotif highlight={model.motif.highlight} />
    );
  }

  // Satori lays out the root box as content-box, so the margins come from an inner box.
  return (
    <div
      style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color.bg,
        fontFamily: "Mona Sans",
        color: color.ink,
      }}
    >
      <div
        style={{
          width: `${CARD_WIDTH - 2 * PAD_X}px`,
          height: `${CARD_HEIGHT - 2 * PAD_Y}px`,
          display: "flex",
          alignItems: "flex-start",
          gap: `${COLUMN_GAP}px`,
        }}
      >
        <div
          style={{
            width: `${TEXT_WIDTH}px`,
            height: `${CARD_HEIGHT - 2 * PAD_Y}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {text}
          <BrandRow logo={model.logo} />
        </div>
        <div
          style={{
            display: "flex",
            width: `${VISUAL_WIDTH}px`,
            justifyContent: "center",
            // Lines up with the cap height of a large title or greeting, not its line box.
            marginTop: model.kind === "docs" ? 0 : "12px",
          }}
        >
          {visual}
        </div>
      </div>
    </div>
  );
}
