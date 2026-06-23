"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Difficulty,
  GenerateQuestResponse,
  QuestBlueprint,
  generateQuest,
} from "@/lib/api";

const starterPrompt =
  "Build a Fiber-powered paid content app with CKB proof receipts, a creator payout split, and a test that blocks unpaid reads.";

const templates = [
  "Build a Fiber-powered paid content app with CKB proof receipts, a creator payout split, and a test that blocks unpaid reads.",
  "Build a CKB xUDT mini marketplace where buyers pay through Fiber and sellers earn instant rewards.",
  "Build an AI coding mentor that charges per boss fight hint and mints a CKB proof badge after mastery.",
];

const tracks = ["Fiber Builder", "CKB Fundamentals", "AI Discipline"];

const fallbackQuest: QuestBlueprint = {
  title: "Paywall Reactor",
  premise:
    "You vibecoded a paid content app, but the reward vault stays locked until you understand the code.",
  build_objective: starterPrompt,
  comprehension_gates: [
    "Explain what the payment verifier trusts and what it refuses.",
    "Debug the route that lets unpaid reads slip through.",
    "Remix the pricing layer to support one xUDT asset.",
    "Attack the receipt flow and document a replay risk.",
    "Ship after tests pass and the comprehension meter clears 80%.",
  ],
  boss_fight:
    "The generated app has one exploit that lets a user reuse someone else's proof receipt.",
  reward_logic:
    "XP unlocks per gate; Fiber rewards and the CKB proof badge unlock only after the boss fight.",
  ckb_fiber_hooks: [
    "CKB stores proof-of-understanding badges and quest receipts.",
    "Fiber handles hint fees, instant bounties, and sponsor rewards.",
  ],
};

const initialRun: GenerateQuestResponse = {
  run_id: "demo-run",
  source: "fallback",
  quest: fallbackQuest,
};

const telemetry = [
  ["Generated code owned", "41%"],
  ["Tests repaired by human", "7"],
  ["Hint debt", "2 CKB"],
  ["Fiber rewards pending", "920"],
];

const roomNames = ["Explain", "Debug", "Remix", "Attack", "Ship"];

