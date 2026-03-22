import React from "react";

/**
 * This module contains the presentational part of the build-time social-card
 * pipeline. It does two jobs:
 *
 * 1. It decides how a title should be wrapped and scaled so it fits into the
 *    fixed card area.
 * 2. It renders the final text overlay as a React tree that Satori can turn
 *    into SVG.
 *
 * The functions below deliberately keep layout decisions deterministic. That is
 * important because these images are committed to git, so two runs with the
 * same content should produce the same output.
 */
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const LEFT_PANEL_WIDTH = 718;
const CONTENT_HEIGHT = 514;
const HEADER_BLOCK_HEIGHT = 100;
const MIN_BODY_GAP = 54;
const TITLE_MAX_LINES = 5;
const TITLE_MAX_WIDTH = 560;
const BLOG_TITLE_FONT_SIZES = [68, 64, 60, 56, 52, 48, 44, 40, 36, 34, 32, 30];
const EVENT_TITLE_FONT_SIZES = [60, 56, 52, 48, 44, 40, 36, 34, 32, 30];
const TITLE_LINE_HEIGHT_MULTIPLIER = 1.05;
const SUPPORTING_LINE_FONT_SIZE = 26;
const SUPPORTING_LINE_HEIGHT = 34;
const SUPPORTING_LINE_MAX_WIDTH = 560;
const SUPPORTING_LINE_MAX_LINES = 2;
const CHIPS_MAX_WIDTH = 580;
const CHIP_HORIZONTAL_PADDING = 36;
const CHIP_FONT_SIZE = 19;
const CHIP_ROW_HEIGHT = 44;
const CHIP_ROW_GAP = 12;
const FOOTER_BLOCK_HEIGHT = 24;
const BOTTOM_SECTION_GAP = 24;

/**
 * Input model for the text overlay. The generator script prepares this data
 * from markdown frontmatter, and this template focuses purely on layout.
 */
export interface SocialCardTemplateModel {
  contentKind: "blog" | "event";
  categoryLabel: string;
  detailLabel: string;
  title: string;
  supportingLine?: string;
  chips: string[];
  footerLabel: string;
  logoDataUri: string;
}

/**
 * Final title layout chosen by the fitter. The rendering component consumes
 * this structure directly.
 */
export interface FittedTitle {
  lines: string[];
  fontSize: number;
  lineHeight: number;
}

/**
 * Internal helper type: while comparing alternative title layouts we keep a
 * numeric score. Lower scores mean "looks better" according to our heuristics.
 */
interface FittedTitleCandidate extends FittedTitle {
  score: number;
}

/**
 * Result used for smaller text blocks such as the event name below the title.
 */
interface TextLayoutResult {
  lines: string[];
  height: number;
}

/**
 * Smallest unit that the title wrapper can move between lines.
 *
 * `gluedToPrevious` is used for fragments that came from splitting a hyphenated
 * word. Example:
 * - "Cloud-Native" becomes ["Cloud-", "Native"]
 * - the second fragment is glued to the previous fragment, so we can render
 *   "Cloud-" and "Native" without inserting an extra space.
 */
interface TitleUnit {
  text: string;
  gluedToPrevious: boolean;
}

/**
 * Very small text-width approximation.
 *
 * We do not need pixel-perfect typography metrics here. We only need a stable,
 * fast estimate that is "good enough" to decide whether a line probably fits.
 */
function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.54;
}

/**
 * Removes trailing punctuation and separators before appending an ellipsis.
 *
 * This avoids awkward endings like:
 * - "Cloud-..."
 * - "Hello ,..."
 */
function trimTrailingPunctuation(value: string): string {
  return value.replace(/[\s,.:;/-]+$/u, "");
}

/**
 * Truncates a single text fragment so it fits into the given width.
 *
 * This is a last-resort fallback. The normal path tries to keep whole words and
 * hyphen fragments intact. We only truncate when there is no cleaner option.
 */
function truncateToWidth(text: string, maxWidth: number, fontSize: number): string {
  if (estimateTextWidth(text, fontSize) <= maxWidth) {
    return text;
  }

  let result = text;
  while (result.length > 1 && estimateTextWidth(`${result}\u2026`, fontSize) > maxWidth) {
    result = result.slice(0, -1);
  }

  return `${trimTrailingPunctuation(result)}\u2026`;
}

/**
 * Greedily fills title lines from left to right.
 *
 * This is intentionally simple:
 * - break at spaces
 * - allow splitting only at hyphens
 * - never rebalance lines afterwards
 *
 * The resulting layout is easy to reason about and usually matches how a human
 * would expect text to flow in a constrained card.
 */
