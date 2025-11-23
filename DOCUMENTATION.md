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

**Fix Applied:**
- Client-side: `app/signup/page.tsx` now performs stricter email validation (better regex) and detects common TLD typos (`.con`, `.cmo`, `.cm`, `.om`) and returns a helpful message (e.g., "did you mean .com?"). The UI also displays a small hint when a user types an email with uppercase characters informing them that the system will normalize the email to lowercase for login/uniqueness.
- Server-side: `server/routers/auth.ts` now preserves the original email input for display, but canonicalizes (lowercases and trims) the email for lookup and storage to enforce uniqueness reliably. The server also performs the same TLD typo detection and rejects suspicious domains with a `BAD_REQUEST` error.

**Preventive Measures:**
- Normalize emails to a canonical format for storage and lookups, but preserve the user's original input for display so they aren't surprised by automatic changes.
- Validate domains for common typos and provide helpful error messages to users.
- Add unit tests around email normalization and common typo detection.

**Verification / Test:**
- Manual: Attempt to sign up with `TEST@example.com` — account should be created using the canonical `test@example.com` for lookups but the UI should indicate the normalization and preserve the original as `displayEmail`.
- Manual: Try `user@domain.con` — the client should warn and the server should reject with a helpful message.
- Automated: Add tests validating the normalization behavior and rejection of common TLD typos.

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

**Root Cause:** The signup form and server-side schema accepted any 2-letter string as a state code (or uppercased it server-side) but did not restrict values to the official USPS two-letter state codes. This allowed invalid values like `XX` to pass validation and caused downstream address verification errors.

**Fix Applied:**
- Created `lib/constants.ts` to store constants -- in this case, a list of US States.
- Client-side: `app/signup/page.tsx` now validates the `state` input against a whitelist of valid 2-letter US state codes (including `DC`). The check is case-insensitive (input is uppercased for validation) and returns a clear message when invalid.
- Server-side: `server/routers/auth.ts` now enforces the same whitelist in the Zod schema for `signup` (transforms the input to uppercase and rejects values not in the allowed set). Server-side validation is authoritative and will reject invalid state codes even if client-side checks are bypassed.

**Preventive Measures:**
- Use a canonical whitelist for state/region codes on both client and server; consider extracting the list into a shared module if used in multiple places.
- If you accept international addresses, add a country selector and validate state/province codes per country accordingly.
- Add unit tests for address field validation to prevent regressions.

**Verification / Test:**
- Manual: attempt to sign up with `state: 'XX'` — client should show "Use a valid 2-letter US state code" and the server should reject if the client is bypassed.
- Manual: sign up with `state: 'ca'` (lowercase) — client should accept after normalization and server should store `CA`.
- Automated: add tests that assert server rejects invalid state codes and accepts all official US state codes plus `DC`.

---

### Ticket VAL-204: Phone Number Format
**Priority:** Medium  
**Reported by:** John Smith  

**Description:** International phone numbers not validated properly.  

**Root Cause:** The client-side signup form (`app/signup/page.tsx`) validated phone numbers as exactly 10 digits (US-only), while the server-side Zod schema permitted a different pattern. This led to inconsistent behavior and allowed some non-international-friendly inputs (or invalid local-only numbers) to pass or fail unexpectedly.

**Fix Applied:**
- Client-side: `app/signup/page.tsx` now validates phone numbers using an international-friendly pattern: optional leading `+` and between 7 and 15 digits (regex: `^\+?\d{7,15}$`). The input placeholder shows an international example (e.g., `+12135551234`).
- Server-side: `server/routers/auth.ts` phone validation updated to accept the same format (optional `+`, 7–15 digits). The server returns a validation error if the input doesn't match this pattern.

**Preventive Measures:**
- For robust phone validation and formatting, use a dedicated library such as `libphonenumber-js` or Google's `libphonenumber` via a lightweight wrapper. Those libraries handle country-specific rules, formatting, and normalization to E.164.
- Keep client and server validation in sync or share a small validation helper to avoid mismatches.

**Verification / Test:**
- Manual: try signup with international numbers such as `+442071838750` or `+12135551234` — client should accept and server should accept the request.
- Manual: try an invalid phone like `12345` — client should reject with a clear message and server should also reject if bypassed.
- Automated: add unit tests validating a set of known-good and known-bad numbers, or integrate `libphonenumber-js` in tests to assert normalization to E.164.

---

