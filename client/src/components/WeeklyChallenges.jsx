import React, { useEffect, useState } from "react";

function WeeklyChallenges({ leagueId, week }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenge() {
      try {
        const res = await fetch(`/api/league/${leagueId}/challenges/${week}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ WeeklyChallenges fetch failed:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (leagueId && week) fetchChallenge();
  }, [leagueId, week]);

  if (loading) {
    return (
      <div className="glass p-4 rounded-xl text-center text-muted">
        Loading weekly challenge…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass p-4 rounded-xl text-center text-muted">
        No challenge data available.
      </div>
    );
  }

  return (
    <div className="glass p-4 rounded-xl">
      <h2 className="text-xl font-bold text-primary mb-2">
        Week {data.week} Challenge
      </h2>
      <p className="text-sm text-muted mb-4">{data.description}</p>
      {data.winner ? (
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-lg font-semibold">🏆 {data.winner.name}</p>
          <p className="text-sm text-muted">{data.winner.points} points</p>
        </div>
      ) : (
        <p className="text-center text-muted">No winner determined yet.</p>
      )}
    </div>
  );
}

export default WeeklyChallenges;
