import React, { useEffect, useState } from "react";

// Base URL: localhost:4000 in dev, relative in prod
const API_BASE = import.meta.env.DEV ? "http://localhost:4000" : "";

function PositionTotals({ leagueId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState("QB");

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [recommendations, setRecommendations] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  // Fetch position totals
  useEffect(() => {
    async function fetchTotals() {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/api/league/${leagueId}/position-totals/${position}`
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ PositionTotals fetch failed:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    if (leagueId && position) fetchTotals();
  }, [leagueId, position]);

  // Fetch teams for dropdown
  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch(`${API_BASE}/api/league/${leagueId}/standings`);
        const json = await res.json();
        setTeams(json);
      } catch (err) {
        console.error("❌ Failed to fetch teams:", err);
      }
    }
    if (leagueId) fetchTeams();
  }, [leagueId]);

  // Fetch trade recommendations
  async function fetchRecommendations(rosterId) {
    setRecLoading(true);
    setRecommendations(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/league/${leagueId}/trade-recommendations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rosterId }),
        }
      );
      const json = await res.json();
      console.log("✅ Trade Recommendations Response:", json);
      setRecommendations(json);
    } catch (err) {
      console.error("❌ Failed to fetch recommendations:", err);
      setRecommendations({ recommendations: "Error fetching recommendations" });
    } finally {
      setRecLoading(false);
    }
  }

  return (
    <div className="glass p-4 rounded-xl space-y-6">
      {/* Position dropdown */}
      <div className="flex justify-center">
        <label htmlFor="pos-select" className="text-sm text-muted mr-2">
          Position:
        </label>
        <select
          id="pos-select"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        >
          {["QB", "RB", "WR", "TE", "K", "DEF"].map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      {/* Totals list */}
      {loading && (
        <div className="text-center text-muted">Loading {position} totals…</div>
      )}
      {!loading && (!data || !data.totals?.length) && (
        <div className="text-center text-muted">
          No totals available for {position}.
        </div>
      )}
      {!loading && data?.totals?.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-primary mb-4">
            {data.position} Totals
          </h2>
          <ul className="divide-y divide-border">
            {data.totals.map((t, idx) => (
              <li
                key={t.roster_id}
                className="flex justify-between py-2 px-1 hover:bg-surface/40 rounded-md"
              >
                <span className="font-medium">
                  {idx + 1}. {t.display_name || t.team_name}
                </span>
                <span className="text-muted">{t.points.toFixed(1)} pts</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Team dropdown */}
      <div className="mt-6 flex justify-center">
        <label htmlFor="team-select" className="text-sm text-muted mr-2">
          Your Team:
        </label>
        <select
          id="team-select"
          value={selectedTeam}
          onChange={(e) => {
            const rosterId = e.target.value;
            setSelectedTeam(rosterId);
            if (rosterId) fetchRecommendations(rosterId);
          }}
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
        >
          <option value="">-- Choose Team --</option>
          {teams.map((t) => (
            <option key={t.roster_id} value={t.roster_id}>
              {t.display_name || t.team_name}
            </option>
          ))}
        </select>
      </div>

      {/* Recommendations */}
      {recLoading && (
        <div className="text-center text-muted">
          Fetching trade recommendations…
        </div>
      )}
      {!recLoading && recommendations && (
        <div className="bg-surface rounded-lg p-4">
          <h3 className="font-semibold text-primary mb-2">Suggestions</h3>
          <p className="whitespace-pre-line text-sm text-text">
            {recommendations.recommendations ||
              "No recommendations available. Try another team."}
          </p>

          {/* Free Agents */}
          {recommendations.freeAgents && recommendations.freeAgents.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-primary mb-1">
                Top Free Agents
              </h4>
              <ul className="list-disc list-inside text-sm text-muted">
                {recommendations.freeAgents.map((fa, idx) => (
                  <li key={idx}>
                    {fa.full_name} ({fa.position}, {fa.team || "FA"})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PositionTotals;
