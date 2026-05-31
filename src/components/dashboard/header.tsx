"use client";

import { signOut } from "next-auth/react";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { RootState } from "@/store/store";
import { Menu, LogOut, Building, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  orgName: string;
  userName: string;
  userRole: string;
}

export function Header({ orgName, userName, userRole }: HeaderProps) {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle & Desktop compact toggle (when sidebar is closed) */}
        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleSidebar())}
            className="h-9 w-9 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Organization Indicator */}
        <div className="flex items-center gap-2 text-zinc-600">
          <Building className="h-4 w-4" />
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            {orgName}
          </span>
        </div>
      </div>

      {/* User Information & Authentication Menu */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end hidden sm:flex">
          <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-zinc-400" /> {userName}
          </span>
          {/* Custom colored role badges */}
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-1.5 py-0 mt-0.5 tracking-wider uppercase bg-zinc-50 text-zinc-600 border-zinc-200"
          >
            {userRole.replace("_", " ")}
          </Badge>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="h-9 w-9 text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
