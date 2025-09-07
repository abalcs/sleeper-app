import { useEffect, useState } from "react";
import { weeklyChallenges } from "../challenges";
import { getChallengeWinner } from "../api";

export default function WeeklyChallenges({ week }) {
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getChallengeWinner(
          import.meta.env.VITE_LEAGUE_ID,
          week
        );
        setWinner(data.winner);
      } catch (e) {
        console.error("Failed to load challenge winner", e);
      }
    })();
  }, [week]);

  const challenge = weeklyChallenges[week];

  if (!challenge) {
    return <div className="text-muted">No challenge defined for Week {week}</div>;
  }

  return (
    <div className="glass p-6 rounded-xl">
      <h2 className="text-2xl font-bold text-primary mb-2">
        Week {week}: {challenge.name}
      </h2>
      <p className="text-muted mb-4">{challenge.desc}</p>

      {winner ? (
        <div className="rounded-md bg-surface px-4 py-3 flex justify-between items-center">
          <span className="font-medium">{winner.name}</span>
          <span className="text-sm text-accent">
            {winner.points.toFixed(1)} pts
          </span>
        </div>
      ) : (
        <div className="text-muted">Winner not calculated yet.</div>
      )}
    </div>
  );
}
