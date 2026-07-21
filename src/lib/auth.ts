import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated. Contact admin.");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // If 2FA is enabled, require OTP verification
        if (user.twoFactorEnabled) {
          // If a 2FA code is provided with the credentials, verify it
          if (credentials.twoFactorCode) {
            if (
              !user.twoFactorCode ||
              !user.twoFactorExp ||
              user.twoFactorCode !== credentials.twoFactorCode
            ) {
              throw new Error("Invalid 2FA code");
            }

            if (new Date() > user.twoFactorExp) {
              throw new Error("2FA code expired. Please try again.");
            }

            // Code is valid — clear it and proceed with login
            await db.user.update({
              where: { id: user.id },
              data: { twoFactorCode: null, twoFactorExp: null },
            });
          } else {
            // No 2FA code provided — generate and send one
            const { generateOTP } = await import("@/lib/auth-helpers");
            const { sendOTPEmail } = await import("@/lib/email");
            const code = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await db.user.update({
              where: { id: user.id },
              data: { twoFactorCode: code, twoFactorExp: expiresAt },
            });

            // Send OTP email
            const emailSent = await sendOTPEmail(user.email, code);
            if (!emailSent) {
              console.log(`[DEV] 2FA code for ${user.email}: ${code}`);
            }

            // Throw special error that the client will handle
            throw new Error("2FA required");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          username: user.username,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          const username =
            user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "_") ||
            `reader_${Date.now()}`;
          await db.user.create({
            data: {
              email: user.email!,
              name: user.name || "Reader",
              username,
              image: user.image,
              role: "READER",
              emailVerified: new Date(),
            },
          });
        } else if (!existingUser.isActive) {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "READER";
        token.username = (user as { username?: string }).username || "";
      }

      if (trigger === "update" && session) {
        token.role = session.role;
        token.username = session.username;
      }

      // Always fetch fresh role from DB for security
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, username: true, isActive: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.username = dbUser.username;
          if (!dbUser.isActive) {
            return {} as typeof token;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.image = token.picture || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  // Cross-subdomain cookie configuration
  // In production, cookies are shared across *.sanaathrumylens.co.ke
  // so logging in on one subdomain authenticates all subdomains
  cookies: process.env.NODE_ENV === "production"
    ? {
        sessionToken: {
          name: "next-auth.session-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            domain: ".sanaathrumylens.co.ke",
            secure: true,
          },
        },
        csrfToken: {
          name: "next-auth.csrf-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            domain: ".sanaathrumylens.co.ke",
            secure: true,
          },
        },
        callbackUrl: {
          name: "next-auth.callback-url",
          options: {
            sameSite: "lax",
            path: "/",
            domain: ".sanaathrumylens.co.ke",
            secure: true,
          },
        },
      }
    : undefined,
};
