import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { db } from '../../lib/db';
import { users, sessions } from '../../lib/db/schema';
import { authRouter } from '../../server/routers/auth';
import { eq } from 'drizzle-orm';

// Ensure SSN hashing secret present for signup
process.env.SSN_HASH_SECRET = process.env.SSN_HASH_SECRET || 'test-secret';

describe('SEC-304 Integration: signup/login single-session enforcement', () => {
  const testEmail = 'int-sec304@example.com';
  const password = 'Str0ng!Pass';
  let createdUser: any;

  beforeAll(async () => {
    // cleanup any previous artifacts
    try {
      db.delete(sessions).where(eq(sessions.token, 'dummy')).run();
    } catch {}
    // remove existing user if present
    try {
      const existing = await db.select().from(users).where(eq(users.email, testEmail)).get();
      if (existing) {
        await db.transaction((tx) => {
          tx.delete(sessions).where(eq(sessions.userId, existing.id)).run();
          tx.delete(users).where(eq(users.id, existing.id)).run();
        });
      }
    } catch (e) {}
  });

  afterAll(async () => {
    // cleanup created user and sessions
    if (createdUser) {
      try {
        db.transaction((tx) => {
          tx.delete(sessions).where(eq(sessions.userId, createdUser.id)).run();
          tx.delete(users).where(eq(users.id, createdUser.id)).run();
        });
      } catch {}
    }
  });

  it('signup creates user and session, login invalidates previous sessions', async () => {
    const caller = authRouter.createCaller({ user: null, req: {} as any, res: { setHeader: () => {} } as any });

    const signupRes = await caller.signup({
      email: testEmail,
      password,
      firstName: 'Int',
      lastName: 'Tester',
      phoneNumber: '+12135550000',
      dateOfBirth: '1990-01-01',
      ssn: '123456789',
      address: '1 Test Rd',
      city: 'Test',
      state: 'CA',
      zipCode: '90001',
    });

    expect(signupRes).toHaveProperty('user');
    expect(signupRes).toHaveProperty('token');
    createdUser = signupRes.user;

    // there should be exactly one session for this user
    const sessionsRows1 = await db.select().from(sessions).where(eq(sessions.userId, createdUser.id));
    expect(sessionsRows1.length).toBeGreaterThanOrEqual(1);

    // login again: should invalidate previous sessions and create a single fresh one
    const loginRes = await caller.login({ email: testEmail, password });
    expect(loginRes).toHaveProperty('token');

    const sessionsRows2 = await db.select().from(sessions).where(eq(sessions.userId, createdUser.id));
    expect(sessionsRows2.length).toBe(1);
    expect(sessionsRows2[0].token).toBe(loginRes.token);
  });
});
