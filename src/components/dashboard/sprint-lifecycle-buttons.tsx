"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Play, CheckCircle, Loader2 } from "lucide-react";
import { startSprint, completeSprint } from "@/actions/project-actions";
import { Button } from "@/components/ui/button";

interface SprintLifecycleButtonsProps {
  projectId: string;
  sprintId: string;
  sprintStatus: "PLANNING" | "ACTIVE" | "COMPLETED";
  userRole: string;
}

export function SprintLifecycleButtons({
  projectId,
  sprintId,
  sprintStatus,
  userRole,
}: SprintLifecycleButtonsProps) {
  const [loading, setLoading] = useState(false);

  // Security check: Only Manager or Owner can trigger lifecycle changes
  const isManager = userRole === "OWNER" || userRole === "MANAGER";
  if (!isManager || sprintStatus === "COMPLETED") return null;

  const handleStart = async () => {
    setLoading(true);
    const result = await startSprint(projectId, sprintId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Sprint initialized! The board is now ACTIVE.");
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    const result = await completeSprint(projectId, sprintId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      // 🟢 Strictly using escaped apostrophe &apos; per your instruction
      toast.success(
        "Sprint closed! Spill-over stories have been returned to the project&apos;s backlog.",
      );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {sprintStatus === "PLANNING" && (
        <Button
          onClick={handleStart}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 flex items-center gap-2 shadow-sm transition"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Play className="h-3.5 w-3.5" /> Start Sprint
            </>
          )}
        </Button>
      )}

      {sprintStatus === "ACTIVE" && (
        <Button
          onClick={handleComplete}
          disabled={loading}
          className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold h-9 px-4 flex items-center gap-2 shadow-sm transition"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" /> Complete Sprint
            </>
          )}
        </Button>
      )}
    </div>
  );
}
