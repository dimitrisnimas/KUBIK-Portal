# KUBIK Portal rewrite specification

**Status:** implementation-ready; access/workspace and assets/catalog vertical slices implemented.
**Product mode:** public portfolio/demo application.  
**Environments:** local development and production on Vercel + Render. There is no staging environment.

## Product boundary

Every verified visitor receives a new, isolated `DemoWorkspace` populated from deterministic seed definitions. Workspace-owned data never carries into a later session and is deleted on logout or expiry. A visitor can choose a simulated client or administrator persona only when `Demo__Enabled=true`. No code in this repository integrates with production KUBIK identity, billing, Nexus, banking, or other internal infrastructure.

The system is a feature-oriented modular monolith: ASP.NET Core 10 and EF Core own business rules and PostgreSQL persistence; Next.js 16 App Router owns the Greek interface. Vercel proxies browser `/api/*` calls to Render to retain same-origin HTTP-only cookie authentication.

## Domain model

| Entity | Purpose and rule |
|---|---|
| `DemoWorkspace` | Root of one temporary verified session; owns an expiry and seed version. |
| `DemoSession` | Server-side session record linked to one selected persona and workspace. |
| `DemoPersona` | Seeded client or administrator identity; always described as simulated in the UI. |
| `ManagedAsset` | Client-owned digital asset with a distinct asset type and zero or one service package. |
| `ServiceCategory` | Classification for the service catalog; deliberately separate from asset type. |
| `ServicePackage` | Current package offering. No lifecycle, scheduling, or subscription history exists in v1. |
| `SupportTicket` | Future slice: request and conversation whose billing decision belongs only to an administrator. |
| `TicketBillingDecision` | Future slice: auditable covered/chargeable decision with price only for chargeable work. |
| `Invoice` | Future slice: structured billing data used to generate a deterministic Greek PDF on demand. |
| `PaymentDeclaration` | Future slice: manual bank-transfer simulation with `PendingReview`, `Approved`, `Rejected`. |

Every workspace-owned table has `workspace_id`. EF query filters apply the current workspace and database foreign keys cascade from `DemoWorkspace`. Assets and service categories remain separate concepts because they classify different things; introducing a shared abstraction would add coupling without a current rule that needs it.

Attachments are absent from v1. A future attachment entity belongs to a ticket message and uses private object storage, authorized upload/download, file-size and MIME allow-lists, generated keys, resource authorization, malware scanning where appropriate, and workspace-expiry cleanup.

## Feature parity decisions

| Capability | v1 decision |
|---|---|
| Email OTP and persona selection | Keep; create a new workspace after every successful verification. |
| Client/admin dashboard and managed assets | Keep and modernize in Greek. |
| Service catalog and one package per asset | Keep with a simple direct relationship. |
| Ticket conversation | Implement in the next slice. |
| Client-selected ticket chargeability | Remove; only administrators can make the decision. |
| Ticket attachments and object storage | Remove from v1. |
| Structured invoices and generated PDF | Implement later in v1; never upload or store an authoritative PDF. |
| Bank-transfer declaration | Implement later in v1 with explicit review states; approval alone pays the invoice. |
| Editable email templates and queue worker | Remove; use typed, version-controlled source templates and direct bounded delivery. |
| Accounts, passwords, collaborators, wallet | Remove. |
| Subscription history, upgrades, downgrades, cancellation | Remove. |
| GA, GTM, tracking pixels and cookies | Remove. |
| Fake backups and placeholder controls | Remove without replacement UI. |

## API design

Implemented endpoints:

| Method | Endpoint | Behavior |
|---|---|---|
| `POST` | `/api/v1/auth/request-code` | Validates email and simulated role, rate-limits requests, creates a short-lived OTP challenge. |
| `POST` | `/api/v1/auth/verify-code` | Atomically consumes the challenge, seeds a new workspace, and issues the encrypted session cookie. |
| `GET` | `/api/v1/session` | Revalidates server-side session/workspace state and returns persona plus CSRF token. |
| `POST` | `/api/v1/auth/logout` | Validates CSRF, deletes the workspace through cascade, and clears the cookie. |
| `GET` | `/api/v1/dashboard` | Returns role-scoped dashboard metrics. |
| `GET` | `/api/v1/assets` | Returns only assets visible to the current simulated persona. |
| `POST/PUT/DELETE` | `/api/v1/assets/*` | Creates or mutates only the client-owned asset scope; every mutation requires CSRF. |
| `GET` | `/api/v1/catalog` | Returns active client offerings or the full administrator catalog. |
| `PATCH` | `/api/v1/admin/assets/{id}/status` | Changes asset status for the simulated administrator only. |
| `POST/PUT/DELETE` | `/api/v1/admin/service-categories/*` | Administrator-only category management. |
| `POST/PUT/DELETE` | `/api/v1/admin/service-packages/*` | Administrator-only package and feature management. |
| `GET` | `/health`, `/health/ready` | Liveness and PostgreSQL readiness. |

Planned endpoints follow resource-oriented feature groups for tickets, catalog, invoices, PDFs, and payment declarations. Mutation handlers enforce workspace ownership from the server-side session. Billing fields from client requests are never accepted as authoritative. Approval of a payment declaration and marking its invoice paid occur in one database transaction.

## Roadmap

1. **Access and workspace foundation — implemented:** OTP, persona choice, deterministic seed, row isolation, expiry cleanup, Greek dashboard, asset list, same-origin proxy, deployment and CI.
2. **Assets and service catalog — implemented:** client/admin CRUD rules with one package per asset, catalog constraints and Greek management UI.
3. **Tickets:** conversation messages, explicit state machine, and administrator-only auditable billing decision. No attachments.
4. **Billing:** structured invoices, deterministic Greek PDF generation, and manual payment declaration review.
5. **Production hardening:** operational counters and error telemetry without personal data, accessibility and E2E coverage, Render/Vercel production verification.

No blocking product or architecture questions remain. Implementation details with multiple valid solutions are resolved within these boundaries without expanding scope.
