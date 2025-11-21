# SecureBank Technical Take-Home
**Author:** Regis Zhao  
**Date:** YYYY-MM-DD  

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

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

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

**Root Cause:** _[...]_  

**Fix Applied:** _[...]_  

**Preventive Measures:** _[...]_  

**Verification / Test:** _[...]_

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
