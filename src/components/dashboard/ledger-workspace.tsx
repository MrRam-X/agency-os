"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Building,
  CreditCard,
  ChevronDown,
  Calendar,
  Loader2,
  Lock,
} from "lucide-react";
import {
  getSprintVariance,
  updateLedgerDate,
  reconcileInvoice,
  ISprintVarianceItem,
} from "@/actions/ledger-actions";
import { IAuditLedgerEntry } from "@/types/ledger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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

interface LedgerWorkspaceProps {
  projects: SimpleProject[];
  sprints: SimpleSprint[];
  initialLedger: IAuditLedgerEntry[];
  initialVariance: ISprintVarianceItem[];
  initialSprintId: string;
  userRole: string;
}

export function LedgerWorkspace({
  projects,
  sprints,
  initialLedger,
  initialVariance,
  initialSprintId,
  userRole,
}: LedgerWorkspaceProps) {
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?._id || "",
  );
  const [selectedSprintId, setSelectedSprintId] = useState(initialSprintId);
  const [varianceData, setVarianceData] =
    useState<ISprintVarianceItem[]>(initialVariance);

  const isManagerOnly = userRole === "OWNER" || userRole === "MANAGER";

  // Filter sprints belonging strictly to the selected project
  const filteredSprints = sprints.filter(
    (sprint) => sprint.projectId === selectedProjectId,
  );

  const fetchVarianceData = async (sprintId: string) => {
    setLoading(true);
    const result = await getSprintVariance(sprintId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success && result.variance) {
      setVarianceData(result.variance);
    }
  };

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);

    const projectSprints = sprints.filter((s) => s.projectId === projId);
    const activeSprint =
      projectSprints.find((s) => s.status === "ACTIVE") || projectSprints[0];

    if (activeSprint) {
      setSelectedSprintId(activeSprint._id);
      fetchVarianceData(activeSprint._id);
    } else {
      setSelectedSprintId("");
      setVarianceData([]);
    }
  };

  const handleSprintChange = (sprintId: string) => {
    setSelectedSprintId(sprintId);
    if (sprintId) {
      fetchVarianceData(sprintId);
    } else {
      setVarianceData([]);
    }
  };

  const handleDateOverride = async (logId: string, newDateStr: string) => {
    setLoading(true);
    const result = await updateLedgerDate(logId, newDateStr);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Timesheet log date overridden successfully!");
    }
  };

  // 🟢 Reconcile Action Trigger: Submits all unbilled ledger IDs on screen to the state lock server action [4]
  const handleReconcile = async () => {
    setLoading(true);
    const logIds = initialLedger.map((item) => item._id);
    const result = await reconcileInvoice(logIds);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      // strictly using escaped apostrophes [20]
      toast.success(
        "Invoice reconciled! Today&apos;s timesheet logs have been locked.",
      );
    }
  };

  // Calculate unbilled invoice totals based on developer billable rates
  const pendingInvoiceTotal = initialLedger.reduce(
    (sum, item) => sum + item.hoursLogged * 100,
    0,
  );

  return (
    <div className="space-y-8">
      {/* 1. Selector Swidescreen Panel */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Selected Project
          </label>
          <div className="relative flex items-center">
            <Building className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="h-9 pl-8 pr-8 rounded-lg border border-zinc-200 bg-white text-xs font-bold text-zinc-700 focus-visible:outline-none appearance-none cursor-pointer max-w-[200px]"
            >
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 h-3 w-3 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        <span className="h-8 w-px bg-zinc-200 self-end mb-1"></span>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Selected Sprint
          </label>
          <div className="relative flex items-center">
            <Calendar className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <select
              value={selectedSprintId}
              onChange={(e) => handleSprintChange(e.target.value)}
              disabled={filteredSprints.length === 0}
              className="h-9 pl-8 pr-8 rounded-lg border border-zinc-200 bg-white text-xs font-bold text-zinc-700 focus-visible:outline-none appearance-none cursor-pointer max-w-[200px] disabled:opacity-50"
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
      </div>

      {/* 2. Split Widescreen Columns */}
      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* LEFT COLUMN: BUDGET VARIANCE TABLE */}
        <div className="lg:col-span-2">
          <Card className="border-zinc-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                Sprint Budget Variance
              </CardTitle>
              {/* Escaped apostrophes */}
              <CardDescription>
                Auditing stories allocated to this sprint to protect the
                agency&apos;s bottom line [20].
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-xs font-semibold">
                    Running budget aggregations...
                  </p>
                </div>
              ) : varianceData.length === 0 ? (
                <p className="text-xs text-zinc-400 italic text-center py-12 font-medium">
                  No active story budgets under this selection.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50">
                      <TableHead className="pl-6">User Story Title</TableHead>
                      <TableHead className="w-[120px] text-right">
                        Planned (Budget)
                      </TableHead>
                      <TableHead className="w-[120px] text-right">
                        Actual Worked
                      </TableHead>
                      <TableHead className="w-[120px] text-right">
                        Variance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {varianceData.map((item) => {
                      const isOverBudget = item.variance < 0;

                      return (
                        <TableRow key={item._id}>
                          <TableCell className="font-semibold text-zinc-900 pl-6 text-xs">
                            {item.title}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.plannedHours} hrs
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.actualHours} hrs
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              className={
                                isOverBudget
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-zinc-50 text-zinc-700 border-zinc-200"
                              }
                            >
                              {item.variance > 0
                                ? `+${item.variance}`
                                : item.variance}{" "}
                              hrs
                            </Badge>
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

        {/* RIGHT COLUMN: TIMESHEET AUDIT LOG & BILLING */}
        <div className="space-y-6">
          {/* Pending Invoice Summary Card */}
          <Card className="border-zinc-200 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Unbilled Draft Invoice
              </CardTitle>
              <CreditCard className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-zinc-900">
                $
                {pendingInvoiceTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 font-medium leading-relaxed">
                {/* Escaped apostrophes */}
                Automated invoice total calculated from all unbilled developer
                timesheets [20].
              </p>

              {/* 🟢 Approve & Lock Invoice CTA Button (Only shown if unbilled timesheets exist) */}
              {initialLedger.length > 0 && isManagerOnly && (
                <Button
                  onClick={handleReconcile}
                  disabled={loading}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition text-xs font-bold h-9 shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Approve &amp; Lock Invoice{" "}
                      <Lock className="h-3.5 w-3.5" />{" "}
                      {/* 🟢 Escaped ampersand */}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timesheet Audit List */}
          <Card className="border-zinc-200 bg-white shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Unbilled Timesheet Logs
              </CardTitle>
              <CardDescription>
                Audit developer timesheets. Only Managers can adjust historical
                date stamps [4].
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {initialLedger.length === 0 ? (
                <p className="text-xs text-zinc-400 italic text-center py-12 font-medium">
                  All logged timesheets have been reconciled.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-zinc-50">
                      <TableHead className="pl-4">Developer</TableHead>
                      <TableHead>Logged</TableHead>
                      <TableHead className="text-right pr-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialLedger.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-semibold text-zinc-900 pl-4 text-xs">
                          <p
                            className="truncate max-w-[100px]"
                            title={item.devName}
                          >
                            {item.devName}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          <div>{item.hoursLogged} hrs</div>
                          <div className="text-[10px] text-zinc-400">
                            {item.date}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          {/* SECURE DATE OVERRIDE POP_OVER */}
                          {isManagerOnly ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 border border-zinc-200 text-[10px] font-bold"
                                >
                                  Override
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[180px] p-2 bg-white border border-zinc-200 rounded-lg shadow-md">
                                <label className="text-[9px] font-extrabold uppercase text-zinc-400 pl-1">
                                  Set Log Date
                                </label>
                                <Input
                                  type="date"
                                  max={new Date().toISOString().split("T")[0]}
                                  onChange={(e) =>
                                    handleDateOverride(item._id, e.target.value)
                                  }
                                  className="h-8 text-xs mt-1 border-zinc-200"
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold bg-zinc-50 text-zinc-400 border-zinc-200"
                            >
                              Locked
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
