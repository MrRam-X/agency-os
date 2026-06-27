import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Project } from "@/models/Project";
import { 
  Users, 
  FolderKanban, 
  Clock, 
  ArrowUpRight, 
  Activity, 
  UserCheck, 
  Bot 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaffManagement, SerializedEmployee } from "@/components/dashboard/staff-management"; // 🟢 Imported staff workspace wrapper

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { id: userId, role, orgId, name } = session.user;

  await connectDB();
  
  let employeeCount = 0;
  let projectCount = 0;
  let employees: SerializedEmployee[] = []; // 🟢 Changed type to SerializedEmployee[]

  try {
    if (role === "OWNER") {
      const [empCount, projCount, staffList] = await Promise.all([
        User.countDocuments({ orgId }),
        Project.countDocuments({ orgId }),
        User.find({ orgId, role: { $ne: "OWNER" } }).sort({ createdAt: -1 }).lean(),
      ]);
      employeeCount = empCount;
      projectCount = projCount;
      
      // 🟢 Cast the serialized output directly to SerializedEmployee[]
      employees = JSON.parse(JSON.stringify(staffList)) as SerializedEmployee[];
    }
  } catch (err) {
    console.error("Dashboard metrics fetch error:", err);
  }

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Welcome back, {name}
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            {formattedDate} &bull; Workspace Panel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-zinc-100 border-zinc-200 text-zinc-700">
            Role: {role.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* ==========================================
          ROLE: OWNER (ADMIN & EMPLOYEE WORKSPACE)
          ========================================== */}
      {role === "OWNER" && (
        <div className="space-y-8">
          {/* Admin KPI Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Total Organization Employees
                </CardTitle>
                <Users className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900">{employeeCount}</div>
                <p className="text-xs text-zinc-500 mt-1">Active registered staff members</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Active Projects
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900">{projectCount}</div>
                <p className="text-xs text-zinc-500 mt-1">Assigned client contracts</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Global Billing Base
                </CardTitle>
                <Activity className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900">SaaS</div>
                <p className="text-xs text-zinc-500 mt-1">Multi-tenant environment active</p>
              </CardContent>
            </Card>
          </div>

          {/* 🟢 Render Unified Client Staff Management Workspace */}
          <StaffManagement initialEmployees={employees} />
        </div>
      )}

      {/* ==========================================
          ROLE: EXECUTIVES (MANAGER, TEAM_LEAD)
          ========================================== */}
      {(role === "MANAGER" || role === "TEAM_LEAD") && (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Sprint Planning Control
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900">Active</div>
                <p className="text-xs text-zinc-500 mt-1">Manage boards and assign user stories</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Sprint Ledger & Invoicing
                </CardTitle>
                <Clock className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900">Billing</div>
                <p className="text-xs text-zinc-500 mt-1">Variance tracking and timesheet overrides</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Team Operations
                </CardTitle>
                <Users className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900">Connected</div>
                <p className="text-xs text-zinc-500 mt-1">Review active staff performance logs</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Quick Navigation</CardTitle>
                <CardDescription>Direct shortcuts to your primary administrative panels.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/dashboard/projects" className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-700">Project & Sprint Controller</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
                <Link href="/dashboard/ledger" className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-700">Sprint Ledger & Profit Variance</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==========================================
          ROLE: STAFF (DEVELOPER, TESTER)
          ========================================== */}
      {(role === "DEVELOPER" || role === "TESTER") && (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Active Sprint Tasks
                </CardTitle>
                <FolderKanban className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900">Sprints</div>
                <p className="text-xs text-zinc-500 mt-1">Navigate to your assigned task board</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Automated Daily Log
                </CardTitle>
                <Clock className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900">Auto</div>
                <p className="text-xs text-zinc-500 mt-1">Review aggregated task completion logs</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  My Portfolio
                </CardTitle>
                <UserCheck className="h-4 w-4 text-zinc-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900">Dossier</div>
                <p className="text-xs text-zinc-500 mt-1">Generate AI Standups and view metrics</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-zinc-200/80 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Sprint Shortcuts</CardTitle>
                <CardDescription>Direct navigation to your assigned execution workspaces.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/dashboard/board/active" className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                  <div className="flex items-center gap-3">
                    <FolderKanban className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-700">Active Kanban Task Board</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
                <Link href="/dashboard/daily-logs" className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span className="text-sm font-semibold text-zinc-700">My Daily Task Logs</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
                <Link href={`/dashboard/profile/${userId}`} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all">
                  <div className="flex items-center gap-3">
                    <Bot className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-700">AI Standup Generator & Dossier</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}