### Ticket VAL-205: Zero Amount Funding
**Priority:** High  
**Reported by:** Lisa Johnson  

**Description:** Funding requests of $0.00 are accepted.  

**Root Cause:** The client-side validation allowed values that could be parsed as zero (e.g. "0.00") and server-side checks were permissive in some cases. This led to zero-amount funding requests creating unnecessary transaction records.

**Fix Applied:**
- Client-side: `components/FundingModal.tsx` now validates the amount string and enforces a minimum of `$0.01` via a custom `validate` function, ensuring users cannot submit `0.00`.
- Server-side: `server/routers/account.ts` now requires `amount` to be a number >= `0.01` (Zod `min(0.01)`), so any bypass of client checks is rejected server-side with a clear error message.

**Preventive Measures:**
- Always enforce monetary lower/upper bounds both client- and server-side; server-side is authoritative.
- Consider normalizing monetary inputs to integer cents early in the request pipeline to avoid floating-point edge cases.

**Verification / Test:**
- Manual: attempt to fund with `0.00` — client should reject with "Amount must be at least $0.01".
- Manual: bypass client checks (e.g., craft API call) and send `amount: 0` — server should reject the request with a `BAD_REQUEST`/validation error.
- Automated: add unit tests to assert client validation and server-side Zod enforcement behave as expected.

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

**Root Cause:** The client sometimes submitted bank funding requests without `routingNumber`, and server-side validation did not require or validate routing numbers when `fundingSource.type` was `bank`. This allowed incomplete ACH transfer requests to be created which subsequently failed during processing.

**Fix Applied:**
- Client-side: the funding UI (`components/FundingModal.tsx`) already marks the routing number input as required when the funding type is `bank`. (No change required here beyond existing behavior.)
- Server-side: strengthened the Zod validation for the `fundAccount` procedure in `server/routers/account.ts` to require a `routingNumber` when `fundingSource.type === 'bank'` and to validate that the routing number is exactly 9 digits. Validation is implemented with `superRefine(...)` so field-specific errors are returned for `accountNumber` or `routingNumber` as appropriate.

**Preventive Measures:**
- Always validate interdependent input fields server-side (e.g., require routing numbers when funding type is `bank`) — client-side checks are helpful but not authoritative.
- Add unit/integration tests that exercise funding with different `fundingSource.type` values to ensure required fields are enforced.
- Log and monitor failed funding attempts that are missing required banking fields so support can proactively surface patterns from user reports.

**Verification / Test:**
- Manual: attempt to call the `fundAccount` RPC (or submit the funding form) with `fundingSource.type: 'bank'` and omit `routingNumber` — the server should return a validation error indicating the routing number is required and must be 9 digits.
- Manual: supply an invalid routing number (e.g., `12345678`) and verify the server rejects it with the same validation error.
- Automated: add a unit/integration test that calls the `fundAccount` procedure for both `card` and `bank` funding sources; assert that `bank` requests without `routingNumber` are rejected and valid `bank` requests succeed.

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

**Root Cause:** The original validation in `server/routers/account.ts` and `components/FundingModal.tsx` used only a small set of prefix/length checks which excluded valid card numbers (for example, American Express with 15 digits and some other networks with 13 or 19 digits). This caused valid cards to be rejected in some cases.

**Fix Applied:**
- Server-side: the `fundAccount` Zod schema now performs a Luhn check and accepts card numbers between 13 and 19 digits (inclusive). This change is implemented in `server/routers/account.ts` and ensures popular card lengths such as 15 (Amex) are accepted.
- Client-side: `components/FundingModal.tsx` was updated to accept card numbers between 13 and 19 digits and to perform a Luhn check for immediate user feedback.

Note: validation still does not attempt to map a card number to a specific brand extensively; it focuses on syntactic validity (length + Luhn). For robust card-brand detection (e.g., Visa, Mastercard, Amex, Discover) and BIN/range handling, consider using a dedicated library such as `credit-card-type` or `card-validator` which maintain up-to-date BIN ranges.

**Preventive Measures:**
- Perform both Luhn and length checks server-side to prevent false rejections while avoiding reliance on brittle prefix-only logic.
- If business logic depends on specific card brands, adopt a tested BIN-detection library rather than ad-hoc prefix lists.
- Add unit tests for common card number edge cases (13, 15, 16, 19 digits) and for known-good test numbers (e.g., `4111111111111111`, `378282246310005`).

