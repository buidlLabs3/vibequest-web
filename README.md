# VibeQuest Web

Next.js + TypeScript frontend for VibeQuest: a gamified vibecoding arena where builders generate real apps with AI, then unlock shipping by explaining, debugging, testing, attacking, and remixing the generated code.

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

`CORE_API_BASE_URL` points the Next.js API proxy at `vibequest-core`. The browser uses `/api/core` by default, so most deployments only need to set `CORE_API_BASE_URL` on the server.

## Environment

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `CORE_API_BASE_URL` | No | `http://localhost:8080` | Server-side target for the Rust backend proxy. |
| `NEXT_PUBLIC_API_BASE_URL` | No | `/api/core` | Optional browser-visible override. Leave empty for normal deployments. |

## Product Shape

- Build prompt arena for AI-assisted app generation.
- Live quest generation through `vibequest-core`.
- Comprehension meter that blocks rewards until the user proves understanding.
- Challenge rooms: Explain, Debug, Remix, Attack, Ship.
- Quest board for CKB/Fiber builder tracks.
- Proof rail for future CKB credentials and Fiber rewards.

## Paired Backend

Use `vibequest-core` for quest generation, scoring, OpenAI calls, CKB proof receipts, and Fiber reward orchestration.

## Checks

```bash
npm run lint
npm run build
```

## Docker

```bash
docker build -t vibequest-web .
docker run --rm -p 3000:3000 \
  -e CORE_API_BASE_URL=http://host.docker.internal:8080 \
  vibequest-web
```
