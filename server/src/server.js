import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import OpenAI from 'openai';

dotenv.config();

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
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sleeper', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
  const r = await axios.get(url, { timeout: 15000 });
  return r.data;
}

async function cachePlayersIfStale() {
  const existing = await Players.findOne({ sport: 'nfl' });
  const stale =
    !existing ||
    Date.now() - new Date(existing.updatedAt).getTime() >
      22 * 60 * 60 * 1000;

  if (!stale) return existing.blob;

  const blob = await fetchJSON(`${SLEEPER}/players/nfl`);
  await Players.findOneAndUpdate(
    { sport: 'nfl' },
    { sport: 'nfl', blob, updatedAt: new Date() },
    { upsert: true }
  );
  return blob;
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

// Get league info
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

// Get standings
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

// Get matchups enriched
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

// Weekly challenges
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

// Weekly recap with persistence
app.post('/api/league/:leagueId/recap/:week', async (req, res) => {
  try {
    const { leagueId, week } = req.params;
    const { style, force } = req.body;

    const existing = await Recap.findOne({ leagueId, week });
    if (existing && !force) {
      return res.json({ recap: existing.text, style: existing.style });
    }

    const matchups = await fetchJSON(
      `http://localhost:${PORT}/api/league/${leagueId}/matchups/${week}`
    );

    const resultsSummary = matchups
      .map(
        (m) =>
          `${m.display_name || m.team_name} scored ${m.points.toFixed(1)} points.`
      )
      .join('\n');

    const prompt = `
      You are a fantasy football recap writer.
      Summarize these Week ${week} matchups in a ${style} style.
      Here are the results:\n\n${resultsSummary}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500, // increased to avoid cutoff
      temperature: 0.7,
    });

    const recapText = completion.choices[0].message.content;

    await Recap.findOneAndUpdate(
      { leagueId, week },
      { leagueId, week, style, text: recapText, updatedAt: new Date() },
      { upsert: true }
    );

    res.json({ recap: recapText, style });
  } catch (e) {
    console.error('❌ Recap route error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Fetch existing recap
app.get('/api/league/:leagueId/recap/:week', async (req, res) => {
  try {
    const { leagueId, week } = req.params;
    const existing = await Recap.findOne({ leagueId, week });
    if (!existing) {
      return res.json({ recap: null });
    }
    res.json({ recap: existing.text, style: existing.style });
  } catch (e) {
    console.error('❌ Recap GET route error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Trade recommendations using ChatGPT with specific player targets
app.post('/api/league/:leagueId/trade-recommendations', async (req, res) => {
    try {
      const { leagueId } = req.params;
      const { rosterId } = req.body;
  
      if (!rosterId) {
        return res.status(400).json({ error: "Missing rosterId" });
      }
  
      const state = await fetchJSON(`${SLEEPER}/state/nfl`);
      const season = state.season;
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
  
      // Collect totals by position for every team
      const allTotals = {};
      for (let week = 1; week <= currentWeek; week++) {
        const rawMatchups = await fetchJSON(`${SLEEPER}/league/${leagueId}/matchups/${week}`);
        for (const m of rawMatchups) {
          if (!allTotals[m.roster_id]) allTotals[m.roster_id] = {};
          for (const pid of m.players || []) {
            const player = pmap?.[pid];
            if (!player) continue;
            const pos = player.position || (player.fantasy_positions || [])[0];
            if (!pos) continue;
            if (!allTotals[m.roster_id][pos]) allTotals[m.roster_id][pos] = 0;
            allTotals[m.roster_id][pos] += m.players_points?.[pid] || 0;
          }
        }
      }
  
      // League-wide distributions
      const leaguePosTotals = {};
      for (const teamId of Object.keys(allTotals)) {
        for (const pos of Object.keys(allTotals[teamId])) {
          if (!leaguePosTotals[pos]) leaguePosTotals[pos] = [];
          leaguePosTotals[pos].push(allTotals[teamId][pos]);
        }
      }
  
      const weaknesses = [];
      const surpluses = {};
  
      for (const pos of Object.keys(leaguePosTotals)) {
        const sorted = [...leaguePosTotals[pos]].sort((a, b) => b - a);
        const medianIndex = Math.floor(sorted.length / 2);
        const medianValue = sorted[medianIndex];
        const teamValue = allTotals[rosterId]?.[pos] || 0;
  
        if (teamValue < medianValue) {
          weaknesses.push({ position: pos, teamValue, medianValue });
        }
      }
  
      // Identify surpluses for other teams
      for (const [teamId, totals] of Object.entries(allTotals)) {
        if (Number(teamId) === Number(rosterId)) continue;
        for (const pos of Object.keys(totals)) {
          const sorted = [...leaguePosTotals[pos]].sort((a, b) => b - a);
          const medianValue = sorted[Math.floor(sorted.length / 2)];
          if (totals[pos] > medianValue) {
            if (!surpluses[pos]) surpluses[pos] = [];
            surpluses[pos].push({
              teamId,
              owner: rosterOwnersByRosterId[teamId],
              total: totals[pos],
            });
          }
        }
      }
  
      if (weaknesses.length === 0) {
        return res.json({ recommendations: "This team has no glaring weaknesses below the league median." });
      }
  
      // Example players for surpluses: pick top scorers from those teams at that position
      const surplusPlayers = {};
      for (const [pos, teams] of Object.entries(surpluses)) {
        surplusPlayers[pos] = [];
        for (const team of teams) {
          const rawMatchups = await fetchJSON(`${SLEEPER}/league/${leagueId}/matchups/${currentWeek}`);
          for (const m of rawMatchups.filter(x => x.roster_id === Number(team.teamId))) {
            for (const pid of m.players || []) {
              const player = pmap?.[pid];
              if (player && (player.position === pos || player.fantasy_positions?.includes(pos))) {
                surplusPlayers[pos].push(player.first_name + " " + player.last_name);
              }
            }
          }
        }
      }
  
      const owner = rosterOwnersByRosterId[rosterId];
      const weaknessesSummary = weaknesses.map(
        w => `${w.position}: ${w.teamValue.toFixed(1)} vs league median ${w.medianValue.toFixed(1)}`
      ).join("\n");
  
      const surplusesSummary = Object.entries(surpluses).map(([pos, teams]) => {
        const names = teams.map(t => `${t.owner.display_name} (${t.owner.team_name})`).join(", ");
        return `${pos}: ${names}`;
      }).join("\n");
  
      const surplusPlayersSummary = Object.entries(surplusPlayers).map(([pos, players]) => {
        return `${pos}: ${players.slice(0,5).join(", ")}`;
      }).join("\n");
  
      const prompt = `
  You are a fantasy football trade advisor.
  The team "${owner.display_name}" (${owner.team_name}) is below league average in these positions:\n\n${weaknessesSummary}
  
  Other teams have surpluses:\n\n${surplusesSummary}
  
  Notable players available:\n\n${surplusPlayersSummary}
  
  Suggest specific trade targets (players) and general trade strategies they could pursue.
  Keep it concise, practical, and written in a fantasy football manager tone.
      `;
  
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.8,
      });
  
      const text = completion.choices[0].message.content;
      res.json({ recommendations: text, weaknesses, surpluses, surplusPlayers });
    } catch (e) {
      console.error("❌ Trade recommendations error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });
  
  

// Position totals across season
app.get('/api/league/:leagueId/position-totals/:position', async (req, res) => {
    try {
      const { leagueId, position } = req.params;
  
      const state = await fetchJSON(`${SLEEPER}/state/nfl`);
      const season = state.season;
      const currentWeek = state.week;
  
      // Get owners
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
  
      // Totals map
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
  

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
