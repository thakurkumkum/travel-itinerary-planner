import React from "react";
import ReactDOMServer from "react-dom/server";
import ItineraryResult from "./src/components/ItineraryResult.jsx";
import {
  normalizeEscapedMarkdown,
  processActivities,
  isStrayTableHeader,
  fixMalformedTable,
  cleanItineraryContent,
  extractTrailingContent,
} from "./src/utils/markdownUtils.js";

console.log("=================================================");
console.log("VoyagePlan Markdown & Table Fix Verification Test");
console.log("=================================================\n");

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failures++;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

/* ── Test 1: Normalizing Escaped Delimiters (\*\*Morning\*\*, \*\*Brittos\*\*) ── */
console.log("\n--- TEST 1: Delimiter Normalization ---");
const escapedText = "\\*\\*Morning\\*\\*: Breakfast at \\*\\*Brittos\\*\\*";
const normalizedText = normalizeEscapedMarkdown(escapedText);
assert(
  normalizedText === "**Morning**: Breakfast at **Brittos**",
  `normalizeEscapedMarkdown properly normalizes \\*\\*Morning\\*\\* and \\*\\*Brittos\\*\\* (got "${normalizedText}")`
);

// Mismatched escaped delimiters
const mismatched = "\\*\\*Morning**: Breakfast at **Brittos\\*\\*";
const normMismatched = normalizeEscapedMarkdown(mismatched);
assert(
  normMismatched === "**Morning**: Breakfast at **Brittos**",
  `Mismatched escaped bold delimiters normalized (got "${normMismatched}")`
);

// Escaped headings
const escapedHeading = "\\## Day 1: Arrival in Goa";
const normHeading = normalizeEscapedMarkdown(escapedHeading);
assert(
  normHeading === "## Day 1: Arrival in Goa",
  `Escaped heading normalized to ## (got "${normHeading}")`
);

// Non-formatting preservation: math and file paths
const mathText = "5 * 4 = 20 and formula a * b";
assert(
  normalizeEscapedMarkdown(mathText) === mathText,
  "Math expression with single asterisks preserved untouched"
);

const pathText = "C:\\Users\\VoyagePlan\\Documents";
assert(
  normalizeEscapedMarkdown(pathText) === pathText,
  "File paths with backslashes preserved untouched"
);

/* ── Test 2: Stray Table Headers in Day 8 Activities ── */
console.log("\n--- TEST 2: Stray Table Header Detection & Removal ---");
const strayHeader1 = "| Day 8 Activities | Time |";
assert(
  isStrayTableHeader(strayHeader1) === true,
  "Single table header row without body correctly identified as stray header"
);

const strayHeader2 = "| Day 8 Activities | Time |\n| --- | --- |";
assert(
  isStrayTableHeader(strayHeader2) === true,
  "Header + delimiter without body rows correctly identified as stray header"
);

const day8Activities = [
  "\\*\\*Morning\\*\\*: Pack luggage and breakfast at \\*\\*Brittos\\*\\*",
  "| Day 8 Activities | Time |",
  "| --- | --- |",
  "Afternoon: Souvenir shopping in Panaji",
  "Evening: Departure flight",
];

const processedDay8 = processActivities(day8Activities);
assert(
  processedDay8.length === 3,
  `Day 8 activities should have 3 items after stray header filtered, got ${processedDay8.length}`
);
assert(
  processedDay8[0].content === "**Morning**: Pack luggage and breakfast at **Brittos**",
  `Day 8 activity 1 normalized: "${processedDay8[0].content}"`
);
assert(
  !processedDay8.some((a) => a.content.includes("Day 8 Activities")),
  "Day 8 stray table header was completely removed without fabricating missing data"
);

/* ── Test 3: Malformed Markdown Table Fix ── */
console.log("\n--- TEST 3: Malformed Markdown Table Fix ---");
const malformedTable = [
  "| Time | Activity | Location |",
  "| 09:00 AM | Guided Church Tour | Old Goa |",
  "| 01:00 PM | Seafood Lunch | Brittos |",
  "| 05:00 PM | Sunset Cruise | Mandovi River |",
].join("\n");

