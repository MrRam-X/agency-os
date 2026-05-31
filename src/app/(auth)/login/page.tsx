"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // 🟢 Next.js optimized Image component
import { signIn } from "next-auth/react"; // 🟢 NextAuth Client sign-in trigger
import { toast } from "sonner";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 🟢 Trigger NextAuth credentials verification (redirect: false let's us handle errors client-side)
      const res = await signIn("credentials", {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      });

      if (res?.error) {
        // Displays exact message thrown by NextAuth authorize() callback (e.g., "Incorrect password")
        toast.error(res.error);
      } else {
        toast.success("Successfully authenticated. Access granted.");
        router.push("/dashboard");
        router.refresh(); // Refresh current route state so middleware registers the cookie instantly
      }
    } catch (err) {
      console.error("Login client error:", err);
      toast.error("An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50/70 p-6 font-sans selection:bg-zinc-900 selection:text-white dark:bg-zinc-950/70">
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

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-[420px] border-zinc-200 bg-white/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4 transition-transform duration-300 hover:scale-[1.05]">
            <Image
              src="/favicon.ico"
              alt="AgencyOS Logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription className="text-sm">
            Enter your credentials to access your organization workspace.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Email Address"
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
                  placeholder="Password"
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-2">
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 transition shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <div className="text-xs text-center text-zinc-500">
              Need a new workspace for your company?{" "}
              <Link
                href="/register-org"
                className="text-zinc-900 hover:underline font-semibold transition"
              >
                Register Org
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
