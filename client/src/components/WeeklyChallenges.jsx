import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Trophy } from "./Icons";

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
        console.error("WeeklyChallenges fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    if (leagueId && week) fetchChallenge();
  }, [leagueId, week]);

  if (loading) return <p className="text-muted">Loading weekly challenge...</p>;
  if (!data) return <p className="text-muted">No challenge data available.</p>;

  return (
    <div className="stadium-card p-4 sm:p-6 shadow-md">
      <h3 className="text-lg sm:text-xl font-display font-semibold text-primary mb-2 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Week {data.week} Challenge: {data.challenge}
      </h3>
      <p className="text-sm text-muted mb-4">{data.description}</p>

      {data.winner ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-surface rounded-lg p-3 sm:p-4 shadow-inner border border-gold/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-gold animate-touchdown" />
            <p className="text-base sm:text-lg font-display font-bold text-gold">
              {data.winner.team}
            </p>
          </div>
          <p className="text-sm text-muted mb-1">
            Manager:{" "}
            <span className="font-medium text-text">
              {data.winner.manager}
            </span>
          </p>
          <p className="text-sm sm:text-base font-display font-semibold text-win">
            Score: {data.winner.points.toFixed(1)} pts
          </p>
        </motion.div>
      ) : (
        <p className="text-muted">No winner determined yet.</p>
      )}
    </div>
  );
}

export default WeeklyChallenges;
