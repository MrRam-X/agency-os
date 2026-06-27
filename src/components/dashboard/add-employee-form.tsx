"use client";

import { useState } from "react";
import { toast } from "sonner";
import { User, Mail, Lock, DollarSign, BrainCircuit, Loader2, X, Check } from "lucide-react";
import { addEmployee, updateEmployee } from "@/actions/add-employee"; // 🟢 Imported updateEmployee
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/models/User";

interface EmployeeProp {
  _id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "HR" | "TEAM_LEAD" | "DEVELOPER" | "TESTER";
  billableRate: number;
  skills: string[];
}

interface AddEmployeeFormProps {
  editingEmployee?: EmployeeProp | null; // 🟢 Optional edit target
  onCancel?: () => void; // 🟢 Optional cancel handler
}

export function AddEmployeeForm({ editingEmployee = null, onCancel }: AddEmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = editingEmployee !== null;

  // 🟢 ZERO-EFFECT: States are initialized directly with editing values on mount/key reset [26]
  const [formData, setFormData] = useState({
    name: editingEmployee ? editingEmployee.name : "",
    email: editingEmployee ? editingEmployee.email : "",
    password: "", // Always start password fields empty for security
    role: editingEmployee ? editingEmployee.role : "DEVELOPER",
    billableRate: editingEmployee ? String(editingEmployee.billableRate) : "",
    skills: editingEmployee ? editingEmployee.skills.join(", ") : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && editingEmployee) {
        // Run update Server Action
        const result = await updateEmployee(editingEmployee._id, {
          ...formData,
          billableRate: Number(formData.billableRate) || 0,
        });

        if (result.error) {
          toast.error(result.error);
        } else if (result.success) {
          toast.success("Employee profile updated successfully!");
          if (onCancel) onCancel(); // Reset the parent edit state
        }
      } else {
        // Run standard creation Server Action
        const result = await addEmployee({
          ...formData,
          billableRate: Number(formData.billableRate) || 0,
        });

        if (result.error) {
          toast.error(result.error);
        } else if (result.success) {
          toast.success("Employee credential workspace provisioned successfully!");
          setFormData({
            name: "",
            email: "",
            password: "",
            role: "DEVELOPER",
            billableRate: "",
            skills: "",
          });
        }
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
      {/* Dynamic Title Headers based on Edit/Create state */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
        <h4 className="text-sm font-bold text-zinc-900">
          {isEditing ? `Edit: ${editingEmployee?.name}` : "Add New Employee"}
        </h4>
        {isEditing && onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-900 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

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
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder={isEditing ? "Leave blank to keep current" : "Temporary Password"}
            type="password"
            required={!isEditing} // Password is optional during edits [13]
            className="pl-9 border-zinc-200"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 pl-1">Assign Workplace Role</label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none"
        >
          <option value="DEVELOPER">Developer</option>
          <option value="TESTER">QA Tester</option>
          <option value="TEAM_LEAD">Team Lead</option>
          <option value="MANAGER">Manager</option>
          <option value="HR">HR Specialist</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 pl-1">Hourly Billable Rate ($)</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Hourly Rate (e.g. 120)"
            type="number"
            min="0"
            required
            className="pl-9 border-zinc-200"
            value={formData.billableRate}
            onChange={(e) => setFormData({ ...formData, billableRate: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 pl-1">Technical Skills (Comma-separated)</label>
        <div className="relative">
          <BrainCircuit className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="React, Node.js, Mongoose"
            type="text"
            className="pl-9 border-zinc-200"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex gap-2">
        {isEditing && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={loading}
            className="flex-1 text-xs font-bold"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          className="flex-grow flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition shadow-sm" 
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEditing ? (
            <>
              Save Changes <Check className="h-4 w-4" />
            </>
          ) : (
            "Provision Credentials"
          )}
        </Button>
      </div>
    </form>
  );
}