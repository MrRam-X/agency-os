"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  FolderKanban,
  Calendar,
  X,
  Search,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Users,
  User,
  ChevronDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createUserStory,
  deleteUserStory,
  createSprintWithStories,
  deleteSprint,
} from "@/actions/project-actions";
import { StoryRowActions } from "@/components/dashboard/story-row-actions";

interface SerializedUserStory {
  _id: string;
  projectId: string;
  sprintId: string | null;
  title: string;
  description?: string;
  plannedHours: number;
  status: "BACKLOG" | "CONFIRMED" | "COMPLETED";
}

interface SerializedSprint {
  _id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
}

interface Member {
  _id: string;
  name: string;
  role: string;
}

interface ProjectDetailsWorkspaceProps {
  project: {
    _id: string;
    name: string;
    description?: string;
    billingType: "FIXED_PRICE" | "TIME_AND_MATERIALS";
    blendedRate: number;
    members: string[];
    createdBy: string;
  };
  team: Member[];
  stories: SerializedUserStory[];
  sprints: SerializedSprint[];
}

export function ProjectDetailsWorkspace({
  project,
  team,
  stories,
  sprints,
}: ProjectDetailsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState("backlog");
  const [loading, setLoading] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [storySearchQuery, setStorySearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form States
  const [storyForm, setStoryForm] = useState({
    title: "",
    description: "",
    plannedHours: "",
  });
  const [sprintForm, setSprintForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    selectedStories: [] as string[],
  });

  // Story Edits / Deletes
  const [sprintDeleteId, setSprintDeleteOpen] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const creatorName =
    team.find((t) => t._id === project.createdBy)?.name || "Unknown Manager";
  const assignedTeam = team.filter((t) => project.members.includes(t._id));

  // Separate Stories
  const backlogStories = stories.filter(
    (story) => story.sprintId === null && story.status === "BACKLOG",
  );
  const plannedStories = stories.filter((story) => story.sprintId !== null);

  const handleStoryToggle = (storyId: string) => {
    setSprintForm((prev) => {
      const exists = prev.selectedStories.includes(storyId);
      return {
        ...prev,
        selectedStories: exists
          ? prev.selectedStories.filter((id) => id !== storyId)
          : [...prev.selectedStories, storyId],
      };
    });
  };

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await createUserStory(project._id, storyForm);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("User Story created inside the Product Backlog!");
      setStoryForm({ title: "", description: "", plannedHours: "" });
    }
  };

  const handleSprintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛡️ Front-End Manual Typing Validation Fallback [13, 20]
    const start = new Date(sprintForm.startDate);
    const end = new Date(sprintForm.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      toast.error("Validation Error: Start Date cannot be set in the past.");
      return;
    }

    if (end <= start) {
      toast.error(
        "Validation Error: End Date must be set chronologically after the Start Date.",
      );
      return;
    }

    setLoading(true);
    const result = await createSprintWithStories(
      project._id,
      sprintForm,
      sprintForm.selectedStories,
    );
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("New Sprint initiated and stories mapped successfully!");
      setSprintForm({
        name: "",
        startDate: "",
        endDate: "",
        selectedStories: [],
      });
    }
  };

  const handleDeleteSprint = async (id: string) => {
    setLoading(true);
    const result = await deleteSprint(project._id, id);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      toast.success("Sprint timeline and nested tracking metrics deleted.");
      setSprintDeleteOpen(null);
    }
  };

  // Get current date string formatted as YYYY-MM-DD for date-picker restrictions
  const todayInputString = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-8">
      {/* Widescreen Project Header Info Panel */}
      <div className="border border-zinc-200 rounded-xl bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-6 w-6 text-zinc-900" />
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            {project.name}
          </h1>
        </div>
        <p className="text-sm text-zinc-500 font-medium max-w-4xl leading-relaxed">
          {project.description || "No project description provided."}
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-3 border-t border-zinc-100 text-xs">
          <span className="flex items-center gap-1.5 text-zinc-500">
            <User className="h-4 w-4 text-zinc-400" /> Creator:{" "}
            <strong className="font-semibold text-zinc-900">
              {creatorName}
            </strong>
          </span>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <Users className="h-4 w-4 text-zinc-400" /> Team:{" "}
            <strong className="font-semibold text-zinc-900">
              {assignedTeam.map((t) => t.name).join(", ") ||
                "No members assigned."}
            </strong>
          </span>
        </div>
      </div>

      {/* Main Split-Column Workspace */}
      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-zinc-100 p-1 rounded-lg mb-6">
              <TabsTrigger
                value="backlog"
                className="text-xs font-semibold py-1.5 transition"
              >
                Product Backlog ({backlogStories.length})
              </TabsTrigger>
              <TabsTrigger
                value="sprints"
                className="text-xs font-semibold py-1.5 transition"
              >
                Sprints ({sprints.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB CONTENT 1: PRODUCT BACKLOG */}
            <TabsContent value="backlog" className="space-y-4">
              <Card className="border-zinc-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold">
                    Unassigned Backlog Stories
                  </CardTitle>
                  <CardDescription>
                    Review and prepare requirements. Sprints can ingest these
                    stories during setup.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-6 pt-0">
                  {backlogStories.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic text-center py-6 font-medium">
                      The product backlog is completely empty.
                    </p>
                  ) : (
                    backlogStories.map((story) => (
                      <div
                        key={story._id}
                        className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition duration-150"
                      >
                        <div className="space-y-1 pr-4">
                          <h4 className="text-sm font-bold text-zinc-900 leading-snug">
                            {story.title}
                          </h4>
                          <p className="text-xs text-zinc-500 truncate max-w-sm">
                            {story.description || "No description provided."}
                          </p>
                          <div className="pt-1.5">
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-bold"
                            >
                              Budget: {story.plannedHours} hrs
                            </Badge>
                          </div>
                        </div>

                        {/* Reusable Story CRUD Actions */}
                        <StoryRowActions
                          projectId={project._id}
                          story={story}
                        />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB CONTENT 2: SPRINTS */}
            <TabsContent value="sprints" className="space-y-4">
              <Card className="border-zinc-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold">
                    Project Sprints & Deliverables
                  </CardTitle>
                  <CardDescription>
                    Scheduled active release cycles and timeline markers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-6 pt-0">
                  {sprints.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic text-center py-6 font-medium">
                      No sprints launched under this project yet.
                    </p>
                  ) : (
                    sprints.map((sprint) => {
                      const sprintStories = plannedStories.filter(
                        (s) => s.sprintId === sprint._id,
                      );
                      const sprintDates = `${new Date(sprint.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(sprint.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

                      return (
                        <div
                          key={sprint._id}
                          className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition duration-150"
                        >
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-zinc-900">
                              {sprint.name}
                            </h4>
                            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" /> {sprintDates}
                            </p>
                            <div className="pt-1.5 flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-white"
                              >
                                {sprint.status}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {sprintStories.length} stories assigned
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* DELETE SPRINT DIALOG */}
                            <Dialog
                              open={sprintDeleteId === sprint._id}
                              onOpenChange={(open) =>
                                setSprintDeleteOpen(open ? sprint._id : null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[400px]">
                                <DialogHeader>
                                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
                                    <AlertTriangle className="h-6 w-6" />
                                  </div>
                                  <DialogTitle className="text-center">
                                    Are you absolutely sure?
                                  </DialogTitle>
                                  <DialogDescription className="text-center text-sm">
                                    Deleting this sprint will delete all
                                    associated user stories, tasks, and
                                    timesheet billing records [21].
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="flex gap-2 sm:justify-center pt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSprintDeleteOpen(null)}
                                    disabled={loading}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    className="bg-red-600 text-white hover:bg-red-700"
                                    onClick={() =>
                                      handleDeleteSprint(sprint._id)
                                    }
                                    disabled={loading}
                                  >
                                    {loading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Delete Sprint"
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Link href={`/dashboard/board/${sprint._id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100"
                                title="Open Kanban Board"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: DYNAMIC CONTROL PANEL */}
        <div>
          <Card className="border-zinc-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {activeTab === "backlog" ? "Add User Story" : "Launch Sprint"}
              </CardTitle>
              <CardDescription>
                {activeTab === "backlog"
                  ? "Define user requirements inside the product backlog."
                  : "Initialize delivery cycle and map backlog items."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTab === "backlog" ? (
                <form onSubmit={handleStorySubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500">
                      Story Title
                    </label>
                    <Input
                      placeholder="As a customer, I want to manage..."
                      required
                      value={storyForm.title}
                      onChange={(e) =>
                        setStoryForm({ ...storyForm, title: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500">
                      Description
                    </label>
                    <textarea
                      placeholder="Acceptance Criteria and detailed specs."
                      className="flex min-h-[60px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                      value={storyForm.description}
                      onChange={(e) =>
                        setStoryForm({
                          ...storyForm,
                          description: e.target.value,
                        })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500">
                      Planned Hours (Estimation Budget)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      required
                      placeholder="8"
                      value={storyForm.plannedHours}
                      onChange={(e) =>
                        setStoryForm({
                          ...storyForm,
                          plannedHours: e.target.value,
                        })
                      }
                      disabled={loading}
                    />
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
                        <Plus className="h-4 w-4" /> Create Story
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSprintSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500">
                      Sprint Name
                    </label>
                    <Input
                      placeholder="Sprint 1 - Initial DB Schema"
                      required
                      value={sprintForm.name}
                      onChange={(e) =>
                        setSprintForm({ ...sprintForm, name: e.target.value })
                      }
                      disabled={loading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Start Date
                      </label>
                      <Input
                        type="date"
                        required
                        min={todayInputString} // 🟢 RESTRICTION: Disable past dates from current date
                        value={sprintForm.startDate}
                        onChange={(e) =>
                          setSprintForm({
                            ...sprintForm,
                            startDate: e.target.value,
                            endDate: "",
                          })
                        } // Clear end date on start date change
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> End Date
                      </label>
                      <Input
                        type="date"
                        required
                        value={sprintForm.endDate}
                        onChange={(e) =>
                          setSprintForm({
                            ...sprintForm,
                            endDate: e.target.value,
                          })
                        }
                        disabled={loading || !sprintForm.startDate} // 🟢 RESTRICTION: Disable until Start Date is selected
                        min={
                          sprintForm.startDate
                            ? new Date(
                                new Date(sprintForm.startDate).getTime() +
                                  86400000,
                              )
                                .toISOString()
                                .split("T")[0]
                            : undefined
                        } // 🟢 Enforce end > start
                      />
                    </div>
                  </div>

                  {/* Searchable Combobox */}
                  <div className="space-y-2 relative" ref={dropdownRef}>
                    <label className="text-xs font-semibold text-zinc-500 pl-1">
                      Ingest Stories into Sprint (Selected:{" "}
                      {sprintForm.selectedStories.length})
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                      <Input
                        placeholder="Search backlog stories..."
                        type="text"
                        className="pl-9 pr-9 border-zinc-200 h-10"
                        value={storySearchQuery}
                        onChange={(e) => {
                          setStorySearchQuery(e.target.value);
                          setComboboxOpen(true);
                        }}
                        onFocus={() => setComboboxOpen(true)}
                        disabled={loading}
                      />
                      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
                    </div>

                    {comboboxOpen && (
                      <div className="absolute left-0 right-0 z-50 mt-1 max-h-[140px] overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg space-y-0.5">
                        {backlogStories.filter(
                          (story) =>
                            story.title
                              .toLowerCase()
                              .includes(storySearchQuery.toLowerCase()) &&
                            !sprintForm.selectedStories.includes(story._id),
                        ).length === 0 ? (
                          <p className="text-xs text-zinc-400 text-center py-3">
                            No unassigned stories found.
                          </p>
                        ) : (
                          backlogStories
                            .filter(
                              (story) =>
                                story.title
                                  .toLowerCase()
                                  .includes(storySearchQuery.toLowerCase()) &&
                                !sprintForm.selectedStories.includes(story._id),
                            )
                            .map((story) => (
                              <button
                                key={story._id}
                                type="button"
                                onClick={() => {
                                  handleStoryToggle(story._id);
                                  setStorySearchQuery("");
                                }}
                                className="flex items-center justify-between w-full text-left rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition"
                              >
                                <span className="truncate max-w-[200px]">
                                  {story.title}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 bg-zinc-100 border border-zinc-200 rounded text-zinc-500 shrink-0">
                                  {story.plannedHours} hrs
                                </span>
                              </button>
                            ))
                        )}
                      </div>
                    )}

                    {sprintForm.selectedStories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pl-1">
                        {sprintForm.selectedStories.map((storyId) => {
                          const story = backlogStories.find(
                            (s) => s._id === storyId,
                          );
                          if (!story) return null;

                          return (
                            <Badge
                              key={story._id}
                              variant="secondary"
                              className="pl-2.5 pr-1.5 py-1 text-xs flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition"
                            >
                              <span className="truncate max-w-[140px]">
                                {story.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStoryToggle(story._id)}
                                className="rounded-full hover:bg-zinc-200 p-0.5 text-zinc-400 hover:text-zinc-950 transition-colors"
                                title="Remove story from sprint draft"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
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
                        <Plus className="h-4 w-4" /> Ingest & Launch Sprint
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
