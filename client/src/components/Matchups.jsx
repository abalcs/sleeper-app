import { useState } from "react";

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
        <div
          key={matchupId}
          className="glass rounded-xl p-2 sm:p-4 space-y-4 shadow-md"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <TeamCard key={team.roster_id} team={team} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamCard({ team }) {
  const [showBench, setShowBench] = useState(false);

  const starterIds = new Set(team.starters.map((p) => p.id));
  const bench = team.players.filter((p) => !starterIds.has(p.id));

  return (
    <div className="bg-surface rounded-lg p-2 sm:p-4">
      <h3 className="text-base sm:text-lg font-semibold mb-2">
        <span className="text-primary font-bold">
          {team.display_name || team.team_name || "Unknown"}
        </span>{" "}
        —{" "}
        <span className="text-accent font-bold">
          {team.points.toFixed(1)} pts
        </span>
      </h3>

      {/* Starters */}
      <div className="overflow-x-auto">
        <h4 className="font-medium mb-1">Starters</h4>
        <table className="w-full text-xs sm:text-sm mb-2">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="p-1">Player</th>
              <th className="p-1">Pos</th>
              <th className="p-1">Team</th>
              <th className="p-1 text-right">Proj</th>
              <th className="p-1 text-right">Actual</th>
            </tr>
          </thead>
          <tbody>
            {team.starters.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="p-1">{p.name}</td>
                <td className="p-1">{p.pos}</td>
                <td className="p-1">{p.team}</td>
                <td className="p-1 text-right">
                  {p.proj != null ? p.proj.toFixed(1) : "-"}
                </td>
                <td className="p-1 text-right">
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
            ? "bg-primary text-white hover:bg-primary/90"
            : "bg-surface text-primary border border-border hover:bg-surface/80"
        }`}
      >
        {showBench ? "Hide Bench" : "Show Bench"}
      </button>

      {showBench && (
        <div className="overflow-x-auto">
          <h4 className="font-medium mb-1">Bench</h4>
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="p-1">Player</th>
                <th className="p-1">Pos</th>
                <th className="p-1">Team</th>
                <th className="p-1 text-right">Proj</th>
                <th className="p-1 text-right">Actual</th>
              </tr>
            </thead>
            <tbody>
              {bench.map((p) => (
                <tr key={p.id} className="border-b border-border">
                  <td className="p-1">{p.name}</td>
                  <td className="p-1">{p.pos}</td>
                  <td className="p-1">{p.team}</td>
                  <td className="p-1 text-right">
                    {p.proj != null ? p.proj.toFixed(1) : "-"}
                  </td>
                  <td className="p-1 text-right">
                    {p.actual != null ? p.actual.toFixed(1) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
