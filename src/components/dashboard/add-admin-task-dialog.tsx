"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Calendar } from "lucide-react";
import { createAdministrativeTaskAndLog } from "@/actions/ledger-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskStatus, TaskType } from "@/store/slices/boardSlice";

interface SimpleProject {
  _id: string;
  name: string;
}

interface SimpleSprint {
  _id: string;
  projectId: string;
  name: string;
}

interface SimpleStory {
  _id: string;
  projectId: string;
  sprintId: string | null;
  title: string;
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
}

interface AddAdminTaskDialogProps {
  projects: SimpleProject[];
  sprints: SimpleSprint[];
  teamMembers: TeamMember[];
  stories: SimpleStory[];
}

export function AddAdminTaskDialog({
  projects,
  sprints,
  teamMembers,
  stories,
}: AddAdminTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selections, setSelections] = useState({
    projectId: "",
    sprintId: "",
    storyId: "",
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    estimatedHours: "",
    type: "TASK" as "TASK" | "BUG" | "CHANGE_REQUEST",
    status: "TO_DO" as "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE",
    completionDate: "",
  });

  // Filter lists based on selections
  const filteredSprints = sprints.filter(
    (s) => s.projectId === selections.projectId,
  );
  const filteredStories = stories.filter(
    (s) => s.sprintId === selections.sprintId,
  );
  const filteredTeam = teamMembers; // All team members of the org can be assigned

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selections.projectId || !selections.sprintId || !selections.storyId) {
      toast.error("Please select a Project, Sprint, and parent User Story.");
      return;
    }

    setLoading(true);
    const result = await createAdministrativeTaskAndLog(
      selections.projectId,
      selections.sprintId,
      selections.storyId,
      {
        ...formData,
        completionDate:
          formData.status === "DONE" ? formData.completionDate : null,
      },
    );
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      // strictly using escaped apostrophes [20]
      toast.success(
        "Administrative task and corresponding timesheet registered successfully!",
      );
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        estimatedHours: "",
        type: "TASK",
        status: "TO_DO",
        completionDate: "",
      });
      setSelections({ projectId: "", sprintId: "", storyId: "" });
      setOpen(false);
    }
  };

  const todayInputString = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold h-9 px-4 flex items-center gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" /> Admin: Log Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Admin: Provision Task &amp; Logs</DialogTitle>{" "}
          {/* 🟢 Escaped ampersand */}
          <DialogDescription>
            Directly create, assign, and back-date completed tasks on behalf of
            employees [20].
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Cascade Selectors */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400">
                Project
              </label>
              <select
                value={selections.projectId}
                onChange={(e) =>
                  setSelections({
                    projectId: e.target.value,
                    sprintId: "",
                    storyId: "",
                  })
                }
                required
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs"
              >
                <option value="">Select...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400">
                Sprint
              </label>
              <select
                value={selections.sprintId}
                onChange={(e) =>
                  setSelections({
                    ...selections,
                    sprintId: e.target.value,
                    storyId: "",
                  })
                }
                required
                disabled={!selections.projectId}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs disabled:opacity-50"
              >
                <option value="">Select...</option>
                {filteredSprints.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-400">
                User Story
              </label>
              <select
                value={selections.storyId}
                onChange={(e) =>
                  setSelections({ ...selections, storyId: e.target.value })
                }
                required
                disabled={!selections.sprintId}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs disabled:opacity-50"
              >
                <option value="">Select...</option>
                {filteredStories.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1 border-t border-zinc-100 pt-3">
            <label className="text-xs font-semibold text-zinc-500">
              Task Title
            </label>
            <Input
              placeholder="e.g. Completed initial database schema migrations"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={loading}
              className="border-zinc-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Assign To
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
                required
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">-- Choose Member --</option>
                {filteredTeam.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Classification
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as TaskType })
                }
                required
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <option value="TASK">Task (Feature)</option>
                <option value="BUG">Bug Fix</option>
                <option value="CHANGE_REQUEST">Change Request</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Hours spent / Estimate
              </label>
              <Input
                type="number"
                min="1"
                max="16"
                required
                placeholder="4"
                value={formData.estimatedHours}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedHours: e.target.value })
                }
                disabled={loading}
                className="border-zinc-200 h-10"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Current Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as TaskStatus })
                }
                required
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <option value="TO_DO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">In Review</option>
                <option value="DONE">Done (Generates Timesheet Log)</option>
              </select>
            </div>
          </div>

          {/* Manually Selectable Date Picker (Only enabled if status is set to DONE) */}
          {formData.status === "DONE" && (
            <div className="space-y-1 p-3 bg-zinc-50 border border-zinc-200 rounded-lg animate-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-400" /> Completion Date
                (Back-Date Log)
              </label>
              <Input
                type="date"
                required
                max={todayInputString} // 🟢 RESTRICTION: No future dates allowed
                value={formData.completionDate}
                onChange={(e) =>
                  setFormData({ ...formData, completionDate: e.target.value })
                }
                disabled={loading}
                className="mt-1.5 border-zinc-200 h-9 text-xs"
              />
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
                "Commit Administrative Log"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
