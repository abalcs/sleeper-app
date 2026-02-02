import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { RankBadge } from "./Icons";

// Animation variants for staggered row entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Playoff cutoff position (top 6 make playoffs)
const PLAYOFF_CUTOFF = 6;

export default function StandingsTable({ rows }) {
  const [sortConfig, setSortConfig] = useState({
    key: "rank",
    direction: "asc",
  });

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  }, []);

  // Memoize sorted rows to avoid recalculating on every render
  const sortedRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    return [...rows].sort((a, b) => {
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
  }, [rows, sortConfig]);

  if (!rows || rows.length === 0) {
    return (
      <div className="text-muted p-4 border rounded-md bg-surface">
        No standings data available.
      </div>
    );
  }

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  // Get row class based on rank
  const getRowClass = (rank) => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-xs sm:text-sm border-collapse table-auto">
        <thead>
          <tr className="text-left border-b border-border bg-surface">
            <th className="p-1 sm:p-2 whitespace-nowrap font-display">RANK</th>
            <th className="p-1 sm:p-2 whitespace-nowrap">Team</th>
            <th className="p-1 sm:p-2 whitespace-nowrap">Manager</th>
            <th className="p-1 sm:p-2 font-display">W</th>
            <th className="p-1 sm:p-2 font-display">L</th>
            <th className="p-1 sm:p-2 font-display">T</th>
            <th
              className="p-1 sm:p-2 cursor-pointer select-none whitespace-nowrap font-display"
              onClick={() => handleSort("winPct")}
            >
              WIN%{renderSortArrow("winPct")}
            </th>
            <th
              className="p-1 sm:p-2 cursor-pointer select-none whitespace-nowrap font-display"
              onClick={() => handleSort("fpts")}
            >
              PF{renderSortArrow("fpts")}
            </th>
            <th
              className="p-1 sm:p-2 cursor-pointer select-none whitespace-nowrap font-display"
              onClick={() => handleSort("fpa")}
            >
              PA{renderSortArrow("fpa")}
            </th>
          </tr>
        </thead>
        <motion.tbody
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sortedRows.map((row, index) => {
            const totalGames = row.wins + row.losses + row.ties;
            const winPct = totalGames > 0 ? (row.wins / totalGames) * 100 : 0;
            const isPlayoffCutoff = row.rank === PLAYOFF_CUTOFF;

            return (
              <motion.tr
                key={row.roster_id}
                variants={rowVariants}
                className={`border-b border-border transition-colors duration-150 ${getRowClass(row.rank)} ${isPlayoffCutoff ? 'playoff-line' : ''}`}
              >
                <td className="p-1 sm:p-2">
                  <RankBadge rank={row.rank} />
                </td>
                <td className="p-1 sm:p-2 font-medium">{row.team_name}</td>
                <td className="p-1 sm:p-2 text-muted">{row.display_name}</td>
                <td className="p-1 sm:p-2 font-display font-semibold text-win">{row.wins}</td>
                <td className="p-1 sm:p-2 font-display font-semibold text-loss">{row.losses}</td>
                <td className="p-1 sm:p-2 font-display">{row.ties}</td>
                <td className="p-1 sm:p-2 font-display font-semibold">{winPct.toFixed(1)}%</td>
                <td className="p-1 sm:p-2 font-display">{row.fpts.toFixed(1)}</td>
                <td className="p-1 sm:p-2 font-display">{row.fpa.toFixed(1)}</td>
              </motion.tr>
            );
          })}
        </motion.tbody>
      </table>
    </div>
  );
}
