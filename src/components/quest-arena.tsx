"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Bot,
  Check,
  ChevronRight,
  Coins,
  FileCode2,
  FlaskConical,
  Gauge,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trophy,
} from "lucide-react";
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
const gateNames = ["Explain", "Debug", "Remix", "Attack", "Ship"];

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
    "CKB records the proof-of-understanding badges and quest receipts.",
    "Fiber handles hint fees, instant bounties, and sponsor rewards.",
  ],
};

const initialRun: GenerateQuestResponse = {
  run_id: "demo-run",
  source: "fallback",
  quest: fallbackQuest,
};

const files = [
  {
    id: "route",
    name: "app/api/unlock/route.ts",
    language: "ts",
    initial: `export async function POST(request: Request) {
  const body = await request.json();

  // TODO: verify payment receipt ownership before unlock.
  const receipt = await getReceipt(body.receiptId);

  return Response.json({
    unlocked: true,
    articleId: body.articleId,
    proofCell: receipt.cell,
  });
}`,
  },
  {
    id: "verifier",
    name: "lib/payment-verifier.ts",
    language: "ts",
    initial: `export function verifyReceipt(receipt: Receipt, user: User) {
  if (!receipt || receipt.status !== "paid") {
    return false;
  }

  return receipt.amount >= priceFor(user.plan);
}`,
  },
  {
    id: "test",
    name: "tests/unlock.test.ts",
    language: "ts",
    initial: `test("blocks unpaid reads", async () => {
  const response = await unlockArticle({
    articleId: "guide-001",
    receiptId: "unpaid-receipt",
  });

  expect(response.status).toBe(403);
});`,
  },
];

