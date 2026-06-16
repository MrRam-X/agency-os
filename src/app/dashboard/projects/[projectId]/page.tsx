import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { Sprint } from "@/models/Sprint";
import { UserStory } from "@/models/UserStory";
import { User } from "@/models/User";
import { ProjectDetailsWorkspace } from "@/components/dashboard/project-details-workspace";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailsPage({ params }: PageProps) {
  // 1. Resolve dynamic path parameters asynchronously (Next.js 15+ standard) [19]
  const { projectId } = await params;

  // 2. Fetch secure server session
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { role, orgId } = session.user;

  // 🛡️ Security Gate: Only Managers, Leads, and Owners can access the planning workspace [5]
  if (role !== "OWNER" && role !== "MANAGER" && role !== "TEAM_LEAD") {
    redirect("/dashboard");
  }

  await connectDB();

  // 3. Parallel Query: Fetch all nested resources simultaneously [1]
  const [project, sprints, stories, team] = await Promise.all([
    Project.findById(projectId).lean(),
    Sprint.find({ projectId }).sort({ startDate: 1 }).lean(),
    UserStory.find({ projectId }).sort({ createdAt: -1 }).lean(),
    User.find({ orgId }).select("name role").lean(),
  ]);

  if (!project) {
    redirect("/dashboard/projects");
  }

  // 4. Serialize data cleanly for hydrated client rendering [12]
  const serializedProject = JSON.parse(JSON.stringify(project));
  const serializedSprints = JSON.parse(JSON.stringify(sprints));
  const serializedStories = JSON.parse(JSON.stringify(stories));
  const serializedTeam = JSON.parse(JSON.stringify(team));

  return (
    <ProjectDetailsWorkspace
      project={serializedProject}
      team={serializedTeam}
      stories={serializedStories}
      sprints={serializedSprints}
    />
  );
}
