import { DefaultSession } from "next-auth";
import { UserRole } from "@/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      orgId: string;
      requirePasswordChange: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    orgId: string;
    requirePasswordChange: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    orgId: string;
    requirePasswordChange: boolean;
  }
}