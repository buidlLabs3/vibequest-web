"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  API_BASE_URL,
  Difficulty,
  GenerateQuestResponse,
  HealthResponse,
  QuestBlueprint,
  generateQuest,
  getHealth,
} from "@/lib/api";

const starterPrompt =
  "Build a Fiber-powered paid content app with CKB proof receipts, a creator payout split, and a test that blocks unpaid reads.";

const templates = [
  "Build a Fiber-powered paid content app with CKB proof receipts, a creator payout split, and a test that blocks unpaid reads.",
  "Build a CKB xUDT mini marketplace where buyers pay through Fiber and sellers earn instant rewards.",
  "Build an AI coding mentor that charges per boss fight hint and mints a CKB proof badge after mastery.",
];

const tracks = ["Fiber Builder", "CKB Fundamentals", "AI Discipline"];
const roomNames = ["Explain", "Debug", "Remix", "Attack", "Ship"];

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

const skillStats = [
  ["Prompt debt", "3"],
  ["Test repairs", "7"],
  ["Proof XP", "1,240"],
  ["Reward pool", "920"],
];

export function QuestArena() {
  const [buildPrompt, setBuildPrompt] = useState(starterPrompt);
  const [skillTrack, setSkillTrack] = useState(tracks[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("builder");
  const [run, setRun] = useState<GenerateQuestResponse>(initialRun);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getHealth()
      .then((nextHealth) => {
        if (!isMounted) {
          return;
        }

        setHealth(nextHealth);
        setHealthError(null);
      })
      .catch((nextError) => {
        if (!isMounted) {
          return;
        }

        setHealthError(
          nextError instanceof Error
            ? nextError.message
            : "Backend health check failed.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsHealthLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const gates = normalizeGates(run.quest.comprehension_gates);
  const activeGate = Math.min(2, gates.length - 1);
  const ownershipScore = useMemo(() => {
    const base = difficulty === "novice" ? 48 : difficulty === "boss" ? 72 : 61;
    const sourceBonus = run.source === "open-ai" ? 6 : 0;
    return Math.min(base + sourceBonus + activeGate * 7, 96);
  }, [activeGate, difficulty, run.source]);

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

  return (
    <main className="min-h-screen bg-[#f5f1e8] text-ink">
      <div className="mx-auto min-h-screen w-full max-w-[1500px] px-3 py-4 sm:px-6 lg:px-8">
        <header className="grid gap-4 border-b border-ink/10 pb-4 lg:grid-cols-[1fr_auto]">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-ink text-sm font-black text-[#f5f1e8] shadow-[inset_0_-4px_0_rgba(255,255,255,0.12)]">
              VQ
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-ember">
                VibeQuest
              </p>
              <h1 className="max-w-4xl text-balance text-xl font-black leading-none min-[420px]:text-2xl sm:text-4xl">
                AI can write the code. You still have to own it.
              </h1>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
            <StatusPill
              label="Core"
              state={health ? "ready" : healthError ? "down" : "checking"}
            />
            <StatusPill
              label="OpenAI"
              state={
                health?.integrations.openai
                  ? "ready"
                  : isHealthLoading
                    ? "checking"
                    : "fallback"
              }
            />
            <StatusPill
              label="CKB"
              state={health?.integrations.ckb_rpc ? "ready" : "planned"}
            />
            <StatusPill
              label="Fiber"
              state={health?.integrations.fiber_rpc ? "ready" : "planned"}
            />
          </div>

          {healthError && (
            <p className="rounded-md border border-ember/25 bg-ember/10 px-3 py-2 text-sm font-semibold text-ember lg:col-span-2">
              {healthError}
            </p>
          )}
        </header>

        <section className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-4 py-4 xl:grid-cols-[360px_minmax(0,1fr)_380px]">
          <aside className="w-full min-w-0 max-w-full space-y-4">
            <form
              onSubmit={handleGenerate}
              className="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-ink/10 bg-white shadow-[0_12px_40px_rgba(16,18,22,0.08)]"
            >
              <div className="border-b border-ink/10 bg-ink px-4 py-3 text-white">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
                  Mission Input
                </p>
                <h2 className="mt-1 text-xl font-black">Vibecode a run</h2>
              </div>

              <div className="space-y-4 p-4">
                <label className="grid min-w-0 gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-ink/45">
                    Build request
                  </span>
                  <textarea
                    aria-label="Build prompt"
                    className="min-h-44 w-full max-w-full resize-none rounded-md border border-ink/15 bg-[#f8f5ee] p-4 font-mono text-sm leading-6 text-ink outline-none transition focus:border-ember focus:bg-white"
                    minLength={12}
                    value={buildPrompt}
                    onChange={(event) => setBuildPrompt(event.target.value)}
                  />
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-ink/45">
                    Skill track
                  </span>
                  <select
                    className="h-12 w-full max-w-full rounded-md border border-ink/15 bg-white px-3 text-sm font-black text-ink outline-none transition focus:border-ember"
                    value={skillTrack}
                    onChange={(event) => setSkillTrack(event.target.value)}
                  >
                    {tracks.map((track) => (
                      <option key={track}>{track}</option>
                    ))}
                  </select>
                </label>

                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-ink/45">
                    Difficulty
                  </p>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-3">
                    {(["novice", "builder", "boss"] as Difficulty[]).map(
                      (level) => (
                        <button
                          className={`h-11 rounded-md border text-xs font-black capitalize transition ${
                            difficulty === level
                              ? "border-ink bg-ink text-white"
                              : "border-ink/15 bg-white text-ink/60 hover:border-ink/35 hover:text-ink"
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
                </div>

                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <button
                    className="h-12 rounded-md bg-ember px-4 text-sm font-black text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/35"
                    disabled={isGenerating}
                    type="submit"
                  >
                    {isGenerating ? "Forging..." : "Forge Quest"}
                  </button>
                  <button
                    className="h-12 min-w-0 rounded-md border border-ink/15 bg-white px-4 text-sm font-black text-ink transition hover:border-ink/35"
                    onClick={() => setBuildPrompt(nextTemplate(buildPrompt))}
                    type="button"
                  >
                    Template
                  </button>
                </div>

                {error && (
                  <p className="rounded-md border border-ember/25 bg-ember/10 px-3 py-2 text-sm font-semibold text-ember">
                    {error}
                  </p>
                )}
              </div>
            </form>

            <section className="w-full min-w-0 rounded-lg border border-ink/10 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-ink/45">
                Runtime
              </p>
              <p className="mt-2 break-all font-mono text-xs leading-5 text-ink/65">
                {API_BASE_URL}
              </p>
            </section>
          </aside>

          <section className="w-full min-w-0 max-w-full space-y-4">
            <div className="w-full min-w-0 overflow-hidden rounded-lg border border-ink/10 bg-ink text-white shadow-[0_18px_60px_rgba(16,18,22,0.18)]">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 border-b border-white/10 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-white/10 px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/65">
                      {skillTrack}
                    </span>
                    <span className="rounded bg-ember px-2.5 py-1 text-xs font-black uppercase tracking-[0.16em]">
                      {sourceLabel(run.source)}
                    </span>
                  </div>
                  <h2 className="text-balance text-3xl font-black leading-none sm:text-5xl">
                    {run.quest.title}
                  </h2>
                  <p className="mt-4 max-w-3xl text-pretty text-base font-semibold leading-7 text-white/68">
                    {run.quest.premise}
                  </p>
                </div>

                <div className="min-w-0 rounded-md border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                    Ownership
                  </p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-5xl font-black leading-none">
                      {ownershipScore}
                    </span>
                    <span className="pb-1 text-sm font-black text-white/45">
                      %
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded bg-white/10">
                    <div
                      className="h-full rounded bg-ember transition-all"
                      style={{ width: `${ownershipScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
                {skillStats.map(([label, value]) => (
                <div className="min-w-0 bg-ink px-5 py-4" key={label}>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-white/38">
                      {label}
                    </p>
                    <p className="mt-1 text-2xl font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <section className="w-full min-w-0 rounded-lg border border-ink/10 bg-white p-4 shadow-[0_12px_40px_rgba(16,18,22,0.06)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-wire">
                    Comprehension Route
                  </p>
                  <h3 className="text-2xl font-black">Escape black box mode</h3>
                </div>
                <span className="rounded-md bg-[#eef3ff] px-3 py-2 text-xs font-black text-wire">
                  Gate {activeGate + 1} / {gates.length}
                </span>
              </div>

              <div className="grid min-w-0 gap-3">
                {gates.map((gate, index) => (
                  <GateRow
                    active={index === activeGate}
                    complete={index < activeGate}
                    gate={gate}
                    index={index}
                    key={`${gate}-${index}`}
                  />
                ))}
              </div>
            </section>

            <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="min-w-0 rounded-lg border border-ink/10 bg-[#111318] p-4 text-[#f6f1e8]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white/38">
                    Code Chamber
                  </p>
                  <span className="rounded bg-signal px-2.5 py-1 text-xs font-black">
                    {isGenerating ? "Compiling mission" : "Ready"}
                  </span>
                </div>
                <pre className="min-h-56 overflow-hidden whitespace-pre-wrap rounded-md border border-white/10 bg-black/24 p-4 font-mono text-xs leading-6 text-white/78">
{`mission("${run.quest.title}");
objective("${run.quest.build_objective}");

current_gate("${roomNames[activeGate]}");
prove("${gates[activeGate]}");

boss("${run.quest.boss_fight}");`}
                </pre>
              </div>

              <div className="min-w-0 rounded-lg border border-ink/10 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-signal">
                  Proof Rail
                </p>
                <h3 className="mt-2 text-2xl font-black">What unlocks</h3>
                <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-ink/70">
                  <p>{run.quest.reward_logic}</p>
                  {run.quest.ckb_fiber_hooks.map((hook) => (
                    <p className="border-l-4 border-signal/40 pl-3" key={hook}>
                      {hook}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          </section>

          <aside className="w-full min-w-0 max-w-full space-y-4">
            <section className="w-full min-w-0 rounded-lg border border-ink/10 bg-white p-4 shadow-[0_12px_40px_rgba(16,18,22,0.06)]">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-plum">
                Active Run
              </p>
              <h3 className="mt-2 text-pretty text-2xl font-black leading-tight">
                {run.quest.build_objective}
              </h3>
              <div className="mt-4 rounded-md bg-[#f8f5ee] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/40">
                  Run ID
                </p>
                <p className="mt-1 break-all font-mono text-xs leading-5 text-ink/62">
                  {run.run_id}
                </p>
              </div>
            </section>

            <section className="w-full min-w-0 overflow-hidden rounded-lg border border-ink/10 bg-ember text-white shadow-[0_18px_60px_rgba(239,91,42,0.22)]">
              <div className="p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/55">
                  Boss Fight
                </p>
                <h3 className="mt-2 text-pretty text-3xl font-black leading-tight">
                  {run.quest.boss_fight}
                </h3>
              </div>
              <div className="grid grid-cols-1 border-t border-white/18 min-[360px]:grid-cols-3">
                <BossStat
                  label="min"
                  value={difficulty === "boss" ? "12" : "18"}
                />
                <BossStat
                  label="hints"
                  value={difficulty === "novice" ? "5" : "3"}
                />
                <BossStat
                  label="reward"
                  value={difficulty === "boss" ? "8x" : "5x"}
                />
              </div>
            </section>

            <section className="w-full min-w-0 rounded-lg border border-ink/10 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-ink/45">
                Rule of the run
              </p>
              <p className="mt-2 text-pretty text-lg font-black leading-7">
                AI may generate the code, but rewards unlock only when you can
                explain and defend the diff.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function GateRow({
  active,
  complete,
  gate,
  index,
}: {
  active: boolean;
  complete: boolean;
  gate: string;
  index: number;
}) {
  return (
    <article
      className={`grid min-w-0 gap-3 rounded-md border p-3 transition md:grid-cols-[112px_minmax(0,1fr)_auto] md:items-center ${
        active
          ? "border-ember/35 bg-ember/8 shadow-[inset_4px_0_0_#ef5b2a]"
          : complete
            ? "border-signal/20 bg-signal/8"
            : "border-ink/10 bg-[#f8f5ee]"
      }`}
    >
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/38">
          Gate {index + 1}
        </p>
        <h4 className="mt-1 text-lg font-black">
          {roomNames[index] ?? "Prove"}
        </h4>
      </div>
      <p className="min-w-0 text-sm font-semibold leading-6 text-ink/68">
        {gate}
      </p>
      <span
        className={`w-fit rounded px-2.5 py-1 text-xs font-black ${
          complete
            ? "bg-signal text-white"
            : active
              ? "bg-ember text-white"
              : "bg-white text-ink/45"
        }`}
      >
        {complete ? "Cleared" : active ? "Live" : "Locked"}
      </span>
    </article>
  );
}

function BossStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/18 p-4 last:border-b-0 min-[360px]:border-b-0 min-[360px]:border-r min-[360px]:last:border-r-0">
      <p className="text-3xl font-black leading-none">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-white/55">
        {label}
      </p>
    </div>
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

function StatusPill({
  label,
  state,
}: {
  label: string;
  state: "ready" | "fallback" | "planned" | "checking" | "down";
}) {
  const className =
    state === "ready"
      ? "bg-signal text-white"
      : state === "down"
        ? "bg-ember text-white"
        : state === "fallback"
          ? "bg-wire text-white"
          : "bg-white text-ink/58";

  return (
    <span
      className={`min-w-0 truncate rounded-md px-3 py-2 text-center text-xs font-black ${className}`}
    >
      {label}: {state}
    </span>
  );
}
