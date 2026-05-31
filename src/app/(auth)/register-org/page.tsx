"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // 🟢 Swapped to Next.js Image component
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Lock, 
  Building, 
  ShieldAlert, 
  Loader2, 
  KanbanSquare, 
  Clock, 
  Calculator, 
  Bot 
} from "lucide-react";

import { registerOrg } from "@/actions/register-org";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterOrgPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
    orgShortName: "",
  });

  const handleOrgNameChange = (val: string) => {
    const suggestedSlug = val
      .toLowerCase()
      .replace(/[^a-z]/g, ""); // strictly lowercase letters only
    setFormData((prev) => ({
      ...prev,
      orgName: val,
      orgShortName: suggestedSlug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await registerOrg(formData);

      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("Organization and Owner profile created successfully!");
        router.push("/login");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row bg-zinc-50/70 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white overflow-hidden">
      
      {/* 🟢 Parallax Background Layer */}
      <div 
        className="absolute inset-0 z-0 bg-fixed bg-cover bg-center bg-no-repeat pointer-events-none opacity-60"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80')",
          filter: "brightness(0.88)"
        }}
      ></div>

      {/* Grid overlay for geometric visual depth */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e4e4e7_0.8px,transparent_0.8px),linear-gradient(to_bottom,#e4e4e7_0.8px,transparent_0.8px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_60%,transparent_100%)] pointer-events-none"></div>

      {/* ==========================================
          COLUMN 1: Widescreen Info Panel (Desktop Only)
          ========================================== */}
      <div className="relative z-10 hidden lg:flex flex-col justify-between w-[45%] bg-zinc-950 p-12 text-white border-r border-zinc-900">
        <div className="flex items-center gap-2.5">
          {/* 🟢 Using optimized Next.js Image component */}
          <Image
            src="/favicon.ico"
            alt="AgencyOS Logo"
            width={24}
            height={24}
            className="object-contain"
          />
          <span className="text-base font-bold tracking-tight text-white">AgencyOS</span>
        </div>

        <div className="space-y-8 my-auto">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              One Unified Workspace for Your Entire Agency.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              Register your workspace today to connect project managers, developers, resources, and clients in a single automated operational flow.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200">
                <KanbanSquare className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">AI Sprint Architect</h4>
                <p className="text-xs text-zinc-400 mt-1">Generate complete backlogs instantly using structured Llama 3 prompts.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">Zero-effort timesheets</h4>
                <p className="text-xs text-zinc-400 mt-1">Automatic time logs generated directly from drag-and-drop board movements.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">Automated Client Billing</h4>
                <p className="text-xs text-zinc-400 mt-1">Generate dynamic T&M invoices and track Fixed-Price profitability variances.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">AI Standups & Dossiers</h4>
                <p className="text-xs text-zinc-400 mt-1">Produce automatic daily updates and data-driven developer profiles.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} AgencyOS. Core operations engine compiled in Next.js 16.
        </div>
      </div>

      {/* ==========================================
          COLUMN 2: The Form Panel (Responsive)
          ========================================== */}
      <div className="relative z-10 flex flex-grow items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-[480px] border-zinc-200 bg-white/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardHeader className="space-y-1">
            <div className="flex lg:hidden items-center gap-2 mb-4">
              <Image
                src="/favicon.ico"
                alt="AgencyOS Logo"
                width={20}
                height={20}
                className="object-contain"
              />
              <span className="text-sm font-bold tracking-tight text-zinc-900">AgencyOS</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Register your Organization</CardTitle>
            <CardDescription className="text-sm">
              Create your administrative owner profile and register your company workspace.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Owner Profile Header */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-zinc-200"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Owner Details
                </span>
                <div className="flex-grow border-t border-zinc-200"></div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Full Name"
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
                    placeholder="Owner Email Address"
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
                    placeholder="Secure Password"
                    type="password"
                    required
                    className="pl-9 border-zinc-200"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Organization Section Header */}
              <div className="relative flex py-2 items-center mt-6">
                <div className="flex-grow border-t border-zinc-200"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Organization Details
                </span>
                <div className="flex-grow border-t border-zinc-200"></div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Organization Name (e.g., Acme Corporation)"
                    type="text"
                    required
                    className="pl-9 border-zinc-200"
                    value={formData.orgName}
                    onChange={(e) => handleOrgNameChange(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Workspace Slug (e.g., acme)"
                    type="text"
                    required
                    className="pl-9 border-zinc-200"
                    value={formData.orgShortName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        orgShortName: e.target.value.toLowerCase().replace(/[^a-z]/g, ""),
                      })
                    }
                    disabled={loading}
                  />
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed pl-1">
                  Workspace URL: <strong className="text-zinc-900 font-semibold">{formData.orgShortName || "slug"}</strong>.com
                </p>
                <div className="flex items-start gap-1.5 rounded-md bg-zinc-50 border border-zinc-200 p-2.5 mt-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Workspace URL restrictions: Only lowercase alphabetic letters are permitted (no symbols, numbers, spaces, or hyphens).
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-2">
              <Button type="submit" className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition shadow-sm" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Workspace...
                  </>
                ) : (
                  "Register & Launch OS"
                )}
              </Button>
              <div className="text-xs text-center text-zinc-500">
                Already have a workspace?{" "}
                <Link href="/login" className="text-zinc-900 hover:underline font-semibold transition">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

    </div>
  );
}