"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { initializeBoard, BoardTask, TaskType } from "@/store/slices/boardSlice";
import { toast } from "sonner";
import {
  User,
  Edit3,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { updateTask, deleteTask } from "@/actions/task-actions";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { CreateTaskDialog } from "@/components/dashboard/create-task-dialog";
import { StoryEstimationBar } from "@/components/dashboard/story-estimation-bar";

export interface SerializedUserStory {
  _id: string;
  orgId: string;
  projectId: string;
  sprintId: string;
  title: string;
  description?: string;
  plannedHours: number;
  status: "BACKLOG" | "CONFIRMED" | "COMPLETED";
  createdBy: string;
  completionDate?: string | null;
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
}

interface KanbanBoardProps {
  initialTasks: BoardTask[];
  stories: SerializedUserStory[];
  sprintId: string;
  team: TeamMember[];
}

export function KanbanBoard({
  initialTasks,
  stories,
  sprintId,
  team,
}: KanbanBoardProps) {
  const dispatch = useDispatch();

  // 🟢 Read dynamic, real-time tasks from our Redux Store
  const currentTasks = useSelector(
    (state: RootState) => state.board.currentTasks,
  );

  // Hydrate Redux Store with Server-side data on mount and on server revalidations [2]
  useEffect(() => {
    dispatch(initializeBoard(initialTasks));
  }, [initialTasks, dispatch]);

  return (
    <div className="space-y-6">
      {stories.map((story) => {
        // Filter tasks belonging to this User Story from the hydrated Redux store
        const storyTasks = currentTasks.filter(
          (task) => task.storyId === story._id,
        );

        return (
          <div
            key={story._id}
            className="border border-zinc-200 rounded-lg bg-white p-4 shadow-sm space-y-4 hover:border-zinc-300/80 transition"
          >
            {/* Swimlane User Story Header */}
            <div className="flex flex-col gap-3 border-b border-zinc-100 pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                    {story.title}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {story.description || "No description provided."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-zinc-100 text-zinc-600 font-bold border-zinc-200 h-7 px-2.5 text-xs"
                  >
                    Budget: {story.plannedHours} hrs
                  </Badge>

                  {/* Create Task Dialog */}
                  <CreateTaskDialog
                    storyId={story._id}
                    sprintId={sprintId}
                    teamMembers={team}
                  />
                </div>
              </div>

              {/* Real-Time Estimation Progress Bar */}
              <StoryEstimationBar
                storyId={story._id}
                plannedHours={story.plannedHours}
              />
            </div>

            {/* 4-Column Kanban Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {["TO_DO", "IN_PROGRESS", "REVIEW", "DONE"].map((colStatus) => {
                const columnTasks = storyTasks.filter(
                  (task) => task.status === colStatus,
                );

                return (
                  <div
                    key={colStatus}
                    className="bg-zinc-50/50 rounded-lg p-3 min-h-[140px] border border-zinc-200/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                        {colStatus.replace("_", " ")}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Task Cards Stack */}
                    <div className="space-y-2">
                      {columnTasks.map((task) => {
                        const assigneeName =
                          team.find((t) => t._id === task.assignedTo)?.name ||
                          "Unassigned";

                        return (
                          <Card
                            key={task._id}
                            className="border-zinc-200/80 bg-white p-3 shadow-xs hover:border-zinc-300 transition relative overflow-hidden"
                          >
                            {/* Color indicator for Task Type with defensive optional chaining */}
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1 ${
                                (task?.type || "") === "BUG"
                                  ? "bg-red-500"
                                  : (task?.type || "") === "CHANGE_REQUEST"
                                    ? "bg-amber-500"
                                    : "bg-blue-500"
                              }`}
                            />

                            <div className="flex items-start justify-between gap-1.5 pl-1.5">
                              <CardTitle className="text-xs font-bold text-zinc-900 leading-normal">
                                {task.title}
                              </CardTitle>

                              {/* 🟢 Interactive Task Actions (Edit & Delete) */}
                              <TaskCardActions
                                task={task}
                                teamMembers={team}
                                sprintId={sprintId}
                              />
                            </div>

                            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-zinc-100 pl-1.5 text-[10px] font-semibold text-zinc-400">
                              {/* 🟢 Assigned Name Display (Resolves Glitch #1) */}
                              <div className="flex items-center gap-1 text-zinc-500">
                                <User className="h-3 w-3 text-zinc-400" />{" "}
                                Assigned:{" "}
                                <span className="font-bold text-zinc-700">
                                  {assigneeName}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <Badge
                                  variant="outline"
                                  className="text-[8px] font-bold uppercase tracking-wider px-1 py-0 border-zinc-200 text-zinc-400 bg-zinc-50"
                                >
                                  {(task?.type || "").replace("_", " ")}
                                </Badge>
                                <span>Est: {task.estimatedHours} hrs</span>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- 🟢 INNER COMPONENT: TASK CARD ACTIONS (EDIT/DELETE) ---
interface TaskCardActionsProps {
  task: BoardTask;
  teamMembers: TeamMember[];
  sprintId: string;
}

function TaskCardActions({
  task,
  teamMembers,
  sprintId,
}: TaskCardActionsProps) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    assignedTo: task.assignedTo,
    estimatedHours: String(task.estimatedHours),
    type: task.type || "TASK",
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateTask(sprintId, task._id, {
      ...formData,
      estimatedHours: Number(formData.estimatedHours) || 0,
    });

    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Task details modified successfully.");
      setEditOpen(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setLoading(true);
    const result = await deleteTask(sprintId, task._id);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Task deleted and unbilled hours purged.");
      setDeleteOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {/* TASK EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-zinc-400 hover:text-zinc-950"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Task Details</DialogTitle>
            <DialogDescription>
              Modify active sub-task requirements and estimates.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Task Title
              </label>
              <Input
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Description
              </label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={loading}
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
                  {teamMembers.map((member) => (
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
                  Estimate (Hours)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="16"
                  required
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedHours: e.target.value })
                  }
                  disabled={loading}
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
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* TASK DELETE DIALOG */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-zinc-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">Delete Sub-Task?</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Are you absolutely sure? This will delete the task and instantly
              purge any unbilled time logs associated with it in the Ledger
              [21].
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
