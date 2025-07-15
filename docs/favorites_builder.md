# Favorites Builder

The favorites builder generates per-user taste vectors from recent favorite items. It can be triggered manually or on a nightly cron when `ENABLE_FAV_BUILDER=true`.

## Enable-Cron Checklist
- [ ] Favorite import error-rate < 2 %.
- [ ] Embedding cache hit ≥ 95 %.
- [ ] Taste-aware candidate endpoint latency ≤ 120 ms.
- [ ] Staging cron passes for 3 days with no failures.