**Verification / Test:**
- Manual: try funding with 15-digit Amex test number `378282246310005` — client should accept the input and server should accept the request (Luhn passes).
- Manual: try known valid 16-digit Visa test number `4111111111111111` — should be accepted as before.
- Automated: add tests that validate the endpoint accepts valid card numbers of lengths 13–19 and rejects numbers that fail Luhn or contain non-digit characters.

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

**Root Cause:** The authentication flow in `server/routers/auth.ts` created new session rows in the `sessions` table on every login or signup without invalidating previous sessions for the same user. There was no policy to rotate tokens or restrict concurrent sessions.

**Fix Applied:**
- On `signup` and `login`, the server now invalidates (deletes) any existing sessions for the user before creating a new session. This enforces a single active session per user and rotates tokens on new logins.
```
await db.delete(sessions).where(eq(sessions.userId, user.id));
```
- The `logout` endpoint continues to delete the session associated with the request's cookie/token.
- Added a `useEffect` in `app/dashboard/page.tsx` that monitors the `getAccounts` query for errors (`isError`/`error`) and automatically redirects the user from `/dashboard` to `/` if the error indicates an `"UNAUTHORIZED"`

**Preventive Measures:**
- Consider more flexible policies depending on requirements: allow multiple sessions but provide a user-facing session management UI that lists and revokes active sessions, or restrict to single-session as done here.
- Implement server-side session introspection and a long-term session revocation list for immediate invalidation of leaked tokens.
- Add monitoring to detect unusual session creation patterns (e.g., many new sessions for the same account in short time) and trigger alerts or rate limiting.

**Verification / Test:**
- Manual: login with account A in browser 1, then login with the same account in browser 2. Ensure the session token from browser 1 is invalidated (requests return unauthorized) and only browser 2 remains logged in.
- Manual: after login, check `sessions` table — it should contain at most one active row per user.
- Automated: add an integration test that logs in twice and asserts only a single session row exists for the user and the earlier token no longer grants access.

**Files changed:** `server/routers/auth.ts` and `app/dashboard/page.tsx` — invalidate previous sessions on login/signup and redirect to homepage on those sessions

---

## Logic & Performance Issues

### Ticket PERF-401: Account Creation Error
**Priority:** Critical
**Reported by:** Support Team  

**Description:** New accounts show $100 balance when DB operations fail.  

**Root Cause:** The account creation flow in `server/routers/account.ts` performed an insert and then fetched the inserted row separately. In failure modes (e.g., a partial DB error, race, or driver oddity) the insert or fetch could fail and the API previously returned a fabricated fallback account object with `balance: 100`. That caused the UI to present incorrect balances to users.

**Fix Applied:**
- Wrapped account number generation, insert, and fetch inside a single synchronous DB transaction (`db.transaction(...)`) to guarantee atomicity and avoid partial state. The transaction performs the insert then reads back the inserted row and returns it. If the fetch or insert fails the transaction aborts and an error is thrown to the client.
- Added a retry loop inside the transaction to handle rare collisions when generating a random account number (up to 5 attempts). If creation still fails after retries an `INTERNAL_SERVER_ERROR` is thrown rather than returning fabricated data.

**Preventive Measures:**
- Prefer performing multi-step operations inside DB transactions to ensure atomicity and avoid partial-visible states.
- Where supported, use `RETURNING` clauses or ORM features that return the inserted row directly to avoid an extra fetch. When not available, read back the inserted row inside the same transaction.
- Add monitoring/logging around DB errors and unique-constraint collisions to detect unusual rates of failures.

**Verification / Test:**
- Manual: create a new account and confirm the returned account has `balance: 0` and the account exists in the `accounts` table.
- Manual failure simulation: temporarily inject an error into the insert path (or lock the DB) and confirm the API returns an error instead of a fabricated account object.
- Automated: add an integration test that attempts account creation and asserts that on transient insertion failures the API surface an error and no fake account object is returned.

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

**Root Cause:** In `server/trpc.ts`, we see that the server treats a session as valid up until its exact expiry timestamp. This created a small window of elevated risk where a token that was only seconds from expiration could still be used to perform sensitive actions.

**Fix Applied:**
- Server-side: the request context creation now treats sessions that are within a small configurable buffer of expiry as expired and proactively invalidates them. The buffer is configurable via the environment variable `SESSION_EXPIRY_BUFFER_MS` (default: `60000` ms = 1 minute). If a session has <= buffer remaining, the server deletes the session row and treats the request as unauthenticated.
- This behavior is implemented in `server/trpc.ts` within `createContext()`
- Note that it is unclear to me why early invalidation is different from just moving the expiry time up. The risk window is the same, just shifted earlier.

