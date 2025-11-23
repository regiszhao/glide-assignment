import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { db } from '../../lib/db';
import { users, accounts, transactions, sessions } from '../../lib/db/schema';
import { authRouter } from '../../server/routers/auth';
import { accountRouter } from '../../server/routers/account';
import { eq } from 'drizzle-orm';

process.env.SSN_HASH_SECRET = process.env.SSN_HASH_SECRET || 'test-secret';

describe('VAL-205 Integration: fundAccount validation and balance update', () => {
  const testEmail = 'int-val205@example.com';
  const password = 'Str0ng!Pass';
  let createdUser: any;
  let account: any;

  beforeAll(async () => {
    // cleanup any previous
    try {
      const existing = await db.select().from(users).where(eq(users.email, testEmail)).get();
      if (existing) {
        db.transaction((tx) => {
          tx.delete(transactions).where(eq(transactions.accountId, -1)).run();
          tx.delete(accounts).where(eq(accounts.userId, existing.id)).run();
          tx.delete(sessions).where(eq(sessions.userId, existing.id)).run();
          tx.delete(users).where(eq(users.id, existing.id)).run();
        });
      }
    } catch {}

    const caller = authRouter.createCaller({ user: null, req: {} as any, res: { setHeader: () => {} } as any });
    const signupRes = await caller.signup({
      email: testEmail,
      password,
      firstName: 'Fund',
      lastName: 'Tester',
      phoneNumber: '+12135550002',
      dateOfBirth: '1990-01-01',
      ssn: '111223333',
      address: '1 Fund St',
      city: 'Test',
      state: 'TX',
      zipCode: '73301',
    });

    createdUser = signupRes.user;

    // create an account for that user directly
    await db.insert(accounts).values({
      userId: createdUser.id,
      accountNumber: '8888888888',
      accountType: 'checking',
      balance: 0,
      status: 'active',
    }).run();

    account = await db.select().from(accounts).where(eq(accounts.userId, createdUser.id)).get();
  });

  afterAll(async () => {
    if (account) {
      try {
        db.transaction((tx) => {
          tx.delete(transactions).where(eq(transactions.accountId, account.id)).run();
          tx.delete(accounts).where(eq(accounts.id, account.id)).run();
          tx.delete(users).where(eq(users.id, createdUser.id)).run();
        });
      } catch {}
    }
  });

  it('rejects zero-amount funding and accepts valid funding, updating balance and inserting tx', async () => {
    const caller = accountRouter.createCaller({ user: createdUser, req: {} as any, res: {} as any });

    // zero amount should be rejected by server schema
    await expect(caller.fundAccount({ accountId: account.id, amount: 0, fundingSource: { type: 'bank', accountNumber: '12345678', routingNumber: '012345678' } })).rejects.toBeTruthy();

    // valid funding
    const res = await caller.fundAccount({ accountId: account.id, amount: 1.23, fundingSource: { type: 'bank', accountNumber: '12345678', routingNumber: '012345678' } });
    expect(res).toHaveProperty('transaction');
    expect(res).toHaveProperty('newBalance');
    expect(Number(res.newBalance)).toBeCloseTo(1.23, 2);

    const finalAccount = await db.select().from(accounts).where(eq(accounts.id, account.id)).get();
    expect(finalAccount).toBeDefined();
    expect(Number(finalAccount!.balance)).toBeCloseTo(1.23, 2);

    const txs = await db.select().from(transactions).where(eq(transactions.accountId, account.id)).all();
    expect(txs.length).toBeGreaterThanOrEqual(1);
  });
});
