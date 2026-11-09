# Security Policy & Vulnerability Disclosure

**BuilderBrix Fraud Intelligence Platform**  
**Document Version:** 1.3.0 (Pre-Launch Production Hardening)  
**Last Updated:** November 2026  
**Governing Standards:** CERT-In Vulnerability Reporting Guidelines, DPDP Act 2023, ISO/IEC 29147, OWASP ASVS 4.0

---

## 1. Supported Versions

We provide active security updates, vulnerability patches, and threat intelligence updates for the following versions:

| Version | Next.js Engine | Supported | Security Patch SLA |
| :--- | :--- | :--- | :--- |
| **v1.3.x (Current / Main)** | **Next.js 16.4.5 (Active LTS)** | :white_check_mark: Yes | Critical: < 24h, High: < 48h |
| **v1.2.x** | Next.js 15.x | :warning: Maintenance | High / Critical only (< 7 days) |
| **< v1.2.0** | Next.js 14.x | :x: No (Deprecated) | Upgrade immediately |

---

## 2. Reporting a Vulnerability

The BuilderBrix Security Architecture team welcomes vulnerability reports from independent security researchers, ethical hackers, CERT-In constituents, and the wider open-source community.

### 2.1. Security Contact Channels
- **Primary Security Email:** `security@builderbrix.in`
- **PGP Fingerprint:** `4B9F 82A1 C3D7 E569 0112 F874 A92E 33C1 7845 DB20`
- **Grievance Redressal / DPDP Officer:** `grievance@builderbrix.in`
- **Emergency Incident Response Cell:** `incident@builderbrix.in`

### 2.2. Service Level Agreement (SLA)
- **Initial Acknowledgment:** Within **24 hours**
- **Triage & Severity Assessment:** Within **48 hours**
- **Status Updates:** Every **72 hours** until remediation is deployed
- **Public Disclosure Date:** Coordinated following a mutually agreed 30-day disclosure embargo after fix verification.

---

## 3. Coordinated Vulnerability Disclosure & Safe Harbor

We consider ethical security research vital to maintaining citizen trust. If you conduct vulnerability research in good faith and comply with this policy, BuilderBrix pledges:
- **No Legal Action:** We will not initiate or support legal proceedings under the Information Technology Act, 2000 or the Digital Personal Data Protection Act, 2023 for authorized testing.
- **Credit & Hall of Fame:** Public attribution on our Security Hall of Fame (unless anonymity is requested).
- **Safe Harbor Scope:** Testing must target only BuilderBrix infrastructure directly within the documented scope.

### 3.1. Guidelines for Responsible Research
- Stop testing immediately and report findings if you encounter personal data (DPDP Data Principal information). Do not view, download, modify, or retain external citizen data.
- Do not execute Denial of Service (DoS / DDoS) attacks or degrade system availability for citizens.
- Do not perform social engineering, phishing, or physical attacks against employees or infrastructure providers.
- Maintain strict confidentiality of the vulnerability until official patches are deployed.

---

## 4. Scope

### 4.1. In-Scope Targets
- Public citizen checking API endpoints: `/api/check`, `/api/check-image`, `/api/check-url`
- Authenticated RBAC management & telemetry: `/api/events`, `/api/models`, `/api/audit`, `/api/auth`
- Session authentication mechanisms (`lib/auth/session.ts`)
- Fraud intelligence heuristics and scoring pipeline (`lib/engine/*`)
- Web application interface and Client-Side Security Headers (`middleware.ts`)

### 4.2. Out-of-Scope Targets
- Third-party telecommunications networks or SMS gateways
- Third-party DNS resolvers (unless demonstrable DNS rebinding bypasses `assessUrlSafetyAsync`)
- Denial of Service / Distributed Denial of Service (volumetric traffic floods)
- Theoretical vulnerabilities without practical exploit scenarios
- Self-XSS (requiring user to paste JavaScript directly into browser devtools)

---

## 5. Architectural Threat Model & Implemented Mitigations

| Threat Vector | Potential Impact | Implemented Mitigation | Verification |
| :--- | :--- | :--- | :--- |
| **Server-Side Request Forgery (SSRF)** | Access to internal metadata services (169.254.169.254) or private cloud services. | Strict asynchronous DNS resolution (`assessUrlSafetyAsync`), blocking 127.0.0.1, 0.0.0.0, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, IPv6 loopbacks (`::1`), decimal/octal/hex representations. | Automated SSRF test suite in `tests/security.test.ts`. |
| **Regular Expression Denial of Service (ReDoS)** | CPU starvation via catastrophic backtracking on long inputs. | Regex bounds limiting patterns, maximum payload length constraints (15,000 characters enforced via Zod), non-backtracking lookaheads. | Latency verified at < 1ms / sample across 65 adversarial benchmarks. |
| **Malicious File Upload / Buffer Exploit** | Remote Code Execution via crafted binary image payloads in OCR parser. | Strict magic-byte inspection (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF..WEBP`), 5MB payload limit, isolated worker process with strict 12,000ms timeout. | Verified via magic-byte unit tests in `tests/security.test.ts`. |
| **Session Hijacking / Privilege Escalation** | Unauthorized access to analyst telemetry or administrative model registry. | Cryptographically signed HMAC-SHA256 session tokens with `HttpOnly`, `Secure`, `SameSite=Lax` cookies; server-side token validation and revocation list. | Verified via session integrity tests in `tests/security.test.ts`. |
| **Adversarial Evasion / Unicode Obfuscation** | Bypass of fraud detection via zero-width spaces, Cyrillic homoglyphs, or invisible Unicode. | Comprehensive Unicode NFKC normalization, zero-width space substitution, homoglyph transliteration to Latin-1, case-folding prior to tokenization. | Tested against adversarial homoglyph/zero-width benchmarks (`tests/fraud-pipeline.test.ts`). |
| **PII & Credential Retention** | Privacy violation under DPDP Act 2023 Section 8(7). | In-memory regex credential sanitization (`sanitizeSensitiveCredentials`) purging OTPs, CVVs, card numbers, UPI PINs; default Ephemeral Processing Mode. | Verified across all test pipelines and DPDP compliance checklist. |
| **API Abuse & Brute Force** | Exhaustion of server compute, resource starvation. | Sliding-window IP rate limiting (60 requests/minute per IP) with automatic memory leak pruning. | Verified via rate-limiting test suite in `tests/security.test.ts`. |

---

## 6. Incident Response & CERT-In Reporting

In compliance with CERT-In directions under Section 70B of the Information Technology Act:
1. **Identification:** Anomalies detected via real-time velocity burst pipelines (`lib/engine/event-pipeline.ts`) or analyst alert triggers.
2. **Containment:** Malicious IP addresses, compromised session tokens, or poisoned model weights can be immediately revoked via `revokeSession()` and the `/dashboard/admin` model rollback controls.
3. **CERT-In Notification:** Mandatory 6-hour cybersecurity incident reporting to CERT-In (`incident@cert-in.org.in`) for qualifying incidents (e.g., unauthorized access, system outages, data integrity violations).
4. **Data Principal Notification:** In compliance with DPDP Act Section 8(6), affected Data Principals and the Data Protection Board of India (DPBI) will be notified without unreasonable delay in the event of any verified personal data breach.
