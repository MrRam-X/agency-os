"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { UserRole } from "@/models/User";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  CreditCard,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  userRole: UserRole;
  userId: string;
}

export function Sidebar({ userRole, userId }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["OWNER", "MANAGER", "HR", "TEAM_LEAD", "DEVELOPER", "TESTER"],
    },
    {
      name: "Projects",
      href: "/dashboard/projects",
      icon: FolderKanban,
      roles: ["OWNER", "MANAGER", "TEAM_LEAD"],
    },
    {
      name: "Kanban Board",
      href: "/dashboard/board/active",
      icon: FolderKanban,
      roles: ["MANAGER", "TEAM_LEAD", "DEVELOPER", "TESTER"],
    },
    {
      name: "Daily Logs",
      href: "/dashboard/daily-logs",
      icon: Clock,
      roles: ["DEVELOPER", "TESTER", "TEAM_LEAD", "MANAGER"],
    },
    {
      name: "Sprint Ledger",
      href: "/dashboard/ledger",
      icon: CreditCard,
      roles: ["OWNER", "MANAGER", "TEAM_LEAD"],
    },
    {
      name: "My Profile",
      href: `/dashboard/profile/${userId}`,
      icon: User,
      roles: ["OWNER", "MANAGER", "HR", "TEAM_LEAD", "DEVELOPER", "TESTER"],
    },
  ];

  const allowedNavItems = navItems.filter((item) =>
    item.roles.includes(userRole),
  );

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-white border-r border-zinc-200 transition-all duration-300 sticky top-0 left-0 z-40 shrink-0",
        sidebarOpen ? "w-64" : "w-16",
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Image
            src="/favicon.ico"
            alt="AgencyOS Logo"
            width={24}
            height={24}
            className="object-contain shrink-0"
          />
          {sidebarOpen && (
            <span className="text-sm font-bold tracking-tight text-zinc-900 whitespace-nowrap transition-opacity duration-300">
              AgencyOS
            </span>
          )}
        </div>

        {sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleSidebar())}
            className="h-7 w-7 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 hidden lg:flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-grow py-4 px-2 space-y-1 overflow-y-auto">
        {allowedNavItems.map((item) => {
          // 🟢 RESOLVED: Strict route checking algorithm to prevent double-active UI highlights [23]
          let isActive = false;

          if (item.name === "Kanban Board") {
            // 🟢 RESOLVED: Keep "Kanban Board" active across any dynamic board route
            isActive = pathname.startsWith("/dashboard/board");
          } else if (item.href === "/dashboard") {
            // 🟢 RESOLVED: Keep "Dashboard" active ONLY if the path is exactly /dashboard [23]
            isActive = pathname === "/dashboard";
          } else {
            // Standard hierarchical check for sub-routes (e.g. /dashboard/projects/[id])
            isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 relative group",
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen ? (
                <span className="whitespace-nowrap transition-opacity duration-150">
                  {item.name}
                </span>
              ) : (
                <span className="absolute left-14 hidden group-hover:block bg-zinc-900 text-white text-xs font-semibold px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!sidebarOpen && (
        <div className="p-2 border-t border-zinc-200 flex justify-center shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(toggleSidebar())}
            className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
