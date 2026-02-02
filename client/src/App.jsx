import { useEffect, useState, Suspense, lazy, useCallback } from "react";
import { getNFLState, getStandings, getMatchups, getLeague } from "./api";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner, DashboardSkeleton, CardSkeleton } from "./components/Skeleton";
import { FieldBackground } from "./components/FieldBackground";
import { FootballIcon, Users, Trophy, Calendar, BarChart3 } from "./components/Icons";

// Lazy load components
const StandingsTable = lazy(() => import("./components/StandingsTable"));
const Matchups = lazy(() => import("./components/Matchups"));
const WeeklyChallenges = lazy(() => import("./components/WeeklyChallenges"));
const WeeklyRecap = lazy(() => import("./components/WeeklyRecap"));
const PositionTotals = lazy(() => import("./components/PositionTotals"));

const LEAGUE_ID = import.meta.env.VITE_LEAGUE_ID || '';

// Tab configuration with icons
const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Users },
  { id: "challenges", label: "Weekly Challenges", icon: Trophy },
  { id: "recap", label: "Weekly Recap", icon: Calendar },
  { id: "positionTotals", label: "Position Totals", icon: BarChart3 },
];

export default function App() {
  const [week, setWeek] = useState(1);
  const [maxWeek, setMaxWeek] = useState(18);
  const [loading, setLoading] = useState(false);
  const [standings, setStandings] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [leagueName, setLeagueName] = useState("");
  const [view, setView] = useState("dashboard");

  // Memoized handlers
  const handleWeekChange = useCallback((e) => {
    setWeek(Number(e.target.value));
  }, []);

  const handleViewChange = useCallback((tab) => {
    setView(tab);
  }, []);

  // Load NFL state on mount
  useEffect(() => {
    (async () => {
      try {
        const state = await getNFLState();
        const dw = Number(state?.display_week || state?.week || 1);
        setWeek(Number.isFinite(dw) && dw > 0 ? dw : 1);
        setMaxWeek(18);
      } catch (e) {
        console.error("Failed to load NFL state", e);
      }
    })();
  }, []);

  // Load league name once
  useEffect(() => {
    if (!LEAGUE_ID) return;
    (async () => {
      try {
        const league = await getLeague(LEAGUE_ID);
        setLeagueName(league?.name || "My Sleeper League");
      } catch (e) {
        console.error("Failed to load league name", e);
      }
    })();
  }, []);

  // Load standings + matchups when week changes
  useEffect(() => {
    if (!LEAGUE_ID) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [s, m] = await Promise.all([
          getStandings(LEAGUE_ID),
          getMatchups(LEAGUE_ID, week),
        ]);
        setStandings(s);
        setMatchups(m);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [week]);

  return (
    <FieldBackground className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-6xl space-y-6 p-2 sm:p-4 md:p-6">
        {/* League title with football icons */}
        <header className="text-center mb-4 sm:mb-6">
          <h1 className="flex items-center justify-center gap-3 text-2xl sm:text-3xl md:text-4xl scoreboard-header text-primary drop-shadow-sm">
            <FootballIcon className="w-8 h-8 sm:w-10 sm:h-10 text-field-light" />
            <span>{leagueName}</span>
            <FootballIcon className="w-8 h-8 sm:w-10 sm:h-10 text-field-light" />
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted">
            Fantasy Football Dashboard
          </p>
        </header>

        {/* Toggle buttons with icons and animated indicator */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleViewChange(tab.id)}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md font-medium transition-colors ${
                  view === tab.id
                    ? "text-white"
                    : "bg-surface text-muted hover:bg-surface/80 hover:text-text"
                }`}
              >
                {view === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-field rounded-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className="relative z-10 w-4 h-4" />
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                <span className="relative z-10 sm:hidden">
                  {tab.id === "dashboard" ? "Home" :
                   tab.id === "challenges" ? "Challenges" :
                   tab.id === "recap" ? "Recap" : "Stats"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Week selector */}
        {view !== "positionTotals" && (
          <div className="flex items-center justify-center mb-6">
            <label htmlFor="week-select" className="text-sm text-muted mr-2 font-display">
              WEEK:
            </label>
            <select
              id="week-select"
              className="rounded-md border border-border bg-surface px-2 sm:px-3 py-1 sm:py-2 text-sm text-text focus:ring-2 focus:ring-primary outline-none font-display"
              value={week}
              onChange={handleWeekChange}
            >
              {Array.from({ length: maxWeek }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-muted text-sm">Loading data...</span>
          </div>
        )}

        <Suspense fallback={<DashboardSkeleton />}>
          {!loading && view === "dashboard" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <section className="stadium-card p-2 sm:p-4 overflow-x-auto">
                <h2 className="mb-3 text-lg sm:text-xl font-display font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gold" />
                  Standings
                </h2>
                <StandingsTable rows={standings} />
              </section>

              <section className="stadium-card p-2 sm:p-4 overflow-x-auto">
                <h2 className="mb-3 mt-4 sm:mt-6 text-lg sm:text-xl font-display font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Weekly Matchups — Week {week}
                </h2>
                <Matchups items={matchups} />
              </section>
            </motion.div>
          )}

          {!loading && view === "challenges" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <WeeklyChallenges leagueId={LEAGUE_ID} week={week} />
            </motion.div>
          )}

          {!loading && view === "recap" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <WeeklyRecap leagueId={LEAGUE_ID} week={week} />
            </motion.div>
          )}

          {!loading && view === "positionTotals" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <PositionTotals leagueId={LEAGUE_ID} position="QB" />
            </motion.div>
          )}
        </Suspense>
      </div>
    </FieldBackground>
  );
}
