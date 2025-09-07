import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import OpenAI from 'openai';

dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const SLEEPER = 'https://api.sleeper.app/v1';

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Mongo setup
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sleeper')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ Mongo error:', err));

// --- Mongo Schemas
const PlayerSchema = new mongoose.Schema(
  {
    sport: String,
    blob: mongoose.Schema.Types.Mixed,
    updatedAt: Date,
  },
  { collection: 'players' }
);
const Players = mongoose.model('Players', PlayerSchema);

const RecapSchema = new mongoose.Schema(
  {
    leagueId: String,
    week: Number,
    style: String,
    text: String,
    updatedAt: Date,
  },
  { collection: 'recaps' }
);
const Recap = mongoose.model('Recap', RecapSchema);

// --- Helpers
async function fetchJSON(url) {
  try {
    const r = await axios.get(url, { timeout: 15000 });
    return r.data;
  } catch (err) {
    console.error(`❌ fetchJSON failed for ${url}`, err.message);
    throw err;
  }
}

async function cachePlayersIfStale() {
  try {
    const existing = await Players.findOne({ sport: 'nfl' });
    const stale =
      !existing ||
      Date.now() - new Date(existing.updatedAt).getTime() >
        22 * 60 * 60 * 1000;

    if (!stale) return existing.blob;

    console.log('♻️ Refreshing NFL players cache from Sleeper API');
    const blob = await fetchJSON(`${SLEEPER}/players/nfl`);
    await Players.findOneAndUpdate(
      { sport: 'nfl' },
      { sport: 'nfl', blob, updatedAt: new Date() },
      { upsert: true }
    );
    return blob;
  } catch (err) {
    console.error('❌ cachePlayersIfStale error:', err.message);
    throw err;
  }
}

function resolvePlayer(pmap, pid, pointsMap = {}, projections = {}) {
  const p = pmap?.[pid];
  const points = pointsMap?.[pid] ?? 0;
  const proj = projections?.[pid]?.stats?.pts_ppr ?? null;

  if (!p) {
    return {
      id: pid,
      name: pid,
      pos: '',
      team: '',
      proj,
      actual: points,
    };
  }

  const name = [p.first_name, p.last_name].filter(Boolean).join(' ');

  return {
    id: pid,
    name,
    pos: p.position || (p.fantasy_positions || [])[0] || '',
    team: p.team || '',
    proj,
    actual: points,
  };
}

function enrichMatchups(rawMatchups, pmap, rosterOwnersByRosterId, projections) {
  return (rawMatchups || []).map((m) => {
    const startersResolved = (m.starters || []).map((pid) =>
      resolvePlayer(pmap, pid, m.players_points, projections)
    );
    const playersResolved = (m.players || []).map((pid) =>
      resolvePlayer(pmap, pid, m.players_points, projections)
    );
    const owner = rosterOwnersByRosterId[m.roster_id] || {};

    return {
      matchup_id: m.matchup_id,
      roster_id: m.roster_id,
      team_name: owner.team_name,
      display_name: owner.display_name,
      points: m.points,
      starters: startersResolved,
      players: playersResolved,
    };
  });
}

// --- Routes

app.get('/health', (_req, res) => {
  res.send('✅ API server is running');
});

