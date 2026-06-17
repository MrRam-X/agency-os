"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Edit3, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { updateUserStory, deleteUserStory } from "@/actions/project-actions";
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

interface StoryRowActionsProps {
  projectId: string;
  sprintId?: string | null; // 🟢 Optional: Used to trigger board revalidation
  story: {
    _id: string;
    title: string;
    description?: string;
    plannedHours: number;
  };
}

export function StoryRowActions({
  projectId,
  sprintId = null,
  story,
}: StoryRowActionsProps) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: story.title,
    description: story.description || "",
    plannedHours: String(story.plannedHours),
  });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateUserStory(
      projectId,
      story._id,
      formData,
      sprintId,
    );
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("User Story modified successfully.");
      setEditOpen(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setLoading(true);
    const result = await deleteUserStory(projectId, story._id, sprintId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      // 🟢 Escaped apostrophe used [20]
      toast.success("Story and associated development tasks deleted.");
      setDeleteOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* STORY EDIT DIALOG */}
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
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit User Story</DialogTitle>
            <DialogDescription>
              Adjust backlog specifications and hours.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Story Title
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
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500">
                Planned Hours
              </label>
              <Input
                type="number"
                min="1"
                required
                value={formData.plannedHours}
                onChange={(e) =>
                  setFormData({ ...formData, plannedHours: e.target.value })
                }
                disabled={loading}
              />
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
                  "Save Story"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* STORY DELETE DIALOG */}
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center">
              Are you absolutely sure?
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Deleting this story will delete all nested development tasks and
              ledger timesheet entries [21].
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
                "Delete Story"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
