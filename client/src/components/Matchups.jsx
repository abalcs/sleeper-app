import { useState, memo, useMemo } from "react";
import { motion } from "framer-motion";
import { PositionBadge, VSBadge, Trophy } from "./Icons";
import { EndzoneStripe } from "./FieldBackground";

export default function Matchups({ items }) {
  if (!items || items.length === 0) {
    return <div className="text-muted">No matchups available.</div>;
  }

  const grouped = items.reduce((acc, m) => {
    if (!acc[m.matchup_id]) acc[m.matchup_id] = [];
    acc[m.matchup_id].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([matchupId, teams]) => (
        <MatchupCard key={matchupId} teams={teams} />
      ))}
    </div>
  );
}

const MatchupCard = memo(function MatchupCard({ teams }) {
  // Determine winner (if both teams have points)
  const winner = useMemo(() => {
    if (teams.length !== 2) return null;
    const [team1, team2] = teams;
    if (team1.points > team2.points) return team1.roster_id;
    if (team2.points > team1.points) return team2.roster_id;
    return null; // tie
  }, [teams]);

  return (
    <div className="field-card p-2 sm:p-4 space-y-4 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {teams.map((team, idx) => (
          <>
            <TeamCard
              key={team.roster_id || idx}
              team={team}
              isWinner={winner === team.roster_id}
              stripeColor={idx === 0 ? "red" : "blue"}
            />
            {idx === 0 && teams.length === 2 && (
              <div className="hidden md:flex justify-center">
                <VSBadge />
              </div>
            )}
          </>
        ))}
      </div>
      {/* Mobile VS indicator */}
      {teams.length === 2 && (
        <div className="md:hidden flex justify-center -my-2">
          <VSBadge />
        </div>
      )}
    </div>
  );
});

const TeamCard = memo(function TeamCard({ team, isWinner, stripeColor }) {
  const [showBench, setShowBench] = useState(false);

  const starterIds = new Set(team.starters.map((p) => p.id));
  const bench = team.players.filter((p) => !starterIds.has(p.id));

  return (
    <EndzoneStripe color={stripeColor}>
      <div className={`bg-surface rounded-lg p-2 sm:p-4 transition-all duration-300 ${isWinner ? 'winner-glow border' : ''}`}>
        {/* Team header with score */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <span className="text-primary font-bold">
              {team.display_name || team.team_name || "Unknown"}
            </span>
            {isWinner && (
              <Trophy className="w-4 h-4 text-gold animate-touchdown" />
            )}
          </h3>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`score-big ${isWinner ? 'text-win' : 'text-accent'}`}
          >
            {team.points.toFixed(1)}
          </motion.span>
        </div>

        {/* Starters */}
        <div className="overflow-x-auto">
          <h4 className="font-medium mb-1 text-sm text-muted uppercase tracking-wide">Starters</h4>
          <table className="min-w-full text-xs sm:text-sm mb-2 border-collapse">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="p-1 whitespace-nowrap">Player</th>
                <th className="p-1 whitespace-nowrap">Pos</th>
                <th className="p-1 whitespace-nowrap">Team</th>
                <th className="p-1 text-right whitespace-nowrap">Proj</th>
                <th className="p-1 text-right whitespace-nowrap">Actual</th>
              </tr>
            </thead>
            <tbody>
              {team.starters.map((p, idx) => (
                <tr key={p.id || idx} className="border-b border-border/50">
                  <td className="p-1 font-medium">{p.name}</td>
                  <td className="p-1">
                    <PositionBadge position={p.pos} />
                  </td>
                  <td className="p-1 text-muted">{p.team}</td>
                  <td className="p-1 text-right text-muted font-display">
                    {p.proj != null ? p.proj.toFixed(1) : "-"}
                  </td>
                  <td className="p-1 text-right font-display font-semibold">
                    {p.actual != null ? p.actual.toFixed(1) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bench toggle button */}
        <button
          onClick={() => setShowBench((s) => !s)}
          className={`mt-3 mb-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
            showBench
              ? "bg-field text-white hover:bg-field-dark"
              : "bg-surface text-primary border border-border hover:bg-surface/80"
          }`}
        >
          {showBench ? "Hide Bench" : "Show Bench"}
        </button>

        {showBench && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-x-auto"
          >
            <h4 className="font-medium mb-1 text-sm text-muted uppercase tracking-wide">Bench</h4>
            <table className="min-w-full text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="p-1 whitespace-nowrap">Player</th>
                  <th className="p-1 whitespace-nowrap">Pos</th>
                  <th className="p-1 whitespace-nowrap">Team</th>
                  <th className="p-1 text-right whitespace-nowrap">Proj</th>
                  <th className="p-1 text-right whitespace-nowrap">Actual</th>
                </tr>
              </thead>
              <tbody>
                {bench.map((p, idx) => (
                  <tr key={p.id || idx} className="border-b border-border/50">
                    <td className="p-1">{p.name}</td>
                    <td className="p-1">
                      <PositionBadge position={p.pos} />
                    </td>
                    <td className="p-1 text-muted">{p.team}</td>
                    <td className="p-1 text-right text-muted font-display">
                      {p.proj != null ? p.proj.toFixed(1) : "-"}
                    </td>
                    <td className="p-1 text-right font-display">
                      {p.actual != null ? p.actual.toFixed(1) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </EndzoneStripe>
  );
});
