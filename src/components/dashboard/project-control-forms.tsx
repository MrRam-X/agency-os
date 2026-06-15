"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Calendar, FolderKanban } from "lucide-react";
import { createProject, createSprint } from "@/actions/project-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// 🟢 Corrected: Importing standard, non-aliased Shadcn Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Member {
  _id: string;
  name: string;
  role: string;
}

interface ProjectListSelect {
  _id: string;
  name: string;
}

interface ProjectControlFormsProps {
  teamMembers: Member[];
  projects: ProjectListSelect[];
}

export function ProjectControlForms({
  teamMembers,
  projects,
}: ProjectControlFormsProps) {
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    billingType: "TIME_AND_MATERIALS",
    blendedRate: "",
    members: [] as string[],
  });

  const [sprintData, setSprintData] = useState({
    projectId: "",
    name: "",
    startDate: "",
    endDate: "",
  });

  const handleMemberCheck = (memberId: string) => {
    setProjectData((prev) => {
      const isAssigned = prev.members.includes(memberId);
      return {
        ...prev,
        members: isAssigned
          ? prev.members.filter((id) => id !== memberId)
          : [...prev.members, memberId],
      };
    });
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createProject({
        ...projectData,
        blendedRate: Number(projectData.blendedRate) || 0,
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(
          "New project registered and members assigned successfully!",
        );
        setProjectData({
          name: "",
          description: "",
          billingType: "TIME_AND_MATERIALS",
          blendedRate: "",
          members: [],
        });
      }
    } catch (err) {
      toast.error("A client-side exception occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSprintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createSprint(sprintData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(
          "Sprint timeline created in PLANNING state successfully!",
        );
        setSprintData({
          projectId: "",
          name: "",
          startDate: "",
          endDate: "",
        });
      }
    } catch (err) {
      toast.error("A client-side exception occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="project" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-zinc-100 p-1 rounded-lg mb-6">
        <TabsTrigger
          value="project"
          className="text-xs font-semibold py-1.5 transition"
        >
          New Project
        </TabsTrigger>
        <TabsTrigger
          value="sprint"
          className="text-xs font-semibold py-1.5 transition"
        >
          New Sprint
        </TabsTrigger>
      </TabsList>

      {/* TAB 1: CREATE PROJECT */}
      <TabsContent value="project">
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 pl-1">
              Project Name
            </label>
            <div className="relative">
              <FolderKanban className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Stripe Payment Engine"
                required
                className="pl-9 border-zinc-200"
                value={projectData.name}
                onChange={(e) =>
                  setProjectData({ ...projectData, name: e.target.value })
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 pl-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Detailed specifications and scope guidelines."
              className="flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={projectData.description}
              onChange={(e) =>
                setProjectData({ ...projectData, description: e.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 pl-1">
                Billing Contract Type
              </label>
              <select
                value={projectData.billingType}
                onChange={(e) =>
                  setProjectData({
                    ...projectData,
                    billingType: e.target.value,
                  })
                }
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="TIME_AND_MATERIALS">Time & Materials</option>
                <option value="FIXED_PRICE">Fixed Price</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 pl-1">
                Blended Rate ($/hr)
              </label>
              <Input
                type="number"
                min="0"
                required
                className="border-zinc-200 h-10"
                placeholder="100"
                value={projectData.blendedRate}
                onChange={(e) =>
                  setProjectData({
                    ...projectData,
                    blendedRate: e.target.value,
                  })
                }
                disabled={loading}
              />
            </div>
          </div>

          {/* Member Selection List (Desktop-optimized scroll box) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 pl-1">
              Assign Team Members (Selected: {projectData.members.length})
            </label>
            <div className="border border-zinc-200 rounded-lg max-h-[140px] overflow-y-auto p-3 bg-zinc-50/50 space-y-2">
              {teamMembers.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-4">
                  No employees provisioned yet.
                </p>
              ) : (
                teamMembers.map((member) => (
                  <label
                    key={member._id}
                    className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    <input
                      type="checkbox"
                      checked={projectData.members.includes(member._id)}
                      onChange={() => handleMemberCheck(member._id)}
                      disabled={loading}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5"
                    />
                    <span>{member.name}</span>
                    <span className="text-[9px] uppercase font-bold px-1.5 bg-white border border-zinc-200 rounded text-zinc-400">
                      {member.role.replace("_", " ")}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" /> Create Project
              </>
            )}
          </Button>
        </form>
      </TabsContent>

      {/* TAB 2: CREATE SPRINT */}
      <TabsContent value="sprint">
        <form onSubmit={handleSprintSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 pl-1">
              Select Project
            </label>
            <select
              value={sprintData.projectId}
              onChange={(e) =>
                setSprintData({ ...sprintData, projectId: e.target.value })
              }
              required
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">-- Choose Project --</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 pl-1">
              Sprint Name
            </label>
            <div className="relative">
              <FolderKanban className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Sprint 1 - Initial DB Schema"
                required
                className="pl-9 border-zinc-200"
                value={sprintData.name}
                onChange={(e) =>
                  setSprintData({ ...sprintData, name: e.target.value })
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 pl-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Start Date
              </label>
              <Input
                type="date"
                required
                className="border-zinc-200 h-10"
                value={sprintData.startDate}
                onChange={(e) =>
                  setSprintData({ ...sprintData, startDate: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 pl-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> End Date
              </label>
              <Input
                type="date"
                required
                className="border-zinc-200 h-10"
                value={sprintData.endDate}
                onChange={(e) =>
                  setSprintData({ ...sprintData, endDate: e.target.value })
                }
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4" /> Launch Sprint
              </>
            )}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
