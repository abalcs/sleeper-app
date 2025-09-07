import { useEffect, useState } from "react";

function WeeklyChallenges({ leagueId, week }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenge() {
      try {
        const res = await fetch(`/api/league/${leagueId}/challenges/${week}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ WeeklyChallenges fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    if (leagueId && week) fetchChallenge();
  }, [leagueId, week]);

  if (loading) return <p className="text-muted">Loading weekly challenge...</p>;
  if (!data) return <p className="text-muted">No challenge data available.</p>;

  return (
    <div className="glass rounded-xl p-4 sm:p-6 shadow-md">
      <h3 className="text-lg sm:text-xl font-semibold text-primary mb-2">
        Week {data.week} Challenge: {data.challenge}
      </h3>
      <p className="text-sm text-muted mb-4">{data.description}</p>

      {data.winner ? (
        <div className="bg-surface rounded-lg p-3 sm:p-4 shadow-inner border border-border">
          <p className="text-base sm:text-lg font-bold text-accent mb-1">
            🏆 {data.winner.team}
          </p>
          <p className="text-sm text-muted mb-1">
            Manager:{" "}
            <span className="font-medium text-text">
              {data.winner.manager}
            </span>
          </p>
          <p className="text-sm sm:text-base font-semibold">
            Score: {data.winner.points.toFixed(1)} pts
          </p>
        </div>
      ) : (
        <p className="text-muted">No winner determined yet.</p>
      )}
    </div>
  );
}

export default WeeklyChallenges;
