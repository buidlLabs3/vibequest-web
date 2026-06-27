import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { 
  Play, 
  Terminal as TermIcon, 
  Folder, 
  FileCode, 
  CheckCircle, 
  AlertCircle, 
  Cpu, 
  Award,
  RefreshCw,
  Clock
} from "lucide-react";
import { QuestData, WorkbenchFile, VerificationGate } from "@/lib/workbench-types";

const EMPTY_WORKSPACE_FILES: WorkbenchFile[] = [];

interface WorkbenchViewProps {
  walletBound: boolean;
  onConnectWallet: () => void;
  questData: QuestData | null;
  onGenerateQuest: (request: string, skill: string, difficulty: string) => Promise<boolean>;
  generating: boolean;
  buildRequest: string;
  setBuildRequest: (req: string) => void;
  skillTrack: string;
  setSkillTrack: (track: string) => void;
  difficulty: string;
  setDifficulty: (diff: string) => void;
  selectedFile: WorkbenchFile | null;
  setSelectedFile: (file: WorkbenchFile | null) => void;
  gates: VerificationGate[];
  setGates: Dispatch<SetStateAction<VerificationGate[]>>;
  bossFightSolved: boolean;
  setBossFightSolved: (solved: boolean) => void;
  shipped: boolean;
  onShip: () => void;
  ckbRpcOnline: boolean;
  generationError?: string | null;
}

