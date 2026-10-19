import React from "react";
import ReactDOMServer from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Regex matching any HTML, escaped, or entity-encoded break tag
export const BR_TAG_REGEX = /(?:\\*<[\/\\]*\s*br\s*[\/\\]*.*?>|&lt;[\/\\]*\s*br\s*[\/\\]*.*?&gt;)/gi;

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

export function cleanItineraryContent(text) {
  if (!text) return "";
  const cleaned = text.replace(/&nbsp;/g, " ").replace(/\u00a0/g, " ");

  // Outside of table rows, convert any break tags into standard Markdown line breaks
  const lines = cleaned.split("\n");
  const processed = lines.map((line) => {
    // In table rows, keep tags for renderWithBreaks to convert into safe <br /> elements
    if (line.includes("|")) {
      return line;
    }
    // Outside tables, replace break tags with standard markdown line break
    return line.replace(BR_TAG_REGEX, "  \n");
  });

  return processed.join("\n");
}

const sampleItineraryMarkdown = `
# Comprehensive Break-Tag Itinerary Test

This is an introduction with an unescaped break: Line A<br>Line B.
Also an escaped backslash break: Line C\\<br>Line D.
And an entity-encoded break: Line E&lt;br&gt;Line F.

* Daily Tip 1 with closing tag: Pack light</br>Stay hydrated
* Daily Tip 2 with self-closing tag: Use sunscreen<br/>Wear comfortable shoes
* Daily Tip 3 with entity self-closing: Book early&lt;br/&gt;Check reviews

| Day | Activities | Budget & Notes |
| --- | --- | --- |
| Day 1 | • Arrive in Goa<br>• Pick up a rented scooter<br>• Check-in | Base budget: ₹1,500<br/>Scooter deposit: ₹1,000 |
| Day 2 | • Anjuna flea market\\<br>• Sunset at Chapora Fort | Meals: ₹800&lt;br&gt;Shopping: ₹1,200 |
| Day 3 | • Water sports at Baga&lt;br/&gt;• Dinner at beach shack | Total approx: ₹2,000<br />Verify tides |
| Day 4 | • Spice plantation tour</br>• Old Goa churches | Entry fee: ₹500\\<br/>Guided tour included |
| Day 5 | • Mandovi river cruise\\<br\\>• Night market | Tickets: ₹600&lt;/br&gt;Souvenirs: ₹400 |
`;

const mdComponents = {
  p: ({ children }) => React.createElement("p", null, renderWithBreaks(children, "p")),
  li: ({ children }) => React.createElement("li", null, renderWithBreaks(children, "li")),
  th: ({ children }) => React.createElement("th", null, renderWithBreaks(children, "th")),
  td: ({ children }) => React.createElement("td", null, renderWithBreaks(children, "td")),
};

console.log("Running Itinerary Break-Tag Rendering Test...\n");

const cleanedMarkdown = cleanItineraryContent(sampleItineraryMarkdown);
const renderedHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(
    ReactMarkdown,
    {
      remarkPlugins: [remarkGfm],
      components: mdComponents,
    },
    cleanedMarkdown
  )
);

console.log("=== RENDERED HTML SAMPLE ===");
console.log(renderedHtml);
console.log("\n============================\n");

// Verification 1: Confirm no literal break-tag text remains visible in rendered output
const literalPatterns = [
  { name: "Literal &lt;br", regex: /&lt;[\/\\]*\s*br/i },
  { name: "Literal \\<br", regex: /\\+<br/i },
  { name: "Literal text <br> not parsed", regex: /&lt;br\s*[\/\\]*&gt;/i },
];

let failed = false;
for (const p of literalPatterns) {
  if (p.regex.test(renderedHtml)) {
    console.error(`FAILED: Found forbidden pattern "${p.name}" in rendered output!`);
    failed = true;
  } else {
    console.log(`PASSED: No "${p.name}" found in rendered output.`);
  }
}

// Verification 2: Ensure actual <br/> elements were produced
const brCount = (renderedHtml.match(/<br\/>/g) || []).length;
console.log(`\nTotal rendered <br/> HTML elements: ${brCount}`);

if (brCount < 12) {
  console.error(`FAILED: Expected at least 12 rendered <br/> elements, found ${brCount}`);
  failed = true;
} else {
  console.log(`PASSED: All break-tag variations successfully converted to ${brCount} actual line-break elements.`);
}

if (failed) {
  console.error("\nTEST SUITE FAILED.");
  process.exit(1);
} else {
  console.log("\nALL TESTS PASSED SUCCESSFULLY.");
  process.exit(0);
}
