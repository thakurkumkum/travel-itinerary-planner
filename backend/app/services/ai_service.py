import os
import re

from groq import Groq


def clean_itinerary_content(content: str) -> str:
    if not content:
        return ""
    # Normalize escaped HTML break tags (e.g. \<br>, \<br/>, \<br \>, \<br\>) to standard line breaks or clean spacing
    cleaned = re.sub(r"\\+<br\s*[\/\\]*>", "<br />", content, flags=re.IGNORECASE)
    cleaned = cleaned.replace("&nbsp;", " ").replace("\u00a0", " ")
    return cleaned


def generate_itinerary(
    destination: str,
    days: int,
    budget: str,
    interests: list[str],
    travelers: int,
) -> str:
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured.")

    client = Groq(api_key=api_key)

    prompt = f"""Create a practical, personalized travel itinerary using these exact details:
- Destination: {destination}
- Duration: {days} days
- Budget: {budget}
- Interests: {", ".join(interests)}
- Number of travelers: {travelers}

Formatting & Rendering Rules:
1. Output clean, standard Markdown only.
2. Never output HTML tags (e.g., no <br>, <div>) and never escape HTML or Markdown syntax (e.g., do not output \\<br\\>, \\*\\*, or \\#). Use standard double line breaks for paragraph spacing.
3. In Markdown tables, keep each cell strictly on a single line. Never insert line breaks or break tags like `<br>` or `\\<br>` inside table cells; separate multiple items with commas, semicolons, or dashes.
4. Do not use non-breaking spaces (&nbsp;) or unnecessary Unicode formatting characters.
5. Use normal Markdown headings (#, ##, ###), bullet lists, and Markdown tables compatible with react-markdown and remark-gfm.

Content Requirements:
1. Heading & Overview: Clearly state the destination, {days}-day duration, {travelers} traveler(s), and total budget ({budget}) in the heading or introductory section.
2. Day-by-Day Plan: Organize the itinerary day by day ({days} days) with morning, afternoon, and evening recommendations that reflect the chosen interests ({", ".join(interests)}).
3. Budget Breakdown: Include a clean Markdown table with an approximate expense breakdown (accommodation, food, transit, activities). Ensure arithmetic is internally consistent and the total does not exceed {budget} unless explicitly explained.
4. Factual Accuracy: Do not fabricate exact prices, opening hours, booking availability, or claim locations are free. Mark all cost estimates as approximate and remind travelers to verify current timings and prices.
5. Reliable Recommendations: If a specific venue or restaurant cannot be confidently identified, suggest a realistic generic alternative (e.g., a local market stall or neighborhood cafe) rather than inventing false details.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful travel-planning assistant. "
                    "Generate practical, well-organized itineraries using clean standard Markdown only. "
                    "Never output HTML tags or escaped formatting."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=2500,
    )

    content = response.choices[0].message.content or ""
    return clean_itinerary_content(content)