type TestRun = {
  status: "idle" | "running" | "passed" | "failed";
  output: string[];
};

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
  const [activeFile, setActiveFile] = useState(files[0].id);
  const [activeGate, setActiveGate] = useState(0);
  const [codeByFile, setCodeByFile] = useState(() =>
    Object.fromEntries(files.map((file) => [file.id, file.initial])),
  );
  const [proofNotes, setProofNotes] = useState<Record<number, string>>({});
  const [testRun, setTestRun] = useState<TestRun>({
    status: "idle",
    output: [
      "$ npm test -- --quest=paywall-reactor",
      "Waiting for your first run.",
    ],
  });

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
  const currentGate = gates[activeGate] ?? gates[0];
  const activeFileMeta =
    files.find((file) => file.id === activeFile) ?? files[0];
  const completedGates = gates.filter((_, index) => isGateComplete(index)).length;
  const ownershipScore = Math.min(
    42 + completedGates * 12 + (testRun.status === "passed" ? 10 : 0),
    100,
  );
  const openAiReady = Boolean(health?.integrations.openai);

  const runLabel = useMemo(
    () => run.run_id.slice(0, 8),
    [run.run_id],
  );

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsGenerating(true);
    setActiveGate(0);
    setProofNotes({});
    setTestRun({
      status: "idle",
      output: ["$ npm test -- --quest=new-run", "Quest forged. Tests queued."],
    });

    try {
      const nextRun = await generateQuest({
        build_prompt: buildPrompt,
        skill_track: skillTrack,
        difficulty,
      });
      setRun(nextRun);
      setCodeByFile((currentCode) => ({
        ...currentCode,
        route: buildRouteScaffold(nextRun.quest),
        verifier: buildVerifierScaffold(nextRun.quest),
        test: buildTestScaffold(nextRun.quest),
      }));
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

  function isGateComplete(index: number) {
    return Boolean(proofNotes[index]?.trim()) || index < activeGate;
  }

  function handleRunTests() {
    setTestRun({
      status: "running",
      output: [
        "$ npm test -- --quest=vibequest",
        "Booting generated app sandbox...",
        "Checking proof receipt ownership...",
      ],
    });

    window.setTimeout(() => {
      const hasOwnershipCheck =
        codeByFile.route.includes("receipt.owner") ||
        codeByFile.verifier.includes("owner") ||
        proofNotes[activeGate]?.toLowerCase().includes("owner");

      setTestRun({
        status: hasOwnershipCheck ? "passed" : "failed",
        output: hasOwnershipCheck
          ? [
              "$ npm test -- --quest=vibequest",
              "PASS tests/unlock.test.ts",
              "PASS verifier rejects receipt replay",
              "PASS proof note explains the trust boundary",
              "All gates for this stage are green.",
            ]
          : [
              "$ npm test -- --quest=vibequest",
              "FAIL tests/unlock.test.ts",
              "Expected unpaid or replayed receipts to return 403.",
              "Hint: add an ownership check or explain how receipt.owner is verified.",
            ],
      });
    }, 700);
  }

  function handleSubmitProof() {
    if (!proofNotes[activeGate]?.trim()) {
      setProofNotes((currentNotes) => ({
        ...currentNotes,
        [activeGate]: "I verified receipt ownership before unlock.",
      }));
      return;
    }

    setActiveGate((currentGateIndex) =>
      Math.min(currentGateIndex + 1, gates.length - 1),
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef0f2] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1760px] min-w-0 flex-col overflow-x-hidden">
        <header className="min-w-0 border-b border-ink/10 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-ink text-sm font-black text-white">
                VQ
              </div>
              <div className="min-w-0 max-w-full">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-ink/45">
                  VibeQuest Workbench
                </p>
                <h1 className="text-balance text-xl font-black leading-tight sm:text-2xl">
                  Vibecode it, then prove you own it.
                </h1>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusPill
                label="Core"
                state={health ? "ready" : healthError ? "down" : "checking"}
              />
              <StatusPill
                label="AI"
                state={
                  openAiReady ? "ready" : isHealthLoading ? "checking" : "fallback"
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
              <span className="rounded border border-ink/10 bg-[#f7f8fa] px-3 py-2 font-mono text-xs font-bold text-ink/55">
                {API_BASE_URL}
              </span>
            </div>
          </div>

          {healthError && (
            <p className="mt-3 rounded border border-[#d84a2f]/30 bg-[#fff2ee] px-3 py-2 text-sm font-semibold text-[#a8321d]">
              {healthError}
            </p>
          )}
        </header>

        <section className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] overflow-x-hidden xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,360px)]">
          <aside className="min-w-0 max-w-full border-b border-ink/10 bg-white p-4 xl:border-b-0 xl:border-r">
            <form onSubmit={handleGenerate} className="space-y-4">
              <PanelTitle
                icon={<Sparkles size={16} />}
                kicker="Quest Forge"
                title="Create the run"
              />

              <label className="grid min-w-0 gap-2">
                <span className="control-label">Build request</span>
                <textarea
                  aria-label="Build prompt"
                  className="min-h-36 w-full min-w-0 resize-none rounded border border-ink/15 bg-[#f7f8fa] p-3 font-mono text-sm leading-6 outline-none transition focus:border-[#2f6fed] focus:bg-white"
                  minLength={12}
                  value={buildPrompt}
                  onChange={(event) => setBuildPrompt(event.target.value)}
                />
              </label>

              <label className="grid min-w-0 gap-2">
                <span className="control-label">Skill track</span>
                <select
                  className="h-11 w-full min-w-0 rounded border border-ink/15 bg-white px-3 text-sm font-bold outline-none focus:border-[#2f6fed]"
                  value={skillTrack}
                  onChange={(event) => setSkillTrack(event.target.value)}
                >
                  {tracks.map((track) => (
                    <option key={track}>{track}</option>
                  ))}
                </select>
              </label>

              <div className="min-w-0">
                <span className="control-label">Difficulty</span>
                <div className="mt-2 grid min-w-0 grid-cols-1 gap-1 rounded border border-ink/10 bg-[#f7f8fa] p-1">
                  {(["novice", "builder", "boss"] as Difficulty[]).map(
                    (level) => (
                      <button
                        className={`h-9 min-w-0 rounded px-2 text-xs font-black capitalize transition ${
                          difficulty === level
                            ? "bg-ink text-white shadow-sm"
                            : "text-ink/55 hover:bg-white hover:text-ink"
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

              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
                <button
                    className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded bg-[#2f6fed] px-4 text-sm font-black text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/35"
                  disabled={isGenerating}
                  type="submit"
                >
                  {isGenerating ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Bot size={16} />
                  )}
                  Forge
                </button>
                <button
                  aria-label="Load next template"
                  className="grid h-11 w-11 place-items-center rounded border border-ink/15 bg-white text-ink transition hover:border-ink/35"
                  onClick={() => setBuildPrompt(nextTemplate(buildPrompt))}
                  title="Load next template"
                  type="button"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {error && (
                <p className="rounded border border-[#d84a2f]/25 bg-[#fff2ee] px-3 py-2 text-sm font-semibold text-[#a8321d]">
                  {error}
                </p>
              )}
            </form>

            <div className="mt-6 space-y-3">
              <PanelTitle
                icon={<BookOpen size={16} />}
                kicker="Quest"
                title={run.quest.title}
              />
              <p className="text-sm font-semibold leading-6 text-ink/65">
                {run.quest.premise}
              </p>
              <div className="rounded border border-ink/10 bg-[#f7f8fa] p-3">
                <p className="control-label">Objective</p>
                <p className="mt-2 overflow-wrap-anywhere text-sm font-bold leading-6">
                  {run.quest.build_objective}
                </p>
              </div>
            </div>
          </aside>

          <section className="min-w-0 max-w-full overflow-hidden bg-[#f7f8fa]">
            <div className="grid border-b border-ink/10 bg-white md:grid-cols-4">
              <Metric icon={<Gauge size={17} />} label="Ownership" value={`${ownershipScore}%`} />
              <Metric icon={<FlaskConical size={17} />} label="Tests" value={testLabel(testRun.status)} />
              <Metric icon={<ShieldCheck size={17} />} label="Gate" value={`${activeGate + 1}/${gates.length}`} />
              <Metric icon={<Coins size={17} />} label="Reward" value={difficulty === "boss" ? "8x" : "5x"} />
            </div>

            <div className="grid min-h-[calc(100vh-156px)] grid-rows-[auto_minmax(0,1fr)_auto]">
              <div className="border-b border-ink/10 bg-white p-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  {files.map((file) => (
                    <button
                      className={`inline-flex h-9 max-w-full items-center gap-2 rounded px-3 text-xs font-black transition ${
                        activeFile === file.id
                          ? "bg-ink text-white"
                          : "bg-[#f0f2f5] text-ink/60 hover:bg-white hover:text-ink"
                      }`}
                      key={file.id}
                      onClick={() => setActiveFile(file.id)}
                      type="button"
                    >
                      <FileCode2 size={14} />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 border-b border-ink/10 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between border-b border-ink/10 bg-[#11151b] px-4 py-3 text-white">
                    <div className="flex min-w-0 items-center gap-2">
                      <Terminal size={16} />
                      <span className="truncate font-mono text-xs font-bold">
                        {activeFileMeta.name}
                      </span>
                    </div>
                    <span className="rounded bg-white/10 px-2 py-1 text-[11px] font-black uppercase text-white/55">
                      {activeFileMeta.language}
                    </span>
                  </div>
                  <textarea
                    aria-label="Code editor"
                    className="h-[420px] w-full resize-none border-0 bg-[#11151b] p-4 font-mono text-[13px] leading-6 text-[#eef4ff] outline-none lg:h-full"
                    spellCheck={false}
                    value={codeByFile[activeFile]}
                    onChange={(event) =>
                      setCodeByFile((currentCode) => ({
                        ...currentCode,
                        [activeFile]: event.target.value,
                      }))
                    }
                  />
                </div>

                <aside className="min-w-0 bg-white p-4">
                  <PanelTitle
                    icon={<ShieldCheck size={16} />}
                    kicker={`Gate ${activeGate + 1}`}
                    title={gateNames[activeGate] ?? "Prove"}
                  />
                  <p className="mt-3 text-sm font-semibold leading-6 text-ink/68">
                    {currentGate}
                  </p>

                  <label className="mt-5 grid gap-2">
                    <span className="control-label">Your proof note</span>
                    <textarea
                      aria-label="Proof note"
                      className="min-h-36 resize-none rounded border border-ink/15 bg-[#f7f8fa] p-3 text-sm font-semibold leading-6 outline-none focus:border-[#2f6fed] focus:bg-white"
                      placeholder="Explain the trust boundary, bug, patch, or attack in your own words."
                      value={proofNotes[activeGate] ?? ""}
                      onChange={(event) =>
                        setProofNotes((currentNotes) => ({
                          ...currentNotes,
                          [activeGate]: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded border border-ink/15 bg-white text-sm font-black text-ink transition hover:border-ink/40"
                      onClick={handleSubmitProof}
                      type="button"
                    >
                      <Save size={15} />
                      Proof
                    </button>
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded bg-[#20a779] text-sm font-black text-white transition hover:bg-ink"
                      onClick={handleRunTests}
                      type="button"
                    >
                      <Play size={15} />
                      Test
                    </button>
                  </div>

                  <div className="mt-5 rounded border border-ink/10 bg-[#11151b] p-3 text-white">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                        Test output
                      </span>
                      <TestBadge status={testRun.status} />
                    </div>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-white/72">
                      {testRun.output.join("\n")}
                    </pre>
                  </div>
                </aside>
              </div>

              <div className="border-t border-ink/10 bg-white p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="control-label">Boss fight</p>
                    <p className="mt-1 truncate text-sm font-bold text-ink/75">
                      {run.quest.boss_fight}
                    </p>
                  </div>
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-black text-white transition hover:bg-[#2f6fed]"
                    onClick={() => setActiveGate(gates.length - 1)}
                    type="button"
                  >
                    <Trophy size={16} />
                    Jump to Ship
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="min-w-0 max-w-full border-t border-ink/10 bg-white p-4 xl:border-l xl:border-t-0">
            <PanelTitle
              icon={<ChevronRight size={16} />}
              kicker={`Run ${runLabel}`}
              title="Progress"
            />

            <div className="mt-4 space-y-2">
              {gates.map((gate, index) => (
                <button
                  className={`w-full rounded border p-3 text-left transition ${
                    activeGate === index
                      ? "border-[#2f6fed] bg-[#eff5ff]"
                      : isGateComplete(index)
                        ? "border-[#20a779]/25 bg-[#effbf6]"
                        : "border-ink/10 bg-white hover:border-ink/30"
                  }`}
                  key={`${gate}-${index}`}
                  onClick={() => setActiveGate(index)}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <GateIcon complete={isGateComplete(index)} active={activeGate === index} />
                    <span className="text-sm font-black">
                      {gateNames[index] ?? "Gate"} {index + 1}
                    </span>
                  </div>
                    <p className="overflow-wrap-anywhere mt-2 line-clamp-2 text-xs font-semibold leading-5 text-ink/58">
                    {gate}
                  </p>
                </button>
              ))}
            </div>

            <section className="mt-5 rounded border border-ink/10 bg-[#f7f8fa] p-4">
              <PanelTitle
                icon={<Coins size={16} />}
                kicker="Unlocks"
                title="Proof rail"
              />
              <p className="mt-3 text-sm font-semibold leading-6 text-ink/65">
                {run.quest.reward_logic}
              </p>
              <div className="mt-3 space-y-2">
                {run.quest.ckb_fiber_hooks.map((hook) => (
                  <p
                    className="overflow-wrap-anywhere rounded border border-ink/10 bg-white p-3 text-xs font-bold leading-5 text-ink/65"
                    key={hook}
                  >
                    {hook}
                  </p>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PanelTitle({
  icon,
  kicker,
  title,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-ink/42">
        {icon}
        {kicker}
      </p>
      <h2 className="mt-1 truncate text-lg font-black">{title}</h2>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-ink/10 px-4 py-3 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded bg-[#f0f2f5] text-ink/65">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="control-label">{label}</p>
        <p className="truncate text-lg font-black">{value}</p>
      </div>
    </div>
  );
}

function GateIcon({ active, complete }: { active: boolean; complete: boolean }) {
  if (complete) {
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#20a779] text-white">
        <Check size={13} strokeWidth={3} />
      </span>
    );
  }

  if (active) {
    return (
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#2f6fed] text-white">
        <ChevronRight size={13} strokeWidth={3} />
      </span>
    );
  }

  return <span className="h-5 w-5 shrink-0 rounded-full border border-ink/20" />;
}

function TestBadge({ status }: { status: TestRun["status"] }) {
  const label =
    status === "passed"
      ? "passed"
      : status === "failed"
        ? "failed"
        : status === "running"
          ? "running"
          : "idle";

  const className =
    status === "passed"
      ? "bg-[#20a779] text-white"
      : status === "failed"
        ? "bg-[#d84a2f] text-white"
        : status === "running"
          ? "bg-[#2f6fed] text-white"
          : "bg-white/10 text-white/55";

  return (
    <span className={`rounded px-2 py-1 text-[11px] font-black uppercase ${className}`}>
      {label}
    </span>
  );
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
      ? "border-[#20a779]/30 bg-[#effbf6] text-[#087451]"
      : state === "down"
        ? "border-[#d84a2f]/30 bg-[#fff2ee] text-[#a8321d]"
        : state === "fallback"
          ? "border-[#d99b2b]/35 bg-[#fff7e8] text-[#8a5c00]"
          : "border-ink/10 bg-[#f7f8fa] text-ink/55";

  return (
    <span
      className={`inline-flex h-9 items-center rounded border px-3 text-xs font-black ${className}`}
    >
      {label}: {state}
    </span>
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

function testLabel(status: TestRun["status"]) {
  if (status === "passed") {
    return "green";
  }

  if (status === "failed") {
    return "red";
  }

  if (status === "running") {
    return "running";
  }

  return "idle";
}

function buildRouteScaffold(quest: QuestBlueprint) {
  return `export async function POST(request: Request) {
  const body = await request.json();
  const receipt = await getReceipt(body.receiptId);

  // Quest: ${quest.title}
  // Gate: explain, patch, test, attack, ship.
  if (!receipt || receipt.status !== "paid") {
    return Response.json({ error: "payment required" }, { status: 403 });
  }

  if (receipt.owner !== body.userId) {
    return Response.json({ error: "receipt owner mismatch" }, { status: 403 });
  }

  return Response.json({
    unlocked: true,
    articleId: body.articleId,
    proofCell: receipt.cell,
  });
}`;
}

function buildVerifierScaffold(quest: QuestBlueprint) {
  return `export function verifyReceipt(receipt: Receipt, user: User) {
  if (!receipt || receipt.status !== "paid") {
    return false;
  }

  const ownsReceipt = receipt.owner === user.id;
  const paidEnough = receipt.amount >= priceFor(user.plan);

  // Boss: ${quest.boss_fight}
  return ownsReceipt && paidEnough;
}`;
}

function buildTestScaffold(quest: QuestBlueprint) {
  return `test("blocks unpaid reads", async () => {
  const response = await unlockArticle({
    articleId: "guide-001",
    receiptId: "unpaid-receipt",
  });

  expect(response.status).toBe(403);
});

test("blocks replayed proof receipts", async () => {
  const response = await unlockArticle({
    articleId: "guide-001",
    receiptId: "paid-but-owned-by-someone-else",
  });

  expect(response.status).toBe(403);
});

// Quest objective:
// ${quest.build_objective}`;
}
