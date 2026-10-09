from datetime import date, datetime
from typing import Any, Dict, Optional

def calculate_rank_score(
    benefit_amount: float,
    deadline: Optional[date],
    document_count: int
) -> Dict[str, Any]:
    """
    Computes a composite ranking score for "Top Picks":
    - benefit_score: up to 50 points based on monetary benefit
    - deadline_score: up to 30 points prioritizing urgent deadlines within 30 days
    - ease_score: up to 20 points favoring fewer required documents
    Returns total score and breakdown.
    """
    # 1. Benefit Score (0 to 50)
    # E.g., ₹100,000 or more reaches 50 pts; ₹12,000 (like ₹1,000/mo) gets ~25 pts
    if benefit_amount <= 0:
        benefit_score = 5.0
    elif benefit_amount >= 100000:
        benefit_score = 50.0
    else:
        # Scale between 10 and 50
        benefit_score = round(10.0 + (benefit_amount / 100000.0) * 40.0, 1)

    # 2. Deadline Urgency Score (0 to 30)
    if deadline:
        if isinstance(deadline, datetime):
            deadline = deadline.date()
        today = date.today()
        days_left = (deadline - today).days

        if days_left < 0:
            deadline_score = 0.0  # expired
        elif days_left <= 14:
            # high urgency
            deadline_score = 30.0
        elif days_left <= 30:
            deadline_score = 22.0
        elif days_left <= 60:
            deadline_score = 15.0
        else:
            deadline_score = 10.0
    else:
        # Open / Rolling scheme with no imminent cut-off
        deadline_score = 15.0

    # 3. Document Ease Score (5 to 20)
    # Fewer documents required means lower friction
    ease_score = max(5.0, round(20.0 - (document_count * 2.5), 1))

    total = round(benefit_score + deadline_score + ease_score, 1)

    return {
        "total": total,
        "benefit_score": benefit_score,
        "deadline_score": deadline_score,
        "ease_score": ease_score,
        "document_count": document_count,
        "days_to_deadline": (deadline - date.today()).days if deadline else None
    }
