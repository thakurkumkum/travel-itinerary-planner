import React from "react";

// Regex matching any HTML, escaped, or entity-encoded break tag
export const BR_TAG_REGEX = /(?:\\*<[\/\\]*\s*br\s*[\/\\]*.*?>|&lt;[\/\\]*\s*br\s*[\/\\]*.*?&gt;)/gi;

/**
 * Normalizes escaped Markdown formatting delimiters (such as \*\*bold\*\* or \## Heading)
 * only where clearly intended as formatting, preserving legitimate backslashes and asterisks.
 */
export function normalizeEscapedMarkdown(text) {
  if (!text || typeof text !== "string") return text || "";

  // 1. Escaped bold delimiters: \*\*text\*\* or \*\*text** or **text\*\*
  const boldPattern = /((?:\\+\*|\*){2})([^\n*]+?)((?:\\+\*|\*){2})/g;
  let result = text.replace(boldPattern, (match, open, content, close) => {
    if (open.includes("\\") || close.includes("\\")) {
      return `**${content}**`;
    }
    return match;
  });

  // 2. Escaped italic delimiters: \*text\* where word boundary or content is clearly formatting
  const italicPattern = /(^|[^\\])\\+\*([a-zA-Z0-9][^\n*]*?[a-zA-Z0-9])\\+\*(?!\*)/g;
  result = result.replace(italicPattern, "$1*$2*");

  // 3. Escaped headings at line starts: e.g. \# Heading or \## Heading
  result = result.replace(/(^|\n)(\s*)\\+(#{1,6}\s+)/g, "$1$2$3");

  // 4. Escaped table pipes: \| in lines that are table rows
  result = result
    .split("\n")
    .map((line) => {
      if (
        line.includes("\\|") &&
        (line.trim().startsWith("|") || line.trim().startsWith("\\|"))
      ) {
        return line.replace(/\\+\|/g, "|");
      }
      return line;
    })
    .join("\n");

  return result;
}

/**
 * Traverses React AST nodes / strings and converts any break tag variants
 * into genuine React <br /> elements.
 */
export function renderWithBreaks(node, keyPrefix = "br") {
  if (typeof node === "string") {
    const parts = node.split(BR_TAG_REGEX);
    if (parts.length === 1) return node;
    const elements = [];
    parts.forEach((part, index) => {
      if (index > 0) {
        elements.push(React.createElement("br", { key: `${keyPrefix}-${index}` }));
      }
      if (part) {
        elements.push(part);
      }
    });
    return elements;
  }
  if (React.isValidElement(node) && node.props && node.props.children) {
    return React.cloneElement(node, {
      children: Array.isArray(node.props.children)
        ? node.props.children.flatMap((c, i) => renderWithBreaks(c, `${keyPrefix}-${i}`))
        : renderWithBreaks(node.props.children, `${keyPrefix}-c`),
    });
  }
  if (Array.isArray(node)) {
    return node.flatMap((item, i) => renderWithBreaks(item, `${keyPrefix}-${i}`));
  }
  return node;
}

/**
 * Checks if a string line represents a Markdown table separator row: | --- | --- |
 */
export function isTableSeparator(line) {
  if (!line || typeof line !== "string") return false;
  const trimmed = line.trim();
  return (
    /^\|?(\s*:?-{2,}:?\s*\|)+$/.test(trimmed) ||
    /^\|(\s*:?-{2,}:?\s*\|?)+$/.test(trimmed)
  );
}

/**
 * Checks if a string line represents a Markdown table row.
 */
export function isTableLine(line) {
  if (!line || typeof line !== "string") return false;
  const trimmed = line.trim();
  return (
    (trimmed.startsWith("|") && trimmed.endsWith("|")) ||
    (trimmed.includes("|") && trimmed.split("|").length >= 3)
  );
}

/**
 * Detects whether a string or block represents a stray table header
 * (e.g., a header or separator row with NO data rows).
 * Do not fabricate missing itinerary data; stray table headers should be filtered out.
 */
export function isStrayTableHeader(text) {
  if (!text || typeof text !== "string") return false;
  const lines = text
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return false;

  // Must consist of table-like lines to even be considered a table header
  if (!lines.every(isTableLine)) return false;

  // A single table row with no body rows is a stray table header / fragment
  if (lines.length === 1) return true;

  // Two lines where line 2 is a separator and line 1 is a header (no data rows)
  if (lines.length === 2 && isTableSeparator(lines[1])) return true;

  // All lines are separator rows
  if (lines.every(isTableSeparator)) return true;

  return false;
}

/**
 * Fixes malformed Markdown tables:
 * - Inserts missing separator line (| --- | --- |) when header and data rows exist.
 * - Normalizes missing outer pipes (|).
 */
export function fixMalformedTable(tableText) {
  if (!tableText || typeof tableText !== "string") return tableText;
  const lines = tableText
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return tableText;

  const normalizedLines = lines.map((l) => {
    let s = l;
    if (!s.startsWith("|")) s = "| " + s;
    if (!s.endsWith("|")) s = s + " |";
    return s;
  });

  // If row 1 is not a separator, insert one based on column count
  if (!isTableSeparator(normalizedLines[1])) {
    const colCount = Math.max(1, normalizedLines[0].split("|").length - 2);
    const sep = "|" + " --- |".repeat(colCount);
    normalizedLines.splice(1, 0, sep);
  }

  return normalizedLines.join("\n");
}

/**
 * Processes an array of day activities:
 * - Normalizes escaped Markdown syntax.
 * - Strips leading stray bullet symbols (e.g. `* `, `- `) so they render properly in list items.
 * - Filters out stray table headers (Requirement 6: do not fabricate missing data).
 * - Groups adjacent table lines and repairs malformed tables.
 * - Returns structured items: [{ type: "activity" | "table", content: string }]
 */
export function processActivities(activities) {
  if (!Array.isArray(activities)) return [];
  const processed = [];
  let tableBuffer = [];

  function flushTableBuffer() {
    if (tableBuffer.length === 0) return;
    const tableText = tableBuffer.join("\n");
    tableBuffer = [];
    if (!isStrayTableHeader(tableText)) {
      processed.push({ type: "table", content: fixMalformedTable(tableText) });
    }
  }

  for (const rawItem of activities) {
    if (!rawItem || typeof rawItem !== "string") continue;
    let item = normalizeEscapedMarkdown(rawItem).trim();
    // Strip leading bullet markers if present: * , - , •
    item = item.replace(/^\\*[*•-]\s+/, "").trim();
    if (!item) continue;

    // Check if item contains multiple lines (e.g. an embedded multi-line table)
    if (item.includes("\n")) {
      flushTableBuffer();
      const lines = item
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.every(isTableLine)) {
        if (!isStrayTableHeader(item)) {
          processed.push({ type: "table", content: fixMalformedTable(item) });
        }
      } else {
        processed.push({ type: "activity", content: item });
      }
      continue;
    }

    // Single line item: is it a table row?
    if (isTableLine(item)) {
      tableBuffer.push(item);
    } else {
      flushTableBuffer();
      processed.push({ type: "activity", content: item });
    }
  }

  flushTableBuffer();
  return processed;
}

/**
 * Normalizes non-breaking spaces, escaped Markdown, and converts break tags outside tables
 * into Markdown line breaks, keeping table lines intact.
 */
export function cleanItineraryContent(text) {
  if (!text) return "";
  let cleaned = text.replace(/&nbsp;/g, " ").replace(/\u00a0/g, " ");
  cleaned = normalizeEscapedMarkdown(cleaned);

  const lines = cleaned.split("\n");
  const processed = lines.map((line) => {
    if (line.includes("|")) {
      return line;
    }
    return line.replace(BR_TAG_REGEX, "  \n");
  });

  return processed.join("\n");
}

/**
 * Extracts non-day trailing Markdown content from the raw itinerary
 * (e.g., ## Budget Breakdown or ## Tips after the last day plan).
 */
export function extractTrailingContent(itineraryText) {
  if (!itineraryText || typeof itineraryText !== "string") return "";
  const dayMatches = [...itineraryText.matchAll(/(?:^|\n)##?\s*Day\s+\d+\b/gi)];
  if (dayMatches.length === 0) return "";
  const lastMatch = dayMatches[dayMatches.length - 1];
  const afterLastDay = itineraryText.slice(lastMatch.index + lastMatch[0].length);
  const nextHeading = afterLastDay.match(/\n(#{1,3}\s+[^\n]+[\s\S]*)$/);
  if (nextHeading) {
    return nextHeading[1].trim();
  }
  return "";
}
