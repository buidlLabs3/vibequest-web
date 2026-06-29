import {
  Terminal as TermIcon,
  Sliders,
  Play,
  ChevronRight,
  RefreshCw,
  Cpu,
  AlertCircle,
} from "lucide-react";

interface QuestRunViewProps {
  onGenerateQuest: (request: string, skill: string, difficulty: string) => Promise<boolean>;
  generating: boolean;
  buildRequest: string;
  setBuildRequest: (req: string) => void;
  skillTrack: string;
  setSkillTrack: (track: string) => void;
  difficulty: string;
  setDifficulty: (diff: string) => void;
  setActiveTab: (tab: string) => void;
  generationError?: string | null;
}

export default function QuestRunView({
  onGenerateQuest,
  generating,
  buildRequest,
  setBuildRequest,
  skillTrack,
  setSkillTrack,
  difficulty,
  setDifficulty,
  setActiveTab,
  generationError,
}: QuestRunViewProps) {

  const learnerPaths = [
    {
      role: "Builder",
      outcome: "Ship safer CKB/Fiber code",
      prompt: "Build a Fiber payment flow with CKB witness checks, then teach me the exact trust boundary and the denial test that proves it is safe.",
      track: "Fiber Builder",
    },
    {
      role: "Auditor",
      outcome: "Find replay and mismatch bugs",
      prompt: "Generate a CKB/Fiber verifier with one realistic replay or mismatched-witness risk, then make the challenge teach me how to detect and patch it.",
      track: "CKB Fundamentals",
    },
    {
      role: "Product / Community",
      outcome: "Understand without writing everything",
      prompt: "Create a non-trivial CKB/Fiber quest that explains what the code enables, what can go wrong, and how a community/product lead should evaluate the risk.",
      track: "AI Discipline",
    },
    {
      role: "Researcher",
      outcome: "Map protocol concepts to code",
      prompt: "Turn a CKB cell/script/witness or Fiber HTLC/channel-state concept into a compact code quest with references, invariants, and a failure case.",
      track: "CKB Fundamentals",
    },
  ];

  const promptBlocks = [
    {
      category: "Trust Boundaries",
      items: [
        "Bind receipt proof to reader, content, run id, and CKB cell",
        "Reject stale Fiber channel state or replayed HTLC preimages",
        "Explain what is checked locally versus proven by CKB witness data",
      ]
    },
    {
      category: "Economic Logic",
      items: [
        "Verify xUDT payout split and rounding behavior",
        "Check creator, sponsor, and protocol fee recipients",
        "Prevent over-claiming from active channel balance transitions",
      ]
    },
    {
      category: "Learning Challenge",
      items: [
        "Ask a code-specific boss question with wrong answers that teach",
        "Include a denial test that mutates the exact trusted field",
        "Explain the generated code for a non-engineer and an engineer",
      ]
    }
  ];

  const applyLearnerPath = (path: (typeof learnerPaths)[number]) => {
    setSkillTrack(path.track);
    setBuildRequest(path.prompt);
  };

  const handleStitchPrompt = (blockText: string) => {
    if (buildRequest.trim() === "") {
      setBuildRequest(`Build ${blockText.toLowerCase()}`);
    } else {
      setBuildRequest(`${buildRequest.trim()} and ${blockText.toLowerCase()}`);
    }
  };

  const handleLaunchQuest = async () => {
    const generated = await onGenerateQuest(buildRequest, skillTrack, difficulty);
    if (generated) {
      setActiveTab("workbench");
    }
  };

  return (
    <div className="bg-[#0B0C0E] text-on-surface font-sans p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8 min-h-screen">
      {/* View Header */}
      <div className="border-b border-glass-border pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Cpu className="text-electric-blue w-8 h-8 animate-pulse" />
          Quest Compiler Dashboard
        </h1>
        <p className="text-on-surface-variant text-sm mt-1 max-w-xl">
          Start from the learner&apos;s role, then generate a code-aware quest with explanations, failure cases, and a boss challenge tied to the generated files.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: BUILDER BLOCKS (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#16181D] border border-glass-border rounded-xl p-5 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-glass-border pb-3">
              <Sliders className="text-electric-blue w-5 h-5" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Learner Intent
              </h2>
            </div>

            <div className="grid gap-3">
              {learnerPaths.map((path) => (
                <button
                  key={path.role}
                  onClick={() => applyLearnerPath(path)}
                  className="rounded-lg border border-glass-border/70 bg-[#0B0C0E]/60 p-4 text-left transition-colors hover:border-electric-blue/40 hover:bg-[#1C1F26]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-white">{path.role}</span>
                    <ChevronRight className="h-4 w-4 text-electric-blue" />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{path.outcome}</p>
                </button>
              ))}
            </div>

            <div className="border-t border-glass-border pt-4">
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-wider text-electric-blue">Deepen the quest</h3>
            </div>

            <div className="flex flex-col gap-5 max-h-[360px] overflow-y-auto pr-1">
              {promptBlocks.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-2.5">
                  <span className="font-mono text-[10px] text-electric-blue uppercase tracking-wider font-bold">
                    {cat.category}
                  </span>
                  <div className="flex flex-col gap-2">
                    {cat.items.map((item, itemIdx) => (
                      <button
                        key={itemIdx}
                        onClick={() => handleStitchPrompt(item)}
                        className="text-left p-3 rounded-lg bg-[#0B0C0E]/50 hover:bg-[#1C1F26] border border-glass-border/70 hover:border-electric-blue/40 text-xs font-mono text-gray-300 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <span className="leading-normal">{item}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-electric-blue transition-colors shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TERMINAL INJECTOR & PARAMS (span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[#16181D] border border-glass-border rounded-xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-glass-border pb-3">
              <div className="flex items-center gap-2">
                <TermIcon className="text-cyber-green w-5 h-5 animate-pulse" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Quest Generation Engine
                </h2>
              </div>
            </div>

            {/* Custom Prompt Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase text-on-surface-variant">
                Build Request
              </label>
              <textarea
                value={buildRequest}
                onChange={(e) => setBuildRequest(e.target.value)}
                rows={5}
                className="w-full bg-[#0B0C0E] border border-glass-border rounded-lg p-3.5 font-mono text-xs text-cyber-green leading-relaxed focus:outline-none focus:border-cyber-green/50 resize-none shadow-inner"
                placeholder="Describe what you want to understand or build: verifier, payout split, receipt proof, wallet flow, protocol risk, or community-facing explanation..."
              />
            </div>


            <div className="grid grid-cols-2 gap-4">
              {/* Skill dropdown */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant">Skill Track</span>
                <select
                  value={skillTrack}
                  onChange={(e) => setSkillTrack(e.target.value)}
                  className="bg-[#0B0C0E] text-white text-xs font-mono rounded p-2 border border-glass-border cursor-pointer focus:outline-none"
                >
                  <option value="Fiber Builder">Fiber Builder</option>
                  <option value="CKB Fundamentals">CKB Fundamentals</option>
                  <option value="AI Discipline">AI Discipline</option>
                </select>
              </div>

              {/* Difficulty dropdown */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant">Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="bg-[#0B0C0E] text-white text-xs font-mono rounded p-2 border border-glass-border cursor-pointer focus:outline-none"
                >
                  <option value="NOVICE">NOVICE (Novice)</option>
                  <option value="BUILDER">BUILDER (Standard)</option>
                  <option value="BOSS">BOSS (Encounter)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleLaunchQuest}
              disabled={generating || !buildRequest.trim()}
              className="w-full py-4 bg-cyber-green hover:brightness-110 disabled:brightness-50 text-black font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,255,100,0.2)]"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Quest...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Generate Live Quest
                </>
              )}
            </button>

            {generationError && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs leading-relaxed text-red-300 flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {generationError}
                  <span className="mt-1 block text-red-200/80">No template quest was loaded. Adjust the prompt if needed, then regenerate.</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
