"use client";

import { signOut, useSession } from "next-auth/react"; // 🟢 Added to check active authentication state
import Link from "next/link";
import Image from "next/image"; // 🟢 Kept optimized Next.js Image component
import {
  ArrowRight,
  KanbanSquare,
  Clock,
  Calculator,
  Bot,
  ShieldCheck,
  UserCheck,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { status, data: session } = useSession(); // 🟢 Read active NextAuth session and loading state
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  // 🟢 Added hard-redirect logout handler
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/"; // Purges the SPA memory cache
  };

  // Animated scroll handler that perfectly calculates off-sets for the sticky header
  const handleScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(targetId);

    if (element) {
      const headerOffset = 64; // Height of our sticky header (h-16 = 64px)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white scroll-smooth relative">
      {/* Parallax Background Layer */}
      <div
        className="absolute inset-0 z-0 bg-fixed bg-cover bg-center bg-no-repeat pointer-events-none opacity-60"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80')",
          filter: "brightness(0.88)",
        }}
      ></div>
      {/* Grid overlay for geometric visual depth */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e4e4e7_0.8px,transparent_0.8px),linear-gradient(to_bottom,#e4e4e7_0.8px,transparent_0.8px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_60%,transparent_100%)] pointer-events-none"></div>
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/favicon.ico"
              alt="AgencyOS Logo"
              width={24}
              height={24}
              className="object-contain"
            />
            <span className="text-base font-bold tracking-tight text-zinc-900">
              AgencyOS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <a
              href="#features"
              onClick={(e) => handleScroll(e, "features")}
              className="transition hover:text-zinc-900"
            >
              Features
            </a>
            <a
              href="#about"
              onClick={(e) => handleScroll(e, "about")}
              className="transition hover:text-zinc-900"
            >
              About
            </a>
          </nav>

          {/* Dynamic Header Actions */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              // Prevent Layout Shift (CLS) by displaying a quiet pulse skeleton while loading session
              <div className="h-9 w-28 animate-pulse bg-zinc-200/60 rounded-md"></div>
            ) : isAuthenticated ? (
              // 🟢 Render User info and Log Out trigger instead of a second Dashboard button
              <div className="flex items-center gap-3">
                {/* User Pill Card */}
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 bg-zinc-100/80 px-3 py-1.5 rounded-full border border-zinc-200/60">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="truncate max-w-[120px]">
                    {session?.user?.name || "User"}
                  </span>
                </div>

                {/* Log Out Button */}
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
            ) : (
              // If anonymous/logged out, show original auth triggers
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/60 transition"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register-org">
                  <Button className="text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition shadow-md hover:shadow-lg">
                    Register Org
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative z-10 py-28 md:py-36">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm transition-transform duration-300 hover:scale-[1.02]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            The Professional Agency Operating System
          </div>

          <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-7xl max-w-4xl mx-auto leading-[1.05] drop-shadow-sm">
            Automate your Sprints, Timesheets, and Client Billing.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Replace fragmented tracking applications. An integrated operational
            ecosystem connecting resource capacity, real-time developer metrics,
            sprint velocity, and billing variance under one dashboard.
          </p>

          {/* Dynamic Hero Actions */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {isLoading ? (
              // Prevent layout shift
              <div className="h-11 w-44 animate-pulse bg-zinc-200/60 rounded-md"></div>
            ) : isAuthenticated ? (
              // 🟢 If authenticated, replace both buttons with a single "Go to Dashboard" CTA
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 font-semibold px-6 transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg"
                >
                  Go to Dashboard{" "}
                  <ArrowRight className="h-4 w-4 animate-pulse" />
                </Button>
              </Link>
            ) : (
              // 🟢 If anonymous/logged out, show original dual CTAs
              <>
                <Link href="/register-org">
                  <Button
                    size="lg"
                    className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800 font-semibold px-6 transition-all duration-300 hover:scale-[1.02] shadow-md hover:shadow-lg"
                  >
                    Launch Your Workspace{" "}
                    <ArrowRight className="h-4 w-4 animate-pulse" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-zinc-200/80 bg-white/85 backdrop-blur-sm hover:bg-zinc-50 text-zinc-700 font-medium px-6 transition-all duration-300 hover:scale-[1.02] shadow-sm"
                  >
                    Employee Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3. Core Pillars Grid (Features) */}
      <section
        id="features"
        className="relative z-10 py-24 border-t border-zinc-200/60 bg-white/70 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Engineered to protect agency margins.
            </h2>
            <p className="mt-4 text-zinc-500 font-medium">
              Eliminate profit leakage due to inaccurate sprint planning,
              forgotten hours, and tedious billing manual audits.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-lg border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-8 hover:-translate-y-1 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-50 border border-zinc-200/60 shadow-sm">
                <KanbanSquare className="h-5 w-5 text-zinc-700" />
              </div>
              <h3 className="mt-6 text-base font-bold text-zinc-900">
                AI Sprint Planning
              </h3>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-normal">
                Provide high-level prompts, and Llama 3 automatically structures
                clean user stories and tasks validated strictly via server-side
                Zod schemas.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-lg border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-8 hover:-translate-y-1 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-50 border border-zinc-200/60 shadow-sm">
                <Clock className="h-5 w-5 text-zinc-700" />
              </div>
              <h3 className="mt-6 text-base font-bold text-zinc-900">
                The Agile Ledger
              </h3>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-normal">
                Developers drag tasks to Done, and the system automatically logs
                exact time-series entries into the database. No manual inputs
                required.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-lg border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-8 hover:-translate-y-1 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-50 border border-zinc-200/60 shadow-sm">
                <Calculator className="h-5 w-5 text-zinc-700" />
              </div>
              <h3 className="mt-6 text-base font-bold text-zinc-900">
                Variance Billing
              </h3>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-normal">
                Automatically aggregate unbilled developer hours. Dynamically
                map T&M billing profiles, or calculate Fixed-Price profit
                variance at a glance.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-lg border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-8 hover:-translate-y-1 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-50 border border-zinc-200/60 shadow-sm">
                <Bot className="h-5 w-5 text-zinc-700" />
              </div>
              <h3 className="mt-6 text-base font-bold text-zinc-900">
                AI Auto-Standups
              </h3>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-normal">
                Click a button on your profile dashboard to query
                yesterday&apos;s completed ledger logs and automatically
                generate polished, Slack-ready status updates.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-lg border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-8 hover:-translate-y-1 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-50 border border-zinc-200/60 shadow-sm">
                <UserCheck className="h-5 w-5 text-zinc-700" />
              </div>
              <h3 className="mt-6 text-base font-bold text-zinc-900">
                Impact Dossiers
              </h3>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-normal">
                When a project is completed, MongoDB aggregations calculate
                precise metrics of developer output, feeding Groq to generate a
                robust impact statement.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-lg border border-zinc-200/80 bg-white/80 backdrop-blur-sm p-8 hover:-translate-y-1 hover:shadow-md hover:border-zinc-300/80 transition-all duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-50 border border-zinc-200/60 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-zinc-700" />
              </div>
              <h3 className="mt-6 text-base font-bold text-zinc-900">
                Multi-Tenant RBAC
              </h3>
              <p className="mt-2 text-sm text-zinc-500 leading-relaxed font-normal">
                Ensure complete data isolation between organizations. Secure
                edge routing prevents developers from accessing ledger analytics
                or project configurations [5].
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. About / Value Proposition */}
      <section
        id="about"
        className="relative z-10 py-24 border-t border-zinc-200/60 bg-zinc-50/50"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <div className="text-zinc-600 font-bold text-xs tracking-widest uppercase">
                The Agency Challenge
              </div>
              <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight sm:text-4xl leading-tight">
                Built for scaling technical service organizations.
              </h2>
              <p className="text-zinc-600 leading-relaxed">
                Most agencies run on a fragmented web of Jira for sprints,
                Clockify for logging time, and Slack for standups. Information
                leaks, billable hours are forgotten, and invoicing is delayed.
              </p>
              <p className="text-zinc-600 leading-relaxed">
                <strong>AgencyOS</strong> consolidates operations. By connecting
                task completion statuses directly to the financial ledger, we
                guarantee that every hour of technical output is immediately
                accounted for and optimized.
              </p>
            </div>

            {/* Visual Stats Block */}
            <div className="rounded-xl border border-zinc-200 bg-white/95 backdrop-blur-sm p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                Target Operational Efficiencies
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-zinc-900">100%</div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Timesheet Automation from Task Statuses
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-zinc-900">
                    &lt; 3 Sec
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    AI Backlog Generation via Groq SDK
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-zinc-900">0</div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Manual Input Errors on Invoices
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-zinc-900">True</div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Multi-Tenant Organization Security [5]
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Minimalist Footer */}
      <footer className="relative z-10 border-t border-zinc-200/60 py-12 bg-white">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Image
              src="/favicon.ico"
              alt="AgencyOS Logo"
              width={20}
              height={20}
              className="object-contain"
            />
            <span className="text-sm font-bold text-zinc-900">AgencyOS</span>
          </div>
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} AgencyOS. All rights reserved.
            Built with Next.js 16.
          </p>
        </div>
      </footer>
    </div>
  );
}
