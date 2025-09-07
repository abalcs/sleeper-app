import { useEffect, useState } from "react";

export default function PositionTotals({ leagueId }) {
  const [position, setPosition] = useState("QB");
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [recLoading, setRecLoading] = useState(false);

  const fetchTotals = async (pos) => {
    setLoading(true);
    try {
      const r = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/league/${leagueId}/position-totals/${pos}`
      );
      const data = await r.json();
      setTotals(data.totals || []);
    } catch (e) {
      console.error("Failed to fetch position totals", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotals(position);
  }, [position]);

  const fetchRecommendations = async () => {
    if (!selectedTeam) return;
    setRecLoading(true);
    try {
      const r = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/league/${leagueId}/trade-recommendations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rosterId: selectedTeam }),
        }
      );
      const data = await r.json();
      setRecommendations(data.recommendations || "No recommendations available.");
    } catch (e) {
      console.error("Failed to fetch recommendations", e);
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="glass p-6 rounded-xl space-y-6">
      <h2 className="text-2xl font-bold text-primary">
        Season Totals by Position
      </h2>

      <div className="flex gap-3 items-center">
        <label className="text-sm">Select Position:</label>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm bg-surface text-text"
        >
          {["QB", "RB", "WR", "TE", "K", "DEF"].map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="text-muted">Loading…</div>}

      {!loading && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="p-2">Rank</th>
              <th className="p-2">Team</th>
              <th className="p-2">Manager</th>
              <th className="p-2 text-right">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((t, i) => (
              <tr key={t.roster_id} className="border-b border-border">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{t.team_name}</td>
                <td className="p-2">{t.display_name}</td>
                <td className="p-2 text-right">
                  {t.points.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Trade Recommendation Section */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Trade Recommendations</h3>
        <div className="flex gap-3 items-center">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm bg-surface text-text"
          >
            <option value="">Select a team</option>
            {totals.map((t) => (
              <option key={t.roster_id} value={t.roster_id}>
                {t.display_name} ({t.team_name})
              </option>
            ))}
          </select>
          <button
            onClick={fetchRecommendations}
            disabled={!selectedTeam || recLoading}
            className="bg-primary text-white px-4 py-2 rounded-md"
          >
            {recLoading ? "Loading…" : "Get Recommendations"}
          </button>
        </div>

        {recommendations && (
            <div className="bg-surface p-4 rounded-md whitespace-pre-line">
              {recommendations}
            </div>
          )}          
      </div>
    </div>
  );
}
