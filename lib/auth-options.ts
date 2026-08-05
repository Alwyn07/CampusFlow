import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { getRoleHome, isAppRole } from "@/lib/roles";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/password";

const eightHours = 8 * 60 * 60;
const thirtyDays = 30 * 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: thirtyDays,
    updateAge: 60 * 60,
  },
  jwt: {
    maxAge: thirtyDays,
  },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
        rememberMe: { label: "Remember me", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
          role: credentials?.role,
          rememberMe: credentials?.rememberMe === "true",
        });

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            status: true,
          },
        });

        if (!user?.passwordHash || user.status !== "ACTIVE") {
          return null;
        }

        if (parsed.data.role !== user.role && user.role !== "SUPER_ADMIN") {
          return null;
        }

        const passwordValid = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!passwordValid) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          rememberMe: parsed.data.rememberMe,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & {
          role?: string;
          rememberMe?: boolean;
        };

        token.id = authUser.id;
        token.role = authUser.role;
        token.rememberMe = Boolean(authUser.rememberMe);
        token.sessionExpiresAt =
          Date.now() +
          (authUser.rememberMe ? thirtyDays : eightHours) * 1000;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = isAppRole(token.role) ? token.role : "STUDENT";
        session.user.homePath = getRoleHome(session.user.role);
      }

      session.expires = new Date(
        Number(token.sessionExpiresAt ?? Date.now()),
      ).toISOString();

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      return baseUrl;
    },
  },
};
