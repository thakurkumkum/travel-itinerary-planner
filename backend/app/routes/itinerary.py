import re
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException

from app.schemas.itinerary import (
    ItineraryRequest,
    ItineraryResponse,
    DayPlan,
)
from app.services.ai_service import generate_itinerary

router = APIRouter(
    prefix="/api/itineraries",
    tags=["Itineraries"],
)


def clean_escaped_delimiters(text: str) -> str:
    if not text:
        return ""
    # Normalize escaped bold: \*\*text\*\* or \*\*text** or **text\*\* -> **text**
    pattern = r'((?:\\+\*|\*){2})([^\n*]+?)((?:\\+\*|\*){2})'
    def repl(m):
        open_delim, content, close_delim = m.group(1), m.group(2), m.group(3)
        if "\\" in open_delim or "\\" in close_delim:
            return f"**{content}**"
        return m.group(0)
    text = re.sub(pattern, repl, text)
    # Normalize escaped headings
    text = re.sub(r"(?m)^(\s*)\\+(#{1,6}\s+)", r"\1\2", text)
    return text


def parse_markdown_to_days(
    markdown_text: str, start_date_str: str | None = None
) -> list[DayPlan]:
    """
    Parses Markdown headings (## Day X: ...) into structured DayPlan objects.
    """
    matches = list(
        re.finditer(
            r"(?:^|\n)##?\s*Day\s+(\d+)\s*[:\-–]?\s*([^\n]*)",
            markdown_text,
            re.IGNORECASE,
        )
    )

    base_date = None
    if start_date_str:
        try:
            base_date = datetime.strptime(start_date_str[:10], "%Y-%m-%d")
        except Exception:
            pass

    day_plans = []

    for i, m in enumerate(matches):
        day_num = int(m.group(1))
        title = m.group(2).strip() or f"Explore {day_num}"
        start_idx = m.end()

        # Determine end of block
        if i + 1 < len(matches):
            end_idx = matches[i + 1].start()
        else:
            # Stop before any subsequent non-day markdown headings (e.g. ## Budget Breakdown, ## Tips)
            next_heading = re.search(r"\n#{1,3}\s+", markdown_text[start_idx:])
            if next_heading:
                end_idx = start_idx + next_heading.start()
            else:
                end_idx = len(markdown_text)

        block = markdown_text[start_idx:end_idx].strip()

        # Compute date if base_date provided
        day_date = None
        if base_date:
            day_date = (base_date + timedelta(days=day_num - 1)).strftime(
                "%Y-%m-%d"
            )

        # Extract activities
        activities = []
        notes_lines = []

        for line in block.split("\n"):
            line = line.strip()
            if not line:
                continue

            # Skip table separator rows: e.g. | --- | --- | or |:---|:---|
            if re.match(r"^\|?(\s*:?-+:?\s*\|?)+$", line):
                continue

            # Check for bullet points or numbered lists
            if line.startswith(("-", "*", "•", "1.", "2.", "3.", "4.", "5.")):
                clean_line = re.sub(r"^[-*•\d.]+\s*", "", line).strip()
                # Skip if clean_line is just a table separator or pipe delimiter
                if clean_line and not re.match(r"^\|?(\s*:?-+:?\s*\|?)+$", clean_line):
                    clean_line = clean_escaped_delimiters(clean_line)
                    activities.append(clean_line)
            elif any(
                line.lower().startswith(p)
                for p in ["morning:", "afternoon:", "evening:"]
            ):
                line = clean_escaped_delimiters(line)
                activities.append(line)
            elif not line.startswith("#") and not line.startswith("|"):
                line = clean_escaped_delimiters(line)
                notes_lines.append(line)

        # Fallback activities if none parsed
        if not activities and block:
            for candidate in block.split("\n"):
                candidate = candidate.strip()
                if candidate and not candidate.startswith(("#", "|")):
                    first_sentence = candidate.split(".")[0].strip()
                    if first_sentence:
                        activities.append(clean_escaped_delimiters(first_sentence))
                        break

        title = clean_escaped_delimiters(title)
        day_plans.append(
            DayPlan(
                day_number=day_num,
                title=title,
                date=day_date,
                notes=" ".join(notes_lines[:2]) if notes_lines else "",
                activities=activities,
            )
        )

    return day_plans


@router.post("/generate", response_model=ItineraryResponse)
def create_itinerary(request: ItineraryRequest):
    try:
        # Calculate days if not directly provided
        days_count = request.days
        if not days_count:
            if request.start_date and request.end_date:
                try:
                    d1 = datetime.strptime(request.start_date[:10], "%Y-%m-%d")
                    d2 = datetime.strptime(request.end_date[:10], "%Y-%m-%d")
                    days_count = (d2 - d1).days + 1
                except Exception:
                    days_count = 3
            else:
                days_count = 3

        # Clamp between 1 and 30 days
        days_count = max(1, min(30, days_count))

        raw_itinerary = generate_itinerary(
            destination=request.destination,
            days=days_count,
            budget=request.budget,
            interests=request.interests,
            travelers=request.travelers,
        )

        structured_days = parse_markdown_to_days(
            raw_itinerary, request.start_date
        )

        return ItineraryResponse(
            destination=request.destination,
            days=structured_days,
            day_count=len(structured_days) if structured_days else days_count,
            budget=request.budget,
            pace=request.pace,
            start_date=request.start_date,
            end_date=request.end_date,
            itinerary=raw_itinerary,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print(f"Itinerary generation error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Failed to generate itinerary. Check backend terminal.",
        ) from exc
