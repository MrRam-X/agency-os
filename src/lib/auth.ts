import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        // 1. Connect to MongoDB
        await connectDB();

        // 2. Find the user
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });
        if (!user) {
          throw new Error("No user found with this email address.");
        }

        // 3. Verify hashed password
        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Incorrect password. Please try again.");
        }

        // 4. Return the custom user object to the JWT callback
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          orgId: user.orgId.toString(),
          requirePasswordChange: user.requirePasswordChange,
        };
      },
    }),
  ],
  callbacks: {
    // Save custom data from authorize() into the JSON Web Token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.orgId = user.orgId;
        token.requirePasswordChange = user.requirePasswordChange;
      }
      return token;
    },
    // Expose JSON Web Token properties directly to the client/server session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.orgId = token.orgId;
        session.user.requirePasswordChange = token.requirePasswordChange;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Custom login page URL
  },
  session: {
    strategy: "jwt", // Use stateless JSON Web Tokens for session handling
  },
  secret: process.env.NEXTAUTH_SECRET,
};