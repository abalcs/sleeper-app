import { useState } from "react";

export default function StandingsTable({ rows }) {
  const [sortConfig, setSortConfig] = useState({
    key: "rank",
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedRows = [...rows].sort((a, b) => {
    const { key, direction } = sortConfig;
    let valA = a[key];
    let valB = b[key];

    if (key === "winPct") {
      valA = a.wins / (a.wins + a.losses + a.ties || 1);
      valB = b.wins / (b.wins + b.losses + b.ties || 1);
    }

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="text-left border-b border-border">
            <th className="p-1 sm:p-2">Rank</th>
            <th className="p-1 sm:p-2">Team</th>
            <th className="p-1 sm:p-2">Manager</th>
            <th className="p-1 sm:p-2">W</th>
            <th className="p-1 sm:p-2">L</th>
            <th className="p-1 sm:p-2">T</th>
            <th
              className="p-1 sm:p-2 cursor-pointer select-none"
              onClick={() => handleSort("winPct")}
            >
              Win%{renderSortArrow("winPct")}
            </th>
            <th
              className="p-1 sm:p-2 cursor-pointer select-none"
              onClick={() => handleSort("fpts")}
            >
              PF{renderSortArrow("fpts")}
            </th>
            <th
              className="p-1 sm:p-2 cursor-pointer select-none"
              onClick={() => handleSort("fpa")}
            >
              PA{renderSortArrow("fpa")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => {
            const totalGames = row.wins + row.losses + row.ties;
            const winPct =
              totalGames > 0 ? (row.wins / totalGames) * 100 : 0;
            return (
              <tr key={row.roster_id} className="border-b border-border">
                <td className="p-1 sm:p-2">{row.rank}</td>
                <td className="p-1 sm:p-2">{row.team_name}</td>
                <td className="p-1 sm:p-2">{row.display_name}</td>
                <td className="p-1 sm:p-2">{row.wins}</td>
                <td className="p-1 sm:p-2">{row.losses}</td>
                <td className="p-1 sm:p-2">{row.ties}</td>
                <td className="p-1 sm:p-2">{winPct.toFixed(1)}%</td>
                <td className="p-1 sm:p-2">{row.fpts.toFixed(1)}</td>
                <td className="p-1 sm:p-2">{row.fpa.toFixed(1)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
