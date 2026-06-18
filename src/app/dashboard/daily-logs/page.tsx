import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDailyTaskLogs } from "@/actions/ledger-actions";
import { IDailyLogGroup } from "@/types/ledger";
import {
  Clock,
  CheckCircle,
  Mail,
  Briefcase,
  Calendar,
  FolderGit2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DailyLogFilter } from "@/components/dashboard/daily-log-filter"; // 🟢 Imported Filter

// 🟢 Next.js 15+ standard: Search parameters are asynchronously resolved on server render [19]
interface PageProps {
  searchParams: Promise<{ start?: string; end?: string }>;
}

export default async function DailyLogsPage({ searchParams }: PageProps) {
  // 1. Resolve search params asynchronously [19]
  const { start, end } = await searchParams;

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const { role, email, id: userId } = session.user;

  // 2. Query MongoDB, passing optional start/end filters [1]
  const result = await getDailyTaskLogs(userId, start, end);

  if (result.error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-center p-6 bg-white border border-zinc-200 rounded-xl">
        <p className="text-sm font-semibold text-red-600">
          Error: {result.error}
        </p>
      </div>
    );
  }

  const logs: IDailyLogGroup[] = result.logs || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Daily Task Logs
          </h1>
          {/* Escaped apostrophes */}
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Review your automatically aggregated daily timesheet entries based
            on completed tasks [20].
          </p>
        </div>
      </div>

      {/* 🟢 Render Custom Date Range Filter */}
      <DailyLogFilter />

      {/* Responsive Widescreen Split Grid */}
      <div className="grid gap-8 lg:grid-cols-4 items-start">
        {/* LEFT COLUMN: User Metadata Sidebar Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-zinc-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Personnel Profile
              </CardTitle>
              <CardDescription>
                Active time-tracking parameters for this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-semibold text-zinc-500">
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-100 bg-zinc-50/50">
                <Mail className="h-4 w-4 text-zinc-400" />
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-zinc-400">
                    Email Address
                  </p>
                  <p className="text-zinc-800">{email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-100 bg-zinc-50/50">
                <Briefcase className="h-4 w-4 text-zinc-400" />
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-zinc-400">
                    Organization Role
                  </p>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-extrabold bg-white border-zinc-200 text-zinc-600"
                  >
                    {role.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-zinc-100 bg-zinc-50/50">
                <Clock className="h-4 w-4 text-zinc-400" />
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase text-zinc-400">
                    Timesheet Automation
                  </p>
                  {/* Escaped apostrophes */}
                  <p className="text-emerald-600 leading-normal">
                    Active &bull; Logs are generated when tasks drop to Done
                    [20].
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: The 4-Column Widescreen Table */}
        <div className="lg:col-span-3">
          <Card className="border-zinc-200/80 bg-white shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {start && end
                  ? `Logs: ${start} to ${end}`
                  : "Recent 7 Days Logs"}
              </CardTitle>
              <CardDescription>
                Your chronological timesheet ledger grouped by completion date.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-lg m-6 mt-0">
                  <CheckCircle className="h-10 w-10 text-zinc-300 mb-3" />
                  <p className="text-sm font-semibold">
                    No completed tasks on record
                  </p>
                  {/* Escaped apostrophes */}
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    Your daily logs are empty for this selection period [20].
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50">
                      <TableHead className="w-[140px] pl-6">Date</TableHead>
                      <TableHead>Completed Tasks</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="text-right w-[140px] pr-6">
                        Total Est. Hours
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const dateObj = new Date(log._id + "T00:00:00");
                      const formattedRowDate = dateObj.toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      );

                      return (
                        <TableRow key={log._id}>
                          {/* Column 1: Date */}
                          <TableCell className="font-semibold text-zinc-900 pl-6 text-xs flex items-center gap-1.5 py-4">
                            <Calendar className="h-3.5 w-3.5 text-zinc-400" />{" "}
                            {formattedRowDate}
                          </TableCell>

                          {/* Column 2: Bullet points with Task Type and Project Name */}
                          <TableCell className="py-4">
                            <ul className="space-y-2">
                              {log.tasks.map((task) => (
                                <li
                                  key={task.id}
                                  className="flex items-center gap-2 text-sm text-zinc-800"
                                >
                                  <span
                                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                                      task.type === "BUG"
                                        ? "bg-red-500"
                                        : task.type === "CHANGE_REQUEST"
                                          ? "bg-amber-500"
                                          : "bg-blue-500"
                                    }`}
                                  />
                                  <span className="font-bold text-zinc-400 text-xs">
                                    [{task.id.slice(-6).toUpperCase()}]
                                  </span>
                                  <span className="font-medium text-zinc-700">
                                    {task.title}
                                  </span>

                                  {/* 🟢 Render Parent Project Name badge */}
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-100/60 border border-zinc-200/50 px-2 py-0.5 rounded-full">
                                    <FolderGit2 className="h-3 w-3 text-zinc-400" />{" "}
                                    {task.projectName}
                                  </span>

                                  <Badge
                                    variant="outline"
                                    className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0 border-zinc-200 text-zinc-400 bg-zinc-50 scale-[0.9] origin-left"
                                  >
                                    {task.type.replace("_", " ")}
                                  </Badge>
                                </li>
                              ))}
                            </ul>
                          </TableCell>

                          {/* Column 3: Status */}
                          <TableCell className="py-4">
                            <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-emerald-200/50 rounded-full">
                              Done
                            </Badge>
                          </TableCell>

                          {/* Column 4: Summed Hours */}
                          <TableCell className="text-right font-extrabold text-zinc-900 pr-6 py-4 text-sm">
                            {log.totalEstimatedHours} hrs
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
