# LightGBM Discovery Ranker

This service reorders discovery feed candidates using a LightGBM model.

## Training

Run `make train` which executes `ml/offline_train_ranker.py`. The script expects
feature Parquet files with columns `viewer_id`, `candidate_id`, `label` and
feature columns. A model and `feature_map.json` are written under `models/` and
logged to MLflow.

## Serving

`make serve-shadow` launches the FastAPI app and gRPC server. The gRPC contract
is defined in `protos/ranker.proto`. The service exposes `/healthz` for health
checks and Prometheus metrics `rank_requests_total`, `rank_latency_ms` and
`shadow_served_total`.

## Testing

Run `make test` to execute the pytest suite which covers LightGBM training and
the gRPC contract.
