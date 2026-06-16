"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FolderOpen, Plus, Loader2, ArrowRight } from "lucide-react";
import { pullStoryIntoSprint } from "@/actions/project-actions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BacklogStory {
  _id: string;
  title: string;
  plannedHours: number;
}

interface SprintBacklogDrawerProps {
  projectId: string;
  sprintId: string;
  backlogStories: BacklogStory[];
  userRole: string;
}

export function SprintBacklogDrawer({
  projectId,
  sprintId,
  backlogStories,
  userRole,
}: SprintBacklogDrawerProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const isManager = userRole === "OWNER" || userRole === "MANAGER";
  if (!isManager) return null;

  const handlePullStory = async (storyId: string) => {
    setLoading(storyId);
    const result = await pullStoryIntoSprint(projectId, storyId, sprintId);
    setLoading(null);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success(
        "Story successfully pulled from backlog and mapped into active board!",
      );
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="border-zinc-200 bg-white text-zinc-700 text-sm flex items-center gap-1.5 shadow-sm"
        >
          <FolderOpen className="h-4 w-4 text-zinc-400" /> Sprint Backlog (
          {backlogStories.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[460px] h-full flex flex-col p-6 bg-white border-l border-zinc-200">
        <SheetHeader className="pb-4 border-b border-zinc-100">
          <SheetTitle className="text-xl font-bold tracking-tight text-zinc-900">
            Project Product Backlog
          </SheetTitle>
          {/* Escaped apostrophes */}
          <SheetDescription className="text-xs">
            These are unassigned User Stories belonging to this project. Pull
            them directly into today&apos;s sprint board on-the-fly [20].
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable backlog stories list */}
        <div className="flex-grow overflow-y-auto py-6 space-y-3">
          {backlogStories.length === 0 ? (
            <p className="text-xs text-zinc-400 italic text-center py-12">
              The product backlog is completely empty.
            </p>
          ) : (
            backlogStories.map((story) => (
              <div
                key={story._id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition duration-150"
              >
                <div className="space-y-1.5 pr-4 min-w-0">
                  <h4 className="text-xs font-bold text-zinc-800 leading-snug truncate max-w-[240px]">
                    {story.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-extrabold uppercase tracking-wider bg-white border-zinc-200 text-zinc-500"
                  >
                    Est: {story.plannedHours} hrs
                  </Badge>
                </div>

                <Button
                  onClick={() => handlePullStory(story._id)}
                  disabled={loading !== null}
                  size="sm"
                  className="bg-zinc-900 text-white hover:bg-zinc-800 text-[10px] font-bold h-8 px-2.5 flex items-center gap-1 shrink-0"
                >
                  {loading === story._id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      Ingest <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
