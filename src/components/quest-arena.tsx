"use client";

import { FormEvent, useEffect, useState } from "react";
import { ccc, useCcc } from "@ckb-ccc/connector-react";
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronRight,
  FileCode2,
  Gauge,
  KeyRound,
  Lock,
  PlugZap,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  Terminal,
  Trophy,
  Unplug,
  Wallet,
} from "lucide-react";
import {
  API_BASE_URL,
  Difficulty,
  GenerateQuestResponse,
  HealthResponse,
  WalletProof,
  generateQuest,
  getHealth,
} from "@/lib/api";

const starterPrompt =
  "Build a Fiber-powered paid content app with CKB proof receipts, a creator payout split, and a test that blocks unpaid reads.";

const templates = [
  starterPrompt,
  "Build a CKB xUDT mini marketplace where buyers pay through Fiber and sellers earn instant rewards.",
  "Build an AI coding mentor that charges per boss fight hint and mints a CKB proof badge after mastery.",
];

const tracks = ["Fiber Builder", "CKB Fundamentals", "AI Discipline"];
const gateNames = ["Explain", "Debug", "Remix", "Attack", "Ship"];

type WalletSession = {
  address: string;
  walletName: string;
  signerName: string;
  balance: string;
  proof: WalletProof;
};

type TestRun = {
  status: "idle" | "running" | "passed" | "failed" | "blocked";
  output: string[];
};

type FlowStep = {
  label: string;
  detail: string;
  done: boolean;
  blocked?: boolean;
};

