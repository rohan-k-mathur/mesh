import json
import types
import pytest
import openai
from jobs import batch_trait_inference as bt


class DummyResp:
    def __init__(self, content: str):
        msg = types.SimpleNamespace(content=content)
        choice = types.SimpleNamespace(message=msg)
        self.choices = [choice]
        self.usage = types.SimpleNamespace(total_tokens=10)


def test_schema_validation(monkeypatch):
    calls = []

    def fake_create(*args, **kwargs):
        calls.append(1)
        return DummyResp("{")

    monkeypatch.setattr(openai.chat.completions, "create", fake_create)
    monkeypatch.setattr(bt, "fetch_top_favs", lambda uid, limit=15: ["x"])
    monkeypatch.setattr(bt, "upsert_traits", lambda uid, t: None)
    monkeypatch.setattr(bt, "record_cost", lambda uid, t: None)

    with pytest.raises(bt.TraitError):
        bt.process_user(1)
    assert len(calls) == 3


def test_budget_guard(monkeypatch):
    monkeypatch.setattr(bt.db, "fetch", lambda q: [1, 2, 3])
    monkeypatch.setattr(bt, "weekly_budget", lambda: 0.001)
    with pytest.raises(SystemExit):
        bt.main()


def test_cost_projection():
    assert bt.projected_cost(4) == 4 * bt.BUDGET_PER_RUN
