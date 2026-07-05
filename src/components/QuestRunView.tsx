import {
  Terminal as TermIcon,
  Play,
  RefreshCw,
  Cpu,
  AlertCircle,
  BookOpenCheck,
  WandSparkles,
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
  learningQuestOrigin?: string | null;
  onClearLearningQuest?: () => void;
}

const CUSTOM_STARTERS = [
  {
    label: "Fiber verifier",
    prompt: "Generate a Fiber receipt verifier with one passing test and two denial tests for replayed nonce and mismatched resourceId.",
    track: "Fiber Builder",
  },
  {
    label: "CKB cell verifier",
    prompt: "Generate a CKB cell verifier that binds OutPoint, cell data hash, lock/type scripts, witness, and rejects a mutated cell reference.",
    track: "CKB Fundamentals",
  },
  {
    label: "Audit challenge",
    prompt: "Generate a CKB/Fiber audit quest that exposes one realistic replay or witness mismatch bug and teaches the patch through tests.",
    track: "AI Discipline",
  },
];

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
  learningQuestOrigin,
  onClearLearningQuest,
}: QuestRunViewProps) {
  const learningOnlyRequest = isLearningOnlyRequest(buildRequest);
  const hasLessonQuest = Boolean(learningQuestOrigin);

  const handleLaunchQuest = async () => {
    if (learningOnlyRequest) return;

    const generated = await onGenerateQuest(buildRequest, skillTrack, difficulty);
    if (generated) {
      setActiveTab("workbench");
    }
  };

  const applyStarter = (starter: (typeof CUSTOM_STARTERS)[number]) => {
    onClearLearningQuest?.();
    setBuildRequest(starter.prompt);
    setSkillTrack(starter.track);
    setDifficulty("BUILDER");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-7 bg-[#0B0C0E] p-4 font-sans text-on-surface md:p-8">
      <div className="border-b border-glass-border pb-6">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-white">
          <Cpu className="h-8 w-8 text-electric-blue" />
          Code Quest
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          Turn completed lessons into generated verifier code, denial tests, and a boss challenge that opens in Workbench with code explanations.
        </p>
      </div>

      {hasLessonQuest ? (
        <section className="rounded-xl border border-electric-blue/35 bg-electric-blue/10 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-electric-blue">
                <BookOpenCheck className="h-5 w-5" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">Completed Lesson Quest</span>
              </div>
              <h2 className="mt-2 text-xl font-black text-white">{learningQuestOrigin}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
                VibeQuest will generate code from this lesson&apos;s checkpoint, concepts, misconception, and practice bridge. The generated run includes implementation files, denial tests, a code explainer, and a boss question tied to the lesson.
              </p>
            </div>
            <button
              onClick={handleLaunchQuest}
              disabled={generating || !buildRequest.trim() || learningOnlyRequest}
              className="flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-cyber-green px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-black transition-all hover:brightness-110 disabled:brightness-50"
            >
              {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {generating ? "Generating..." : "Generate Lesson Quest"}
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-glass-border bg-[#16181D] p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-glass-border pb-3">
            <TermIcon className="h-5 w-5 text-cyber-green" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              {hasLessonQuest ? "Quest Request" : "Custom Code Quest"}
            </h2>
          </div>

          <textarea
            value={buildRequest}
            onChange={(event) => {
              onClearLearningQuest?.();
              setBuildRequest(event.target.value);
            }}
            rows={8}
            className="w-full resize-none rounded-lg border border-glass-border bg-[#0B0C0E] p-4 font-mono text-xs leading-relaxed text-cyber-green shadow-inner outline-none focus:border-cyber-green/50"
            placeholder="Describe the verifier, payment receipt, CKB cell proof, denial test, or audit scenario you want VibeQuest to turn into code."
          />

          {learningOnlyRequest ? (
            <div className="mt-4 rounded-lg border border-electric-blue/25 bg-electric-blue/10 p-3 text-xs leading-relaxed text-electric-blue">
              This reads like a lesson request. Use Learn mode first, pass the checkpoint, then generate a code quest from that lesson.
            </div>
          ) : null}

          {generationError ? (
            <div className="mt-4 flex gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs leading-relaxed text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{generationError}</span>
            </div>
          ) : null}

          {!hasLessonQuest ? (
            <button
              onClick={handleLaunchQuest}
              disabled={generating || !buildRequest.trim() || learningOnlyRequest}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyber-green py-4 text-sm font-extrabold uppercase tracking-wider text-black transition-all hover:brightness-110 disabled:brightness-50"
            >
              {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {generating ? "Generating Quest..." : "Generate Code Quest"}
            </button>
          ) : null}
        </section>

        <aside className="rounded-xl border border-glass-border bg-[#16181D] p-5">
          <div className="mb-4 flex items-center gap-2 border-b border-glass-border pb-3">
            <WandSparkles className="h-5 w-5 text-electric-blue" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Quest Controls</h2>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Skill Track</span>
              <select
                value={skillTrack}
                onChange={(event) => setSkillTrack(event.target.value)}
                className="rounded border border-glass-border bg-[#0B0C0E] p-2 text-xs font-mono text-white outline-none"
              >
                <option value="Fiber Builder">Fiber Builder</option>
                <option value="CKB Fundamentals">CKB Fundamentals</option>
                <option value="AI Discipline">AI Discipline</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Difficulty</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="rounded border border-glass-border bg-[#0B0C0E] p-2 text-xs font-mono text-white outline-none"
              >
                <option value="NOVICE">NOVICE</option>
                <option value="BUILDER">BUILDER</option>
                <option value="BOSS">BOSS</option>
              </select>
            </label>
          </div>

          {!hasLessonQuest ? (
            <div className="mt-6 grid gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-electric-blue">Quick Starts</span>
              {CUSTOM_STARTERS.map((starter) => (
                <button
                  key={starter.label}
                  onClick={() => applyStarter(starter)}
                  className="rounded-lg border border-glass-border/70 bg-[#0B0C0E]/70 p-3 text-left text-xs font-bold text-white transition-colors hover:border-electric-blue/40"
                >
                  {starter.label}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => {
                onClearLearningQuest?.();
                setBuildRequest("");
              }}
              className="mt-6 w-full rounded-lg border border-glass-border px-3 py-2 text-xs font-bold uppercase text-on-surface-variant transition-colors hover:border-electric-blue/40 hover:text-white"
            >
              Switch To Custom Quest
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}

function isLearningOnlyRequest(value: string) {
  const request = value.trim().toLowerCase();

  if (!request) {
    return false;
  }

  const asksToLearn = /^(teach|explain|learn|what is|what are|how does|help me understand|i want to learn|tell me about)\b/.test(request);
  const asksToBuild = /\b(build|create|implement|code|write|test|verifier|function|app|contract|script|patch|debug|ship|generate a quest)\b/.test(request);

  return asksToLearn && !asksToBuild;
}