export function QuestArena() {
  const { open, disconnect, wallet, signerInfo } = useCcc();
  const [buildPrompt, setBuildPrompt] = useState(starterPrompt);
  const [skillTrack, setSkillTrack] = useState(tracks[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("builder");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [walletSession, setWalletSession] = useState<WalletSession | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isBindingWallet, setIsBindingWallet] = useState(false);
  const [run, setRun] = useState<GenerateQuestResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFile, setActiveFile] = useState(0);
  const [activeGate, setActiveGate] = useState(0);
  const [codeByPath, setCodeByPath] = useState<Record<string, string>>({});
  const [proofNotes, setProofNotes] = useState<Record<number, string>>({});
  const [testRun, setTestRun] = useState<TestRun>({
    status: "idle",
    output: ["Bind a CKB wallet proof, generate a quest, then write proof notes."],
  });

  useEffect(() => {
    refreshHealth();
  }, []);

  useEffect(() => {
    setWalletSession(null);
    setWalletError(null);
  }, [wallet?.name, signerInfo?.name]);

  const integrationsReady = Boolean(
    health?.integrations.openai &&
      health.integrations.ckb_rpc &&
      health.integrations.fiber_rpc,
  );
  const canGenerate = Boolean(walletSession && health?.integrations.openai);
  const generateBlocker = getGenerateBlocker(health, healthError, walletSession);
  const files = run?.quest.workbench_files ?? [];
  const activeFileMeta = files[activeFile] ?? files[0];
  const gates = run?.quest.comprehension_gates ?? [];
  const currentGate = gates[activeGate] ?? "Generate a quest run to start proof work.";
  const completedGates = gates.filter((_, index) => isGateComplete(index)).length;
  const ownershipScore = run
    ? Math.min(25 + completedGates * 13 + (testRun.status === "passed" ? 10 : 0), 100)
    : 0;
  const runLabel = run?.run_id.slice(0, 8) ?? "none";
  const canClaimRewards = Boolean(run?.ship_requirements.can_claim_rewards);
  const flowSteps: FlowStep[] = [
    {
      label: "Infrastructure",
      detail: integrationsReady
        ? "OpenAI, CKB RPC, and Fiber RPC are configured."
        : `Missing ${health?.missing.join(", ") || "backend health"}.`,
      done: integrationsReady,
      blocked: Boolean(health && !integrationsReady),
    },
    {
      label: "Wallet Proof",
      detail: walletSession
        ? `Signed by ${shortenAddress(walletSession.address)}.`
        : "Connect a CKB secp256k1 signer and sign the VibeQuest proof message.",
      done: Boolean(walletSession),
    },
    {
      label: "Quest Run",
      detail: run ? `${run.quest.title} is bound to the signer.` : "Generate from your build request.",
      done: Boolean(run),
    },
    {
      label: "Ship Gate",
      detail: canClaimRewards
        ? "Reward claim path is available."
        : "Rewards stay locked until CKB and Fiber RPC are configured.",
      done: canClaimRewards,
      blocked: Boolean(run && !canClaimRewards),
    },
  ];

  async function refreshHealth() {
    try {
      const nextHealth = await getHealth();
      setHealth(nextHealth);
      setHealthError(null);
    } catch (error) {
      setHealth(null);
      setHealthError(error instanceof Error ? error.message : "Backend health check failed.");
    }
  }

  async function handleBindWallet() {
    setWalletError(null);

    if (!signerInfo) {
      open();
      return;
    }

    setIsBindingWallet(true);

    try {
      await signerInfo.signer.connect();
      const address = await signerInfo.signer.getRecommendedAddress();
      const message = buildWalletProofMessage(address);
      const signature = await signerInfo.signer.signMessage(message);
      const balance = await signerInfo.signer
        .getBalance()
        .then((value) => ccc.fixedPointToString(value))
        .catch(() => "unavailable");

      setWalletSession({
        address,
        walletName: wallet?.name ?? "CKB Wallet",
        signerName: signerInfo.name,
        balance,
        proof: {
          address,
          message,
          signature: {
            signature: signature.signature,
            identity: signature.identity,
            sign_type: signature.signType,
          },
        },
      });
    } catch (error) {
      setWalletError(
        error instanceof Error
          ? error.message
          : "Wallet proof signing failed.",
      );
    } finally {
      setIsBindingWallet(false);
    }
  }

  function handleDisconnectWallet() {
    disconnect();
    setWalletSession(null);
    setWalletError(null);
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunError(null);

    if (!walletSession) {
      setRunError("Bind a real wallet proof before generating a quest run.");
      return;
    }

    if (!health?.integrations.openai) {
      setRunError("OpenAI is not configured on vibequest-core.");
      return;
    }

    setIsGenerating(true);
    setRun(null);
    setActiveGate(0);
    setActiveFile(0);
    setProofNotes({});
    setCodeByPath({});
    setTestRun({
      status: "idle",
      output: ["Quest generation is running through vibequest-core."],
    });

    try {
      const nextRun = await generateQuest({
        build_prompt: buildPrompt,
        skill_track: skillTrack,
        difficulty,
        wallet: walletSession.proof,
      });

      setRun(nextRun);
      setCodeByPath(
        Object.fromEntries(
          nextRun.quest.workbench_files.map((file) => [file.path, file.content]),
        ),
      );
      setTestRun({
        status: "idle",
        output: [`Run ${nextRun.run_id} generated and bound to ${nextRun.wallet.address}.`],
      });
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Quest generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleRunChecks() {
    if (!run || !activeFileMeta) {
      return;
    }

    setTestRun({
      status: "running",
      output: [
        "Local proof check running.",
        "Checking wallet proof binding...",
        "Checking written gate evidence...",
        "Checking workbench edits for receipt ownership...",
      ],
    });

    window.setTimeout(() => {
      const allNotesReady =
        gates.length > 0 &&
        gates.every((_, index) => (proofNotes[index] ?? "").trim().length >= 24);
      const codeMentionsSigner = Object.values(codeByPath)
        .join("\n")
        .toLowerCase()
        .includes("owner");
      const passed = allNotesReady && codeMentionsSigner;

      setTestRun({
        status: passed ? "passed" : "failed",
        output: passed
          ? [
              "Wallet proof is attached to the run.",
              "Every gate has a written proof note.",
              "Workbench code references receipt ownership.",
            ]
          : [
              "Proof gates are incomplete.",
              "Add proof notes for every gate and keep receipt ownership visible in the code.",
            ],
      });
    }, 700);
  }

  function handleSubmitProof() {
    if (!run) {
      return;
    }

    const note = proofNotes[activeGate]?.trim();
    if (!note || note.length < 24) {
      setProofNotes((current) => ({
        ...current,
        [activeGate]: "I verified the trust boundary and named the owner check.",
      }));
      return;
    }

    setActiveGate((current) => Math.min(current + 1, gates.length - 1));
  }

  function isGateComplete(index: number) {
    return (proofNotes[index] ?? "").trim().length >= 24;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef0f2] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1760px] flex-col">
        <header className="border-b border-ink/10 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-ink text-sm font-black text-white">
                VQ
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-ink/45">
                  VibeQuest Workbench
                </p>
                <h1 className="text-balance text-xl font-black leading-tight sm:text-2xl">
                  Sign the run, generate the code, prove the diff.
                </h1>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusPill label="Core" state={health ? "ready" : healthError ? "down" : "checking"} />
              <StatusPill label="OpenAI" state={health?.integrations.openai ? "ready" : "blocked"} />
              <StatusPill label="CKB RPC" state={health?.integrations.ckb_rpc ? "ready" : "blocked"} />
              <StatusPill label="Fiber RPC" state={health?.integrations.fiber_rpc ? "ready" : "blocked"} />
              <StatusPill label="Wallet" state={walletSession ? "ready" : "blocked"} />
              <span className="rounded border border-ink/10 bg-[#f7f8fa] px-3 py-2 font-mono text-xs font-bold text-ink/55">
                {API_BASE_URL}
              </span>
            </div>
          </div>

          {healthError && <Notice tone="bad">{healthError}</Notice>}
          {health && health.missing.length > 0 && (
            <Notice tone="warn">
              Missing backend configuration: {health.missing.join(", ")}.
            </Notice>
          )}
        </header>

        <section className="grid flex-1 grid-cols-[minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_360px]">
          <aside className="border-b border-ink/10 bg-white p-4 xl:border-b-0 xl:border-r">
            <PanelTitle icon={<Gauge size={16} />} kicker="Flow" title="Run State" />
            <div className="mt-4 space-y-2">
              {flowSteps.map((step, index) => (
                <FlowRow key={step.label} index={index + 1} step={step} />
              ))}
            </div>

            <div className="mt-5">
              <WalletPanel
                walletName={walletSession?.walletName ?? wallet?.name}
                signerName={walletSession?.signerName ?? signerInfo?.name}
                address={walletSession?.address}
                balance={walletSession?.balance}
                isBinding={isBindingWallet}
                error={walletError}
                onConnect={handleBindWallet}
                onDisconnect={handleDisconnectWallet}
                onChooseWallet={open}
              />
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleGenerate}>
              <PanelTitle icon={<Bot size={16} />} kicker="Quest" title="Generate" />
              <label className="grid gap-2">
                <span className="control-label">Build request</span>
                <textarea
                  aria-label="Build prompt"
                  className="min-h-32 resize-none rounded border border-ink/15 bg-[#f7f8fa] p-3 font-mono text-sm leading-6 outline-none focus:border-[#2f6fed] focus:bg-white"
                  minLength={12}
                  value={buildPrompt}
                  onChange={(event) => setBuildPrompt(event.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="control-label">Skill track</span>
                <select
                  className="h-11 rounded border border-ink/15 bg-white px-3 text-sm font-bold outline-none focus:border-[#2f6fed]"
                  value={skillTrack}
                  onChange={(event) => setSkillTrack(event.target.value)}
                >
                  {tracks.map((track) => (
                    <option key={track}>{track}</option>
                  ))}
                </select>
              </label>

              <div>
                <span className="control-label">Difficulty</span>
                <div className="mt-2 grid grid-cols-3 gap-1 rounded border border-ink/10 bg-[#f7f8fa] p-1">
                  {(["novice", "builder", "boss"] as Difficulty[]).map((level) => (
                    <button
                      className={`h-9 rounded px-2 text-xs font-black capitalize transition ${
                        difficulty === level
                          ? "bg-ink text-white"
                          : "text-ink/55 hover:bg-white hover:text-ink"
                      }`}
                      key={level}
                      onClick={() => setDifficulty(level)}
                      type="button"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#2f6fed] px-4 text-sm font-black text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/35"
                  disabled={!canGenerate || isGenerating}
                  type="submit"
                >
                  {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Bot size={16} />}
                  Generate
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

              {generateBlocker && <Notice tone="warn">{generateBlocker}</Notice>}
              {runError && <Notice tone="bad">{runError}</Notice>}
            </form>
          </aside>

          <section className="min-w-0 bg-[#f7f8fa]">
            <div className="grid border-b border-ink/10 bg-white md:grid-cols-4">
              <Metric icon={<Gauge size={17} />} label="Ownership" value={`${ownershipScore}%`} />
              <Metric icon={<ShieldCheck size={17} />} label="Gates" value={run ? `${completedGates}/${gates.length}` : "0/0"} />
              <Metric icon={<Wallet size={17} />} label="Signer" value={walletSession ? "bound" : "none"} />
              <Metric icon={<Trophy size={17} />} label="Rewards" value={canClaimRewards ? "claimable" : "locked"} />
            </div>

            <div className="grid min-h-[calc(100vh-156px)] grid-rows-[auto_minmax(0,1fr)_auto]">
              <div className="border-b border-ink/10 bg-white p-3">
                {files.length > 0 ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {files.map((file, index) => (
                      <button
                        className={`inline-flex h-9 max-w-full items-center gap-2 rounded px-3 text-xs font-black transition ${
                          activeFile === index
                            ? "bg-ink text-white"
                            : "bg-[#f0f2f5] text-ink/60 hover:bg-white hover:text-ink"
                        }`}
                        key={file.path}
                        onClick={() => setActiveFile(index)}
                        type="button"
                      >
                        <FileCode2 size={14} />
                        <span className="truncate">{file.path}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-ink/55">
                    No generated workbench files yet.
                  </p>
                )}
              </div>

              <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 border-b border-ink/10 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between border-b border-ink/10 bg-[#11151b] px-4 py-3 text-white">
                    <div className="flex min-w-0 items-center gap-2">
                      <Terminal size={16} />
                      <span className="truncate font-mono text-xs font-bold">
                        {activeFileMeta?.path ?? "no-file"}
                      </span>
                    </div>
                    <span className="rounded bg-white/10 px-2 py-1 text-[11px] font-black uppercase text-white/55">
                      {activeFileMeta?.language ?? "none"}
                    </span>
                  </div>
                  <textarea
                    aria-label="Code editor"
                    className="h-[460px] w-full resize-none border-0 bg-[#11151b] p-4 font-mono text-[13px] leading-6 text-[#eef4ff] outline-none lg:h-full"
                    disabled={!activeFileMeta}
                    spellCheck={false}
                    value={activeFileMeta ? codeByPath[activeFileMeta.path] ?? "" : ""}
                    onChange={(event) => {
                      if (!activeFileMeta) {
                        return;
                      }

                      setCodeByPath((current) => ({
                        ...current,
                        [activeFileMeta.path]: event.target.value,
                      }));
                    }}
                  />
                </div>

                <aside className="min-w-0 bg-white p-4">
                  <PanelTitle
                    icon={<ShieldCheck size={16} />}
                    kicker={run ? `Gate ${activeGate + 1}` : "Gate"}
                    title={run ? gateNames[activeGate] ?? "Prove" : "Waiting"}
                  />
                  <p className="mt-3 text-sm font-semibold leading-6 text-ink/68">
                    {currentGate}
                  </p>

                  <label className="mt-5 grid gap-2">
                    <span className="control-label">Proof note</span>
                    <textarea
                      aria-label="Proof note"
                      className="min-h-36 resize-none rounded border border-ink/15 bg-[#f7f8fa] p-3 text-sm font-semibold leading-6 outline-none focus:border-[#2f6fed] focus:bg-white"
                      disabled={!run}
                      value={proofNotes[activeGate] ?? ""}
                      onChange={(event) =>
                        setProofNotes((current) => ({
                          ...current,
                          [activeGate]: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded border border-ink/15 bg-white text-sm font-black text-ink transition hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!run}
                      onClick={handleSubmitProof}
                      type="button"
                    >
                      <Save size={15} />
                      Proof
                    </button>
                    <button
                      className="inline-flex h-10 items-center justify-center gap-2 rounded bg-[#20a779] text-sm font-black text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/35"
                      disabled={!run}
                      onClick={handleRunChecks}
                      type="button"
                    >
                      <Play size={15} />
                      Verify
                    </button>
                  </div>

                  <div className="mt-5 rounded border border-ink/10 bg-[#11151b] p-3 text-white">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                        Verification
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
                      {run?.quest.boss_fight ?? "Generate a signed run to receive a boss fight."}
                    </p>
                  </div>
                  <button
                    className="inline-flex h-11 items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-black text-white transition hover:bg-[#2f6fed] disabled:cursor-not-allowed disabled:bg-ink/35"
                    disabled={!run || !canClaimRewards}
                    onClick={() => setActiveGate(gates.length - 1)}
                    type="button"
                  >
                    <Trophy size={16} />
                    Ship
                  </button>
                </div>
              </div>
            </div>
          </section>

          <aside className="border-t border-ink/10 bg-white p-4 xl:border-l xl:border-t-0">
            <PanelTitle icon={<ChevronRight size={16} />} kicker={`Run ${runLabel}`} title="Proof Rail" />
            <div className="mt-4 space-y-2">
              {run ? (
                gates.map((gate, index) => (
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
                ))
              ) : (
                <EmptyState />
              )}
            </div>

            <section className="mt-5 rounded border border-ink/10 bg-[#f7f8fa] p-4">
              <PanelTitle icon={<Lock size={16} />} kicker="Receipts" title="Reward Locks" />
              <div className="mt-3 space-y-2">
                <ReceiptRow label="Wallet" ready={Boolean(walletSession)} value={walletSession ? shortenAddress(walletSession.address) : "not bound"} />
                <ReceiptRow label="CKB RPC" ready={Boolean(health?.integrations.ckb_rpc)} value={health?.integrations.ckb_rpc ? "ready" : "missing"} />
                <ReceiptRow label="Fiber RPC" ready={Boolean(health?.integrations.fiber_rpc)} value={health?.integrations.fiber_rpc ? "ready" : "missing"} />
              </div>
              {run && (
                <p className="mt-3 text-sm font-semibold leading-6 text-ink/65">
                  {run.quest.reward_logic}
                </p>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function WalletPanel({
  walletName,
  signerName,
  address,
  balance,
  isBinding,
  error,
  onConnect,
  onDisconnect,
  onChooseWallet,
}: {
  walletName?: string;
  signerName?: string;
  address?: string;
  balance?: string;
  isBinding: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onChooseWallet: () => void;
}) {
  const bound = Boolean(address);

  return (
    <section className="rounded border border-ink/10 bg-[#f7f8fa] p-3">
      <div className="flex items-start justify-between gap-3">
        <PanelTitle icon={<Wallet size={16} />} kicker="Wallet" title={bound ? "Proof bound" : "Bind signer"} />
        <span className={`rounded px-2 py-1 text-[11px] font-black uppercase ${bound ? "bg-[#effbf6] text-[#087451]" : "bg-white text-ink/45"}`}>
          {walletName ?? "required"}
        </span>
      </div>

      <div className="mt-3 space-y-2 font-mono text-xs font-bold leading-5 text-ink/62">
        <p className="overflow-wrap-anywhere">{address ?? "No wallet proof signed yet."}</p>
        {signerName && <p>Signer: {signerName}</p>}
        {balance && <p>Balance: {balance} CKB</p>}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <button
          className={`inline-flex h-10 items-center justify-center gap-2 rounded text-sm font-black transition ${
            bound ? "border border-ink/15 bg-white text-ink hover:border-ink/40" : "bg-ink text-white hover:bg-[#2f6fed]"
          }`}
          disabled={isBinding}
          onClick={bound ? onDisconnect : onConnect}
          type="button"
        >
          {bound ? <Unplug size={15} /> : <PlugZap size={15} />}
          {isBinding ? "Signing..." : bound ? "Disconnect" : "Sign Wallet Proof"}
        </button>
        {!bound && (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-ink/15 bg-white text-sm font-black text-ink transition hover:border-ink/40"
            onClick={onChooseWallet}
            type="button"
          >
            <KeyRound size={15} />
            Choose Wallet
          </button>
        )}
      </div>

      {error && <Notice tone="bad">{error}</Notice>}
    </section>
  );
}

function FlowRow({ index, step }: { index: number; step: FlowStep }) {
  return (
    <div className={`rounded border p-3 ${step.done ? "border-[#20a779]/25 bg-[#effbf6]" : step.blocked ? "border-[#d99b2b]/30 bg-[#fff7e8]" : "border-ink/10 bg-[#f7f8fa]"}`}>
      <div className="flex items-center gap-2">
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black ${step.done ? "bg-[#20a779] text-white" : step.blocked ? "bg-[#d99b2b] text-white" : "bg-white text-ink/45"}`}>
          {step.done ? <Check size={14} strokeWidth={3} /> : index}
        </span>
        <p className="text-sm font-black">{step.label}</p>
      </div>
      <p className="mt-2 overflow-wrap-anywhere text-xs font-semibold leading-5 text-ink/60">
        {step.detail}
      </p>
    </div>
  );
}

function ReceiptRow({ label, ready, value }: { label: string; ready: boolean; value: string }) {
  return (
    <p className="flex items-center justify-between gap-3 rounded border border-ink/10 bg-white p-3 text-xs font-bold text-ink/65">
      <span>{label}</span>
      <span className={ready ? "text-[#087451]" : "text-[#a8321d]"}>{value}</span>
    </p>
  );
}

function EmptyState() {
  return (
    <div className="rounded border border-ink/10 bg-[#f7f8fa] p-4">
      <p className="text-sm font-black">No signed run</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-ink/58">
        Bind a real wallet proof, then generate a quest. The workbench files and gates will appear here.
      </p>
    </div>
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
  const className =
    status === "passed"
      ? "bg-[#20a779] text-white"
      : status === "failed" || status === "blocked"
        ? "bg-[#d84a2f] text-white"
        : status === "running"
          ? "bg-[#2f6fed] text-white"
          : "bg-white/10 text-white/55";

  return (
    <span className={`rounded px-2 py-1 text-[11px] font-black uppercase ${className}`}>
      {status}
    </span>
  );
}

function StatusPill({
  label,
  state,
}: {
  label: string;
  state: "ready" | "blocked" | "checking" | "down";
}) {
  const className =
    state === "ready"
      ? "border-[#20a779]/30 bg-[#effbf6] text-[#087451]"
      : state === "down" || state === "blocked"
        ? "border-[#d84a2f]/30 bg-[#fff2ee] text-[#a8321d]"
        : "border-ink/10 bg-[#f7f8fa] text-ink/55";

  return (
    <span className={`inline-flex h-9 items-center rounded border px-3 text-xs font-black ${className}`}>
      {label}: {state}
    </span>
  );
}

function Notice({ tone, children }: { tone: "warn" | "bad"; children: React.ReactNode }) {
  const className =
    tone === "bad"
      ? "border-[#d84a2f]/30 bg-[#fff2ee] text-[#a8321d]"
      : "border-[#d99b2b]/30 bg-[#fff7e8] text-[#8a5c00]";

  return (
    <p className={`mt-3 rounded border px-3 py-2 text-sm font-semibold ${className}`}>
      <span className="inline-flex items-center gap-2">
        <AlertTriangle size={15} />
        {children}
      </span>
    </p>
  );
}

function buildWalletProofMessage(address: string) {
  return [
    "VibeQuest wallet proof",
    `Address: ${address}`,
    `Issued: ${new Date().toISOString()}`,
    "Purpose: bind generated quest runs, proof notes, and reward claims to this signer.",
  ].join("\n");
}

function getGenerateBlocker(
  health: HealthResponse | null,
  healthError: string | null,
  walletSession: WalletSession | null,
) {
  if (!health && !healthError) {
    return "Checking vibequest-core health.";
  }

  if (healthError) {
    return "vibequest-core health check failed.";
  }

  if (!health?.integrations.openai) {
    return "Configure OPENAI_API_KEY in vibequest-core.";
  }

  if (!walletSession) {
    return "Sign a CKB secp256k1 wallet proof first.";
  }

  return null;
}

function nextTemplate(currentPrompt: string) {
  const currentIndex = templates.indexOf(currentPrompt);
  return templates[(currentIndex + 1) % templates.length];
}

function shortenAddress(address: string) {
  if (address.length <= 18) {
    return address;
  }

  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}
