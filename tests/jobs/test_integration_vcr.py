import os
import types
import json
import vcr
import openai
from jobs import batch_trait_inference as bt

CASSETTE = os.path.join(os.path.dirname(__file__), "openai_success.yaml")


@vcr.use_cassette(CASSETTE)
def test_upsert_with_vcr(monkeypatch, tmp_path):
    def fake_create(*args, **kwargs):
        import requests
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            json={},
            headers={"Authorization": "Bearer test"},
        )
        data = json.loads(resp.text)
        msg = types.SimpleNamespace(content=data["choices"][0]["message"]["content"])
        choice = types.SimpleNamespace(message=msg)
        usage = types.SimpleNamespace(total_tokens=data["usage"]["total_tokens"])
        return types.SimpleNamespace(choices=[choice], usage=usage)

    monkeypatch.setattr(bt.db, "fetch", lambda q: [1])
    monkeypatch.setattr(bt, "weekly_budget", lambda: 10)
    monkeypatch.setattr(bt, "fetch_top_favs", lambda uid, limit=15: ["title"])
    monkeypatch.setattr(openai.chat.completions, "create", fake_create)
    stored = {}
    monkeypatch.setattr(bt, "upsert_traits", lambda uid, t: stored.setdefault("traits", t))
    monkeypatch.setattr(bt, "record_cost", lambda uid, t: None)
    bt.main()
    assert bt.validate_json(stored["traits"])
