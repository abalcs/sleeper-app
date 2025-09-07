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
    <div className="glass rounded-xl p-4 sm:p-6 shadow-md space-y-6">
      {/* Position dropdown */}
      <div className="flex justify-center items-center gap-2">
        <label htmlFor="pos-select" className="text-sm text-muted">
          Position:
        </label>
        <select
          id="pos-select"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
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
        <div className="text-center text-muted">
          Loading {position} totals…
        </div>
      )}
      {!loading && (!data || !data.totals?.length) && (
        <div className="text-center text-muted">
          No totals available for {position}.
        </div>
      )}
      {!loading && data?.totals?.length > 0 && (
        <>
          <h2 className="text-lg sm:text-xl font-semibold text-primary mb-3">
            {data.position} Totals
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {data.totals.map((t, idx) => (
              <li
                key={t.roster_id}
                className="flex justify-between items-center px-3 py-2 hover:bg-surface/50 transition"
              >
                <span className="font-medium">
                  {idx + 1}. {t.display_name || t.team_name}
                </span>
                <span className="text-sm font-semibold text-accent">
                  {t.points.toFixed(1)} pts
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Team dropdown */}
      <div className="flex justify-center items-center gap-2">
        <label htmlFor="team-select" className="text-sm text-muted">
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
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
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
          Fetching recommendations…
        </div>
      )}
      {!recLoading && recommendations && (
        <div className="bg-surface rounded-lg p-4 border border-border shadow-inner space-y-6">
          {/* Trade Recommendations */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-accent mb-3 flex items-center gap-2">
              🔄 Trade Recommendations
            </h3>
            {recommendations.recommendations ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {recommendations.recommendations
                  .split("\n")
                  .filter((line) => line.trim() !== "")
                  .map((line, idx) => (
                    <div
                      key={idx}
                      className="bg-background border border-border rounded-md p-3 text-sm text-text leading-snug shadow-sm"
                    >
                      {line}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted">No trade recommendations available.</p>
            )}
          </div>

          {/* Free Agent Recommendations */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-primary mb-3 flex items-center gap-2">
              🆓 Free Agent Recommendations
            </h3>
            {recommendations.freeAgents &&
            recommendations.freeAgents.length > 0 ? (
              <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted">
                {recommendations.freeAgents.map((fa, idx) => (
                  <li
                    key={idx}
                    className="bg-background border border-border rounded-md px-3 py-2 shadow-sm"
                  >
                    <span className="font-medium text-text">
                      {fa.full_name}
                    </span>{" "}
                    <span className="text-xs">
                      ({fa.position}, {fa.team || "FA"})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No free agent recommendations.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionTotals;
