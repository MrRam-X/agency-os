"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Edit3, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  deleteProject,
  deleteSprint,
  updateProject,
  updateSprint,
} from "@/actions/project-actions";
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

// --- PROJECT ACTIONS ---
interface Member {
  _id: string;
  name: string;
  role: string;
}

interface ProjectActionsProps {
  project: {
    _id: string;
    name: string;
    description?: string;
    billingType: "FIXED_PRICE" | "TIME_AND_MATERIALS";
    blendedRate: number;
    members: string[];
  };
  teamMembers: Member[];
}

export function ProjectRowActions({
  project,
  teamMembers,
}: ProjectActionsProps) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
    billingType: project.billingType,
    blendedRate: String(project.blendedRate),
    members: project.members,
  });

  const handleMemberCheck = (memberId: string) => {
    setFormData((prev) => {
      const isAssigned = prev.members.includes(memberId);
      return {
        ...prev,
        members: isAssigned
          ? prev.members.filter((id) => id !== memberId)
          : [...prev.members, memberId],
      };
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateProject(project._id, {
      ...formData,
      blendedRate: Number(formData.blendedRate) || 0,
    });

    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Project settings updated successfully!");
      setEditOpen(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setLoading(true);
    const result = await deleteProject(project._id);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Project and all nested operational streams deleted.");
      setDeleteOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* 🟢 EDIT DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-950"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Project Settings</DialogTitle>
            <DialogDescription>
              Modify active billing parameters and employee allocations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Project Name
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
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Description
              </label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
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
                  Billing Contract Type
                </label>
                <select
                  value={formData.billingType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingType: e.target.value as
                        | "FIXED_PRICE"
                        | "TIME_AND_MATERIALS",
                    })
                  } // 🟢 Strictly Typed!                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                >
                  <option value="TIME_AND_MATERIALS">Time & Materials</option>
                  <option value="FIXED_PRICE">Fixed Price</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500">
                  Blended Rate ($/hr)
                </label>
                <Input
                  type="number"
                  required
                  value={formData.blendedRate}
                  onChange={(e) =>
                    setFormData({ ...formData, blendedRate: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Assigned Team Members
              </label>
              <div className="border border-zinc-200 rounded-lg max-h-[120px] overflow-y-auto p-3 bg-zinc-50/50 space-y-2">
                {teamMembers.map((member) => (
                  <label
                    key={member._id}
                    className="flex items-center gap-2 cursor-pointer text-sm font-medium text-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={formData.members.includes(member._id)}
                      onChange={() => handleMemberCheck(member._id)}
                      disabled={loading}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5"
                    />
                    <span>{member.name}</span>
                  </label>
                ))}
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

      {/* 🟢 DELETE DIALOG */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">
              Are you absolutely sure?
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              This action cannot be undone. Deleting this project will trigger a{" "}
              <strong>cascading deletion</strong> that wipes out all nested
              sprints, stories, tasks, and timesheet logs linked to it [21].
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={loading}
            >
              No, Keep Project
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
                "Yes, Delete Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SPRINT ACTIONS ---
interface SprintActionsProps {
  sprint: {
    _id: string;
    projectId: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export function SprintRowActions({ sprint }: SprintActionsProps) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    projectId: sprint.projectId,
    name: sprint.name,
    startDate: sprint.startDate.split("T")[0],
    endDate: sprint.endDate.split("T")[0],
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateSprint(sprint._id, formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Sprint timelines adjusted successfully!");
      setEditOpen(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setLoading(true);
    const result = await deleteSprint(sprint._id);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Sprint and all nested task/ledger lists deleted.");
      setDeleteOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* 🟢 EDIT SPRINT */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-950"
          >
            <Edit3 className="h-3.5 w-3.5" />
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
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
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
                  "Save Timelines"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🟢 DELETE SPRINT */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">
              Are you absolutely sure?
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Deleting this sprint will delete all associated user stories,
              tasks, and timesheet billing records linked to it [21].
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
                "Delete Sprint"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
