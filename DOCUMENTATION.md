# SecureBank Technical Take-Home
**Author:** Regis Zhao  
**Date:** 2025-11-21  

---

## Table of Contents
- [UI Issues](#ui-issues)
- [Validation Issues](#validation-issues)
- [Security Issues](#security-issues)
- [Logic & Performance Issues](#logic--performance-issues)

---

## UI Issues

### Ticket UI-101: Dark Mode Text Visibility
**Priority:** Medium  
**Reported by:** Sarah Chen  

**Description:** Text typed into forms in dark mode is white on white background.  

**Root Cause:** _[Explain what caused the issue in code / styles]_  

**Fix Applied:** _[Explain what changes you made]_  

**Preventive Measures:** _[How to avoid similar issues]_  

**Verification / Test:** _[Manual check / screenshot / test snippet]_

---

## Validation Issues

### Ticket VAL-201: Email Validation Problems
**Priority:** High  
**Reported by:** James Wilson  

**Description:** Invalid email formats are accepted and case handling is inconsistent.  

**Root Cause:** _[Explain root cause]_  

**Fix Applied:** _[Explain fix, e.g., regex, zod schema, React Hook Form validation]_  

**Preventive Measures:** _[Best practices for email validation]_  

**Verification / Test:** _[Example test snippet or steps]_

---

### Ticket VAL-202: Date of Birth Validation
**Priority:** Critical  
**Reported by:** Maria Garcia  

**Description:** System accepts future birth dates.  

**Root Cause:** The signup form and server-side schema accepted any string for `dateOfBirth` without checking that it represented a valid date, wasn't in the future, or met minimum/maximum age constraints.

**Fix Applied:**
- Client-side: added validation in `app/signup/page.tsx` to ensure the `date` input is a valid date, not in the future, age is at least 18 (no minors) and at most 120 (no unrealistic ages). This provides immediate feedback in the UI.
- Server-side: strengthened the Zod input schema in `server/routers/auth.ts` to enforce the same checks (valid date, not future, age between 18 and 120). Server-side validation is authoritative and prevents bypassing client checks.

**Preventive Measures:**
- Always perform input validation both client- and server-side; treat server-side validation as the source of truth.
- Codify age-range rules in a shared validation module if multiple endpoints need the same logic.
- Add unit tests for boundary conditions (exactly 18, 120, and future dates) and CI gates to prevent regressions.

**Verification / Test:**
- Manual: attempt to register with a future DOB (e.g., next year) — client reject and server should also reject if bypassed.
- Manual: attempt to register with DOB making age <18 or >120 — both client and server reject with clear messages.
- Recommended: add unit/integration tests that assert server rejects invalid DOBs and accepts a valid DOB (exactly 18 years old should be accepted).

---

### Ticket VAL-203: State Code Validation
**Priority:** Medium  
**Reported by:** Alex Thompson  

**Description:** Invalid state codes like 'XX' are accepted.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket VAL-204: Phone Number Format
**Priority:** Medium  
**Reported by:** John Smith  

**Description:** International phone numbers not validated properly.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket VAL-205: Zero Amount Funding
**Priority:** High  
**Reported by:** Lisa Johnson  

**Description:** Funding requests of $0.00 are accepted.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket VAL-206: Card Number Validation
**Priority:** Critical  
**Reported by:** David Brown  

**Description:** Invalid card numbers are accepted.  

**Root Cause:** The system accepted any 16-digit string as a card number, with only minimal pattern checks on the client (in `components/FundingModal.tsx`) and no Luhn validation. These checks were also missing on the server-side (`server/routers/account.ts`). This allowed invalid or mistyped card numbers to be submitted, leading to failed transactions and poor user experience.

**Fix Applied:**
- Wrote a Luhn algorithm check in `lib/utils/luhn.ts`
- Client-side: Added Luhn check and strict 16-digit validation for card numbers in `components/FundingModal.tsx`. Users receive immediate feedback if the card number is invalid.
- Server-side: Added Luhn check and 16-digit validation in the Zod schema for the `fundAccount` endpoint in `server/routers/account.ts`. This ensures only valid card numbers are accepted, even if client validation is bypassed.
- Opted to remove prefix check. For this context, Luhn algorithm and length check should be sufficient for detecting invalid numbers. Using prefix checks in this context is less practical due to the wide variety of issuing banks and card types.

**Preventive Measures:**
- Always validate credit/debit card numbers using the Luhn algorithm and length checks on both client and server.
- Add automated tests for common invalid card numbers and edge cases.
- Consider using a payment processor's SDK for additional card validation and BIN checks.

**Verification / Test:**
- Manual: Try to fund an account with an invalid card number (wrong length, fails Luhn) — both client and server should reject it with a clear error.
- Manual: Try a valid card number (e.g., 4111111111111111 for Visa test) — should be accepted.
- Automated: Add unit/integration tests for the Luhn check and endpoint validation.

---

### Ticket VAL-207: Routing Number Optional
**Priority:** High  
**Reported by:** Support Team  

**Description:** Bank transfers submitted without routing numbers.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket VAL-208: Weak Password Requirements
**Priority:** Critical  
**Reported by:** Security Team  

**Description:** Password validation only checks length.  

**Root Cause:** Password validation on signup (`app/signup/page.tsx`) only enforced a minimum length and checks against common passwords; it lacked complexity rules (uppercase, lowercase, digit, symbol). This allows weak passwords that are easier to guess or brute-force.

**Fix Applied:**
- Client-side: Enhanced form validation in `app/signup/page.tsx` to require a minimum length of 10 characters (instead of 8), at least one uppercase letter, one lowercase letter, one digit, one symbol. This provides immediate user feedback.
- Server-side: Strengthened the Zod schema in `server/routers/auth.ts` to enforce the same rules. Server-side validation is authoritative and prevents bypassing client checks.

**Preventive Measures:**
- Enforce strong password requirements both client- and server-side.
- Consider adding password strength meters and guidance to help users choose secure passwords.
- Optionally implement rate limiting, account lockout, and encourage MFA for higher-risk accounts.
- Maintain a larger denylist of compromised/common passwords (e.g., use a service or repo of known weak passwords).

**Verification / Test:**
- Manual: Attempt to register with weak passwords (e.g., "password", "12345678", no uppercase, no symbol) — both client and server should reject them with clear messages.
- Manual: Attempt to register with a compliant password (e.g., "Str0ng!Pass") — should be accepted.
- Automated: Add unit/integration tests that validate enforcement and boundary cases.

---

### Ticket VAL-209: Amount Input Issues
**Priority:** Medium  
**Reported by:** Robert Lee  

**Description:** Multiple leading zeros accepted.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket VAL-210: Card Type Detection
**Priority:** High  
**Reported by:** Support Team  

**Description:** Only basic card prefixes detected.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

## Security Issues

### Ticket SEC-301: SSN Storage
**Priority:** Critical  
**Reported by:** Security Audit Team  

**Description:** SSNs stored in plaintext.  

**Root Cause:** The `users` table contained an `ssn` TEXT column and the signup flow inserted the raw SSN value directly into the database. This allowed SSNs to be stored in plaintext at rest.

**Fix Applied:**
- Replaced the plaintext `ssn` column with `ssn_hash` and `ssn_last4` in the application schema and DB creation SQL. `ssn_hash` stores an HMAC-SHA256 of the SSN using a server-side secret (`SSN_HASH_SECRET`) and `ssn_last4` stores only the last 4 digits for display purposes.
- Updated the signup flow (`server/routers/auth.ts`) to compute the HMAC and store `ssn_hash` and `ssn_last4` instead of the plaintext SSN. The system now requires `SSN_HASH_SECRET` to be set; signup will fail if it is missing.
- In development, a simple secret key is used in `.env`. In production, a secure random key should be set in environment variables.

**Preventive Measures:**
- Never store plaintext sensitive identifiers (SSNs, full credit card numbers, etc.). Store only irreversible hashes or encrypted values and limit who can access them.
- Use a keyed HMAC or envelope encryption with an external key management system for production.
- Require the hashing/encryption secret via environment variable and keep it in a secure vault.
- Add code review and automated scans to detect plaintext PII in code and schema changes.

**Verification / Test:**
- Signup flow now stores `ssn_hash` and `ssn_last4` in the `users` table; the `ssn` column no longer exists.
- Manual verification: create a new user and confirm `users` row contains `ssn_hash` (hex) and `ssn_last4` (4 digits), and that no plaintext SSN is present in DB.
- Recommended: run an automated scan of existing DB to detect any residual plaintext SSNs and perform a migration to replace them with hashed values.

---

### Ticket SEC-302: Insecure Random Numbers
**Priority:** High  
**Reported by:** Security Team  

**Description:** Account numbers generated with `Math.random()`.  

**Root Cause:** Account numbers were produced using `Math.random()`, which is a non-cryptographic PRNG and can be predictable in certain circumstances. Predictable account numbers increase risk of enumeration and targeted fraud.

**Fix Applied:**
- Replaced `Math.random()`-based generation with Node's `crypto.randomInt(0, 10_000_000_000)` to produce a uniformly distributed 10-digit account number. The change is in `server/routers/account.ts` in `generateAccountNumber()`.
- Existing uniqueness checks remain in place (the code still verifies generated numbers are not already present in the DB and retries when necessary), so the change preserves behavior while improving unpredictability.

**Preventive Measures:**
- Use cryptographically secure random functions (Node's `crypto` APIs or a dedicated RNG/KMS) for any security-sensitive identifiers.
- Limit information leaked about ID formats and avoid sequential or easily guessable identifiers.
- Add a code review or lint rule to flag uses of `Math.random()` in server-side code where unpredictability matters.

**Verification / Test:**
- Create multiple accounts and inspect the generated `account_number` values — they should look uniformly random and non-sequential.
- Optionally run a statistical test on a batch of generated numbers to ensure distribution.
- Confirm uniqueness by attempting to create multiple accounts quickly; the existing uniqueness loop should prevent duplicates.

---

### Ticket SEC-303: XSS Vulnerability
**Priority:** Critical  
**Reported by:** Security Audit  

**Description:** Unescaped HTML in transaction descriptions.  

**Root Cause:** Transaction descriptions were rendered into the DOM using `dangerouslySetInnerHTML` in the `TransactionList` component, which allowed untrusted input to be interpreted as HTML/JS and created a cross-site scripting (XSS) vector.

```
transaction.description ? <span dangerouslySetInnerHTML={{ __html: transaction.description }} /> : "-"}
```

**Fix Applied:**
- Replaced usage of `dangerouslySetInnerHTML` in `components/TransactionList.tsx` with plain-text rendering so React escapes any HTML. This prevents injected markup or scripts from executing in the browser.
```
{transaction.description ? <span>{transaction.description}</span> : "-"}
```
- Searched the codebase for other direct `innerHTML` or `dangerouslySetInnerHTML` uses; no other application source files use the unsafe pattern (only compiled `.next` artifacts).

**Preventive Measures:**
- Avoid `dangerouslySetInnerHTML` unless absolutely required and the HTML is produced by a trusted, sanitized source.
- When rich text is required, use a safe HTML-sanitization library (e.g., `dompurify`) and apply sanitization server-side or during input processing. This method wasn't used for this ticket because the transaction descriptions did not require any formatting.
- Add a linter rule or CI check to flag uses of `dangerouslySetInnerHTML` and similar APIs.

**Verification / Test:**
- Manual test: create a transaction with a description containing `<script>alert(1)</script>` and confirm the alert does not execute; the literal string should display instead.
- Automated test recommendation: add an integration test that posts a transaction with HTML in the description and asserts no script execution (or that the returned HTML is escaped).

---

### Ticket SEC-304: Session Management
**Priority:** High  
**Reported by:** DevOps Team  

**Description:** Multiple valid sessions per user, no invalidation.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

## Logic & Performance Issues

### Ticket PERF-401: Account Creation Error
**Priority:** Critical  
**Reported by:** Support Team  

**Description:** New accounts show $100 balance when DB operations fail.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket PERF-402: Logout Issues
**Priority:** Medium  
**Reported by:** QA Team  

**Description:** Logout reports success even when session remains active.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket PERF-403: Session Expiry
**Priority:** High  
**Reported by:** Security Team  

**Description:** Expiring sessions still considered valid until exact expiry time.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket PERF-404: Transaction Sorting
**Priority:** Medium  
**Reported by:** Jane Doe  

**Description:** Transaction order seems random.  

**Root Cause:** The `fundAccount` handler previously fetched the "created" transaction using a global `orderBy(created_at)` call without specifying descending order or filtering by `accountId`. That query could return an unrelated row (oldest or global-most-recent) instead of the transaction just inserted for the user's account. The transaction listing endpoint also did not specify ordering, leading to unpredictable presentation order.

**Fix Applied:**
- When fetching the newly-created transaction, the code now filters by `accountId` and orders by `created_at` descending, then by `id` descending, then limits to 1. This reliably returns the transaction most recently inserted for that account.
- The `getTransactions` endpoint now returns transactions ordered by `created_at` descending (newest-first) then by `id` descending so UI listing is deterministic.

**Preventive Measures:**
- Always filter and order queries explicitly when fetching recently inserted rows; prefer using `RETURNING` where supported to get the inserted row directly.
- Avoid relying on default order; specify `ORDER BY` with direction in queries and API responses.
- Add integration tests that create multiple transactions across accounts and assert each account's history contains only its own transactions in the expected order.

**Verification / Test:**
- Manual: perform multiple funding events on a single account and confirm all transactions appear in the account history in newest-first order.
- Manual: perform concurrent funding events across multiple accounts and confirm each account's transaction history only contains its own transactions.
- Recommended: add automated tests to cover batched/concurrent inserts and listing behavior.

---

### Ticket PERF-405: Missing Transactions
**Priority:** Critical  
**Reported by:** Multiple Users  

**Description:** Not all transactions appear after multiple funding events.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket PERF-406: Balance Calculation
**Priority:** Critical  
**Reported by:** Finance Team  

**Description:** Account balances become incorrect after many transactions.  

**Root Cause:** Two main issues in `server/routers/account.ts` combined to produce incorrect balances:
- Floating-point arithmetic producing cumulative rounding drift when adding many small amounts in the odd loop method used to calculate the final balance:
```
for (let i = 0; i < 100; i++) {
    finalBalance = finalBalance + amount / 100;
}
```
- Balance updates were performed non-atomically: the code read the current balance, computed a new balance, then updated the row. Under concurrent funding requests this allowed lost updates (read-modify-write races) and out-of-order writes.

**Fix Applied:**
- Make funding an atomic operation by performing the transaction insert and balance update inside a single DB transaction (`db.transaction(...)`). This prevents race conditions where concurrent requests read the same balance.
- Re-read the account's balance inside the DB transaction before computing the new balance, ensuring the update is based on the most recent value.
- Round balances to two decimal places when computing and persisting them to avoid cumulative floating-point drift in presentation and storage. The code computes `Number((balance + amount).toFixed(2))` and persists that value.
- Remove the weird loop that calculates the final balance.

**Preventive Measures:**
- Prefer storing monetary values as integer cents or use a fixed-point/decimal column type to avoid floating-point rounding issues.
- Always perform money-related updates inside DB transactions and, where possible, use DB-side expressions (e.g., `UPDATE accounts SET balance = balance + ? WHERE id = ?`) to avoid read-modify-write races.
- Add integration tests that perform many concurrent funding operations and assert the final stored balance matches the sum of all applied transactions.

**Verification / Test:**
- Manual: run many funding operations in rapid succession against an account and verify that `getTransactions` shows all entries and the account `balance` equals the sum of transactions (rounded to 2 decimals).
- Automated: add a test harness that fires many concurrent requests against the `fundAccount` procedure and verifies the final persisted balance matches the expected total in cents.

---

### Ticket PERF-407: Performance Degradation
**Priority:** High  
**Reported by:** DevOps  

**Description:** System slows down when processing multiple transactions.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

---

### Ticket PERF-408: Resource Leak
**Priority:** Critical  
**Reported by:** System Monitoring  

**Description:** Database connections remain open.  

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_
