"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  FolderKanban,
  Search,
  X,
  ChevronDown,
} from "lucide-react";
import { createProject } from "@/actions/project-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // 🟢 Imported Badge component for tags

interface Member {
  _id: string;
  name: string;
  role: string;
}

interface CreateProjectFormProps {
  teamMembers: Member[];
}

export function CreateProjectForm({ teamMembers }: CreateProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    billingType: "TIME_AND_MATERIALS",
    blendedRate: "",
    members: [] as string[],
  });

  // Close search dropdown when clicking outside the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMemberToggle = (memberId: string) => {
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

  // Filter out members already selected AND match the search query
  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch = member.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const isAlreadySelected = projectData.members.includes(member._id);
    return matchesSearch && !isAlreadySelected;
  });

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
        setSearchQuery("");
      }
    } catch (err) {
      toast.error("A client-side exception occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          className="flex min-h-[70px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                billingType: e.target.value as
                  | "TIME_AND_MATERIALS"
                  | "FIXED_PRICE",
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
              setProjectData({ ...projectData, blendedRate: e.target.value })
            }
            disabled={loading}
          />
        </div>
      </div>

      {/* 🟢 Searchable Combobox Member Selector */}
      <div className="space-y-2 relative" ref={dropdownRef}>
        <label className="text-xs font-semibold text-zinc-500 pl-1">
          Assign Team Members
        </label>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search employees..."
            type="text"
            className="pl-9 pr-9 border-zinc-200 h-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            disabled={loading}
          />
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-zinc-400 pointer-events-none" />
        </div>

        {/* Dropdown Selection Panel */}
        {dropdownOpen && (
          <div className="absolute left-0 right-0 z-50 mt-1 max-h-[160px] overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg space-y-0.5">
            {filteredMembers.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-3">
                No matching employees found.
              </p>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member._id}
                  type="button"
                  onClick={() => {
                    handleMemberToggle(member._id);
                    setSearchQuery(""); // Clear search query on click
                  }}
                  className="flex items-center justify-between w-full text-left rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition"
                >
                  <span>{member.name}</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 bg-zinc-100 border border-zinc-200 rounded text-zinc-500">
                    {member.role.replace("_", " ")}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* 🟢 Rounded Badges with Cross Deselect Icons */}
        {projectData.members.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pl-1">
            {projectData.members.map((memberId) => {
              const member = teamMembers.find((m) => m._id === memberId);
              if (!member) return null;

              return (
                <Badge
                  key={member._id}
                  variant="secondary"
                  className="pl-2.5 pr-1.5 py-1 text-xs flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition"
                >
                  <span>{member.name}</span>
                  <button
                    type="button"
                    onClick={() => handleMemberToggle(member._id)}
                    className="rounded-full hover:bg-zinc-200 p-0.5 text-zinc-400 hover:text-zinc-900 transition-colors"
                    title="Remove member"
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
        className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition mt-4"
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
  );
}
