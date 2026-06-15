import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { Sprint } from "@/models/Sprint";
import { User } from "@/models/User";
import { FolderKanban, Calendar, Users, ExternalLink, BadgeDollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectControlForms } from "@/components/dashboard/project-control-forms";
import { ProjectRowActions, SprintRowActions } from "@/components/dashboard/project-row-actions"; // 🟢 Import CRUD triggers

interface SerializedProject {
  _id: string;
  name: string;
  description?: string;
  billingType: "FIXED_PRICE" | "TIME_AND_MATERIALS";
  blendedRate: number;
  status: "ACTIVE" | "COMPLETED";
  members: string[];
}

interface SerializedSprint {
  _id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
}

interface SerializedMember {
  _id: string;
  name: string;
  role: string;
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { role, orgId } = session.user;

  if (role !== "OWNER" && role !== "MANAGER" && role !== "TEAM_LEAD") {
    redirect("/dashboard");
  }

  await connectDB();

  let projectsList: SerializedProject[] = [];
  let sprintsList: SerializedSprint[] = [];
  let teamMembersList: SerializedMember[] = [];

  try {
    const [projects, sprints, staff] = await Promise.all([
      Project.find({ orgId }).sort({ createdAt: -1 }).lean(),
      Sprint.find({ orgId }).sort({ startDate: 1 }).lean(),
      User.find({ orgId, role: { $ne: "OWNER" } }).select("name role").lean(),
    ]);

    projectsList = JSON.parse(JSON.stringify(projects)) as SerializedProject[];
    sprintsList = JSON.parse(JSON.stringify(sprints)) as SerializedSprint[];
    teamMembersList = JSON.parse(JSON.stringify(staff)) as SerializedMember[];
  } catch (err) {
    console.error("Projects page parallel fetch error:", err);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Projects & Sprints</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">Manage project members, sprint timelines, and release cycles.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* LEFT COLUMN: LISTS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Active Organization Projects</CardTitle>
              <CardDescription>Chronological overview of active contracts, timelines, and personnel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
              {projectsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                  <FolderKanban className="h-10 w-10 text-zinc-300 mb-3" />
                  <p className="text-sm font-semibold">No active projects found</p>
                  {/* 🟢 Strictly using escaped apostrophe &apos; per your instruction */}
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">Use the control panel on the right to register your organization&apos;s first contract.</p>
                </div>
              ) : (
                projectsList.map((project) => {
                  const projectSprints = sprintsList.filter((sprint) => sprint.projectId === project._id);
                  const assignedStaffNames = teamMembersList
                    .filter((member) => project.members.includes(member._id))
                    .map((m) => m.name);

                  return (
                    <div key={project._id} className="border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 space-y-4">
                      {/* Project Meta Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-100 pb-4">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-zinc-900">{project.name}</h3>
                          <p className="text-xs text-zinc-500">{project.description || "No project description provided."}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-zinc-50 text-zinc-600 border-zinc-200">
                              {project.billingType.replace("_", " ")}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border-zinc-200">
                              <span className="flex items-center text-xs">
                                <BadgeDollarSign className="h-3 w-3 text-zinc-400 mr-0.5" /> {project.blendedRate}/hr
                              </span>
                            </Badge>
                          </div>
                          
                          {/* 🟢 Project CRUD Actions Component */}
                          <ProjectRowActions project={project} teamMembers={teamMembersList} />
                        </div>
                      </div>

                      {/* Project Personnel */}
                      <div className="flex items-start gap-2 text-xs">
                        <Users className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <span className="font-bold text-zinc-500">Assigned Team:</span>
                          <p className="text-zinc-700 font-semibold leading-relaxed">
                            {assignedStaffNames.length === 0 ? "None assigned." : assignedStaffNames.join(", ")}
                          </p>
                        </div>
                      </div>

                      {/* Nested Chronological Sprints */}
                      <div className="pt-2">
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Associated Sprints</div>
                        {projectSprints.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic">No sprints scheduled under this project.</p>
                        ) : (
                          <div className="space-y-2">
                            {projectSprints.map((sprint) => {
                              const sprintDates = `${new Date(sprint.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(sprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

                              return (
                                <div key={sprint._id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition">
                                  <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-zinc-400" />
                                    <div>
                                      <h4 className="text-xs font-bold text-zinc-800">{sprint.name}</h4>
                                      <p className="text-[10px] text-zinc-500 mt-0.5">{sprintDates}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider bg-white text-zinc-500 border-zinc-200">
                                      {sprint.status}
                                    </Badge>
                                    
                                    {/* 🟢 Sprint CRUD Actions */}
                                    <SprintRowActions sprint={sprint} />

                                    <Link href={`/dashboard/board/${sprint._id}`}>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-950" title="Open Kanban Board">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: ACTION FORMS */}
        <div className="space-y-6">
          <Card className="border-zinc-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Control Panel</CardTitle>
              <CardDescription>Provision projects and map sprint timelines.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectControlForms 
                teamMembers={teamMembersList} 
                projects={projectsList.map((p) => ({ _id: p._id, name: p.name }))} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}