"use client";

import { useSelector, shallowEqual } from "react-redux"; // 🟢 Imported shallowEqual
import { RootState } from "@/store/store";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryEstimationBarProps {
  storyId: string;
  plannedHours: number;
}

export function StoryEstimationBar({ storyId, plannedHours }: StoryEstimationBarProps) {
  // 1. Fetch current draft tasks belonging to this User Story using shallowEqual to optimize rendering
  const tasks = useSelector(
    (state: RootState) =>
      state.board.currentTasks.filter((task) => task.storyId === storyId),
    shallowEqual // 🟢 Prevents unnecessary re-renders by doing element-level array comparison
  );

  // 2. Calculate sum of estimated hours
  const totalEstimated = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

  // 3. Calculate percentage of budget used
  const percentage = Math.min((totalEstimated / plannedHours) * 100, 100);
  const isOverBudget = totalEstimated > plannedHours;

  return (
    <div className="w-full space-y-2 mt-1">
      <div className="flex items-center justify-between text-xs font-semibold">
        {/* Status Indicators */}
        {isOverBudget ? (
          <span className="flex items-center gap-1 text-amber-600 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" /> Budget Overrun Risk (+{totalEstimated - plannedHours} &apos;s hrs)
          </span>
        ) : (
          <span className="flex items-center gap-1 text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Estimation Scope Healthy
          </span>
        )}
        
        {/* Horizontal Readout */}
        <span className="text-zinc-600">
          Estimated: <strong className={cn("font-bold", isOverBudget ? "text-amber-600" : "text-zinc-950")}>{totalEstimated}</strong> / {plannedHours} hrs
        </span>
      </div>

      {/* 4. Custom, 100% Type-Safe Progress Bar */}
      <div className="h-1.5 w-full bg-zinc-100 border border-zinc-200/50 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500 rounded-full",
            isOverBudget ? "bg-amber-500" : "bg-zinc-800"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}