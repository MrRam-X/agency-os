"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Plus, Loader2, ClipboardCheck } from "lucide-react";
import { createTask } from "@/actions/task-actions";
import { addNewTaskLocal } from "@/store/slices/boardSlice";
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

interface TeamMember {
  _id: string;
  name: string;
  role: string;
}

interface CreateTaskDialogProps {
  storyId: string;
  sprintId: string;
  teamMembers: TeamMember[];
}

export function CreateTaskDialog({
  storyId,
  sprintId,
  teamMembers,
}: CreateTaskDialogProps) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    estimatedHours: "",
    type: "TASK", // 🟢 Default value matching enum
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createTask(storyId, sprintId, {
        ...formData,
        estimatedHours: Number(formData.estimatedHours) || 0,
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.task) {
        dispatch(addNewTaskLocal(result.task));
        toast.success("Sub-task registered successfully!");
        setFormData({
          title: "",
          description: "",
          assignedTo: "",
          estimatedHours: "",
          type: "TASK",
        });
        setOpen(false);
      }
    } catch (err) {
      toast.error("An unexpected error occurred during task creation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 border border-zinc-200/50 bg-zinc-50/50"
        >
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add Sub-Task</DialogTitle>
          <DialogDescription>
            Create an implementation task and assign it to an employee&apos;s
            workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500">
              Task Title
            </label>
            <Input
              placeholder="e.g. Write integration tests for webhooks"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={loading}
              className="border-zinc-200"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500">
              Description
            </label>
            <textarea
              placeholder="Provide clean steps or reference documentation."
              className="flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* 🟢 Row 1: Assignee and Task Type selectors */}
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
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
              >
                <option value="">-- Select Member --</option>
                {teamMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Task Classification
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                required
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
              >
                <option value="TASK">Task (Feature)</option>
                <option value="BUG">Bug Fix</option>
                <option value="CHANGE_REQUEST">Change Request</option>
              </select>
            </div>
          </div>

          {/* Row 2: Hours Estimation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Estimate (Hours)
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
          </div>

          <DialogFooter className="pt-4">
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
                <>
                  <Plus className="h-4 w-4" /> Create Task
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
