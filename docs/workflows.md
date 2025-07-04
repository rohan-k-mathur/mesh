# Workflow API

## GET /api/workflows/[id]

Returns a workflow by id.

### Query Parameters
- `version`: optional version number to fetch.
- `history=true`: include all versions and transitions.

If neither parameter is supplied, the latest workflow and all transitions are returned.

## Database Changes

`WorkflowTransition` now has a `version` column. See `lib/models/migrations/20250704000000_add_transition_version.sql` for the migration script.
