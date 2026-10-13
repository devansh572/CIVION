import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { findAuthorityAccount, verifyAuthorityCredentials } from "@/lib/authority-credentials";
import { findWorkerAccount, verifyWorkerCredentials } from "@/lib/worker-credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "google-client-id-placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-client-secret-placeholder",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "github-client-id-placeholder",
      clientSecret: process.env.GITHUB_SECRET || "github-client-secret-placeholder",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Check if authority account
        const authority = findAuthorityAccount(credentials.email);
        if (authority) {
          const check = verifyAuthorityCredentials(credentials.email, credentials.password);
          if (check.valid && check.account) {
            return {
              id: `auth-${Date.now()}`,
              name: check.account.name,
              email: check.account.email,
              role: "authority",
            };
          }
          // Password mismatch for authority account
          return null;
        }

        // Check if field worker account
        const worker = findWorkerAccount(credentials.email);
        if (worker) {
          const check = verifyWorkerCredentials(credentials.email, credentials.password);
          if (check.valid && check.account) {
            return {
              id: `wrk-${Date.now()}`,
              name: check.account.name,
              email: check.account.email,
              role: "field_worker",
            };
          }
          // Password mismatch for worker account
          return null;
        }

        // Standard user login
        return {
          id: `usr-${Date.now()}`,
          name: credentials.email.split("@")[0] || "User",
          email: credentials.email,
          role: "resident",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "resident";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role || "resident";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