**Preventive Measures:**
- Use a configurable safety buffer for session validity checks to avoid allowing very-near-expiry tokens to be used. This reduces time-of-use risk when tokens are close to their expiry boundary.
- Consider implementing a proper refresh-token flow instead of long-lived single tokens. With refresh tokens you can issue short-lived access tokens and refresh them securely when necessary.
- Add monitoring/alerts for high rates of session invalidations or refresh failures to detect systemic issues.

**Verification / Test:**
- Manual: set `SESSION_EXPIRY_BUFFER_MS=60000` (default) and create a session with an expiry timestamp 30 seconds in the future; requests using that token should be rejected as unauthorized and the session row should be removed from the `sessions` table.
- Manual: create a session with more than `buffer` remaining and confirm requests succeed.
- Automated: add integration tests that simulate tokens with various remaining lifetimes and assert the server accepts/rejects according to the configured buffer.

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

**Root Cause:** Having difficulties reproducing this bug. Tried funding accounts multiple times, as well as in rapid succession, but all transactions seem to be present. Will look into other methods or possible reasons why this bug is occurring.

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

**Root Cause:** 
- Performance testing shows that transaction creation time increases linearly as number of existing transactions grows.
- This shows that there is no performance degradation -- each transaction takes the same amount of time to complete.
- No quadratic or exponential behavior was observed
- Recent architectural changes may have removed avoidable overhead

**Fix Applied:**
- Consolidated database usage into a single long-lived database connection in `PERF-408`, removing repeated connection setup/teardown overhead. 
- Cleaned up handlers to ensure there are no redundant awaits or nested operations contributing artificial delays.

**Preventive Measures:**
- Continue monitoring transaction throughput against baseline performance.
- Revisit query/index design if future requirements demand sub-linear scaling.

**Verification / Test:** _[...]_
- Added an integration test `tests/perf/perf-407.test.ts` which creates a test user and account, fires a batch of parallel `fundAccount` RPC calls and verifies final balance and transaction count.

**Notes:**
- Adjust the `iterations` value in `tests/perf/perf-407.test.ts` to simulate higher load.

---

### Ticket PERF-408: Resource Leak
**Priority:** Critical  
**Reported by:** System Monitoring  

**Description:** Database connections remain open.

**Root Cause:** The application created multiple `better-sqlite3` `Database` instances (via `new Database(dbPath)`) during imports and pushed them into an array without ever closing them. Only one connection was actually used by Drizzle (`db`), so the extra connections leaked file descriptors.

**Fix Applied:**
- Consolidated the DB initialization to a single long-lived `better-sqlite3` connection (`sqlite`) that is wrapped by Drizzle (`db`) and used across the app (`lib/db/index.ts`). Removed the unused `connections` array and prevented creating extra connections on import.
- Added graceful shutdown handlers in `lib/db/index.ts` to close the SQLite connection on process exit or fatal signals (`SIGINT`, `SIGTERM`, `uncaughtException`, `unhandledRejection`). The shutdown handler calls `sqlite.close()` and logs the action.
- Reviewed local scripts (e.g., `scripts/db-utils.js`) to ensure they call `db.close()`.

**Preventive Measures:**
- Use a single shared DB connection for long-lived server processes; avoid creating new DB connections per import or per request.
- For serverless environments or short-lived CLI scripts, open and close `better-sqlite3` connections within the script scope and call `.close()` when finished.
- Add monitoring and alerts for file descriptor growth and unexpected handle counts during load testing.
- Add a lint rule or code-review checklist item to flag creation of raw DB connections outside `lib/db/index.ts`.

**Verification / Test:**
- Manual: start the dev server (`npm run dev`), then stop it with Ctrl+C and verify console shows "SQLite connection closed gracefully." Confirm no lingering processes have `bank.db` open (use `lsof` on Unix or appropriate tools on Windows).
- Manual: run the app through a stress test that repeatedly imports code paths that would previously create new connections and observe the OS handle count — it should remain stable.
- Automated: add an integration test or monitoring script that records open file descriptors before and after starting/stopping the server; assert no descriptor leak.

**Files changed:** `lib/db/index.ts` — consolidated connection handling and added graceful shutdown logic.
