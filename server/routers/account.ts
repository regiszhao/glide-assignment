import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm"; // PERF-404
import crypto from "crypto";
// VAL-206
import { luhnCheck } from "@/lib/utils/luhn";

function generateAccountNumber(): string {
  // SEC-302
  // Use a cryptographically secure RNG to generate a 10-digit account number.
  const num = crypto.randomInt(0, 10_000_000_000);
  return num.toString().padStart(10, "0");
}

export const accountRouter = router({
  createAccount: protectedProcedure
    .input(
      z.object({
        accountType: z.enum(["checking", "savings"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already has an account of this type
      const existingAccount = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.accountType, input.accountType)))
        .get();

      if (existingAccount) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `You already have a ${input.accountType} account`,
        });
      }

      let accountNumber;
      let isUnique = false;

      // Generate unique account number
      while (!isUnique) {
        accountNumber = generateAccountNumber();
        const existing = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber)).get();
        isUnique = !existing;
      }

      await db.insert(accounts).values({
        userId: ctx.user.id,
        accountNumber: accountNumber!,
        accountType: input.accountType,
        balance: 0,
        status: "active",
      });

      // Fetch the created account
      const account = await db.select().from(accounts).where(eq(accounts.accountNumber, accountNumber!)).get();

      return (
        account || {
          id: 0,
          userId: ctx.user.id,
          accountNumber: accountNumber!,
          accountType: input.accountType,
          balance: 100,
          status: "pending",
          createdAt: new Date().toISOString(),
        }
      );
    }),

  getAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, ctx.user.id));

    return userAccounts;
  }),

  fundAccount: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
        amount: z.number().positive(),
        // VAL-206
        fundingSource: z
          .object({
            type: z.enum(["card", "bank"]),
            accountNumber: z.string(),
            routingNumber: z.string().optional(),
          })
          .refine((val) => {
            if (val.type === "card") {
              return /^\d{16}$/.test(val.accountNumber) && luhnCheck(val.accountNumber);
            } else {
              return /^\d+$/.test(val.accountNumber);
            }
          }, {
            message: "Invalid card/account number (must be 16 digits and pass Luhn for cards)",
            path: ["accountNumber"],
          }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const amount = parseFloat(input.amount.toString());

      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      if (account.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account is not active",
        });
      }

      // PERF-406
      // Create transaction and update balance atomically inside a DB transaction to avoid races and ensure the returned balance is correct.
      const nowIso = new Date().toISOString();

      // Note: for the SQLite driver in this project the transaction callback must be synchronous (cannot return a Promise).
      const { transaction: createdTransaction, newBalance } = db.transaction((tx) => {
        // insert the transaction with explicit createdAt/processedAt
        tx.insert(transactions).values({
          accountId: input.accountId,
          type: "deposit",
          amount,
          description: `Funding from ${input.fundingSource.type}`,
          status: "completed",
          createdAt: nowIso,
          processedAt: nowIso,
        }).run();

        // PERF-404
        // PERF-406
        // fetch the inserted transaction for this account deterministically
        const txRow = tx
          .select()
          .from(transactions)
          .where(eq(transactions.accountId, input.accountId))
          .orderBy(desc(transactions.createdAt), desc(transactions.id))
          .limit(1)
          .get();

        // re-read the account inside the transaction to get the latest balance
        const freshAccount = tx.select().from(accounts).where(eq(accounts.id, input.accountId)).get();

        if (!freshAccount) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Account not found during update" });
        }

        // compute new balance rounded to cents to avoid floating-point drift
        const newBalanceRaw = Number((freshAccount.balance + amount).toFixed(2));

        tx.update(accounts).set({ balance: newBalanceRaw }).where(eq(accounts.id, input.accountId)).run();

        return { transaction: txRow, newBalance: newBalanceRaw };
      });

      return { transaction: createdTransaction, newBalance };
    }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        accountId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify account belongs to user
      const account = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.accountId), eq(accounts.userId, ctx.user.id)))
        .get();

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      // PERF-404
      // Return transactions for the account ordered newest first
      const accountTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.accountId, input.accountId))
        .orderBy(desc(transactions.createdAt), desc(transactions.id));

      const enrichedTransactions = [];
      for (const transaction of accountTransactions) {
        const accountDetails = await db.select().from(accounts).where(eq(accounts.id, transaction.accountId)).get();

        enrichedTransactions.push({
          ...transaction,
          accountType: accountDetails?.accountType,
        });
      }

      return enrichedTransactions;
    }),
});