function wrapTitle(title: string, maxWidth: number, fontSize: number): string[] {
  const tokens = createTitleUnits(title, fontSize, maxWidth);

  const lines: string[] = [];
  let current: string | null = null;

  for (const token of tokens) {
    const next = current
      ? `${current}${token.gluedToPrevious ? "" : " "}${token.text}`
      : token.text;
    if (current && estimateTextWidth(next, fontSize) > maxWidth) {
      lines.push(current);
      current =
        estimateTextWidth(token.text, fontSize) > maxWidth
          ? truncateToWidth(token.text, maxWidth, fontSize)
          : token.text;
      continue;
    }

    current = next;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

/**
 * Converts a raw title into movable layout units.
 *
 * Most words stay untouched. Overlong hyphenated words may be split into
 * hyphen-based fragments so they can wrap more naturally.
 */
function createTitleUnits(title: string, fontSize: number, maxWidth: number): TitleUnit[] {
  return title
    .split(/\s+/u)
    .filter(Boolean)
    .flatMap((token) => splitTitleToken(token, fontSize, maxWidth));
}

/**
 * Decides whether a single token needs special handling.
 *
 * Our current policy is intentionally strict:
 * - if the token fits, keep it whole
 * - if it does not fit, try splitting at hyphens
 * - otherwise keep it whole and let the caller truncate as a last resort
 *
 * We do not split at dots, slashes, or arbitrary characters because those
 * breaks look especially bad for technical names such as
 * "Microsoft.Extensions.AI" or ".NET".
 */
function splitTitleToken(token: string, fontSize: number, maxWidth: number): TitleUnit[] {
  if (estimateTextWidth(token, fontSize) <= maxWidth) {
    return [{ text: token, gluedToPrevious: false }];
  }

  const preferredSegments = splitAtPreferredBoundaries(token);
  if (
    preferredSegments.length > 1 &&
    preferredSegments.every((segment) => estimateTextWidth(segment, fontSize) <= maxWidth)
  ) {
    return preferredSegments.map((segment, index) => ({
      text: segment,
      gluedToPrevious: index > 0,
    }));
  }

  return [{ text: token, gluedToPrevious: false }];
}

/**
 * Splits a token at hyphens while preserving the hyphen on the preceding
 * fragment. Example:
 * - "Cloud-Native" -> ["Cloud-", "Native"]
 *
 * Keeping the hyphen on the first fragment makes the wrap look natural when the
 * break happens exactly at that point.
 */
function splitAtPreferredBoundaries(token: string): string[] {
  const segments: string[] = [];
  let current = "";

  for (const char of Array.from(token)) {
    current += char;
    if (char === "-") {
      segments.push(current);
      current = "";
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments.length > 1 ? segments : [token];
}

/**
 * Returns how many title lines fit into the currently available vertical space.
 *
 * The available height changes depending on whether the card has an event name
 * and how many tag chips are rendered below the title.
 */
function getMaxLinesForHeight(maxHeight: number, lineHeight: number): number {
  let maxLines = 0;

  for (let lineCount = 1; lineCount <= TITLE_MAX_LINES; lineCount += 1) {
    if (estimateTextBlockHeight(lineCount, lineHeight) <= maxHeight) {
      maxLines = lineCount;
    }
  }

  return maxLines;
}

const CONNECTOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

/**
 * Normalizes a word before we compare it against small heuristics such as the
 * connector-word list.
 */
function normalizeWordForPenalty(word: string): string {
  return word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/giu, "").toLowerCase();
}

/**
 * Assigns a "looks worse" penalty to one rendered line.
 *
 * The fitter compares several font sizes. This score helps us choose between
 * layouts that all technically fit:
 * - short dangling lines are discouraged
 * - ending a line with "and", "with", etc. is discouraged
 * - starting a line with a connector is also discouraged
 * - ending a line with a hyphen costs extra
 *
 * Lower score is better.
 */
function scoreTitleLine(lineText: string, fontSize: number, isLastLine: boolean): number {
  const width = estimateTextWidth(lineText, fontSize);
  const remainingWidth = Math.max(0, TITLE_MAX_WIDTH - width);
  const words = lineText.split(/\s+/u).filter(Boolean);
  const firstWord = normalizeWordForPenalty(words[0] ?? "");
  const lastWord = normalizeWordForPenalty(words[words.length - 1] ?? "");
  let score = Math.pow(remainingWidth / TITLE_MAX_WIDTH, 2) * (isLastLine ? 55 : 160);

  if (CONNECTOR_WORDS.has(lastWord)) {
    score += 320;
  }

  if (!isLastLine && words.length === 1 && firstWord.length <= 6) {
    score += 220;
  }

  if (isLastLine && words.length === 1 && firstWord.length <= 8) {
    score += 140;
  }

  if (lineText.endsWith("-")) {
    score += 140;
  }

  if (!isLastLine && CONNECTOR_WORDS.has(firstWord)) {
    score += 220;
  }

  return score;
}

/**
 * Builds one complete title layout for a specific font size.
 *
 * If the title does not fit the available height at this size, the function
 * returns `null` so the caller can try a smaller size.
 */
function fitTitleForFontSize(
  title: string,
  fontSize: number,
  maxHeight: number
): FittedTitleCandidate | null {
  const lineHeight = Math.round(fontSize * TITLE_LINE_HEIGHT_MULTIPLIER);
  const maxLines = getMaxLinesForHeight(maxHeight, lineHeight);
  if (maxLines === 0) {
    return null;
  }

  const lines = wrapTitle(title, TITLE_MAX_WIDTH, fontSize);
  if (lines.length > maxLines) {
    return null;
  }

  const score = lines.reduce(
    (total, lineText, index) =>
      total + scoreTitleLine(lineText, fontSize, index === lines.length - 1),
    0
  );

  return {
    lines,
    fontSize,
    lineHeight,
    score,
  };
}

/**
 * Ensures a wrapped text block does not exceed the allowed line count.
 *
 * The first lines are preserved and the remaining content is folded into the
 * final line with an ellipsis.
 */
function createEllipsizedLines(
  lines: string[],
  maxLines: number,
  maxWidth: number,
  fontSize: number
): string[] {
  if (lines.length <= maxLines) {
    return lines;
  }

  const head = lines.slice(0, maxLines - 1);
  const tail = lines.slice(maxLines - 1).join(" ");
  return [...head, truncateToWidth(tail, maxWidth, fontSize)];
}

/**
 * Estimates the vertical space used by a multi-line title block.
 */
function estimateTextBlockHeight(lineCount: number, lineHeight: number): number {
  return lineCount * lineHeight + Math.max(0, lineCount - 1) * 8;
}

/**
 * Wraps the smaller supporting line below the title.
 *
 * We reuse the same greedy wrapper as the title because it already follows the
 * project's line-break policy.
 */
function layoutSupportingLine(text?: string): TextLayoutResult {
  if (!text) {
    return {
      lines: [],
      height: 0,
    };
  }

  const wrappedLines = wrapTitle(
    text.replace(/\s+/gu, " ").trim(),
    SUPPORTING_LINE_MAX_WIDTH,
    SUPPORTING_LINE_FONT_SIZE
  );
  const lines = createEllipsizedLines(
    wrappedLines,
    SUPPORTING_LINE_MAX_LINES,
    SUPPORTING_LINE_MAX_WIDTH,
    SUPPORTING_LINE_FONT_SIZE
  );

  return {
    lines,
    height: lines.length * SUPPORTING_LINE_HEIGHT,
  };
}

/**
 * Estimates how many rows of chips we need at the bottom of the card.
 *
 * This matters because the title fitter must know how much vertical space is
 * left after rendering the chips.
 */
function estimateChipRows(chips: string[]): number {
  if (chips.length === 0) {
    return 0;
  }

  let rows = 1;
  let currentRowWidth = 0;

  for (const chip of chips) {
    const chipWidth = estimateTextWidth(chip, CHIP_FONT_SIZE) + CHIP_HORIZONTAL_PADDING;
    const nextWidth = currentRowWidth === 0 ? chipWidth : currentRowWidth + 12 + chipWidth;

    if (currentRowWidth > 0 && nextWidth > CHIPS_MAX_WIDTH) {
      rows += 1;
      currentRowWidth = chipWidth;
      continue;
    }

    currentRowWidth = nextWidth;
  }

  return rows;
}

/**
 * Calculates how much vertical space the lower card section consumes.
 *
 * The title fitter uses this value to decide how large the title may become
 * without colliding with the event name, chips, or footer.
 */
function estimateBottomBlockHeight(supportingLine?: string, chips: string[] = []): number {
  const supportingLayout = layoutSupportingLine(supportingLine);
  const chipRows = estimateChipRows(chips);
  const chipsHeight =
    chipRows > 0 ? chipRows * CHIP_ROW_HEIGHT + Math.max(0, chipRows - 1) * CHIP_ROW_GAP : 0;

  let height = FOOTER_BLOCK_HEIGHT;

  if (supportingLayout.height > 0) {
    height += BOTTOM_SECTION_GAP + supportingLayout.height;
  }

  if (chipsHeight > 0) {
    height += BOTTOM_SECTION_GAP + chipsHeight;
  }

  return height;
}

/**
 * Chooses the best title layout across several candidate font sizes.
 *
 * Strategy:
 * - start with larger sizes
 * - reject any size that does not fit vertically
 * - score the remaining layouts
 * - add a small penalty for shrinking too far
 *
 * This gives us the largest title that still looks reasonable.
 */
export function fitTitle(
  title: string,
  options: {
    maxHeight: number;
    fontSizes: number[];
  }
): FittedTitle {
  const normalizedTitle = title.replace(/\s+/gu, " ").trim();
  let bestCandidate: FittedTitleCandidate | null = null;

  for (const fontSize of options.fontSizes) {
    const fittedTitle = fitTitleForFontSize(normalizedTitle, fontSize, options.maxHeight);
    if (!fittedTitle) {
      continue;
    }

    const fontSizePenalty = (options.fontSizes[0] - fittedTitle.fontSize) * 6;
    const candidateScore = fittedTitle.score + fontSizePenalty;

    if (!bestCandidate || candidateScore < bestCandidate.score) {
      bestCandidate = {
        ...fittedTitle,
    score: candidateScore,
      };
    }
  }

  if (bestCandidate) {
    return bestCandidate;
  }

  const fontSize = options.fontSizes[options.fontSizes.length - 1];
  const lines = wrapTitle(normalizedTitle, TITLE_MAX_WIDTH, fontSize);
  const truncatedLines = createEllipsizedLines(lines, TITLE_MAX_LINES, TITLE_MAX_WIDTH, fontSize);

  return {
    lines: truncatedLines,
    fontSize,
    lineHeight: Math.round(fontSize * TITLE_LINE_HEIGHT_MULTIPLIER),
  };
}

/**
 * Renders the complete text overlay for one social card.
 *
 * The actual PNG is produced later by Satori + Sharp. This component only
 * describes the layout tree.
 */
export function SocialCardTemplate({
  contentKind,
  categoryLabel,
  detailLabel,
  title,
  supportingLine,
  chips,
  footerLabel,
  logoDataUri,
}: SocialCardTemplateModel) {
  const bottomBlockHeight = estimateBottomBlockHeight(supportingLine, chips);
  const fittedTitle = fitTitle(title, {
    fontSizes: contentKind === "event" ? EVENT_TITLE_FONT_SIZES : BLOG_TITLE_FONT_SIZES,
    maxHeight: Math.max(
      120,
      CONTENT_HEIGHT - HEADER_BLOCK_HEIGHT - bottomBlockHeight - MIN_BODY_GAP
    ),
  });
  const supportingLayout = layoutSupportingLine(supportingLine);

  return (
    <div
      style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        display: "flex",
        backgroundColor: "rgba(0,0,0,0)",
        color: "#f8fbff",
      }}
    >
      <div
        style={{
          width: `${LEFT_PANEL_WIDTH}px`,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "62px 64px 54px 70px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <img src={logoDataUri} width={52} height={52} alt="Kenny Codes logo" />
              <span
                style={{
                  fontSize: "27px",
                  lineHeight: "32px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "#f8fbff",
                }}
              >
                Kenny Codes
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "20px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#8ee7df",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "999px",
                  backgroundColor: "#36d7cf",
                  marginRight: "12px",
                }}
              />
              <span style={{ marginRight: "20px" }}>{categoryLabel}</span>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "999px",
                  backgroundColor: "#6ba1ff",
                  marginRight: "12px",
                }}
              />
              <span style={{ color: "#b8cce6", letterSpacing: "0.01em", textTransform: "none" }}>
                {detailLabel}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {fittedTitle.lines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                style={{
                  display: "block",
                  maxWidth: `${TITLE_MAX_WIDTH}px`,
                  fontSize: `${fittedTitle.fontSize}px`,
                  lineHeight: `${fittedTitle.lineHeight}px`,
                  fontWeight: 700,
                  letterSpacing: "-0.035em",
                  whiteSpace: "nowrap",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {supportingLine ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0px",
                maxWidth: "560px",
                fontSize: "26px",
                lineHeight: "34px",
                color: "#d7e3f4",
              }}
            >
              {supportingLayout.lines.map((line, index) => (
                <span key={`${line}-${index}`} style={{ whiteSpace: "nowrap" }}>
                  {line}
                </span>
              ))}
            </div>
          ) : null}

          {chips.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                maxWidth: "580px",
              }}
            >
              {chips.map((chip) => (
                <div
                  key={chip}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    borderRadius: "999px",
                    border: "1px solid rgba(112, 169, 255, 0.42)",
                    backgroundColor: "rgba(17, 29, 44, 0.72)",
                    fontSize: "19px",
                    fontWeight: 600,
                    color: "#dfe9f7",
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "24px",
              fontWeight: 600,
              color: "#8da8c9",
            }}
          >
            <div
              style={{
                width: "96px",
                height: "2px",
                background: "linear-gradient(90deg, #35d8d0 0%, #4a8cff 100%)",
              }}
            />
            <span>{footerLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
