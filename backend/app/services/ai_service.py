import os
import re
import logging
from groq import Groq

logger = logging.getLogger("ai_service")


def clean_itinerary_content(content: str) -> str:
    if not content:
        return ""

    # Normalize escaped HTML break tags to line breaks.
    cleaned = re.sub(
        r"\\*?\\?<?br\s*/?>",
        "\n",
        content,
        flags=re.IGNORECASE,
    )

    cleaned = cleaned.replace("&nbsp;", " ").replace("\u00a0", " ")

    # Normalize escaped bold delimiters: \*\*text\*\* -> **text**
    pattern = r'((?:\\+\*|\*){2})([^\n*]+?)((?:\\+\*|\*){2})'
    def repl(m):
        open_delim, c, close_delim = m.group(1), m.group(2), m.group(3)
        if "\\" in open_delim or "\\" in close_delim:
            return f"**{c}**"
        return m.group(0)
    cleaned = re.sub(pattern, repl, cleaned)

    # Normalize escaped headings: \# Heading -> # Heading
    cleaned = re.sub(r"(?m)^(\s*)\\+(#{1,6}\s+)", r"\1\2", cleaned)

    return cleaned


def extract_itinerary_days(markdown_text: str) -> list[int]:
    """
    Reliably extracts unique Day numbers from Markdown headings and bold text
    (e.g., '# Day 1:', '## Day 2 -', '### Day 3', '**Day 4:**').
    """
    if not markdown_text:
        return []

    # Matches lines like:
    # ## Day 1: ...
    # ### Day 1 - ...
    # **Day 1:** ...
    # Day 1: ...
    matches = re.findall(
        r"(?:^|\n)(?:#+\s*|\*\*)?Day\s+(\d+)\b",
        markdown_text,
        flags=re.IGNORECASE,
    )
    return sorted(list(set(int(m) for m in matches)))


def build_generation_prompt(
    destination: str,
    days: int,
    budget: str,
    interests: list[str],
    travelers: int,
) -> str:
    return f"""Create a practical, personalized travel itinerary using these exact details:
- Destination: {destination}
- Duration: EXACTLY {days} days
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
2. Day-by-Day Plan: You MUST include distinct, sequential sections for EVERY day from Day 1 through Day {days} without skipping any days or combining days (e.g., do NOT write 'Day 14-16'). Every single day from Day 1 to Day {days} must have its own separate '## Day X: <Title>' heading followed by morning, afternoon, and evening recommendations.
3. Budget Breakdown: Include a clean Markdown table with an approximate expense breakdown (accommodation, food, transit, activities). Ensure arithmetic is internally consistent and the total does not exceed {budget} unless explicitly explained.
4. Factual Accuracy: Do not fabricate exact prices, opening hours, booking availability, or claim locations are free. Mark all cost estimates as approximate and remind travelers to verify current timings and prices.
5. Reliable Recommendations: If a specific venue or restaurant cannot be confidently identified, suggest a realistic generic alternative (e.g., a local market stall or neighborhood cafe) rather than inventing false details.
"""


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

    system_message = (
        "You are an expert travel-planning assistant. "
        "Generate comprehensive, realistic itineraries using clean standard Markdown only. "
        f"You must always generate the exact number of days requested ({days} days) with distinct day headings."
    )

    prompt = build_generation_prompt(
        destination=destination,
        days=days,
        budget=budget,
        interests=interests,
        travelers=travelers,
    )

    # Dynamic token allocation: longer trips need more tokens
    max_tokens = min(4000, max(2200, days * 220))

    # Initial generation
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=max_tokens,
    )

    content = clean_itinerary_content(response.choices[0].message.content or "")
    detected_days = extract_itinerary_days(content)

    # Verification: If day count is incomplete, perform targeted recovery
    if len(detected_days) < days:
        logger.warning(
            f"Initial generation returned {len(detected_days)}/{days} days. Attempting correction..."
        )

        missing_days = [d for d in range(1, days + 1) if d not in detected_days]
        
        correction_prompt = (
            f"The previous itinerary stopped early at {len(detected_days)} days, but the user requested {days} days.\n"
            f"Please generate the complete remaining days ({', '.join(f'Day {d}' for d in missing_days)}) "
            f"for {destination} ({budget} budget, interests: {', '.join(interests)}) "
            f"with full morning, afternoon, and evening details and practical travel advice in clean Markdown format."
        )

        recovery_response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt},
                {"role": "assistant", "content": content},
                {"role": "user", "content": correction_prompt},
            ],
            temperature=0.6,
            max_tokens=max(1500, len(missing_days) * 220),
        )

        extension = clean_itinerary_content(recovery_response.choices[0].message.content or "")
        combined_content = f"{content.rstrip()}\n\n{extension.lstrip()}"
        combined_days = extract_itinerary_days(combined_content)

        if len(combined_days) >= days:
            logger.info(f"Recovery successful! Total days now: {len(combined_days)}")
            return combined_content

        # If still incomplete after recovery, raise structured error with clean user-facing detail
        raise ValueError(
            f"Received incomplete itinerary: AI generated {len(combined_days)} days but trip requires {days} days. "
            "Please try generating again."
        )

    return content
