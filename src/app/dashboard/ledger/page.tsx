import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { Sprint } from "@/models/Sprint";
import { UserStory } from "@/models/UserStory";
import { User } from "@/models/User";
import {
  getManagerAuditLedger,
  getSprintVariance,
  ISprintVarianceItem,
} from "@/actions/ledger-actions";
import { LedgerWorkspace } from "@/components/dashboard/ledger-workspace";
import { IAuditLedgerEntry } from "@/types/ledger";

interface SimpleProject {
  _id: string;
  name: string;
  blendedRate: number;
}

interface SimpleSprint {
  _id: string;
  projectId: string;
  name: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
}

interface SimpleStory {
  _id: string;
  projectId: string;
  sprintId: string | null;
  title: string;
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
}

// 🟢 Next.js 15+ standard: Search parameters are asynchronously resolved on server render [19]
interface PageProps {
  searchParams: Promise<{
    projectId?: string;
    sprintId?: string;
    stage?: string;
  }>;
}

export default async function LedgerPage({ searchParams }: PageProps) {
  // 1. Resolve search params asynchronously [19]
  const { projectId, sprintId, stage } = await searchParams;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { role, orgId } = session.user;

  // Security Routing Gate [5]
  if (role !== "OWNER" && role !== "MANAGER" && role !== "TEAM_LEAD") {
    redirect("/dashboard");
  }

  await connectDB();

  let projectsList: SimpleProject[] = [];
  let sprintsList: SimpleSprint[] = [];
  let timesheetLedger: IAuditLedgerEntry[] = [];
  let varianceData: ISprintVarianceItem[] = [];
  let teamList: TeamMember[] = [];
  let storiesList: SimpleStory[] = [];

  // Determine active states securely based on URL parameters [15]
  let activeProjectId = projectId || "";
  let activeSprintId = sprintId || "";
  const billingStatus = stage === "BILLED" ? "BILLED" : "UNBILLED";

  try {
    // 2. Fetch Projects, Team, Stories, and Timesheets in parallel [1]
    const [projects, staff, stories, ledgerResult] = await Promise.all([
      Project.find({ orgId })
        .select("name blendedRate")
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ orgId, role: { $ne: "OWNER" } })
        .select("name role")
        .lean(),
      UserStory.find({ orgId }).select("title projectId sprintId").lean(),
      getManagerAuditLedger(billingStatus, activeSprintId), // Fetch exact unbilled/billed timesheets [1]
    ]);

    projectsList = JSON.parse(JSON.stringify(projects)) as SimpleProject[];
    teamList = JSON.parse(JSON.stringify(staff)) as TeamMember[];
    storiesList = JSON.parse(JSON.stringify(stories)) as SimpleStory[];
    timesheetLedger = ledgerResult.ledger || [];

    console.log({timesheetLedger, ledgerResult})

    // 3. Fallback: If no projectId in URL, default to first project [15]
    if (!activeProjectId && projectsList.length > 0) {
      activeProjectId = projectsList[0]._id;
    }

    // 4. Fetch Sprints strictly belonging to the active project [1]
    const sprints = await Sprint.find({ projectId: activeProjectId, orgId })
      .select("name projectId status")
      .sort({ startDate: 1 })
      .lean();
    sprintsList = JSON.parse(JSON.stringify(sprints)) as SimpleSprint[];

    // 5. Fallback: If no sprintId in URL, default to active project sprint [15]
    if (!activeSprintId && sprintsList.length > 0) {
      const activeSprint =
        sprintsList.find((s) => s.status === "ACTIVE") || sprintsList[0];
      if (activeSprint) {
        activeSprintId = activeSprint._id;
      }
    }

    // 6. Server-side Hydration: Fetch story-level budget variance for active sprint [1]
    if (activeSprintId) {
      const res = await getSprintVariance(activeSprintId);
      varianceData = res.variance || [];
    }
  } catch (err) {
    console.error("Ledger page parallel fetch error:", err);
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Sprint Ledger
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Audit contract timesheet margins, review budget variances, and
            manage billing drafts.
          </p>
        </div>
      </div>

      {/* Render Widescreen Ledger Workspace, passing down pre-computed server values */}
      <LedgerWorkspace
        projects={projectsList}
        sprints={sprintsList}
        initialLedger={timesheetLedger}
        initialVariance={varianceData} // 🟢 Pre-fetched on server!
        currentProjectId={activeProjectId} // 🟢 Passed from URL
        currentSprintId={activeSprintId} // 🟢 Passed from URL
        billingFilter={billingStatus} // 🟢 Passed from URL
        userRole={role}
        teamMembers={teamList}
        stories={storiesList}
      />
    </div>
  );
}
