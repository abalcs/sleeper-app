# Server (Express + Mongo)


## Env
Copy `.env.example` → `.env` and set `MONGO_URL`.


## Run
```bash
npm i
npm run dev

Routes

GET /api/state/nfl

GET /api/league/:leagueId/standings

GET /api/league/:leagueId/matchups/:week

POST /api/refresh/league/:leagueId?week=##

Standings are computed from roster settings; matchups are enriched with player names/positions/teams and team display names.

---


## Client (React + Vite + Tailwind)


### `client/.env.example`
```env
# Point to your Express server
VITE_API_BASE=http://localhost:4000
# Default league id for the UI (override in runtime UI later if you want)
VITE_LEAGUE_ID=YOUR_LEAGUE_ID