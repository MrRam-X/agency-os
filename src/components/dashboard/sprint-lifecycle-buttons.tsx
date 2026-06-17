"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Play, CheckCircle, Loader2, Edit3 } from "lucide-react";
import {
  startSprint,
  completeSprint,
  updateSprint,
} from "@/actions/project-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SprintLifecycleButtonsProps {
  projectId: string;
  sprintId: string;
  sprintStatus: "PLANNING" | "ACTIVE" | "COMPLETED";
  sprintName: string;
  startDate: string;
  endDate: string;
  userRole: string;
}

export function SprintLifecycleButtons({
  projectId,
  sprintId,
  sprintStatus,
  sprintName,
  startDate,
  endDate,
  userRole,
}: SprintLifecycleButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: sprintName,
    startDate: startDate.split("T")[0],
    endDate: endDate.split("T")[0],
  });

  const isManager = userRole === "OWNER" || userRole === "MANAGER";
  if (!isManager) return null;

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
      // Escaped apostrophe used [20]
      toast.success(
        "Sprint closed! Spill-over stories have been returned to the project&apos;s backlog.",
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛡️ Date Validations [13]
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      toast.error("Validation Error: Start Date cannot be set in the past.");
      return;
    }

    if (end <= start) {
      toast.error(
        "Validation Error: End Date must be set chronologically after the Start Date.",
      );
      return;
    }

    setLoading(true);
    const result = await updateSprint(projectId, sprintId, formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Sprint timelines modified successfully!");
      setEditOpen(false);
    }
  };

  const todayInputString = new Date().toISOString().split("T")[0];

  return (
    <div className="flex items-center gap-2">
      {/* 🟢 EDIT SPRINT BUTTON & DIALOG */}
      {sprintStatus !== "COMPLETED" && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100"
              title="Edit Sprint"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Edit Sprint Timelines</DialogTitle>
              <DialogDescription>
                Modify active delivery milestones and dates.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500">
                  Sprint Name
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    required
                    min={todayInputString} // 🟢 RESTRICTION: Disable past dates [13]
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                        endDate: "",
                      })
                    }
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">
                    End Date
                  </label>
                  <Input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    disabled={loading || !formData.startDate} // 🟢 RESTRICTION: Disable until Start Date is selected [13]
                    min={
                      formData.startDate
                        ? new Date(
                            new Date(formData.startDate).getTime() + 86400000,
                          )
                            .toISOString()
                            .split("T")[0]
                        : undefined
                    } // 🟢 Enforce end > start [13]
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-zinc-900 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Timelines"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* START SPRINT */}
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

      {/* COMPLETE SPRINT */}
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