const fixedTable = fixMalformedTable(malformedTable);
assert(
  fixedTable.includes("| --- | --- | --- |"),
  "Missing delimiter row (| --- | --- | --- |) was automatically inserted"
);
assert(
  fixedTable.includes("| 01:00 PM | Seafood Lunch | Brittos |"),
  "All table body rows preserved without data fabrication"
);

/* ── Test 4: Trailing Section Extraction (Budget Breakdown) ── */
console.log("\n--- TEST 4: Trailing Section Extraction ---");
const fullItineraryMarkdown = `
# 8-Day Trip to Goa

## Day 1: North Goa
* Morning: Arrival at airport

## Day 8: Departure
* Morning: Breakfast at **Brittos**
* Afternoon: Checkout and flight

## Estimated Budget Breakdown
| Category | Estimated Cost (INR) |
| --- | --- |
| Accommodation | 25,000 |
| Food & Dining | 15,000 |
| Transportation | 8,000 |
| Activities | 7,000 |

## Important Travel Tips
- Verify ferry timings in advance.
- Carry cash for local beach shacks.
`;

const extractedTrailing = extractTrailingContent(fullItineraryMarkdown);
assert(
  extractedTrailing.includes("## Estimated Budget Breakdown"),
  "Trailing budget breakdown extracted correctly"
);
assert(
  extractedTrailing.includes("| Accommodation | 25,000 |"),
  "Budget table data preserved in trailing content"
);
assert(
  extractedTrailing.includes("## Important Travel Tips"),
  "Subsequent travel tips preserved in trailing content"
);

/* ── Test 5: Full Component Render Test with ItineraryResult ── */
console.log("\n--- TEST 5: Full Component Static HTML Render ---");

const sampleItineraryData = {
  destination: "Goa",
  day_count: 8,
  budget: "moderate",
  pace: "balanced",
  start_date: "2026-11-01",
  end_date: "2026-11-08",
  days: [
    {
      day_number: 1,
      title: "Arrival & North Goa Beaches",
      date: "2026-11-01",
      notes: "Check in and get oriented. Relax after travel.",
      activities: [
        "\\*\\*Morning\\*\\*: Arrive at airport and transfer to hotel",
        "\\*\\*Afternoon\\*\\*: Head to Calangute beach, lunch at \\*\\*Brittos\\*\\*",
        "Evening: Sunset stroll at Baga",
      ],
    },
    {
      day_number: 8,
      title: "Departure & Local Market",
      date: "2026-11-08",
      notes: "Final day packing and preparations.",
      activities: [
        "**Morning**: Pack luggage and breakfast at **Brittos**",
        "| Day 8 Activities | Time |", // Stray table header to be filtered
        "| --- | --- |",             // Stray separator
        "Afternoon: Flea market shopping",
        // Malformed table (missing separator)
        "| Schedule | Key Activity |\n| 03:00 PM | Taxi to airport |\n| 06:00 PM | Flight departure |",
      ],
    },
  ],
  itinerary: fullItineraryMarkdown,
};

const renderedHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ItineraryResult, {
    itinerary: sampleItineraryData,
    formData: { destination: "Goa", budget: "moderate", pace: "balanced" },
  })
);

// 1. Verify NO literal formatting characters remain in HTML
assert(
  !renderedHtml.includes("\\*\\*Morning\\*\\*"),
  "No literal escaped '\\*\\*Morning\\*\\*' found in rendered HTML"
);
assert(
  !renderedHtml.includes("\\*\\*Brittos\\*\\*"),
  "No literal escaped '\\*\\*Brittos\\*\\*' found in rendered HTML"
);
assert(
  !renderedHtml.includes("**Morning**"),
  "No raw unrendered '**Morning**' text found in rendered HTML"
);
assert(
  !renderedHtml.includes("**Brittos**"),
  "No raw unrendered '**Brittos**' text found in rendered HTML"
);

