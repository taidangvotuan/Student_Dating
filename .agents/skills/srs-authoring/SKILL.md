---
name: srs-authoring
description: Author comprehensive, industry-standard Software Requirements Specifications (SRS) based on IEEE 830 / ISO 29148. Use when the user asks to create an SRS, write software requirements, define functional/non-functional specifications, user stories with acceptance criteria, or build a complete product specification before coding.
---

# Software Requirements Specification (SRS) Authoring

Author formal, structured, and unambiguous Software Requirements Specifications (SRS) that bridge high-level product intent with concrete technical execution.

## When to Use
- Starting a new software system or substantial module from scratch.
- The user requests an SRS, PRD, or detailed requirements document.
- Prior to database design and architectural planning.
- When requirements are vague and need formal structuring into functional/non-functional specs and use cases.

## Core Process: The 5-Phase Requirements Pipeline

```mermaid
flowchart LR
    A["1. Discovery & Scope"] --> B["2. Actor & Use Case Modeling"]
    B --> C["3. Functional Decomposition"]
    C --> D["4. Non-Functional & SLA"]
    D --> E["5. Traceability & Review"]
```

### Phase 1: Problem Definition & Scope Boundaries
1. **Define the Bounded Context**: State explicitly what the software is, who it is for, and why it exists.
2. **Explicit Boundary Fencing**:
   - **In-Scope**: Essential core features for MVP / Release 1.
   - **Out-of-Scope (YAGNI)**: Features explicitly deferred to future phases to prevent scope creep.

### Phase 2: User Persona & Use Case Modeling
1. Identify all **Actors**:
   - Human Users (e.g., Unauthenticated Visitor, Registered Customer, System Admin).
   - External Systems (e.g., Stripe Payment Gateway, SendGrid Email Service, OAuth Provider).
2. For each major user journey, write:
   - **User Story**: `As a <role>, I want to <action>, so that <benefit>`.
   - **Preconditions**: State of the system before the action starts.
   - **Main Success Scenario**: Numbered chronological flow.
   - **Alternative / Exceptional Flows**: What happens on invalid input, network timeout, or unauthorized access.

### Phase 3: Functional Requirements (FR) Specification
Each functional requirement must be **atomic, uniquely identifiable, testable, and unambiguous**:
- **Format**: `FR-[MODULE]-[NUMBER]: The system SHALL <capability> when <trigger>.`
- **Avoid Ambiguous Words**: Never use words like *fast, user-friendly, robust, adequate, as appropriate*. Use measurable thresholds.
- **Acceptance Criteria (Gherkin BDD)**:
  ```gherkin
  Scenario: Successful user checkout with discount coupon
    Given a user with a cart valued at $100 and a valid coupon "SAVE20"
    When the user applies the coupon and confirms checkout
    Then the final charge SHALL be $80
    And an order confirmation email SHALL be dispatched within 5 seconds
  ```

### Phase 4: Non-Functional Requirements (NFR / Quality Attributes)
Quantify quality metrics according to ISO 25010:
1. **Performance & Latency**: P95 response time < 200ms for read endpoints; P99 < 500ms for write endpoints under 1,000 req/sec load.
2. **Availability & Reliability**: 99.9% uptime SLA; zero unhandled 500 errors; graceful degradation on third-party service outage.
3. **Security & Compliance**:
   - Authentication (JWT with short expiry + secure HTTP-only refresh cookies).
   - Authorization (Role-Based Access Control / RBAC).
   - Data Protection: Encryption in transit (TLS 1.3) and at rest (AES-256). OWASP Top 10 mitigation.
4. **Data Integrity & Retention**: ACID compliance for transactional ledger; automated daily database backups with point-in-time recovery.

### Phase 5: Data & Interface Requirements
1. Specify external APIs, protocols (REST / gRPC / WebSocket), and payload formats.
2. Define data volume assumptions (e.g., estimated DAU, reads/writes per second, storage growth rate per month) to inform the downstream **Database Design phase**.

## Output Standard
Generate the final specification in `docs/srs/SRS-[MODULE].md` using the template at `workflows/templates/SRS-TEMPLATE.md`.
