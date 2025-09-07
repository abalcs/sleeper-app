import { useEffect, useState } from "react";

export default function WeeklyRecap({ leagueId, week }) {
  const [style, setStyle] = useState("empirical");
  const [recap, setRecap] = useState("");
  const [loading, setLoading] = useState(false);

  // Load existing recap on mount/week change
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `/api/league/${leagueId}/recap/${week}`
        );
        const data = await r.json();
        if (data.recap) {
          setRecap(data.recap);
          if (data.style) setStyle(data.style);
        }
      } catch (e) {
        console.error("Failed to fetch recap", e);
      }
    })();
  }, [leagueId, week]);

  const generateRecap = async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/league/${leagueId}/recap/${week}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style, force: true }),
        }
      );
      const data = await r.json();
      setRecap(data.recap);
    } catch (e) {
      console.error("Failed to generate recap", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 rounded-xl space-y-4">
      <h2 className="text-2xl font-bold text-primary">Week {week} Recap</h2>

      <div className="flex gap-3 items-center">
        <label className="text-sm">Style:</label>
        <input
          type="text"
          className="rounded-md border px-3 py-2 text-sm bg-surface text-text"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="funny, sarcastic, empirical..."
        />
        <button
          onClick={generateRecap}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-md"
        >
          {loading ? "Generating..." : "Generate Recap"}
        </button>
      </div>

      {recap && (
        <div className="whitespace-pre-line text-text bg-surface p-4 rounded-md">
          {recap}
        </div>
      )}
    </div>
  );
}