export function QuestArena() {
  const [buildPrompt, setBuildPrompt] = useState(starterPrompt);
  const [skillTrack, setSkillTrack] = useState(tracks[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("builder");
  const [run, setRun] = useState<GenerateQuestResponse>(initialRun);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const ownershipScore = useMemo(() => {
    const base = difficulty === "novice" ? 52 : difficulty === "boss" ? 76 : 68;
    const bonus = run.source === "open-ai" ? 4 : 0;
    return Math.min(base + bonus, 94);
  }, [difficulty, run.source]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsGenerating(true);

    try {
      const nextRun = await generateQuest({
        build_prompt: buildPrompt,
        skill_track: skillTrack,
        difficulty,
      });
      setRun(nextRun);
    } catch (questError) {
      setError(
        questError instanceof Error
          ? questError.message
          : "Quest generation failed. Try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  const gates = normalizeGates(run.quest.comprehension_gates);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fffaf0_0,#f3efe7_36%,#e6edf5_100%)] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-ink text-sm font-black text-panel">
              VQ
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/55">
                VibeQuest
              </p>
              <h1 className="text-xl font-black leading-tight sm:text-2xl">
                Vibecode. Prove it. Ship it.
              </h1>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <a className="rounded-md bg-white px-3 py-2 shadow-panel-sm" href="#arena">
              Arena
            </a>
            <a className="rounded-md px-3 py-2 text-ink/70" href="#quests">
              Run
            </a>
            <a className="rounded-md px-3 py-2 text-ink/70" href="#proof">
              Proof
            </a>
          </nav>
        </header>

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div id="arena" className="flex min-h-[620px] flex-col gap-4">
            <form
              onSubmit={handleGenerate}
              className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-ember">
                    Build Prompt
                  </p>
                  <h2 className="text-2xl font-black leading-tight sm:text-4xl">
                    Generate the app. Then escape black box mode.
                  </h2>
                </div>
                <div className="rounded-md bg-signal px-3 py-2 text-sm font-black text-white">
                  {ownershipScore}% owned
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
                <textarea
                  className="min-h-40 resize-none rounded-md border border-ink/15 bg-panel p-4 font-mono text-sm leading-6 text-ink/80 outline-none transition focus:border-ember"
                  minLength={12}
                  value={buildPrompt}
                  onChange={(event) => setBuildPrompt(event.target.value)}
                  aria-label="Build prompt"
                />
                <div className="grid gap-3">
                  <label className="grid gap-1 text-xs font-bold uppercase tracking-[0.16em] text-ink/55">
                    Track
                    <select
                      className="rounded-md border border-ink/15 bg-white px-3 py-3 text-sm font-black normal-case tracking-normal text-ink outline-none"
                      value={skillTrack}
                      onChange={(event) => setSkillTrack(event.target.value)}
                    >
                      {tracks.map((track) => (
                        <option key={track}>{track}</option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["novice", "builder", "boss"] as Difficulty[]).map(
                      (level) => (
                        <button
                          className={`rounded-md border px-2 py-3 text-xs font-black capitalize transition ${
                            difficulty === level
                              ? "border-ink bg-ink text-white"
                              : "border-ink/15 bg-white text-ink/65 hover:border-ink/35"
                          }`}
                          key={level}
                          onClick={() => setDifficulty(level)}
                          type="button"
                        >
                          {level}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    className="rounded-md bg-ink px-4 py-3 text-sm font-black text-white transition hover:bg-ember disabled:cursor-not-allowed disabled:bg-ink/40"
                    disabled={isGenerating}
                    type="submit"
                  >
                    {isGenerating ? "Generating..." : "Start Run"}
                  </button>
                  <button
                    className="rounded-md border border-ink/15 bg-white px-4 py-3 text-sm font-black text-ink transition hover:border-ink/35"
                    onClick={() => setBuildPrompt(nextTemplate(buildPrompt))}
                    type="button"
                  >
                    Use Template
                  </button>
                </div>
              </div>

              {error && (
                <p className="mt-3 rounded-md border border-ember/30 bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">
                  {error}
                </p>
              )}
            </form>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-lg border border-ink/10 bg-ink p-4 text-panel shadow-panel-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-panel/55">
                    Code Arena
                  </p>
                  <span className="rounded bg-ember px-2 py-1 text-xs font-black text-white">
                    {isGenerating ? "AI forging quest" : "Quest loaded"}
                  </span>
                </div>
                <pre className="overflow-hidden whitespace-pre-wrap rounded-md bg-black/30 p-4 font-mono text-xs leading-5 text-panel/90">
{`// ${run.quest.title}
objective("${run.quest.build_objective}");

gate("${gates[0]}");
gate("${gates[1]}");

// Boss: ${run.quest.boss_fight}`}
                </pre>
              </div>

              <div className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-wire">
                    Comprehension Meter
                  </p>
                  <span className="text-sm font-black">
                    Gate {Math.min(gates.length, 3)} / {gates.length}
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded bg-ink/10">
                  <div
                    className="h-full bg-gradient-to-r from-signal via-wire to-ember transition-all"
                    style={{ width: `${ownershipScore}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {telemetry.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-md border border-ink/10 bg-panel p-3"
                    >
                      <p className="text-xs font-semibold text-ink/55">
                        {label}
                      </p>
                      <p className="mt-1 text-xl font-black">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {gates.map((gate, index) => (
                <article
                  key={`${gate}-${index}`}
                  className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="text-lg font-black">
                      {roomNames[index] ?? `Gate ${index + 1}`}
                    </h3>
                    <span className="rounded bg-ink/5 px-2 py-1 text-xs font-bold text-ink/65">
                      {index === 0 ? "Unlocked" : index === 1 ? "Live" : "Locked"}
                    </span>
                  </div>
                  <p className="min-h-20 text-sm leading-6 text-ink/70">
                    {gate}
                  </p>
                  <p className="mt-4 text-sm font-black text-ember">
                    {index === 0 ? "Ready" : `Gate ${index + 1}`}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="grid gap-4 lg:grid-rows-[auto_1fr_auto]">
            <section
              id="quests"
              className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-plum">
                    Active Run
                  </p>
                  <h2 className="text-2xl font-black">{run.quest.title}</h2>
                </div>
                <span className="rounded-md bg-panel px-3 py-2 text-xs font-black">
                  {sourceLabel(run.source)}
                </span>
              </div>
              <p className="rounded-md border border-ink/10 bg-panel p-3 text-sm font-semibold leading-6 text-ink/75">
                {run.quest.premise}
              </p>
              <div className="mt-3 rounded-md border border-ink/10 bg-panel p-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/50">
                  Run ID
                </p>
                <p className="mt-1 break-all font-mono text-xs text-ink/70">
                  {run.run_id}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-ink/10 bg-ink p-4 text-panel shadow-panel-sm">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-panel/55">
                Boss Fight
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight">
                {run.quest.boss_fight}
              </h2>
              <p className="mt-3 text-sm leading-6 text-panel/70">
                Clear the final gate by explaining the failure, shipping a
                human-authored fix, and defending the diff before rewards unlock.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-2xl font-black">
                    {difficulty === "boss" ? 12 : 18}
                  </p>
                  <p className="text-xs text-panel/55">min</p>
                </div>
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-2xl font-black">
                    {difficulty === "novice" ? 5 : 3}
                  </p>
                  <p className="text-xs text-panel/55">hints</p>
                </div>
                <div className="rounded-md bg-white/10 p-3">
                  <p className="text-2xl font-black">
                    {difficulty === "boss" ? "8x" : "5x"}
                  </p>
                  <p className="text-xs text-panel/55">reward</p>
                </div>
              </div>
            </section>

            <section
              id="proof"
              className="rounded-lg border border-ink/10 bg-white/88 p-4 shadow-panel-sm"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-signal">
                Proof Rail
              </p>
              <h2 className="mt-2 text-2xl font-black">Ship unlocks</h2>
              <div className="mt-4 space-y-3 text-sm font-semibold text-ink/75">
                <p>{run.quest.reward_logic}</p>
                {run.quest.ckb_fiber_hooks.map((hook) => (
                  <p key={hook}>{hook}</p>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function normalizeGates(gates: string[]) {
  const normalized = gates.filter(Boolean);

  if (normalized.length >= 5) {
    return normalized.slice(0, 5);
  }

  return [...normalized, ...fallbackQuest.comprehension_gates].slice(0, 5);
}

function nextTemplate(currentPrompt: string) {
  const currentIndex = templates.indexOf(currentPrompt);
  return templates[(currentIndex + 1) % templates.length];
}

function sourceLabel(source: GenerateQuestResponse["source"]) {
  return source === "open-ai" ? "OpenAI" : "Fallback";
}
