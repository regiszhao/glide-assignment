import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
// VAL-203
import { US_STATES } from "@/lib/constants";

// VAL-202
function calculateAgeFromISO(dateStr: string): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return NaN;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        // VAL-201
        email: z.string().email(),
        // VAL-208
        password: z
          .string()
          .min(10, { message: "Password must be at least 10 characters" })
          .refine((v) => /[a-z]/.test(v), { message: "Password must contain a lowercase letter" })
          .refine((v) => /[A-Z]/.test(v), { message: "Password must contain an uppercase letter" })
          .refine((v) => /\d/.test(v), { message: "Password must contain a number" })
          .refine((v) => /[^A-Za-z0-9]/.test(v), { message: "Password must contain a symbol" })
          .refine((v) => {
            const common = ["password", "12345678", "qwerty"];
            return !common.includes(v.toLowerCase());
          }, { message: "Password is too common" }),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        // VAL-204: accept international phone numbers (optional leading +, 7-15 digits)
        phoneNumber: z.string().regex(/^\+?\d{7,15}$/, { message: "Phone number must be digits (optional leading +) and between 7 and 15 characters" }),
        // VAL-202
        dateOfBirth: z
          .string()
          .refine((v) => {
            const d = new Date(v);
            return !isNaN(d.getTime());
          }, { message: "Date of birth must be a valid date" })
          .refine((v) => {
            const d = new Date(v);
            return d <= new Date();
          }, { message: "Date of birth cannot be in the future" })
          .refine((v) => {
            const age = calculateAgeFromISO(v);
            return age >= 18;
          }, { message: "You must be at least 18 years old" })
          .refine((v) => {
            const age = calculateAgeFromISO(v);
            return age <= 120;
          }, { message: "Age must be 120 or less" }),
        ssn: z.string().regex(/^\d{9}$/),
        address: z.string().min(1),
        city: z.string().min(1),
        // VAL-203: enforce valid US state codes (2-letter)
        state: z
          .string()
          .length(2)
          .transform((s) => s.toUpperCase())
          .refine((s) => {
            return US_STATES.includes(s);
          }, { message: "State must be a valid 2-letter US state code" }),
        zipCode: z.string().regex(/^\d{5}$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // VAL-201
      // Normalize email for lookup/storage but preserve the original input for display
      const normalizedEmail = input.email.trim().toLowerCase();

      // Basic typo detection for common TLD mistakes
      const domain = input.email.split("@")[1] || "";
      const commonTldTypos = [".con", ".cmo", ".cm", ".om"];
      for (const t of commonTldTypos) {
        if (domain.endsWith(t)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Email domain looks incorrect (did you mean '${domain.replace(t, ".com")}')` });
        }
      }

      const existingUser = await db.select().from(users).where(eq(users.email, normalizedEmail)).get();

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      // SEC-301
      if (!process.env.SSN_HASH_SECRET) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "SSN hashing secret is not configured",
        });
      }

      const ssnHash = crypto.createHmac("sha256", process.env.SSN_HASH_SECRET).update(input.ssn).digest("hex");
      const ssnLast4 = input.ssn.slice(-4);

      await db.insert(users).values({
        // store canonical lowercased email for uniqueness and lookups
        email: normalizedEmail,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        dateOfBirth: input.dateOfBirth,
        ssnHash,
        ssnLast4,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
      });

      // Fetch the created user
      const user = await db.select().from(users).where(eq(users.email, normalizedEmail)).get();

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      // Create session
      // SEC-304
      // Invalidate other sessions for this user before creating a new one so logging in rotates sessions and prevents lingering tokens
      await db.delete(sessions).where(eq(sessions.userId, user.id));

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "temporary-secret-for-interview", {
        expiresIn: "7d",
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      // Set cookie
      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      }

      // Return user with password removed and include the original email input as `displayEmail`
      return { user: { ...user, password: undefined, displayEmail: input.email }, token };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const user = await db.select().from(users).where(eq(users.email, normalizedEmail)).get();

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);

      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "temporary-secret-for-interview", {
        expiresIn: "7d",
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // SEC-304
      // Invalidate other sessions for this user before creating a new one so logging in rotates sessions and prevents lingering tokens
      await db.delete(sessions).where(eq(sessions.userId, user.id));

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
      });

      if ("setHeader" in ctx.res) {
        ctx.res.setHeader("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      } else {
        (ctx.res as Headers).set("Set-Cookie", `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
      }

      return { user: { ...user, password: undefined }, token };
    }),

  // PERF-402
  logout: publicProcedure.mutation(async ({ ctx }) => {
    // Attempt to read the session token from cookies or headers
    let token: string | undefined;
    if ("cookies" in ctx.req) {
      // console.log("ALL COOKIES:", (ctx.req as any).cookies); // See all cookies
      token = (ctx.req as any).cookies.get('session')?.value;
      // console.log("Logout via Next.js cookies:", token);
    } else {
      const cookieHeader = ctx.req.headers.get?.("cookie") || (ctx.req.headers as any).cookie;
      // console.log("RAW COOKIE HEADER:", cookieHeader); // See raw cookie string
      token = cookieHeader
        ?.split("; ")
        .find((c: string) => c.startsWith("session="))
        ?.split("=")[1];
    }

    // Check whether a session with this token exists, delete if present
    let deleted = false;
    if (token) {
      const result = await db.delete(sessions).where(eq(sessions.token, token)).run();
      deleted = result.changes > 0;
    }

    // Clear cookie for client regardless
    if ("setHeader" in ctx.res) {
      ctx.res.setHeader("Set-Cookie", `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    } else {
      (ctx.res as Headers).set("Set-Cookie", `session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    }

    return { success: deleted, message: deleted ? "Logged out successfully" : "No active session" };
  }),
});