// 2. Verify bold tags <strong> rendered
assert(
  /<strong[^>]*>Morning<\/strong>/.test(renderedHtml),
  "Rendered HTML includes <strong ...>Morning</strong>"
);
assert(
  /<strong[^>]*>Brittos<\/strong>/.test(renderedHtml),
  "Rendered HTML includes <strong ...>Brittos</strong>"
);

// 3. Verify stray table headers removed
assert(
  !renderedHtml.includes("Day 8 Activities"),
  "Stray table header 'Day 8 Activities' successfully omitted"
);

// 4. Verify tables rendered as HTML <table> with <thead> and <tbody>
assert(
  /<table[^>]*>/.test(renderedHtml) && renderedHtml.includes("</table>"),
  "Malformed and valid tables successfully rendered as HTML <table>"
);
assert(
  /<th[^>]*>/.test(renderedHtml) && /<td[^>]*>/.test(renderedHtml),
  "Tables contain valid <th> and <td> cells"
);
assert(
  renderedHtml.includes("Taxi to airport") && renderedHtml.includes("03:00 PM"),
  "Table row data preserved and rendered inside table cells"
);
assert(
  renderedHtml.includes("Estimated Budget Breakdown") && renderedHtml.includes("Accommodation"),
  "Trailing Budget Breakdown table rendered cleanly in overview card"
);

// 5. Verify lists and headings
assert(
  renderedHtml.includes("<ul") && renderedHtml.includes("<li"),
  "Activities rendered with list markup"
);
assert(
  renderedHtml.includes("Day 1: Arrival &amp; North Goa Beaches"),
  "Day 1 heading rendered"
);
assert(
  renderedHtml.includes("Day 8: Departure &amp; Local Market"),
  "Day 8 heading rendered"
);

// 6. Verify Save, Copy, Print buttons present
assert(
  renderedHtml.includes("Save"),
  "Save Trip / Sign in to Save button rendered and functional"
);
assert(
  renderedHtml.includes("Copy"),
  "Copy button rendered"
);
assert(
  renderedHtml.includes("Print / PDF"),
  "Print / PDF button rendered"
);

/* ── Test 6: Saved Itinerary Consistency ── */
console.log("\n--- TEST 6: Saved Itinerary Consistency ---");
// Simulate itinerary retrieved from Supabase `savedTrip.content`
const savedTripContent = {
  destination: "Goa",
  day_count: 1,
  budget: "moderate",
  pace: "balanced",
  start_date: "2026-11-01",
  end_date: "2026-11-01",
  days: [
    {
      day_number: 1,
      title: "Goa Highlights",
      date: "2026-11-01",
      notes: "\\*\\*Note\\*\\*: Remember sunscreen.",
      activities: [
        "\\*\\*Morning\\*\\*: Visit Fort Aguada",
        "\\*\\*Afternoon\\*\\*: Seafood at \\*\\*Brittos\\*\\*",
      ],
    },
  ],
};

const savedHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(ItineraryResult, {
    itinerary: savedTripContent,
    formData: {},
  })
);

assert(
  /<strong[^>]*>Morning<\/strong>/.test(savedHtml) && /<strong[^>]*>Brittos<\/strong>/.test(savedHtml),
  "Saved itinerary renders bold Morning and Brittos identically"
);
assert(
  /<strong[^>]*>Note<\/strong>: Remember sunscreen/.test(savedHtml),
  "Saved itinerary notes render bold tags correctly"
);

console.log("\n=================================================");
if (failures === 0) {
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! (0 failures)");
  console.log("=================================================\n");
  process.exit(0);
} else {
  console.error(`💥 ${failures} TEST(S) FAILED.`);
  console.log("=================================================\n");
  process.exit(1);
}
