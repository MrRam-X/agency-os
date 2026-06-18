"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Filter, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DailyLogFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Read current parameters from URL to populate default inputs
  const [start, setStart] = useState(searchParams.get("start") || "");
  const [end, setEnd] = useState(searchParams.get("end") || "");

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!start || !end) return;

    setLoading(true);
    // 🟢 Update URL Search Parameters to trigger Next.js Server-side aggregation re-fetch [1, 15]
    router.push(`/dashboard/daily-logs?start=${start}&end=${end}`);
    setTimeout(() => setLoading(false), 800); // UI visual transition delay
  };

  const handleReset = () => {
    setLoading(true);
    setStart("");
    setEnd("");
    router.push("/dashboard/daily-logs");
    setTimeout(() => setLoading(false), 800);
  };

  // Get current date string formatted as YYYY-MM-DD to disable future calendar clicks
  const todayInputString = new Date().toISOString().split("T")[0];

  return (
    <form
      onSubmit={handleFilterSubmit}
      className="flex flex-wrap items-end gap-4 p-4 rounded-xl border border-zinc-200 bg-white shadow-sm"
    >
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
          <Calendar className="h-3 w-3" /> Start Date
        </label>
        <Input
          type="date"
          required
          max={todayInputString} // 🟢 RESTRICTION: Disable future dates
          value={start}
          onChange={(e) => setStart(e.target.value)}
          disabled={loading}
          className="border-zinc-200 h-9 w-[160px] text-xs font-semibold"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
          <Calendar className="h-3 w-3" /> End Date
        </label>
        <Input
          type="date"
          required
          max={todayInputString} // 🟢 RESTRICTION: Disable future dates
          min={start || undefined} // 🟢 RESTRICTION: Disable dates before selected start date
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          disabled={loading || !start}
          className="border-zinc-200 h-9 w-[160px] text-xs font-semibold"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={loading || !start || !end}
          size="sm"
          className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold h-9 px-4 flex items-center gap-1.5 shadow"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Filter className="h-3.5 w-3.5" /> Filter Log
            </>
          )}
        </Button>

        {(searchParams.get("start") || searchParams.get("end")) && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading}
            size="sm"
            className="border-zinc-200 text-zinc-500 hover:text-zinc-950 text-xs font-bold h-9 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </Button>
        )}
      </div>
    </form>
  );
}
