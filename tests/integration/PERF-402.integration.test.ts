import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { db } from '../../lib/db';
import { users, sessions } from '../../lib/db/schema';
import { authRouter } from '../../server/routers/auth';
import { eq } from 'drizzle-orm';

describe('PERF-402 Integration: logout authoritative behavior', () => {
  const testEmail = 'int-perf402@example.com';
  const password = 'Str0ng!Pass';
  let createdUser: any;
  let token = 'perf402-token-test';

  beforeAll(async () => {
    process.env.SSN_HASH_SECRET = process.env.SSN_HASH_SECRET || 'test-secret';
    // clean existing
    try {
      const existing = await db.select().from(users).where(eq(users.email, testEmail)).get();
      if (existing) {
        await db.transaction((tx) => {
          tx.delete(sessions).where(eq(sessions.userId, existing.id)).run();
          tx.delete(users).where(eq(users.id, existing.id)).run();
        });
      }
    } catch (e) {}

    const caller = authRouter.createCaller({ user: null, req: {} as any, res: { setHeader: () => {} } as any });
    const signupRes = await caller.signup({
      email: testEmail,
      password,
      firstName: 'Lgt',
      lastName: 'Tester',
      phoneNumber: '+12135550001',
      dateOfBirth: '1990-01-01',
      ssn: '987654321',
      address: '1 Test Ln',
      city: 'Test',
      state: 'NY',
      zipCode: '10001',
    });

    createdUser = signupRes.user;
    // ensure a session exists; override token for deterministic test
    const sessionRow = await db.select().from(sessions).where(eq(sessions.userId, createdUser.id)).get();
    if (sessionRow) {
      token = sessionRow.token;
    }
  });

  afterAll(async () => {
    if (createdUser) {
      try {
        db.transaction((tx) => {
          tx.delete(sessions).where(eq(sessions.userId, createdUser.id)).run();
          tx.delete(users).where(eq(users.id, createdUser.id)).run();
        });
      } catch {}
    }
  });

  it('logout deletes the server-side session when cookie provided and returns success', async () => {
    const cookieHeader = `session=${token}`;
    const caller = authRouter.createCaller({ user: null, req: { headers: { get: () => cookieHeader } } as any, res: { setHeader: () => {} } as any });

    const res = await caller.logout();
    expect(res).toHaveProperty('success');
    expect(res.success).toBe(true);

    // second logout should return false
    const caller2 = authRouter.createCaller({ user: null, req: { headers: { get: () => cookieHeader } } as any, res: { setHeader: () => {} } as any });
    const res2 = await caller2.logout();
    expect(res2.success).toBe(false);
  });
});
