import pytest
from datetime import date, timedelta
from app.engine.rule_evaluator import evaluate_rule, evaluate_scheme, calculate_verified_status
from app.engine.ranker import calculate_rank_score

def test_evaluate_rule_numeric_operators():
    rule_income = {"field": "family_income", "op": "<=", "value": 250000}
    passed, reason = evaluate_rule(rule_income, {"family_income": 200000})
    assert passed is True
    assert reason is None

    passed, reason = evaluate_rule(rule_income, {"family_income": 280000})
    assert passed is False
    assert reason["gap_amount"] == 30000
    assert "above limit" in reason["gap"]

def test_evaluate_rule_equality_and_membership():
    rule_gender = {"field": "gender", "op": "==", "value": "female"}
    assert evaluate_rule(rule_gender, {"gender": "female"})[0] is True
    assert evaluate_rule(rule_gender, {"gender": "male"})[0] is False

    rule_community = {"field": "community", "op": "in", "value": ["BC", "MBC", "SC", "ST"]}
    assert evaluate_rule(rule_community, {"community": "MBC"})[0] is True
    assert evaluate_rule(rule_community, {"community": "General"})[0] is False

def test_evaluate_scheme_eligibility():
    rules = [
        {"field": "age", "op": ">=", "value": 18},
        {"field": "family_income", "op": "<=", "value": 250000},
        {"field": "gender", "op": "==", "value": "female"}
    ]

    # Perfect match: all pass
    profile_eligible = {"age": 20, "family_income": 150000, "gender": "female"}
    res = evaluate_scheme(rules, profile_eligible)
    assert res.is_eligible is True
    assert res.is_almost_eligible is False
    assert res.match_percent == 100.0

    # Almost eligible: exactly 1 fails
    profile_almost = {"age": 20, "family_income": 300000, "gender": "female"}
    res2 = evaluate_scheme(rules, profile_almost)
    assert res2.is_eligible is False
    assert res2.is_almost_eligible is True
    assert res2.match_percent == round((2 / 3) * 100, 1)
    assert len(res2.failed_reasons) == 1
    assert res2.failed_reasons[0]["field"] == "family_income"

    # Excluded: 2 fail
    profile_excluded = {"age": 16, "family_income": 300000, "gender": "female"}
    res3 = evaluate_scheme(rules, profile_excluded)
    assert res3.is_eligible is False
    assert res3.is_almost_eligible is False
    assert len(res3.failed_reasons) == 2

def test_calculate_verified_status():
    today = date.today()
    assert calculate_verified_status(today) == "verified"
    assert calculate_verified_status(today - timedelta(days=80)) == "verified"
    assert calculate_verified_status(today - timedelta(days=95)) == "needs_recheck"
    assert calculate_verified_status(None) == "needs_recheck"

def test_calculate_rank_score():
    score = calculate_rank_score(
        benefit_amount=24000,
        deadline=date.today() + timedelta(days=10),
        document_count=2
    )
    assert "total" in score
    assert "benefit_score" in score
    assert "deadline_score" in score
    assert "ease_score" in score
    assert score["deadline_score"] == 30.0  # within 14 days
    assert score["ease_score"] == 15.0  # 20 - (2 * 2.5) = 15.0
