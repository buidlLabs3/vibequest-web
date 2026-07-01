# VibeQuest Product Architecture

VibeQuest is an AI gamified CKB/Fiber learning workbench. The product goal is simple: users can vibe-code with AI, but they only progress when they understand the generated code, can explain the trust boundary, and can verify failure cases.

## Product Loop

```mermaid
flowchart TD
    A["Learner Intent"] --> B["Profile Setup<br/>interests, goal, background, pace"]
    B --> C["AI Learning Engine"]
    C --> D["5-Module Learning Path"]
    D --> E["Lesson Study"]
    E --> F["Checkpoint Question"]
    E --> G["AI Tutor"]
    E --> H["Notebook Reflection"]
    F --> I{"Checkpoint Passed?"}
    I -- "No" --> E
    I -- "Yes" --> J["Practice Quest Unlock"]
    J --> K["Lesson-to-Quest Compiler"]
    K --> L["Generated Files"]
    K --> M["Denial Tests"]
    K --> N["Boss Challenge"]
    L --> O["Workbench Verification"]
    M --> O
    N --> O
    O --> P{"Checks + Boss Solved?"}
    P -- "No" --> O
    P -- "Yes" --> Q["Learning Record"]
    Q --> R["Ship Gate"]
    R --> S["JoyID Proof Envelope"]
    R --> T["Fiber Invoice Claim"]
```

## Runtime Architecture

```mermaid
flowchart LR
    U["User Browser"] --> FE["Next.js Frontend<br/>Learn, Workbench, Dashboard, Ship Gate"]
    FE --> WALLET["JoyID / CCC<br/>Wallet proof"]
    FE --> PROXY["Next.js API Proxy<br/>/api/core"]
    PROXY --> CORE["vibequest-core<br/>Rust + Axum"]
    CORE --> AI["OpenAI Responses API<br/>lesson seeds, quest seeds, tutors"]
    CORE --> DB[("MongoDB<br/>users, sessions, quests, rewards")]
    CORE --> CKB["CKB RPC<br/>readiness + CKB context"]
    CORE --> FIBER["Fiber RPC<br/>readiness + invoice rail"]
    CORE --> PROXY
```

## Core Product Surfaces

| Surface | Role | User Outcome |
| --- | --- | --- |
| Landing | Entry point and product framing | User understands VibeQuest is a learning workbench, not a generic generator |
| Learn | Interest-based modules, checkpoints, tutor, notes | User learns CKB/Fiber concepts before generating quests |
| Quest Run | Prompt and lesson-to-quest generation | User turns a learning objective into a practical quest |
| Workbench | Code explorer, file checks, code tutor, boss challenge | User verifies generated code and proves understanding |
| Dashboard | Lessons, quests, questions, notes, progress | User can resume, review, and track learning history |
| Ship Gate | Completion proof and reward claim preparation | User claims only after identity, checks, and boss proof pass |

## Data Ownership Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Next.js Web
    participant Core as Rust Core
    participant AI as OpenAI
    participant DB as MongoDB
    participant CKB as CKB RPC
    participant Fiber as Fiber RPC

    User->>Web: Connect JoyID wallet
    Web->>Core: Submit wallet proof
    Core->>DB: Upsert user session
    User->>Web: Select interests and goal
    Web->>Core: Generate learning module
    Core->>AI: Request compact lesson seed
    AI-->>Core: Lesson seed JSON
    Core->>DB: Save learning session
    Core-->>Web: 5-module learning path
    User->>Web: Pass checkpoint
    Web->>Core: Generate quest from lesson
    Core->>AI: Request compact quest seed
    Core->>CKB: Check CKB readiness
    Core->>Fiber: Check Fiber readiness
    Core->>DB: Save quest run
    Core-->>Web: Files, tests, boss challenge
    User->>Web: Run checks and solve boss
    Web->>Core: Persist progress
    Core->>DB: Save verification state
    User->>Web: Submit Fiber invoice
    Web->>Core: Complete quest
    Core->>DB: Save reward claim
```

## Backend Responsibilities

`vibequest-core` owns the trust-sensitive work:

- Validate JoyID wallet proof shape.
- Generate learning modules through OpenAI and normalize them into product-safe lesson structures.
- Generate quest seeds through OpenAI and compile them into verified workbench files.
- Store users, learning sessions, quest runs, boss attempts, tutor messages, and reward claims.
- Check CKB RPC and Fiber RPC readiness.
- Enforce ship-gate completion requirements before reward claims are created.

## Frontend Responsibilities

`vibequest-web` owns the learner experience:

- Wallet connect and session persistence.
- Learning profile, lesson navigation, checkpoints, tutor chat, and notebook reflections.
- Quest prompt composition and lesson-to-quest handoff.
- Workbench file explorer, verification checks, code explainer, and boss challenge UI.
- Dashboard for review, resume, and progress history.
- Ship Gate status display and Fiber invoice submission.

## AI Generation Strategy

VibeQuest avoids asking the AI for huge, slow, fragile payloads. The backend asks for compact seeds, then expands and validates them into product-safe structures.

```mermaid
flowchart TD
    A["User request"] --> B["Compact AI seed"]
    B --> C["Rust normalization"]
    C --> D["Validation and fallback rejection"]
    D --> E["Product-ready lesson or quest"]
    E --> F["Stored progress record"]
```

This keeps generation fast while still making the output feel specific and useful.

## Learning Record Model

The dashboard is designed around learning evidence, not infrastructure logs.

| Record | Purpose |
| --- | --- |
| Lesson status | Complete, attempted, or open |
| Checkpoint answer | Shows what the learner understood or missed |
| Tutor questions | Keeps the user's confusion and answers reviewable |
| Notebook reflection | Lets learners write what they learned in their own words |
| Related quests | Links lessons to generated code exercises |
| Quest history | Allows review, redo, or continuation |
| Reward claim | Shows completion and payout state |

## Ship Gate Rules

A run should only be claimable when:

1. JoyID proof is bound.
2. Backend generation services are ready.
3. MongoDB reward ledger is available.
4. Generated workspace checks pass.
5. Boss challenge is solved.
6. User submits a Fiber invoice.

If a step is incomplete, the UI should show it as `PENDING`, not as a system failure.

## Integration Boundaries

| Integration | Current Role | Future Role |
| --- | --- | --- |
| JoyID | Wallet identity and proof binding | Stronger account/session portability |
| CKB RPC | Readiness and CKB learning context | Proof receipts, badges, or on-chain learning attestations |
| Fiber RPC | Readiness and invoice-bound claim flow | Automatic testnet/mainnet payout rail through a funded node |
| MongoDB | Product state and history | Analytics, progress recovery, cohort views |
| OpenAI | Lessons, quests, tutors | Personalized learning paths and adaptive remediation |

## Verification Checklist

- `npm run lint`
- `npm run build`
- `cargo test` in `vibequest-core`
- Generate a learning path and confirm 5 modules render.
- Pass a checkpoint and generate a quest from the lesson.
- Run Workbench checks and solve the boss challenge.
- Confirm Dashboard stores lesson, quest, tutor, and notebook state.
