import { useEffect, useState, Suspense, lazy } from 'react';
import { getNFLState, getStandings, getMatchups, getLeague } from './api';
import { motion } from 'framer-motion';

// Lazy load components
const StandingsTable = lazy(() => import('./components/StandingsTable'));
const Matchups = lazy(() => import('./components/Matchups'));
const WeeklyChallenges = lazy(() => import('./components/WeeklyChallenges'));
const WeeklyRecap = lazy(() => import('./components/WeeklyRecap'));
const PositionTotals = lazy(() => import('./components/PositionTotals'));

const LEAGUE_ID = import.meta.env.VITE_LEAGUE_ID || '';

export default function App() {
  const [week, setWeek] = useState(1);
  const [maxWeek, setMaxWeek] = useState(18);
  const [loading, setLoading] = useState(false);
  const [standings, setStandings] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [leagueName, setLeagueName] = useState('');
  const [view, setView] = useState('dashboard');

  // Load NFL state on mount
  useEffect(() => {
    (async () => {
      try {
        const state = await getNFLState();
        const dw = Number(state?.display_week || state?.week || 1);
        setWeek(Number.isFinite(dw) && dw > 0 ? dw : 1);
        setMaxWeek(18);
      } catch (e) {
        console.error('Failed to load NFL state', e);
      }
    })();
  }, []);

  // Load league name once
  useEffect(() => {
    if (!LEAGUE_ID) return;
    (async () => {
      try {
        const league = await getLeague(LEAGUE_ID);
        setLeagueName(league?.name || 'My Sleeper League');
      } catch (e) {
        console.error('Failed to load league name', e);
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
    <div className="mx-auto max-w-6xl space-y-6 p-2 sm:p-4 md:p-6 bg-background text-text min-h-screen">
      {/* League title */}
      <header className="text-center mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-primary drop-shadow-sm">
          {leagueName}
        </h1>
        <p className="mt-1 text-sm sm:text-base text-muted">
          Sleeper League Dashboard
        </p>
      </header>

      {/* Toggle buttons */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        {["dashboard", "challenges", "recap", "positionTotals"].map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-3 sm:px-4 py-2 rounded-md font-medium transition ${
              view === tab
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:bg-surface/80"
            }`}
          >
            {tab === "dashboard"
              ? "Dashboard"
              : tab === "challenges"
              ? "Weekly Challenges"
              : tab === "recap"
              ? "Weekly Recap"
              : "Position Totals"}
          </button>
        ))}
      </div>

      {/* Week selector */}
      {view !== "positionTotals" && (
        <div className="flex items-center justify-center mb-6">
          <label htmlFor="week-select" className="text-sm text-muted mr-2">
            Week:
          </label>
          <select
            id="week-select"
            className="rounded-md border border-border bg-surface px-2 sm:px-3 py-1 sm:py-2 text-sm text-text focus:ring-2 focus:ring-primary outline-none"
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
          >
            {Array.from({ length: maxWeek }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && <div className="text-muted text-center">Loading…</div>}

      <Suspense fallback={<div className="text-center text-muted">Loading component…</div>}>
        {!loading && view === "dashboard" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <section className="glass p-2 sm:p-4 rounded-xl overflow-x-auto">
              <h2 className="mb-3 text-lg sm:text-xl font-semibold">Standings</h2>
              <StandingsTable rows={standings} />
            </section>

            <section className="glass p-2 sm:p-4 rounded-xl overflow-x-auto">
              <h2 className="mb-3 mt-4 sm:mt-6 text-lg sm:text-xl font-semibold">
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
            <WeeklyChallenges week={week} />
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
            <PositionTotals leagueId={LEAGUE_ID} />
          </motion.div>
        )}
      </Suspense>
    </div>
  );
}
