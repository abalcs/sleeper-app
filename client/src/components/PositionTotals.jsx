import { useEffect, useState } from "react";

function PositionTotals({ leagueId, position }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchTotals() {
      try {
        const res = await fetch(`/api/league/${leagueId}/position-totals/${position}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ PositionTotals fetch failed:", err);
      }
    }
    if (leagueId && position) {
      fetchTotals();
    }
  }, [leagueId, position]);

  if (!data) return <p>Loading totals...</p>;

  return (
    <div>
      <h3>{data.position} Totals</h3>
      <ul>
        {data.totals.map((t) => (
          <li key={t.roster_id}>
            {t.display_name || t.team_name}: {t.points.toFixed(1)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PositionTotals;
