import { useEffect, useState } from "react";

function WeeklyChallenges({ leagueId, week }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchChallenge() {
      try {
        const res = await fetch(`/api/league/${leagueId}/challenges/${week}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ WeeklyChallenges fetch failed:", err);
      }
    }
    if (leagueId && week) {
      fetchChallenge();
    }
  }, [leagueId, week]);

  if (!data) return <p>Loading weekly challenge...</p>;

  return (
    <div>
      <h3>Week {data.week} Challenge: {data.challenge}</h3>
      <p>{data.description}</p>
      {data.winner && (
        <p>
          🏆 Winner: {data.winner.name} ({data.winner.points} points)
        </p>
      )}
    </div>
  );
}

export default WeeklyChallenges;
