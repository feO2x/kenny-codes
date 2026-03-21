import React from "react";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const LEFT_PANEL_WIDTH = 718;
const TITLE_MAX_LINES = 3;
const TITLE_MAX_WIDTH = 560;
const TITLE_FONT_SIZES = [68, 64, 60, 56, 52, 48, 44, 40, 36];
const TITLE_LINE_HEIGHT_MULTIPLIER = 1.05;

export interface SocialCardTemplateModel {
  categoryLabel: string;
  detailLabel: string;
  title: string;
  supportingLine?: string;
  chips: string[];
  footerLabel: string;
  logoDataUri: string;
}

export interface FittedTitle {
  lines: string[];
  fontSize: number;
  lineHeight: number;
}

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.54;
}

function trimTrailingPunctuation(value: string): string {
  return value.replace(/[\s,.:;/-]+$/u, "");
}

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

function splitLongToken(token: string, maxWidth: number, fontSize: number): string[] {
  const parts: string[] = [];
  let current = "";

  for (const char of Array.from(token)) {
    const next = `${current}${char}`;
    if (current && estimateTextWidth(next, fontSize) > maxWidth) {
      parts.push(`${trimTrailingPunctuation(current)}-`);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function wrapTitle(title: string, maxWidth: number, fontSize: number): string[] {
  const tokens = title
    .split(/\s+/u)
    .filter(Boolean)
    .flatMap((token) =>
      estimateTextWidth(token, fontSize) > maxWidth
        ? splitLongToken(token, maxWidth, fontSize)
        : [token]
    );

  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const next = current ? `${current} ${token}` : token;
    if (current && estimateTextWidth(next, fontSize) > maxWidth) {
      lines.push(current);
      current = token;
      continue;
    }

    current = next;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

export function fitTitle(title: string): FittedTitle {
  const normalizedTitle = title.replace(/\s+/gu, " ").trim();

  for (const fontSize of TITLE_FONT_SIZES) {
    const lines = wrapTitle(normalizedTitle, TITLE_MAX_WIDTH, fontSize);
    if (lines.length <= TITLE_MAX_LINES) {
      return {
        lines,
        fontSize,
        lineHeight: Math.round(fontSize * TITLE_LINE_HEIGHT_MULTIPLIER),
      };
    }
  }

  const fontSize = TITLE_FONT_SIZES[TITLE_FONT_SIZES.length - 1];
  const lines = wrapTitle(normalizedTitle, TITLE_MAX_WIDTH, fontSize);
  const visibleLines = lines.slice(0, TITLE_MAX_LINES);
  const truncatedLines =
    lines.length > TITLE_MAX_LINES
      ? [
          ...visibleLines.slice(0, TITLE_MAX_LINES - 1),
          truncateToWidth(visibleLines[TITLE_MAX_LINES - 1], TITLE_MAX_WIDTH, fontSize),
        ]
      : visibleLines;

  return {
    lines: truncatedLines,
    fontSize,
    lineHeight: Math.round(fontSize * TITLE_LINE_HEIGHT_MULTIPLIER),
  };
}

export function SocialCardTemplate({
  categoryLabel,
  detailLabel,
  title,
  supportingLine,
  chips,
  footerLabel,
  logoDataUri,
}: SocialCardTemplateModel) {
  const fittedTitle = fitTitle(title);

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
                gap: "16px",
              }}
            >
              <img src={logoDataUri} width={52} height={52} alt="Kenny Codes logo" />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span
                  style={{
                    fontSize: "26px",
                    lineHeight: "30px",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "#f8fbff",
                  }}
                >
                  Kenny Codes
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    lineHeight: "18px",
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#7d95b5",
                  }}
                >
                  Software Engineering
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
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
                }}
              />
              <span>{categoryLabel}</span>
              <span style={{ color: "#6ba1ff" }}>•</span>
              <span style={{ color: "#b8cce6", letterSpacing: "0.01em", textTransform: "none" }}>
                {detailLabel}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
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
                display: "block",
                maxWidth: "560px",
                fontSize: "26px",
                lineHeight: "34px",
                color: "#d7e3f4",
              }}
            >
              {supportingLine}
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
