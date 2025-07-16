# Explainability API

The `/api/v2/discovery/why/:targetId` endpoint provides a short reason why a viewer is seeing a piece of content. Reasons are derived from LightGBM SHAP values.

* Cache key: `why:{viewerId}:{targetId}` (TTL 120s)
* Model and feature map loaded from `services/explainer`
* Human readable strings are defined in `config/explain_map.json`

Request parameters:
```
GET /api/v2/discovery/why/:targetId?viewerId=123
```

Response body:
```
{ "reason_en": "Because you liked…", "reason_es": "Porque te gustó…", "chip": { "en": "Both appreciate sci-fi", "es": "Ambos disfrutan de la ciencia ficción" } }
```

### Trait Chip

When the viewer and content creator share at least one genre in `user_taste_vectors.traits.genres`,
the response includes a small chip object:

```json
{
  "chip": { "en": "Both appreciate sci-fi", "es": "Ambos disfrutan de la ciencia ficción" }
}
```
If no overlap is found, the `chip` field is omitted.
