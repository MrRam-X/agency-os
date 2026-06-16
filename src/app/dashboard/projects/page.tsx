import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import {
  FolderKanban,
  Users,
  ExternalLink,
  BadgeDollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateProjectForm } from "@/components/dashboard/project-control-forms"; // 🟢 Swapped to clean form
import { ProjectRowActions } from "@/components/dashboard/project-row-actions";

interface SerializedProject {
  _id: string;
  name: string;
  description?: string;
  billingType: "FIXED_PRICE" | "TIME_AND_MATERIALS";
  blendedRate: number;
  status: "ACTIVE" | "COMPLETED";
  members: string[];
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
  let teamMembersList: SerializedMember[] = [];

  try {
    // 🟢 Simplified Parallel Query (No Sprint queries here anymore) [1]
    const [projects, staff] = await Promise.all([
      Project.find({ orgId }).sort({ createdAt: -1 }).lean(),
      User.find({ orgId, role: { $ne: "OWNER" } })
        .select("name role")
        .lean(),
    ]);

    projectsList = JSON.parse(JSON.stringify(projects)) as SerializedProject[];
    teamMembersList = JSON.parse(JSON.stringify(staff)) as SerializedMember[];
  } catch (err) {
    console.error("Projects page parallel fetch error:", err);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          {/* 🟢 Strictly says only "Projects" */}
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Projects
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Manage project members, client contracts, and workspace settings.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* LEFT COLUMN: PROJECT CARDS LISTINGS (60% width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Active Organization Projects
              </CardTitle>
              <CardDescription>
                Overview of active contracts, billing structures, and assigned
                personnel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              {projectsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                  <FolderKanban className="h-10 w-10 text-zinc-300 mb-3" />
                  <p className="text-sm font-semibold">
                    No active projects found
                  </p>
                  {/* 🟢 Escaped apostrophe used */}
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    Use the control panel on the right to register your
                    organization&apos;s first contract.
                  </p>
                </div>
              ) : (
                projectsList.map((project) => {
                  const assignedStaffNames = teamMembersList
                    .filter((member) => project.members.includes(member._id))
                    .map((m) => m.name);

                  return (
                    <div
                      key={project._id}
                      className="border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 space-y-4"
                    >
                      {/* Project Meta Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-100 pb-4">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-zinc-900">
                            {project.name}
                          </h3>
                          <p className="text-xs text-zinc-500">
                            {project.description ||
                              "No project description provided."}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap items-center gap-2 mr-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold uppercase tracking-wider bg-zinc-50 text-zinc-600 border-zinc-200"
                            >
                              {project.billingType.replace("_", " ")}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border-zinc-200"
                            >
                              <span className="flex items-center text-xs">
                                <BadgeDollarSign className="h-3 w-3 text-zinc-400 mr-0.5" />{" "}
                                {project.blendedRate}/hr
                              </span>
                            </Badge>
                          </div>

                          {/* 🟢 Link Icon Control to redirect to Project Details Page */}
                          <Link href={`/dashboard/projects/${project._id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100"
                              title="Open Project Workspace"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>

                          {/* Project CRUD Actions (Edit, Delete) */}
                          <ProjectRowActions
                            project={project}
                            teamMembers={teamMembersList}
                          />
                        </div>
                      </div>

                      {/* Project Personnel */}
                      <div className="flex items-start gap-2 text-xs">
                        <Users className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <span className="font-bold text-zinc-500">
                            Assigned Team:
                          </span>
                          <p className="text-zinc-700 font-semibold leading-relaxed">
                            {assignedStaffNames.length === 0
                              ? "None assigned."
                              : assignedStaffNames.join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: ACTION FORMS (40% width) */}
        <div className="space-y-6">
          <Card className="border-zinc-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Control Panel</CardTitle>
              <CardDescription>
                Provision organization contracts and settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 🟢 Render standalone CreateProjectForm */}
              <CreateProjectForm teamMembers={teamMembersList} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
