from typing import Any, Dict, List, Optional, Tuple
from datetime import date, datetime

class RuleEvaluationResult:
    def __init__(
        self,
        is_eligible: bool,
        is_almost_eligible: bool,
        match_percent: float,
        passed_rules: int,
        total_rules: int,
        failed_reasons: List[Dict[str, Any]]
    ):
        self.is_eligible = is_eligible
        self.is_almost_eligible = is_almost_eligible
        self.match_percent = match_percent
        self.passed_rules = passed_rules
        self.total_rules = total_rules
        self.failed_reasons = failed_reasons

def evaluate_rule(rule: Dict[str, Any], profile: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Evaluates a single rule against user profile.
    Returns (passed, failure_detail_if_failed).
    """
    field = rule.get("field")
    op = rule.get("op")
    expected_value = rule.get("value")
    label_en = rule.get("label_en", f"Rule for {field}")
    label_ta = rule.get("label_ta", f"{field} விதி")
    label_hi = rule.get("label_hi", f"{field} नियम")

    user_value = profile.get(field)

    # If field is missing or None in profile
    if user_value is None:
        return False, {
            "field": field,
            "operator": op,
            "required_value": expected_value,
            "user_value": None,
            "gap": f"{field} not provided",
            "gap_amount": None,
            "label_en": label_en,
            "label_ta": label_ta,
            "label_hi": label_hi,
        }

    # Normalize strings for comparison
    u_val = user_value
    e_val = expected_value

    if isinstance(u_val, str) and not isinstance(e_val, list):
        u_cmp = u_val.strip().lower()
        e_cmp = str(e_val).strip().lower()
    else:
        u_cmp = u_val
        e_cmp = e_val

    passed = False
    gap_desc = ""
    gap_amount = None

    try:
        if op == "==":
            passed = (u_cmp == e_cmp)
            if not passed:
                gap_desc = f"Required '{expected_value}', but you entered '{user_value}'"
        elif op == "!=":
            passed = (u_cmp != e_cmp)
            if not passed:
                gap_desc = f"Cannot be '{expected_value}'"
        elif op == "<=":
            passed = float(u_val) <= float(e_val)
            if not passed:
                diff = float(u_val) - float(e_val)
                gap_amount = diff
                gap_desc = f"{field.replace('_', ' ').title()} is {int(diff) if diff.is_integer() else diff} above limit of {expected_value}"
        elif op == ">=":
            passed = float(u_val) >= float(e_val)
            if not passed:
                diff = float(e_val) - float(u_val)
                gap_amount = diff
                gap_desc = f"{field.replace('_', ' ').title()} is {int(diff) if diff.is_integer() else diff} below minimum of {expected_value}"
        elif op == "in":
            # expected_value is a list or comma-separated string
            if isinstance(e_val, list):
                allowed = [str(x).strip().lower() for x in e_val]
            else:
                allowed = [str(x).strip().lower() for x in str(e_val).split(",")]
            
            passed = str(u_val).strip().lower() in allowed
            if not passed:
                gap_desc = f"Required one of: {', '.join([str(x) for x in (e_val if isinstance(e_val, list) else [e_val])])}"
        elif op == "not_in":
            if isinstance(e_val, list):
                disallowed = [str(x).strip().lower() for x in e_val]
            else:
                disallowed = [str(x).strip().lower() for x in str(e_val).split(",")]
            
            passed = str(u_val).strip().lower() not in disallowed
            if not passed:
                gap_desc = f"Not eligible for category '{user_value}'"
        else:
            passed = False
            gap_desc = f"Unsupported operator '{op}'"
    except (ValueError, TypeError) as err:
        passed = False
        gap_desc = f"Invalid format for evaluation: {str(err)}"

    if passed:
        return True, None

    return False, {
        "field": field,
        "operator": op,
        "required_value": expected_value,
        "user_value": user_value,
        "gap": gap_desc,
        "gap_amount": gap_amount,
        "label_en": label_en,
        "label_ta": label_ta,
        "label_hi": label_hi,
    }

def evaluate_scheme(rules: List[Dict[str, Any]], profile: Dict[str, Any]) -> RuleEvaluationResult:
    """
    Evaluates all rules for a scheme.
    - Eligible: all rules pass (total == passed)
    - Almost eligible: exactly 1 rule fails
    - Excluded: more than 1 rule fails
    """
    if not rules:
        return RuleEvaluationResult(
            is_eligible=True,
            is_almost_eligible=False,
            match_percent=100.0,
            passed_rules=0,
            total_rules=0,
            failed_reasons=[]
        )

    total_rules = len(rules)
    passed_count = 0
    failed_reasons = []

    for rule in rules:
        passed, failure_detail = evaluate_rule(rule, profile)
        if passed:
            passed_count += 1
        else:
            if failure_detail:
                failed_reasons.append(failure_detail)

    match_percent = round((passed_count / total_rules) * 100.0, 1) if total_rules > 0 else 100.0
    is_eligible = (passed_count == total_rules)
    is_almost_eligible = (len(failed_reasons) == 1)

    return RuleEvaluationResult(
        is_eligible=is_eligible,
        is_almost_eligible=is_almost_eligible,
        match_percent=match_percent,
        passed_rules=passed_count,
        total_rules=total_rules,
        failed_reasons=failed_reasons
    )

def calculate_verified_status(last_verified: Optional[date]) -> str:
    """
    Returns 'verified' if last_verified is within 90 days, else 'needs_recheck'.
    """
    if not last_verified:
        return "needs_recheck"
    
    if isinstance(last_verified, datetime):
        last_verified = last_verified.date()

    days_ago = (date.today() - last_verified).days
    return "verified" if days_ago <= 90 else "needs_recheck"
