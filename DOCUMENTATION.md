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

**Root Cause:** _[Explain root cause]_  

**Fix Applied:** _[Explain fix, e.g., min/max date validation]_  

**Preventive Measures:** _[Validation policies]_  

**Verification / Test:** _[Unit test or manual check]_

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

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

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

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

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

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

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

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

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

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

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
