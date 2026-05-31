import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Organization } from "@/models/Organization";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Fetch NextAuth session on the server
  const session = await getServerSession(authOptions);

  // 2. Security Gate: If not authenticated, redirect to login page immediately
  if (!session || !session.user) {
    redirect("/login");
  }

  // 3. Connect to DB and fetch Organization Name securely
  await connectDB();
  const org = await Organization.findById(session.user.orgId).lean();
  
  // Safety check: If organization was deleted, invalidate session and redirect
  const orgName = org ? org.orgName : "Unknown Organization";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50/50">
      {/* Collapsible Left Sidebar */}
      <Sidebar userRole={session.user.role} userId={session.user.id} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow h-screen min-w-0">
        {/* Top Header Navigation */}
        <Header 
          orgName={orgName} 
          userName={session.user.name || "User"} 
          userRole={session.user.role} 
        />

        {/* Active Page View Container */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 bg-zinc-50/50">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}