# SwapMeet API

Backend service for SwapMeet features.

`getSection(x, y)` now queries Prisma for stalls within the requested section. The function is used by `app/swapmeet` and is exposed via the `/swapmeet/api/section` endpoint.

Future iterations will surface additional tRPC routes as detailed in the SRS.