app.get('/api/league/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const league = await fetchJSON(`${SLEEPER}/league/${leagueId}`);
    res.json(league);
  } catch (e) {
    console.error('❌ League route error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/league/:leagueId/standings', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const [users, rosters] = await Promise.all([
      fetchJSON(`${SLEEPER}/league/${leagueId}/users`),
      fetchJSON(`${SLEEPER}/league/${leagueId}/rosters`),
    ]);

    const standings = rosters.map((r) => {
      const owner = users.find((u) => u.user_id === r.owner_id);
      return {
        roster_id: r.roster_id,
        wins: r.settings?.wins ?? 0,
        losses: r.settings?.losses ?? 0,
        ties: r.settings?.ties ?? 0,
        fpts: r.settings?.fpts ?? 0,
        fpa: r.settings?.fpts_against ?? 0,
        team_name: owner?.metadata?.team_name || '—',
        display_name: owner?.display_name || 'Unknown',
      };
    });

    standings.sort((a, b) => b.wins - a.wins || b.fpts - a.fpts);
    standings.forEach((s, i) => (s.rank = i + 1));

    res.json(standings);
  } catch (e) {
    console.error('❌ Standings route error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/league/:leagueId/matchups/:week', async (req, res) => {
  try {
    const { leagueId, week } = req.params;
    const state = await fetchJSON(`${SLEEPER}/state/nfl`);
    const season = state.season;

    const [rawMatchups, users, rosters, pmap, projections] = await Promise.all([
      fetchJSON(`${SLEEPER}/league/${leagueId}/matchups/${week}`),
      fetchJSON(`${SLEEPER}/league/${leagueId}/users`),
      fetchJSON(`${SLEEPER}/league/${leagueId}/rosters`),
      cachePlayersIfStale(),
      fetchJSON(`${SLEEPER}/projections/nfl/${season}/${week}`),
    ]);

    const rosterOwnersByRosterId = {};
    for (const r of rosters) {
      const owner = users.find((u) => u.user_id === r.owner_id);
      rosterOwnersByRosterId[r.roster_id] = {
        team_name: owner?.metadata?.team_name || '—',
        display_name: owner?.display_name || 'Unknown',
        owner_id: owner?.user_id,
      };
    }

    const enriched = enrichMatchups(
      rawMatchups,
      pmap,
      rosterOwnersByRosterId,
      projections
    );
    res.json(enriched);
  } catch (e) {
    console.error('❌ Matchups route error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/league/:leagueId/challenges/:week', async (req, res) => {
  try {
    const { leagueId, week } = req.params;
    const wk = Number(week);

    const state = await fetchJSON(`${SLEEPER}/state/nfl`);
    const season = state.season;

    const [rawMatchups, users, rosters, pmap, projections] = await Promise.all([
      fetchJSON(`${SLEEPER}/league/${leagueId}/matchups/${week}`),
      fetchJSON(`${SLEEPER}/league/${leagueId}/users`),
      fetchJSON(`${SLEEPER}/league/${leagueId}/rosters`),
      cachePlayersIfStale(),
      fetchJSON(`${SLEEPER}/projections/nfl/${season}/${week}`),
    ]);

    const rosterOwnersByRosterId = {};
    for (const r of rosters) {
      const owner = users.find((u) => u.user_id === r.owner_id);
      rosterOwnersByRosterId[r.roster_id] = {
        team_name: owner?.metadata?.team_name || '—',
        display_name: owner?.display_name || 'Unknown',
        owner_id: owner?.user_id,
      };
    }

    const enriched = enrichMatchups(rawMatchups, pmap, rosterOwnersByRosterId, projections);

    let winner = null;
    let challengeName = '';
    let description = '';

    switch (wk) {
      case 1:
        challengeName = 'Hot Start';
        description = 'The team that scores the most points wins.';
        winner = enriched.reduce((best, team) =>
          team.points > (best?.points ?? -Infinity) ? team : best,
          null
        );
        break;
      default:
        challengeName = 'Unknown Challenge';
        description = 'No challenge defined for this week.';
    }

    res.json({
      week: wk,
      challenge: challengeName,
      description,
      winner: winner
        ? {
            name: winner.display_name || winner.team_name || 'Unknown',
            points: winner.points,
          }
        : null,
    });
  } catch (e) {
    console.error('❌ Challenge route error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/league/:leagueId/position-totals/:position', async (req, res) => {
  try {
    const { leagueId, position } = req.params;
    const state = await fetchJSON(`${SLEEPER}/state/nfl`);
    const currentWeek = state.week;

    const [users, rosters, pmap] = await Promise.all([
      fetchJSON(`${SLEEPER}/league/${leagueId}/users`),
      fetchJSON(`${SLEEPER}/league/${leagueId}/rosters`),
      cachePlayersIfStale(),
    ]);

    const rosterOwnersByRosterId = {};
    for (const r of rosters) {
      const owner = users.find((u) => u.user_id === r.owner_id);
      rosterOwnersByRosterId[r.roster_id] = {
        team_name: owner?.metadata?.team_name || '—',
        display_name: owner?.display_name || 'Unknown',
      };
    }

    const totals = {};
    for (let week = 1; week <= currentWeek; week++) {
      const rawMatchups = await fetchJSON(`${SLEEPER}/league/${leagueId}/matchups/${week}`);
      for (const m of rawMatchups) {
        const owner = rosterOwnersByRosterId[m.roster_id];
        if (!owner) continue;
        if (!totals[m.roster_id]) {
          totals[m.roster_id] = { ...owner, roster_id: m.roster_id, points: 0 };
        }
        for (const pid of m.players || []) {
          const player = pmap?.[pid];
          if (!player) continue;
          const pos = player.position || (player.fantasy_positions || [])[0];
          if (pos === position.toUpperCase()) {
            totals[m.roster_id].points += m.players_points?.[pid] || 0;
          }
        }
      }
    }

    const result = Object.values(totals).sort((a, b) => b.points - a.points);
    res.json({ position: position.toUpperCase(), totals: result });
  } catch (e) {
    console.error('❌ Position totals route error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// --- Serve Vite build
const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
