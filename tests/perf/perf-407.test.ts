import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { db } from '../../lib/db';
import { users, accounts, transactions } from '../../lib/db/schema';
import { accountRouter } from '../../server/routers/account';
import { eq, desc } from 'drizzle-orm';

describe('PERF-407: Performance Degradation (integration)', () => {
  const testEmail = 'perf-test@example.com';
  let user: any;
  let account: any;

  beforeAll(async () => {
    // Clean up any previous test artifacts
    try {
        db.transaction((tx) => {
            tx.delete(transactions).where(eq(transactions.accountId, -1)).run();
            tx.delete(accounts).where(eq(accounts.accountNumber, "9999999999")).run();
            tx.delete(users).where(eq(users.email, testEmail)).run();
        });
    } catch (err) {
        // ignore cleanup errors
    }

    // Insert a user
    await db.insert(users).values({
      email: testEmail,
      password: 'test-pass',
      firstName: 'Perf',
      lastName: 'Tester',
      phoneNumber: '0000000000',
      dateOfBirth: '1990-01-01',
      ssnHash: 'testhash',
      ssnLast4: '1234',
      address: '1 Test St',
      city: 'Testville',
      state: 'TS',
      zipCode: '00000',
    }).run();

    user = await db.select().from(users).where(eq(users.email, testEmail)).get();

    // Insert an account for that user
    await db.insert(accounts).values({
      userId: user.id,
      accountNumber: '9999999999',
      accountType: 'checking',
      balance: 0,
      status: 'active',
    }).run();

    account = await db.select().from(accounts).where(eq(accounts.userId, user.id)).get();
  });

  afterAll(async () => {
    // Cleanup test data
    // await db.delete(transactions).where(eq(transactions.accountId, account?.id ?? -1)).run().catch(() => {});
    // await db.delete(accounts).where(eq(accounts.userId, user?.id ?? -1)).run().catch(() => {});
    // await db.delete(users).where(eq(users.email, testEmail)).run().catch(() => {});
    try {
        db.transaction((tx) => {
            tx.delete(transactions).where(eq(transactions.accountId, account?.id ?? -1)).run();
            tx.delete(accounts).where(eq(accounts.userId, user?.id ?? -1)).run();
            tx.delete(users).where(eq(users.email, testEmail)).run();
        });
    } catch (err) {
        // ignore errors
    }
  });

  it('applies many funding transactions and verifies final balance and counts', async () => {
    const caller = accountRouter.createCaller({ user, req: {} as any, res: {} as any });

    const iterations = 500; // number of transactions to simulate
    const amount = 1.0;

    const start = Date.now();

    // Fire many funding requests in parallel and await them
    const promises = Array.from({ length: iterations }, () =>
      caller.fundAccount({ accountId: account.id, amount, fundingSource: { type: 'bank', accountNumber: '12345678' } })
    );

    const results = await Promise.all(promises);

    const elapsedMs = Date.now() - start;
    // Log results for debugging / perf observation
    // eslint-disable-next-line no-console
    console.log(`PERF-407: applied ${iterations} fundings in ${elapsedMs}ms`);

    // Verify all returned successfully and newBalance values are present
    expect(results.length).toBe(iterations);
    for (const r of results) {
      expect(r).toHaveProperty('transaction');
      expect(r).toHaveProperty('newBalance');
    }

    // Check DB final state
    const finalAccount = await db.select().from(accounts).where(eq(accounts.id, account.id)).get();
    // expect(finalAccount).toBeTruthy();
    // expect(Number(finalAccount.balance)).toBeCloseTo(iterations * amount, 2);
    expect(finalAccount).toBeDefined(); // narrows type
    expect(Number(finalAccount!.balance)).toBeCloseTo(iterations * amount, 2);

    // Ensure transaction rows exist and count matches
    const txRows = await db.select().from(transactions).where(eq(transactions.accountId, account.id)).orderBy(desc(transactions.createdAt));
    expect(txRows.length).toBeGreaterThanOrEqual(iterations);
  });
});
