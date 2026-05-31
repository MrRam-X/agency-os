"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  DollarSign,
  BrainCircuit,
  Loader2,
} from "lucide-react";
import { addEmployee } from "@/actions/add-employee";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddEmployeeForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "DEVELOPER",
    billableRate: "",
    skills: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await addEmployee({
        ...formData,
        billableRate: Number(formData.billableRate) || 0,
      });

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(
          "Employee credential workspace provisioned successfully!",
        );
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "DEVELOPER",
          billableRate: "",
          skills: "",
        });
      }
    } catch (err) {
      console.error("Form submit error:", err);
      toast.error("An unexpected client-side error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Full Name (e.g. Bob Smith)"
            type="text"
            required
            className="pl-9 border-zinc-200"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Work Email Address"
            type="email"
            required
            className="pl-9 border-zinc-200"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Temporary Password"
            type="password"
            required
            className="pl-9 border-zinc-200"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 pl-1">
          Assign Workplace Role
        </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="DEVELOPER">Developer</option>
          <option value="TESTER">QA Tester</option>
          <option value="TEAM_LEAD">Team Lead</option>
          <option value="MANAGER">Manager</option>
          <option value="HR">HR Specialist</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 pl-1">
          Hourly Billable Rate ($)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Hourly Rate (e.g. 120)"
            type="number"
            min="0"
            required
            className="pl-9 border-zinc-200"
            value={formData.billableRate}
            onChange={(e) =>
              setFormData({ ...formData, billableRate: e.target.value })
            }
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 pl-1">
          Technical Skills (Comma-separated)
        </label>
        <div className="relative">
          <BrainCircuit className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="React, Node.js, Mongoose"
            type="text"
            className="pl-9 border-zinc-200"
            value={formData.skills}
            onChange={(e) =>
              setFormData({ ...formData, skills: e.target.value })
            }
            disabled={loading}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition shadow-sm mt-4"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Provisioning Account...
          </>
        ) : (
          "Provision Workspace Credentials"
        )}
      </Button>
    </form>
  );
}