function verifyGeneratedWorkspace(files: WorkbenchFile[]) {
  const haystack = files
    .map((file) => `${file.path}\n${file.description}\n${file.content}`)
    .join("\n")
    .toLowerCase();

  const checks = [
    {
      label: "workspace files returned",
      passed: files.length > 0 && files.every((file) => file.content.trim().length > 0),
    },
    {
      label: "test or assertion path present",
      passed: /test|spec|assert|expect|should|#\[test\]/.test(haystack),
    },
    {
      label: "wallet/proof/payment trust boundary present",
      passed: /wallet|proof|signature|receipt|payment|fiber|ckb|cell/.test(haystack),
    },
    {
      label: "denial or failure path present",
      passed: /block|reject|unauthorized|unpaid|forbid|deny|invalid|error/.test(haystack),
    },
  ];

  return {
    passed: checks.every((check) => check.passed),
    logs: checks.map((check) =>
      `[VQ-CORE] ${check.passed ? "PASS" : "FAIL"}: ${check.label}.`,
    ),
  };
}
export default function WorkbenchView({
  walletBound,
  onConnectWallet,
  questData,
  onGenerateQuest,
  generating,
  buildRequest,
  setBuildRequest,
  skillTrack,
  setSkillTrack,
  difficulty,
  setDifficulty,
  selectedFile,
  setSelectedFile,
  gates,
  setGates,
  bossFightSolved,
  setBossFightSolved,
  shipped,
  onShip,
  ckbRpcOnline,
  generationError,
}: WorkbenchViewProps) {
  const [testConsoleLogs, setTestConsoleLogs] = useState<string[]>([]);
  const [runningTests, setRunningTests] = useState(false);
  const [bossAnswer, setBossAnswer] = useState<number | null>(null);
  const [bossFeedback, setBossFeedback] = useState<string | null>(null);
  const [showBossHint, setShowBossHint] = useState(false);

  const workspaceFiles = questData?.files ?? EMPTY_WORKSPACE_FILES;

  useEffect(() => {
    if (workspaceFiles.length === 0) {
      if (selectedFile) {
        setSelectedFile(null);
      }
      return;
    }

    if (!selectedFile || !workspaceFiles.some((file) => file.path === selectedFile.path)) {
      setSelectedFile(workspaceFiles[0]);
    }
  }, [workspaceFiles, selectedFile, setSelectedFile]);

  // Sync wallet and backend readiness values
  useEffect(() => {
    setGates(prev => prev.map(gate => {
      if (gate.id === "identity") {
        return { ...gate, isCompleted: walletBound };
      }
      if (gate.id === "infrastructure") {
        return { ...gate, isCompleted: ckbRpcOnline };
      }
      return gate;
    }));
  }, [walletBound, ckbRpcOnline, setGates]);

  const handleRunTests = () => {
    if (!questData) {
      setTestConsoleLogs([
        "[VQ-CORE] ERROR: No active quest generated. Generate a quest through vibequest-core first."
      ]);
      return;
    }

    setRunningTests(true);
    setTestConsoleLogs([]);

    const verification = verifyGeneratedWorkspace(workspaceFiles);
    const logSteps = [
      `[VQ-CORE] Initializing verification sequence for [${questData.questName}]...`,
      "[VQ-CORE] Loading generated workbench files from backend response...",
      ...workspaceFiles.map((file) => `[VQ-CORE] Inspecting ${file.path} (${file.content.length} bytes)...`),
      ...verification.logs,
      verification.passed
        ? "[VQ-CORE] SUCCESS: generated workspace contains test, proof, and denial-path signals."
        : "[VQ-CORE] BLOCKED: generated workspace is missing required proof/test signals.",
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logSteps.length) {
        setTestConsoleLogs((prev) => [...prev, logSteps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setRunningTests(false);
        setGates((prev) =>
          prev.map((gate) =>
            gate.id === "verification" ? { ...gate, isCompleted: verification.passed } : gate,
          ),
        );
      }
    }, 360);
  };
  const handleBossSubmit = () => {
    if (!questData) return;
    const correctIndex = questData.bossFight.correctAnswerIndex;
    if (bossAnswer === correctIndex) {
      setBossFeedback("SUCCESS");
      setBossFightSolved(true);
    } else {
      setBossFeedback("FAIL");
    }
  };

  useEffect(() => {
    setBossAnswer(null);
    setBossFeedback(null);
    setShowBossHint(false);
    setTestConsoleLogs([]);
  }, [questData?.questName]);

  const isAllGatesPassed = gates.every(g => g.isCompleted);

  return (
    <div className="bg-[#0B0C0E] text-on-surface font-sans p-4 md:p-8 max-w-[1500px] mx-auto flex flex-col gap-8 min-h-screen">
      {/* Top Banner / Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-glass-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Cpu className="text-electric-blue w-8 h-8 animate-pulse" />
            VibeQuest Workbench
          </h1>
          <p className="text-on-surface-variant text-sm font-mono mt-1">
            NETWORK: <span className="text-cyber-green">CKB_FIBER_TESTNET_WORKBENCH</span> / CLIENT: v1.0.4 / LOG: RUNNING
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#16181D] border border-glass-border px-4 py-2 rounded-xl text-xs font-mono text-on-surface-variant">
          <Clock className="w-4 h-4 text-electric-blue" />
          <span>INFRA: {ckbRpcOnline ? "READY" : "BLOCKED"}</span>
          <span className="opacity-30">|</span>
          <span>QUEST SOURCE: VQ-CORE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT COLUMN: QUEST BUILD / PROMPT PANEL (span 4) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <div className="bg-[#16181D] border border-glass-border rounded-xl p-5 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-glass-border pb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-electric-blue"></span>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Forge Quest Parameters
              </h2>
            </div>

            {/* Skill Track Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase text-on-surface-variant">
                Skill Track
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Fiber Builder", "CKB Fundamentals", "AI Discipline"].map((track) => (
                  <button
                    key={track}
                    onClick={() => setSkillTrack(track)}
                    className={`px-3 py-2 rounded font-mono text-xs border text-center transition-all cursor-pointer ${
                      skillTrack === track
                        ? "border-electric-blue bg-electric-blue/15 text-electric-blue font-bold"
                        : "border-glass-border text-on-surface-variant hover:bg-white/5"
                    }`}
                  >
                    {track.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Threat Level Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase text-on-surface-variant">
                Threat Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["NOVICE", "BUILDER", "BOSS"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-3 py-2 rounded font-mono text-xs border text-center transition-all cursor-pointer ${
                      difficulty === level
                        ? level === "NOVICE"
                          ? "border-cyber-green bg-cyber-green/15 text-cyber-green font-bold"
                          : level === "BUILDER"
                          ? "border-electric-blue bg-electric-blue/15 text-electric-blue font-bold"
                          : "border-warning-amber bg-warning-amber/15 text-warning-amber font-bold"
                        : "border-glass-border text-on-surface-variant hover:bg-white/5"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Build Request TextArea */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase text-on-surface-variant flex justify-between items-center">
                <span>Build Request Prompt</span>
                <span className="text-[10px] text-electric-blue cursor-pointer hover:underline" onClick={() => setBuildRequest("Build a state-channel payment route with atomic multi-hop payments and signature check.")}>
                  Load Preset
                </span>
              </label>
              <textarea
                value={buildRequest}
                onChange={(e) => setBuildRequest(e.target.value)}
                rows={5}
                className="w-full bg-[#0B0C0E] border border-glass-border rounded-lg p-3 font-mono text-xs text-white focus:outline-none focus:border-electric-blue resize-none leading-relaxed"
                placeholder="Describe the CKB/Fiber app, proof behavior, and tests you want generated..."
              />
            </div>

            {/* Generate Quest Button */}
            <button
              onClick={() => void onGenerateQuest(buildRequest, skillTrack, difficulty)}
              disabled={generating || !buildRequest.trim()}
              className="w-full py-3.5 bg-electric-blue hover:brightness-110 disabled:brightness-50 disabled:cursor-not-allowed text-[#0B0C0E] rounded-lg font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Workspace...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Generate Quest
                </>
              )}
            </button>

            {generationError && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 font-mono text-[11px] leading-relaxed text-red-300">
                {generationError}
              </div>
            )}
          </div>

          {questData && (
            <div className="bg-[#16181D] border border-glass-border rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-glass-border pb-3 justify-between">
                <div className="flex items-center gap-2">
                  <TermIcon className="text-cyber-green w-5 h-5" />
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                    Active Quest Checks
                  </h2>
                </div>
                <span
                  className={
                    gates.find((gate) => gate.id === "verification")?.isCompleted
                      ? "font-mono text-xs text-cyber-green"
                      : "font-mono text-xs text-warning-amber"
                  }
                >
                  {gates.find((gate) => gate.id === "verification")?.isCompleted ? "VERIFIED" : "PENDING"}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {questData.gates.map((gate, index) => (
                  <div
                    key={gate.id}
                    className="p-3 rounded-lg border border-glass-border bg-[#0B0C0E]/50 flex gap-3"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-electric-blue/10 text-[10px] font-mono font-bold text-electric-blue">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold font-mono text-white">{gate.name}</h3>
                      <p className="text-[11px] text-on-surface-variant leading-normal mt-1">
                        {gate.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleRunTests}
                disabled={runningTests || !walletBound || !ckbRpcOnline}
                className="w-full py-3 border border-dashed border-electric-blue/30 hover:border-electric-blue hover:bg-electric-blue/5 text-electric-blue font-mono font-bold text-xs uppercase rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                {runningTests ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Checking Generated Files...
                  </>
                ) : (
                  <>
                    <TermIcon className="w-3.5 h-3.5" />
                    Run Generated File Checks
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CODE EXPLORER & INTERACTIVE EDITOR (span 8) */}
        <div className="xl:col-span-9 flex flex-col gap-6">
          <div className="bg-[#16181D] border border-glass-border rounded-xl flex flex-col min-h-[720px] xl:min-h-[760px] overflow-hidden">
            {/* Workspace Explorer Header */}
            <div className="bg-[#1D212A] border-b border-glass-border px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Folder className="text-electric-blue w-5 h-5" />
                <span className="font-mono text-sm font-bold text-white uppercase tracking-wide">
                  Workspace Explorer
                </span>
                {questData && (
                  <span className="text-xs font-mono text-cyber-green bg-cyber-green/10 border border-cyber-green/20 px-2.5 py-0.5 rounded">
                    Active Quest: {questData.questName}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/30"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/30"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/30"></span>
              </div>
            </div>

            {/* Inner Workspace split panel: File list left, Editor right */}
            <div className="flex flex-1 overflow-hidden">
              {/* File list */}
              <div className="w-56 lg:w-64 bg-[#0F1115] border-r border-glass-border overflow-y-auto p-2 flex flex-col gap-1">
                <div className="text-[10px] font-mono text-on-surface-variant uppercase font-semibold px-2.5 py-2">
                  Files
                </div>
                {workspaceFiles.length > 0 ? (
                  workspaceFiles.map((file) => {
                    const isActive = selectedFile?.path === file.path;
                    return (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={
                          isActive
                            ? "w-full text-left px-2.5 py-1.5 rounded font-mono text-xs flex items-center gap-2 transition-all cursor-pointer bg-electric-blue/10 text-electric-blue font-semibold border-l-2 border-electric-blue"
                            : "w-full text-left px-2.5 py-1.5 rounded font-mono text-xs flex items-center gap-2 transition-all cursor-pointer text-on-surface-variant hover:text-white hover:bg-white/5"
                        }
                      >
                        <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-glass-border p-3 font-mono text-[11px] leading-relaxed text-on-surface-variant">
                    No generated files yet.
                  </div>
                )}
              </div>

              {/* Editor panel */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0B0E]">
                {/* File Title Bar */}
                <div className="border-b border-glass-border/70 px-4 py-2 flex justify-between items-center text-xs text-on-surface-variant bg-[#0F1115]/80">
                  <span className="font-mono text-electric-blue">
                    /{selectedFile?.path || "workspace"}
                  </span>
                  <span className="font-mono text-[10px] opacity-50">
                    TypeScript / Rust Lexer
                  </span>
                </div>

                {/* File Contents */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 font-mono text-[13px] leading-6 text-gray-300 select-text">
                  {selectedFile ? (
                    <pre className="whitespace-pre-wrap">
                      {selectedFile.content.split("\n").map((line, idx) => (
                        <div key={idx} className="flex hover:bg-white/5 px-2 rounded">
                          <span className="w-10 text-on-surface-variant opacity-30 select-none border-r border-glass-border/30 pr-3 mr-4 text-right">
                            {idx + 1}
                          </span>
                          <span className="text-[#A9B2C3] font-mono break-words">{line}</span>
                        </div>
                      ))}
                    </pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant gap-3 px-6">
                      <TermIcon className="w-8 h-8 opacity-60" />
                      <span className="text-xs font-mono uppercase tracking-wider text-white">No active generated workspace</span>
                      <span className="max-w-md text-xs leading-relaxed">Connect JoyID, then generate a quest to load backend-created files here.</span>
                      {!walletBound && (
                        <button
                          onClick={onConnectWallet}
                          className="mt-2 rounded-lg border border-electric-blue/40 px-4 py-2 font-mono text-xs font-bold uppercase text-electric-blue hover:bg-electric-blue/10"
                        >
                          Connect Wallet
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Verification Console Terminal logs */}
          {testConsoleLogs.length > 0 && (
            <div className="bg-[#0B0C0E] border border-glass-border rounded-xl p-4 font-mono text-xs text-cyber-green flex flex-col gap-1 h-[220px] overflow-y-auto shadow-inner">
              <div className="text-[10px] uppercase font-bold text-on-surface-variant border-b border-glass-border pb-1.5 mb-2 flex justify-between">
                <span>Generated File Check Terminal</span>
                <span>SYSTEM STATE: RUNNING</span>
              </div>
              {testConsoleLogs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOSS FIGHT BLOCK - FULL WIDTH BOTTOM ENCOUNTER */}
      {questData && !shipped && (
        <div className="bg-[#1C1517] border border-red-900/40 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-stretch relative overflow-hidden">
          {/* Accent Danger Glows */}
          <div className="absolute top-[-20%] right-[-10%] w-[30%] h-[50%] bg-red-900/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="flex-1 flex flex-col justify-between gap-5 z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-red-950/40 border border-red-800/30 px-3 py-1 rounded-full text-red-400 font-mono text-[10px] uppercase tracking-wider mb-4 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                ACTIVE BOSS ENCOUNTER
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Award className="text-red-500 w-7 h-7" />
                {questData.bossFight.title}
              </h2>
              <p className="text-sm text-gray-400 mt-2 font-light leading-relaxed">
                {questData.bossFight.challenge}
              </p>
            </div>

            {/* Multiple Choice Question */}
            <div className="bg-[#0D0B0C] border border-red-900/20 rounded-lg p-5 flex flex-col gap-4">
              <span className="font-mono text-xs uppercase tracking-wider text-red-400 font-semibold">
                Question Checklist Challenge
              </span>
              <p className="text-sm font-sans text-white font-medium">
                {questData.bossFight.question}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {questData.bossFight.options.map((opt, idx) => {
                  const isSelected = bossAnswer === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (bossFeedback !== "SUCCESS") {
                          setBossAnswer(idx);
                          setBossFeedback(null);
                        }
                      }}
                      className={`text-left p-3.5 rounded font-mono text-xs border transition-all cursor-pointer ${
                        isSelected
                          ? "border-red-500 bg-red-500/15 text-white font-bold"
                          : "border-red-900/20 text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="font-extrabold mr-2 text-red-500">[{String.fromCharCode(65 + idx)}]</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Controls and Feedback */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 pt-4 border-t border-red-900/20">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleBossSubmit}
                    disabled={bossAnswer === null || bossFeedback === "SUCCESS"}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold font-mono text-xs uppercase tracking-wider rounded transition-all cursor-pointer shrink-0"
                  >
                    SUBMIT RUN
                  </button>
                  <button
                    onClick={() => setShowBossHint(!showBossHint)}
                    className="px-4 py-2.5 border border-red-900/40 text-red-400 hover:bg-red-900/10 font-mono text-xs uppercase rounded transition-all cursor-pointer shrink-0"
                  >
                    HINT
                  </button>
                </div>

                {bossFeedback === "SUCCESS" && (
                  <span className="text-cyber-green font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    CHALLENGE COMPLETED. PROOF SYNCHRONIZED!
                  </span>
                )}
                {bossFeedback === "FAIL" && (
                  <span className="text-red-500 font-mono text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    LOCK FAULT DEPLOYED. TRY AGAIN!
                  </span>
                )}
              </div>

              {showBossHint && (
                <div className="text-xs font-mono text-red-400/80 bg-red-950/20 p-3 rounded border border-red-900/25 mt-2">
                  <span className="font-bold">VQ-CORE ASSIST HINT:</span> {questData.bossFight.hint}
                </div>
              )}
            </div>
          </div>

          {/* Cinematics / Proof sidebar for Boss */}
          <div className="w-full md:w-80 border-l border-red-900/20 pl-0 md:pl-8 flex flex-col justify-between gap-6 z-10 shrink-0">
            <div className="bg-[#0D0B0C]/80 rounded-lg p-4 border border-red-900/20">
              <span className="font-mono text-[10px] text-red-400 uppercase tracking-wider block mb-2">
                VERIFICATION ENVELOPE
              </span>
              <ul className="space-y-2 text-[11px] font-mono text-gray-400">
                <li className="flex justify-between">
                  <span>IDENTITY PROOF:</span>
                  <span className={walletBound ? "text-cyber-green" : "text-red-500"}>
                    {walletBound ? "BOUND" : "MISSING"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>INFRASTRUCTURE:</span>
                  <span className={ckbRpcOnline ? "text-cyber-green" : "text-red-500"}>
                    {ckbRpcOnline ? "OPERATIONAL" : "BLOCKED"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>TEST VERIFICATION:</span>
                  <span className={gates.find(g => g.id === "verification")?.isCompleted ? "text-cyber-green" : "text-red-500"}>
                    {gates.find(g => g.id === "verification")?.isCompleted ? "PASSED" : "PENDING"}
                  </span>
                </li>
              </ul>
            </div>

            {bossFightSolved && (
              <div className="bg-cyber-green/5 border border-cyber-green/20 rounded-lg p-4">
                <span className="font-mono text-[10px] text-cyber-green uppercase tracking-wider block mb-1 font-bold">
                  CINEMATIC VICTORY SIGNED
                </span>
                <p className="text-[11px] font-sans text-gray-300 leading-relaxed italic">
                  &ldquo;{questData.bossFight.victoryMessage}&rdquo;
                </p>
                <button
                  onClick={onShip}
                  disabled={!isAllGatesPassed}
                  className="w-full py-2.5 bg-cyber-green hover:brightness-110 disabled:brightness-50 disabled:cursor-not-allowed text-black font-extrabold text-xs uppercase tracking-wider rounded mt-4 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Award className="w-4 h-4 animate-bounce" />
                  LOCK PROOF ENVELOPE
                </button>
                {!isAllGatesPassed && (
                  <span className="text-[9px] font-mono text-red-400 text-center block mt-1.5 leading-tight">
                    * Wallet, backend readiness, and generated file checks must pass before shipping!
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUCCESS / SHIPPED STATE BANNER */}
      {shipped && (
        <div className="bg-cyber-green/10 border-2 border-cyber-green rounded-xl p-8 text-center flex flex-col items-center justify-center gap-4 max-w-2xl mx-auto my-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-cyber-green/5 blur-[50px] rounded-full pointer-events-none"></div>
          <Award className="w-16 h-16 text-cyber-green animate-bounce" />
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">
            Proof Envelope Locked
          </h2>
          <p className="text-sm text-gray-300 max-w-md leading-relaxed">
            Your verified quest solution proof for <span className="text-cyber-green font-semibold">&ldquo;{questData?.questName}&rdquo;</span> is now locked locally for reward claim wiring. The chain claim adapter can consume this proof state next.
          </p>
          <div className="bg-[#0B0C0E] border border-glass-border px-5 py-3 rounded font-mono text-xs text-cyber-green mt-2 select-all">
            PROOF_STATE: WALLET_BOUND / QUEST_VERIFIED / BOSS_SOLVED
          </div>
        </div>
      )}
    </div>
  );
}
