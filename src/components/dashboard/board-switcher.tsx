"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, CalendarRange, ChevronDown } from "lucide-react";

interface SimpleProject {
  _id: string;
  name: string;
}

interface SimpleSprint {
  _id: string;
  projectId: string;
  name: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
}

interface BoardSwitcherProps {
  currentProjectId: string;
  currentSprintId: string;
  projects: SimpleProject[];
  sprints: SimpleSprint[];
}

export function BoardSwitcher({
  currentProjectId,
  currentSprintId,
  projects,
  sprints,
}: BoardSwitcherProps) {
  const router = useRouter();
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId);
  const [selectedSprintId, setSelectedSprintId] = useState(currentSprintId);

  const filteredSprints = sprints.filter(
    (sprint) => sprint.projectId === selectedProjectId,
  );

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);

    // Find the default active or first sprint of that new project
    const projectSprints = sprints.filter((s) => s.projectId === projId);
    const activeSprint =
      projectSprints.find((s) => s.status === "ACTIVE") || projectSprints[0];

    if (activeSprint) {
      setSelectedSprintId(activeSprint._id);
      router.push(`/dashboard/board/${activeSprint._id}`);
    } else {
      setSelectedSprintId("");
    }
  };

  const handleSprintChange = (sprintId: string) => {
    if (!sprintId) return;
    setSelectedSprintId(sprintId);
    router.push(`/dashboard/board/${sprintId}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-zinc-100/80 p-1.5 rounded-xl border border-zinc-200/60 shadow-sm shrink-0">
      {/* 1. Project Selector */}
      <div className="relative flex items-center">
        <FolderKanban className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
        <select
          value={selectedProjectId}
          onChange={(e) => handleProjectChange(e.target.value)}
          className="h-8 pl-8 pr-8 rounded-lg border border-zinc-200/50 bg-white text-xs font-bold text-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 appearance-none cursor-pointer max-w-[160px]"
        >
          {projects.map((proj) => {
            // 🟢 Calculate if this project has any sprints in the database
            const hasNoSprints =
              sprints.filter((s) => s.projectId === proj._id).length === 0;

            return (
              // 🟢 Set the disabled attribute natively and append an explicit status indicator [25]
              <option key={proj._id} value={proj._id} disabled={hasNoSprints}>
                {proj.name} {hasNoSprints ? " (No Sprints)" : ""}
              </option>
            );
          })}
        </select>
        <ChevronDown className="absolute right-2.5 h-3 w-3 text-zinc-400 pointer-events-none" />
      </div>

      {/* Divider */}
      <span className="h-4 w-px bg-zinc-300"></span>

      {/* 2. Sprint Selector */}
      <div className="relative flex items-center">
        <CalendarRange className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
        <select
          value={selectedSprintId}
          onChange={(e) => handleSprintChange(e.target.value)}
          disabled={filteredSprints.length === 0}
          className="h-8 pl-8 pr-8 rounded-lg border border-zinc-200/50 bg-white text-xs font-bold text-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 appearance-none cursor-pointer max-w-[160px] disabled:opacity-50"
        >
          {filteredSprints.length === 0 ? (
            <option value="">No Sprints</option>
          ) : (
            filteredSprints.map((sprint) => (
              <option key={sprint._id} value={sprint._id}>
                {sprint.name} {sprint.status === "ACTIVE" ? "🟢" : ""}
              </option>
            ))
          )}
        </select>
        <ChevronDown className="absolute right-2.5 h-3 w-3 text-zinc-400 pointer-events-none" />
      </div>
    </div>
  );
}
