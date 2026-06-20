import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { Sprint } from "@/models/Sprint";
import {
  getManagerAuditLedger,
  getSprintVariance,
  ISprintVarianceItem,
} from "@/actions/ledger-actions"; // 🟢 Added getSprintVariance and interface
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

export default async function LedgerPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { role, orgId } = session.user;

  // Security Routing Gate
  if (role !== "OWNER" && role !== "MANAGER" && role !== "TEAM_LEAD") {
    redirect("/dashboard");
  }

  await connectDB();

  let projectsList: SimpleProject[] = [];
  let sprintsList: SimpleSprint[] = [];
  let timesheetLedger: IAuditLedgerEntry[] = [];
  let initialVariance: ISprintVarianceItem[] = []; // 🟢 Added
  let defaultSprintId = ""; // 🟢 Added

  try {
    // 1. Parallel Fetching: Projects, Sprints, and raw Unbilled timesheets [1]
    const [projects, sprints, ledgerResult] = await Promise.all([
      Project.find({ orgId })
        .select("name blendedRate")
        .sort({ createdAt: -1 })
        .lean(),
      Sprint.find({ orgId })
        .select("name projectId status")
        .sort({ startDate: 1 })
        .lean(),
      getManagerAuditLedger(),
    ]);

    projectsList = JSON.parse(JSON.stringify(projects)) as SimpleProject[];
    sprintsList = JSON.parse(JSON.stringify(sprints)) as SimpleSprint[];
    timesheetLedger = ledgerResult.ledger || [];

    // 🟢 2. Server-side Hydration: Calculate default active sprint and pre-fetch its variance on the server [1]
    const defaultProject = projectsList[0];
    if (defaultProject) {
      const projectSprints = sprintsList.filter(
        (s) => s.projectId === defaultProject._id,
      );
      const activeSprint =
        projectSprints.find((s) => s.status === "ACTIVE") || projectSprints[0];

      if (activeSprint) {
        defaultSprintId = activeSprint._id;
        const res = await getSprintVariance(activeSprint._id);
        initialVariance = res.variance || [];
      }
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

      {/* Render Widescreen Ledger Workspace Wrapper, passing down hydrated initial values */}
      <LedgerWorkspace
        projects={projectsList}
        sprints={sprintsList}
        initialLedger={timesheetLedger}
        initialVariance={initialVariance} // 🟢 Passed!
        initialSprintId={defaultSprintId} // 🟢 Passed!
        userRole={role}
      />
    </div>
  );
}
