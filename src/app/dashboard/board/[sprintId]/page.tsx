import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Sprint } from "@/models/Sprint";
import { UserStory } from "@/models/UserStory";
import { Task } from "@/models/Task";
import { User } from "@/models/User";
import { KanbanSquare, Calendar, FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// 🟢 Strict Serialized TypeScript Interfaces replacing 'any'
interface SerializedSprint {
  _id: string;
  orgId: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  createdBy: string;
}

interface SerializedUserStory {
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

interface SerializedTask {
  _id: string;
  orgId: string;
  sprintId: string;
  storyId: string;
  assignedTo: string;
  title: string;
  description?: string;
  status: "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  estimatedHours: number;
  createdBy: string;
  completionDate?: string | null;
}

interface PageProps {
  params: Promise<{ sprintId: string }>;
}

export default async function SprintBoardPage({ params }: PageProps) {
  // 1. Fetch parameters asynchronously
  const { sprintId } = await params;

  // 2. Authenticate user session
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { orgId } = session.user;

  // 3. Connect to DB
  await connectDB();

  const activeSprintId = sprintId;

  // Edge Case: Handle the "active" dynamic route parameter safely
  if (sprintId === "active") {
    let currentSprint = await Sprint.findOne({ orgId, status: "ACTIVE" }).lean();
    
    if (!currentSprint) {
      currentSprint = await Sprint.findOne({ orgId }).sort({ createdAt: -1 }).lean();
    }

    if (!currentSprint) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 bg-white border border-zinc-200 rounded-xl">
          <FolderKanban className="h-12 w-12 text-zinc-300 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-zinc-900">No active sprints found</h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm">
            To view the Kanban board, you must first create a Project and launch a Sprint.
          </p>
          <Link href="/dashboard/projects" className="mt-6">
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Go to Projects Control
            </Button>
          </Link>
        </div>
      );
    }

    redirect(`/dashboard/board/${currentSprint._id.toString()}`);
  }

  // 4. Parallel Query: Fetch Sprint Metadata, Stories, Tasks, and Project Members simultaneously [1]
  const [sprint, stories, tasks, team] = await Promise.all([
    Sprint.findById(activeSprintId).lean(),
    UserStory.find({ sprintId: activeSprintId, orgId }).lean(),
    Task.find({ sprintId: activeSprintId, orgId }).lean(),
    User.find({ orgId }).select("name email role").lean(),
  ]);

  if (!sprint) {
    return redirect("/dashboard");
  }

  // Serialize Mongoose ObjectIds to clean primitives for secure client-side hydration [12]
  const serializedSprint = JSON.parse(JSON.stringify(sprint)) as SerializedSprint;
  const serializedStories = JSON.parse(JSON.stringify(stories)) as SerializedUserStory[];
  const serializedTasks = JSON.parse(JSON.stringify(tasks)) as SerializedTask[];

  const formattedDates = `${new Date(serializedSprint.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(serializedSprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="space-y-8">
      
      {/* 5. Sprint Board Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              {serializedSprint.name}
            </h1>
            <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-zinc-50 text-zinc-600 border-zinc-200">
              {serializedSprint.status}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 font-medium mt-1.5 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-zinc-400" /> {formattedDates}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-zinc-200 bg-white text-zinc-700 text-sm">
            Sprint Backlog
          </Button>
        </div>
      </div>

      {/* 6. Read-Only Swimlane Layout Structure */}
      {serializedStories.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center p-6 bg-white border border-zinc-200 rounded-xl">
          <KanbanSquare className="h-10 w-10 text-zinc-300 mb-3" />
          <h3 className="text-base font-bold text-zinc-900">No User Stories assigned to this sprint</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs">
            Managers must add User Stories to this sprint to populate the Kanban columns.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {serializedStories.map((story: SerializedUserStory) => {
            // Find tasks belonging to this User Story (Now completely type-safe)
            const storyTasks = serializedTasks.filter((task) => task.storyId === story._id);

            return (
              <div 
                key={story._id} 
                className="border border-zinc-200 rounded-lg bg-white p-4 shadow-sm space-y-4 hover:border-zinc-300/80 transition"
              >
                {/* Swimlane User Story Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                      {story.title}
                    </h3>
                    <p className="text-xs text-zinc-500">{story.description || "No description provided."}</p>
                  </div>
                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 font-bold border-zinc-200">
                    Budget: {story.plannedHours} hrs
                  </Badge>
                </div>

                {/* 4-Column Kanban Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {["TO_DO", "IN_PROGRESS", "REVIEW", "DONE"].map((colStatus) => {
                    const columnTasks = storyTasks.filter((task) => task.status === colStatus);

                    return (
                      <div 
                        key={colStatus} 
                        className="bg-zinc-50/50 rounded-lg p-3 min-h-[140px] border border-zinc-200/40"
                      >
                        {/* Column Title */}
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
                          {columnTasks.map((task: SerializedTask) => (
                            <Card key={task._id} className="border-zinc-200/80 bg-white p-3 shadow-xs hover:border-zinc-300 transition cursor-grab">
                              <CardTitle className="text-xs font-bold text-zinc-900 leading-normal">
                                {task.title}
                              </CardTitle>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                                <span className="text-[10px] font-semibold text-zinc-400">
                                  Estimate: {task.estimatedHours} hrs
                                </span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}