import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { Sprint } from "@/models/Sprint";
import { UserStory } from "@/models/UserStory";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { Calendar, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SprintLifecycleButtons } from "@/components/dashboard/sprint-lifecycle-buttons";
import { SprintBacklogDrawer } from "@/components/dashboard/sprint-backlog-drawer";
import {
  KanbanBoard,
  SerializedUserStory,
} from "@/components/dashboard/kanban-board";
import { BoardSwitcher } from "@/components/dashboard/board-switcher"; // 🟢 Imported

interface SerializedSprint {
  _id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  createdBy: string;
}

interface SerializedTask {
  _id: string;
  orgId: string;
  sprintId: string;
  storyId: string;
  assignedTo: string;
  title: string;
  description?: string;
  status: "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  type: "BUG" | "TASK" | "CHANGE_REQUEST";
  estimatedHours: number;
  createdBy: string;
  completionDate?: string | null;
}

interface SerializedProjectHeader {
  name: string;
  members: string[];
}

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

interface PageProps {
  params: Promise<{ sprintId: string }>;
}

export default async function SprintBoardPage({ params }: PageProps) {
  const { sprintId } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { orgId, role, id: userId } = session.user;

  await connectDB();

  const activeSprintId = sprintId;

  // 🟢 Security & Scope Routing Check: Fetch projects the user actually has access to [1, 5]
  const projectAccessQuery =
    role === "OWNER" || role === "MANAGER"
      ? { orgId } // Managers and Owners can access all projects
      : { orgId, members: userId }; // Developers/Testers only access assigned projects

  const allowedProjects = await Project.find(projectAccessQuery)
    .select("name")
    .lean();
  const allowedProjectIds = allowedProjects.map((p) => p._id.toString());

  // Edge Case: Handle the "active" dynamic route parameter safely
  if (sprintId === "active") {
    // Attempt to locate an active sprint belonging to their allowed projects [1]
    let currentSprint = await Sprint.findOne({
      projectId: { $in: allowedProjectIds },
      status: "ACTIVE",
    }).lean();

    if (!currentSprint) {
      currentSprint = await Sprint.findOne({
        projectId: { $in: allowedProjectIds },
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!currentSprint) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 bg-white border border-zinc-200 rounded-xl">
          <FolderKanban className="h-12 w-12 text-zinc-300 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-zinc-900">
            No active sprints found
          </h2>
          {/* Escaped apostrophes */}
          <p className="text-sm text-zinc-500 mt-2 max-w-sm">
            To view the Kanban board, you must first belong to an active Project
            and launch a Sprint [20].
          </p>
        </div>
      );
    }

    redirect(`/dashboard/board/${currentSprint._id.toString()}`);
  }

  // 1. Fetch Sprint Metadata
  const sprint = await Sprint.findById(activeSprintId).lean();
  if (!sprint) {
    return redirect("/dashboard");
  }

  // 2. Fetch Project Metadata
  const project = (await Project.findById(sprint.projectId)
    .select("name members")
    .lean()) as SerializedProjectHeader | null;
  const projectMemberIds = project ? project.members : [];

  // 3. Parallel Query: Fetch stories, tasks, assigned members, project backlog, and ALL allowed sprints [1]
  const [stories, tasks, team, unassignedStories, allowedSprints] =
    await Promise.all([
      UserStory.find({ sprintId: activeSprintId, orgId }).lean(),
      Task.find({ sprintId: activeSprintId, orgId }).lean(),
      User.find({ _id: { $in: projectMemberIds } })
        .select("name email role")
        .lean(),
      UserStory.find({
        projectId: sprint.projectId,
        sprintId: null,
        status: "BACKLOG",
        orgId,
      }).lean(),
      Sprint.find({ projectId: { $in: allowedProjectIds } })
        .select("name projectId status")
        .sort({ startDate: 1 })
        .lean(), // 🟢 Fetch all sprints
    ]);

  // Serialize Mongoose ObjectIds [12]
  const serializedSprint = JSON.parse(
    JSON.stringify(sprint),
  ) as SerializedSprint;
  const serializedStories = JSON.parse(
    JSON.stringify(stories),
  ) as SerializedUserStory[];
  const serializedTasks = JSON.parse(JSON.stringify(tasks)) as SerializedTask[];
  const serializedTeam = JSON.parse(JSON.stringify(team));
  const serializedBacklog = JSON.parse(JSON.stringify(unassignedStories));
  const serializedProjectsList = JSON.parse(
    JSON.stringify(allowedProjects),
  ) as SimpleProject[];
  const serializedSprintsList = JSON.parse(
    JSON.stringify(allowedSprints),
  ) as SimpleSprint[];

  const formattedDates = `${new Date(serializedSprint.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(serializedSprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="space-y-8">
      {/* Sprint Board Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
            {project?.name || "Project Workspace"}
          </span>
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 leading-none">
              {serializedSprint.name}
            </h1>
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-zinc-50 text-zinc-600 border-zinc-200"
            >
              {serializedSprint.status}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 font-medium mt-2 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-zinc-400" /> {formattedDates}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* 🟢 Render Widescreen Board Switcher in the Top Right header */}
          <BoardSwitcher
            currentProjectId={serializedSprint.projectId}
            currentSprintId={serializedSprint._id}
            projects={serializedProjectsList}
            sprints={serializedSprintsList}
          />

          <div className="flex items-center gap-3">
            <SprintLifecycleButtons
              projectId={serializedSprint.projectId}
              sprintId={serializedSprint._id}
              sprintStatus={serializedSprint.status}
              sprintName={serializedSprint.name}
              startDate={serializedSprint.startDate}
              endDate={serializedSprint.endDate}
              userRole={session.user.role}
            />

            <SprintBacklogDrawer
              projectId={serializedSprint.projectId}
              sprintId={serializedSprint._id}
              backlogStories={serializedBacklog}
              userRole={session.user.role}
            />
          </div>
        </div>
      </div>

      {/* Render Dynamic, Redux-Linked Kanban Board */}
      <KanbanBoard
        initialTasks={serializedTasks}
        stories={serializedStories}
        sprintId={serializedSprint._id}
        team={serializedTeam}
      />
    </div>
  );
}
