import { useState } from "react";
import {
  Terminal as TermIcon,
  Sliders,
  Play,
  ChevronRight,
  RefreshCw,
  Cpu,
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
}: QuestRunViewProps) {
  const [activeSegment, setActiveSegment] = useState<"standard" | "advanced">("standard");
  const [timeoutPeriod, setTimeoutPeriod] = useState(30);
  const [maxGasLimit, setMaxGasLimit] = useState(150000);

  const promptBlocks = [
    {
      category: "Nervos CKB Logic",
      items: [
        "Include signature verification for multiple witnesses",
        "Add a cell timelock restriction under 100 epochs",
        "Enforce strict payout split using a custom lock script witness",
      ]
    },
    {
      category: "Fiber Payment Channels",
      items: [
        "Configure atomic HTLC-based multi-hop route logic",
        "Add an active channel balance split with fraud proofs",
        "Create an off-chain invoice generator that signs proofs",
      ]
    },
    {
      category: "Verification Constraints",
      items: [
        "Include a Rust integration test that blocks unauthorized reads",
        "Validate CKB cell script transaction layout witness checks",
        "Check that input cell capacity matches exact output split rules",
      ]
    }
  ];

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
          Stitch prompt-based contract building blocks together, configure advanced emulated sandbox constraints, and spawn customized developer quests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: BUILDER BLOCKS (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#16181D] border border-glass-border rounded-xl p-5 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-glass-border pb-3">
              <Sliders className="text-electric-blue w-5 h-5" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Stitch Prompt Blocks
              </h2>
            </div>

            <div className="flex flex-col gap-5 max-h-[460px] overflow-y-auto pr-1">
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
                  Custom Generation Engine
                </h2>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveSegment("standard")}
                  className={`px-3 py-1 rounded font-mono text-[10px] uppercase border cursor-pointer transition-all ${
                    activeSegment === "standard"
                      ? "border-cyber-green bg-cyber-green/10 text-cyber-green font-bold"
                      : "border-glass-border text-on-surface-variant"
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setActiveSegment("advanced")}
                  className={`px-3 py-1 rounded font-mono text-[10px] uppercase border cursor-pointer transition-all ${
                    activeSegment === "advanced"
                      ? "border-electric-blue bg-electric-blue/10 text-electric-blue font-bold"
                      : "border-glass-border text-on-surface-variant"
                  }`}
                >
                  Advanced
                </button>
              </div>
            </div>

            {/* Custom Prompt Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono uppercase text-on-surface-variant">
                Active Request Command Buffer
              </label>
              <textarea
                value={buildRequest}
                onChange={(e) => setBuildRequest(e.target.value)}
                rows={5}
                className="w-full bg-[#0B0C0E] border border-glass-border rounded-lg p-3.5 font-mono text-xs text-cyber-green leading-relaxed focus:outline-none focus:border-cyber-green/50 resize-none shadow-inner"
                placeholder="Compose your custom VibeQuest build requirements here..."
              />
            </div>

            {/* Advanced configurations if selected */}
            {activeSegment === "advanced" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0A0B0E] p-4 rounded-lg border border-glass-border/60">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono uppercase text-on-surface-variant flex justify-between">
                    <span>MAX EMULATION GAS LIMIT</span>
                    <span className="text-electric-blue">{maxGasLimit.toLocaleString()} Shas</span>
                  </label>
                  <input
                    type="range"
                    min="50000"
                    max="500000"
                    step="10000"
                    value={maxGasLimit}
                    onChange={(e) => setMaxGasLimit(parseInt(e.target.value))}
                    className="w-full accent-electric-blue h-1 bg-[#16181D] rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono uppercase text-on-surface-variant flex justify-between">
                    <span>EMULATOR TIMEOUT PERIOD</span>
                    <span className="text-electric-blue">{timeoutPeriod} SECONDS</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    step="5"
                    value={timeoutPeriod}
                    onChange={(e) => setTimeoutPeriod(parseInt(e.target.value))}
                    className="w-full accent-electric-blue h-1 bg-[#16181D] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

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
                  Compiling Sandbox...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Launch Advanced Sandbox Quest
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
