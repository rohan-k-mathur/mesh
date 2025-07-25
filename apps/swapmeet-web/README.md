# SwapMeet Web

This package contains the Next.js frontend for the Mesh Bazaar module.

The `/market/[x]/[y]` route now loads stall data using the `swapmeet-api` package and lists stall names for the requested section. An API endpoint at `/api/section?x=&y=` also exposes this query for client requests.

See `SwapMeet_Implementation_Plan.md` for the milestone breakdown.
