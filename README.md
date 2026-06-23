# VibeQuest Web

Next.js + TypeScript frontend for VibeQuest: a gamified vibecoding arena where builders generate real apps with AI, then unlock shipping by explaining, debugging, testing, attacking, and remixing the generated code.

## Run

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` when the backend is running somewhere other than `http://localhost:8080`.

## Product Shape

- Build prompt arena for AI-assisted app generation.
- Live quest generation through `vibequest-core`.
- Comprehension meter that blocks rewards until the user proves understanding.
- Challenge rooms: Explain, Debug, Remix, Attack, Ship.
- Quest board for CKB/Fiber builder tracks.
- Proof rail for future CKB credentials and Fiber rewards.

## Paired Backend

Use `vibequest-core` for quest generation, scoring, OpenAI calls, CKB proof receipts, and Fiber reward orchestration.
