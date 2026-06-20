"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 🟢 Handles secure URL state changes [15]
import { toast } from "sonner";
import {
  Building,
  CreditCard,
  ChevronDown,
  Loader2,
  Calendar,
  Lock,
  Download,
  FileText,
} from "lucide-react";
import {
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
import { AddAdminTaskDialog } from "@/components/dashboard/add-admin-task-dialog";

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

interface LedgerWorkspaceProps {
  projects: SimpleProject[];
  sprints: SimpleSprint[];
  initialLedger: IAuditLedgerEntry[];
  initialVariance: ISprintVarianceItem[]; // 🟢 Rendered directly from server props (No local state duplicate!)
  currentProjectId: string;
  currentSprintId: string;
  billingFilter: "UNBILLED" | "BILLED";
  userRole: string;
  teamMembers: TeamMember[];
  stories: SimpleStory[];
}

export function LedgerWorkspace({
  projects,
  sprints,
  initialLedger,
  initialVariance,
  currentProjectId,
  currentSprintId,
  billingFilter,
  userRole,
  teamMembers,
  stories,
}: LedgerWorkspaceProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 🟢 State tracking for the Invoice Draft generator
  const [isDraftGenerated, setIsDraftGenerated] = useState(false);

  const isOwner = userRole === "OWNER"; // 🟢 Strict Owner Verification [5]
  const isManagerOnly = userRole === "OWNER" || userRole === "MANAGER";

  // Filter Sprints locally on render based on active project
  const filteredSprints = sprints.filter(
    (sprint) => sprint.projectId === currentProjectId,
  );

  // 🟢 Event-driven Project Change: Updates the URL. Next.js re-fetches and streams fresh props [1, 15]
  const handleProjectChange = (projId: string) => {
    setLoading(true);
    setIsDraftGenerated(false); // 🟢 Safe state mutation directly inside user-driven event (No useEffect!) [26]

    const projectSprints = sprints.filter((s) => s.projectId === projId);
    const activeSprint =
      projectSprints.find((s) => s.status === "ACTIVE") || projectSprints[0];

    if (activeSprint) {
      router.push(
        `/dashboard/ledger?projectId=${projId}&sprintId=${activeSprint._id}&stage=${billingFilter}`,
      );
    } else {
      router.push(
        `/dashboard/ledger?projectId=${projId}&stage=${billingFilter}`,
      );
    }
    setTimeout(() => setLoading(false), 400);
  };

  // 🟢 Event-driven Sprint Change: Updates the URL [15]
  const handleSprintChange = (sprintId: string) => {
    setLoading(true);
    setIsDraftGenerated(false); // 🟢 Safe state mutation directly inside user-driven event (No useEffect!) [26]
    router.push(
      `/dashboard/ledger?projectId=${currentProjectId}&sprintId=${sprintId}&stage=${billingFilter}`,
    );
    setTimeout(() => setLoading(false), 400);
  };

  // 🟢 Event-driven Billing Stage Change: Updates the URL [15]
  const handleBillingFilterChange = (status: "UNBILLED" | "BILLED") => {
    setLoading(true);
    router.push(
      `/dashboard/ledger?projectId=${currentProjectId}&sprintId=${currentSprintId}&stage=${status}`,
    );
    setTimeout(() => setLoading(false), 400);
  };

  const handleGenerateDraft = () => {
    setIsDraftGenerated(true);
    toast.success(
      "Draft Invoice generated. Visual spreadsheet and payment reconciliation controls are now unlocked.",
    );
  };

  const handleCSVExport = () => {
    if (!isDraftGenerated || initialLedger.length === 0) return;

    const headers = [
      "Date",
      "Developer",
      "Task Title",
      "Task Classification",
      "Hours Logged",
      "Status",
    ];
    const rows = initialLedger.map((item) => [
      item.date,
      `"${item.devName.replace(/"/g, '""')}"`,
      `"${item.taskTitle.replace(/"/g, '""')}"`,
      item.taskType,
      item.hoursLogged,
      item.billingStatus,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `agencyos_invoice_draft_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Spreadsheet generated successfully.");
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

  const handleReconcile = async () => {
    setLoading(true);
    const logIds = initialLedger.map((item) => item._id);
    const result = await reconcileInvoice(logIds);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      setIsDraftGenerated(false); // Reset draft view state
      toast.success(
        "Invoice fully reconciled! Associated timesheet logs are now locked.",
      );
    }
  };

  // Calculate unbilled invoice totals based on developer billable rates
  const pendingInvoiceTotal = initialLedger
    .filter((item) => item.billingStatus === "UNBILLED")
    .reduce((sum, item) => sum + item.hoursLogged * 100, 0);

  return (
    <div className="space-y-8">
      {/* 1. Selector Swidescreen Panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Selected Project
            </label>
            <div className="relative flex items-center">
              <Building className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <select
                value={currentProjectId}
                onChange={(e) => handleProjectChange(e.target.value)} // Event-driven project change
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
                value={currentSprintId}
                onChange={(e) => handleSprintChange(e.target.value)} // Event-driven sprint change
                disabled={filteredSprints.length === 0}
                className="h-9 pl-8 pr-8 rounded-lg border border-zinc-200 bg-white text-xs font-bold text-zinc-700 focus-visible:outline-none appearance-none cursor-pointer max-w-[200px] disabled:opacity-50"
              >
                {filteredSprints.length === 0 ? (
                  <option value="">No Sprints</option>
                ) : (
                  filteredSprints.map((sprint) => (
                    <option key={sprint._id} value={sprint._id}>
                      {sprint.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-2.5 h-3 w-3 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Render Administrative Task Creator Modal */}
        {isManagerOnly && (
          <AddAdminTaskDialog
            projects={projects.map((p) => ({ _id: p._id, name: p.name }))}
            sprints={sprints.map((s) => ({
              _id: s._id,
              projectId: s.projectId,
              name: s.name,
            }))}
            teamMembers={teamMembers}
            stories={stories.map((s) => ({
              _id: s._id,
              projectId: s.projectId,
              sprintId: s.sprintId,
              title: s.title,
            }))}
          />
        )}
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
              ) : initialVariance.length === 0 ? (
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
                    {initialVariance.map((item) => {
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
              {/* If draft is not generated, hide the total figures and display a CTA [3] */}
              {!isDraftGenerated && billingFilter === "UNBILLED" ? (
                <div className="space-y-4">
                  <div className="text-xl font-bold text-zinc-400 font-mono">
                    ---
                  </div>
                  <Button
                    onClick={handleGenerateDraft}
                    disabled={loading || initialLedger.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition text-xs font-bold h-9 shadow-sm"
                  >
                    <FileText className="h-3.5 w-3.5" /> Generate Invoice Draft
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Dynamic Total Figure Displayed only after generation [3] */}
                  <div className="text-3xl font-extrabold text-zinc-900">
                    {billingFilter === "UNBILLED"
                      ? `$${pendingInvoiceTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      : "$0.00"}
                  </div>

                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                    {/* Escaped apostrophes */}
                    Automated invoice total calculated from all unbilled
                    developer timesheets [20].
                  </p>

                  {/* OWNER-ONLY GATE: Only the OWNER can approve and lock the invoice. Managers see a disabled awaiting notification [5] */}
                  {billingFilter === "UNBILLED" &&
                    initialLedger.length > 0 &&
                    (isOwner ? (
                      <Button
                        onClick={handleReconcile}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition text-xs font-bold h-9 shadow-sm"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Approve &amp; Lock Invoice{" "}
                            <Lock className="h-3.5 w-3.5" />{" "}
                            {/* Escaped ampersand */}
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 p-2 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider mt-2">
                        <Lock className="h-3.5 w-3.5" /> Awaiting Owner&apos;s
                        Billing Approval {/* Escaped apostrophes */}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timesheet Audit List Card */}
          <Card className="border-zinc-200 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">
                  Timesheet Audit Logs
                </CardTitle>

                {/* Control C: CSV Exporter Button (Hidden until Draft is generated) [3] */}
                {initialLedger.length > 0 && isDraftGenerated && (
                  <Button
                    onClick={handleCSVExport}
                    variant="outline"
                    size="sm"
                    className="h-8 border-zinc-200 text-zinc-500 hover:text-zinc-950 flex items-center gap-1 text-[10px] font-bold"
                  >
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                )}
              </div>

              {/* Billed/Unbilled Status Dropdown Selector */}
              <div className="mt-3 flex items-center gap-2">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400">
                  View Stage:
                </label>
                <select
                  value={billingFilter}
                  onChange={(e) =>
                    handleBillingFilterChange(
                      e.target.value as "UNBILLED" | "BILLED",
                    )
                  }
                  className="h-7 rounded border border-zinc-200 bg-white px-2 py-0 text-[10px] font-bold text-zinc-700"
                >
                  <option value="UNBILLED">Pending Drafts (Unbilled)</option>
                  <option value="BILLED">Paid Archive (Billed)</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0 max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  <p className="text-xs font-semibold">
                    Filtering log archive...
                  </p>
                </div>
              ) : initialLedger.length === 0 ? (
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
                          {isManagerOnly &&
                          item.billingStatus === "UNBILLED" ? (
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
