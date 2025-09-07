const BASE = import.meta.env.VITE_API_BASE || "";

export async function getNFLState() {
const r = await fetch(`${BASE}/api/state/nfl`);
if (!r.ok) throw new Error('State failed');
return r.json();
}


export async function getStandings(leagueId) {
const r = await fetch(`${BASE}/api/league/${leagueId}/standings`);
console.log(r)
if (!r.ok) throw new Error('Standings failed');
return r.json();
}


export async function getMatchups(leagueId, week) {
const r = await fetch(`${BASE}/api/league/${leagueId}/matchups/${week}`);
if (!r.ok) throw new Error('Matchups failed');
return r.json();
}

export async function getLeague(leagueId) {
    const r = await fetch(`${import.meta.env.VITE_API_BASE}/api/league/${leagueId}`);
    if (!r.ok) throw new Error('Failed to fetch league');
    return r.json();
  }

  export async function getChallengeWinner(leagueId, week) {
    const r = await fetch(
      `${import.meta.env.VITE_API_BASE}/api/league/${leagueId}/challenges/${week}`
    );
    if (!r.ok) throw new Error("Failed to fetch challenge winner");
    return r.json();
  }
  
  