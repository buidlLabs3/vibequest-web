import { type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Code2,
  GraduationCap,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

import type { HealthResponse, LearningModuleDto, QuestRunRecord, RewardClaimRecord, UserQuestCounts } from "@/lib/api";
import type { PracticeRecord, ProofLog, QuestData, VerificationGate } from "@/lib/workbench-types";

interface DashboardViewProps {
  walletBound: boolean;
  walletLabel?: string;
  proofLogs: ProofLog[];
  health: HealthResponse | null;
  questData: QuestData | null;
  learningModule: LearningModuleDto | null;
  activeLessonIndex: number;
  checkpointAnswers: Record<string, number>;
  gates: VerificationGate[];
  bossFightSolved: boolean;
  shipped: boolean;
  onConnectWallet: () => void;
  onOpenQuestRun: () => void;
  onOpenLearn: () => void;
  onOpenWorkbench: () => void;
  onOpenShipGate: () => void;
  onOpenQuestRunRecord: (run: QuestRunRecord) => void;
  onOpenPracticeRecord: (record: PracticeRecord) => void;
  onRedoQuestRun: (run: QuestRunRecord) => void;
  onRedoPracticeRecord: (record: PracticeRecord) => void;
  questRuns: QuestRunRecord[];
  questStats: UserQuestCounts;
  rewardClaims: RewardClaimRecord[];
  practiceRecords: PracticeRecord[];
  historyLoading: boolean;
  historyError: string | null;
}

export default function DashboardView({
  walletBound,
  walletLabel,
  proofLogs,
  health,
  questData,
  learningModule,
  activeLessonIndex,
  checkpointAnswers,
  gates,
  bossFightSolved,
  shipped,
  onConnectWallet,
  onOpenQuestRun,
  onOpenLearn,
  onOpenWorkbench,
  onOpenShipGate,
  onOpenQuestRunRecord,
  onOpenPracticeRecord,
  onRedoQuestRun,
  onRedoPracticeRecord,
  questRuns,
  questStats,
  rewardClaims,
  practiceRecords,
  historyLoading,
  historyError,
}: DashboardViewProps) {
  const infraReady = Boolean(
    health?.integrations.openai && health.integrations.ckb_rpc && health.integrations.fiber_rpc,
  );
  const rewardLedgerReady = Boolean(health?.integrations.mongodb);
  const passedGates = gates.filter((gate) => gate.isCompleted).length;
  const activeLesson = learningModule?.lessons[activeLessonIndex] ?? null;
  const completedLessons = learningModule
    ? learningModule.lessons.filter((lesson) => checkpointAnswers[lesson.id] === lesson.checkpoint.correct_index).length
    : 0;
  const lessonCount = learningModule?.lessons.length ?? 0;
  const completedPractice = practiceRecords.filter((record) => record.status === "completed" || record.status === "shipped").length;
  const localInProgress = practiceRecords.filter((record) => record.status !== "completed" && record.status !== "shipped").length;
  const questsStarted = Math.max(questStats.created, practiceRecords.length);
  const completedCount = Math.max(questStats.completed, completedPractice);
  const inProgressCount = Math.max(questStats.uncompleted, localInProgress);
  const activities = buildActivities({
    walletBound,
    proofLogs,
    infraReady,
    rewardLedgerReady,
    questData,
    passedGates,
    gateCount: gates.length,
    bossFightSolved,
    shipped,
    learningModule,
    completedLessons,
    lessonCount,
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col gap-8 bg-[#0B0C0E] p-4 font-sans text-on-surface md:p-8">
      <div className="flex flex-col gap-4 border-b border-glass-border pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-white">
            <LayoutDashboard className="h-8 w-8 text-electric-blue" />
            Dashboard
          </h1>
          <p className="mt-1 max-w-xl text-sm text-on-surface-variant">
            Your VibeQuest activity hub: wallet proof, quest run, generated workspace checks, and shipping state in one place.
          </p>
        </div>
        <button
          onClick={onOpenLearn}
          className="flex items-center justify-center gap-2 rounded-xl bg-electric-blue px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-black transition-all hover:brightness-110"
        >
          {learningModule ? "Continue Learning" : "Start Learning"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-xl border border-electric-blue/25 bg-[#121820] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-electric-blue">Current learning objective</span>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{learningModule?.title ?? questData?.questName ?? "Choose interests and generate a learning path"}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
                {activeLesson
                  ? `Next lesson: ${activeLesson.title}. ${activeLesson.why_it_matters}`
                  : questData
                    ? "Inspect the generated code, run verification checks, answer the code-specific boss challenge, then record the badge."
                    : "Start with interests and background, learn the concepts interactively, then generate quests from lessons you completed."}
              </p>
            </div>
            <button
              onClick={learningModule ? onOpenLearn : questData ? onOpenWorkbench : onOpenLearn}
              className="rounded-xl bg-cyber-green px-5 py-3 text-sm font-black uppercase tracking-wider text-black transition-all hover:brightness-110"
            >
              {learningModule ? "Continue Lesson" : questData ? "Continue Quest" : "Build Path"}
            </button>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {learningModule
              ? learningModule.lessons.slice(0, 4).map((lesson, index) => {
                  const complete = checkpointAnswers[lesson.id] === lesson.checkpoint.correct_index;
                  const active = index === activeLessonIndex;
                  return (
                    <div key={lesson.id} className={"rounded-lg border p-3 " + (complete ? "border-cyber-green/20 bg-cyber-green/5" : active ? "border-electric-blue/30 bg-electric-blue/10" : "border-glass-border bg-[#0B0C0E]/60")}>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant">Lesson {index + 1}</span>
                      <p className="mt-2 line-clamp-2 text-xs font-bold text-white">{complete ? "Complete" : active ? "Active" : lesson.title}</p>
                    </div>
                  );
                })
              : gates.map((gate) => (
                  <div key={gate.id} className={"rounded-lg border p-3 " + (gate.isCompleted ? "border-cyber-green/20 bg-cyber-green/5" : "border-glass-border bg-[#0B0C0E]/60")}>
                    <span className="font-mono text-[10px] uppercase text-on-surface-variant">{gate.name}</span>
                    <p className="mt-2 text-xs font-bold text-white">{gate.isCompleted ? "Complete" : "Pending"}</p>
                  </div>
                ))}
            {!learningModule ? (
              <div className={"rounded-lg border p-3 " + (bossFightSolved ? "border-cyber-green/20 bg-cyber-green/5" : "border-glass-border bg-[#0B0C0E]/60")}>
                <span className="font-mono text-[10px] uppercase text-on-surface-variant">Boss Challenge</span>
                <p className="mt-2 text-xs font-bold text-white">{bossFightSolved ? "Solved" : "Pending"}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            icon={<Wallet className="h-5 w-5 text-electric-blue" />}
            label="Wallet Proof"
            value={walletBound ? "Bound" : "Missing"}
            detail={walletBound ? walletLabel ?? "JoyID" : "Sign once to unlock quest generation"}
            ready={walletBound}
            actionLabel={walletBound ? "Manage" : "Connect"}
            onAction={onConnectWallet}
          />
          <MetricCard
            icon={<ShieldCheck className="h-5 w-5 text-cyber-green" />}
            label="Gate Progress"
            value={passedGates + "/" + gates.length}
            detail={shipped ? "Proof envelope locked" : bossFightSolved ? "Boss solved" : "Complete gates to ship"}
            ready={passedGates === gates.length && bossFightSolved}
            actionLabel="Ship"
            onAction={onOpenShipGate}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<GraduationCap className="h-5 w-5 text-electric-blue" />}
          label="Learning Path"
          value={learningModule ? `${completedLessons}/${lessonCount}` : "New"}
          detail={learningModule ? learningModule.title : "Generate lessons from your interests"}
          ready={Boolean(learningModule)}
          actionLabel={learningModule ? "Continue" : "Start"}
          onAction={onOpenLearn}
        />
        <MetricCard
          icon={<Code2 className="h-5 w-5 text-electric-blue" />}
          label="Quests Started"
          value={String(questsStarted)}
          detail="Practice quests generated from lessons or prompts"
          ready={questsStarted > 0}
          actionLabel="Generate"
          onAction={onOpenQuestRun}
        />
        <MetricCard
          icon={<CheckCircle className="h-5 w-5 text-cyber-green" />}
          label="Completed"
          value={String(completedCount)}
          detail="Quests where code, checks, and boss challenge are done"
          ready={completedCount > 0}
          actionLabel="Ship Gate"
          onAction={onOpenShipGate}
        />
        <MetricCard
          icon={<Clock className="h-5 w-5 text-warning-amber" />}
          label="In Progress"
          value={String(inProgressCount)}
          detail="Quests you can continue from history"
          ready={inProgressCount === 0 && questsStarted > 0}
          actionLabel="Workbench"
          onAction={onOpenWorkbench}
        />
        <MetricCard
          icon={<ReceiptText className="h-5 w-5 text-electric-blue" />}
          label="Learning Records"
          value={String(practiceRecords.length)}
          detail={completedPractice > 0 ? `${completedPractice} completed practice runs` : "Local quest attempts appear here"}
          ready={completedPractice > 0}
          actionLabel="Review"
          onAction={onOpenWorkbench}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {learningModule ? (
            <div className="rounded-xl border border-electric-blue/20 bg-[#121820] p-5">
              <div className="mb-4 flex items-center justify-between border-b border-glass-border pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-electric-blue" />
                  <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Active Learning Path</h2>
                </div>
                <span className="font-mono text-xs text-cyber-green">{completedLessons}/{lessonCount}</span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {learningModule.lessons.map((lesson, index) => {
                  const complete = checkpointAnswers[lesson.id] === lesson.checkpoint.correct_index;
                  const active = index === activeLessonIndex;
                  return (
                    <button key={lesson.id} onClick={onOpenLearn} className={"rounded-lg border p-3 text-left transition-colors " + (complete ? "border-cyber-green/25 bg-cyber-green/5" : active ? "border-electric-blue/40 bg-electric-blue/10" : "border-glass-border/70 bg-[#0B0C0E]/70 hover:border-electric-blue/30")}>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="line-clamp-1 text-xs font-bold text-white">{index + 1}. {lesson.title}</h3>
                        <span className="font-mono text-[10px] uppercase text-on-surface-variant">{complete ? "done" : active ? "next" : "up next"}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-on-surface-variant">{lesson.why_it_matters}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={onOpenLearn} className="rounded border border-electric-blue/30 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-electric-blue hover:bg-electric-blue/10">
                  Continue Lesson
                </button>
                <button onClick={onOpenQuestRun} className="rounded border border-cyber-green/30 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-cyber-green hover:bg-cyber-green/10">
                  Generate Practice Quest
                </button>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-glass-border bg-[#16181D] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-glass-border pb-3">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Quest History</h2>
              <span className="font-mono text-xs text-on-surface-variant">{historyLoading ? "syncing" : questRuns.length}</span>
            </div>
            {historyError ? (
              <div className="rounded-lg border border-warning-amber/30 bg-warning-amber/10 p-3 text-xs text-warning-amber">
                {historyError}
              </div>
            ) : questRuns.length > 0 ? (
              <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
                {questRuns.slice(0, 8).map((run) => (
                  <div key={run.run_id} className="rounded-lg border border-glass-border/70 bg-[#0B0C0E] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="line-clamp-1 text-xs font-bold text-white">{run.quest.title}</h3>
                      <span className={"rounded border px-2 py-0.5 font-mono text-[10px] uppercase " + (run.status === "completed" ? "border-cyber-green/20 bg-cyber-green/10 text-cyber-green" : "border-warning-amber/20 bg-warning-amber/10 text-warning-amber")}>
                        {run.status === "completed" ? "completed" : "continue"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-on-surface-variant">{run.build_prompt}</p>
                    <p className="mt-2 font-mono text-[10px] uppercase text-on-surface-variant">
                      {run.skill_track} / {run.difficulty} / {new Date(run.updated_at).toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => onOpenQuestRunRecord(run)} className="rounded border border-electric-blue/30 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-electric-blue hover:bg-electric-blue/10">
                        Review / Continue
                      </button>
                      <button onClick={() => onRedoQuestRun(run)} className="rounded border border-glass-border px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-on-surface-variant hover:text-white">
                        Redo Similar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-glass-border p-5 text-center text-xs text-on-surface-variant">
                No saved cloud quests yet. Local learning records below can still be reviewed when available.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-glass-border bg-[#16181D] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-glass-border pb-3">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Learning Records</h2>
              <span className="font-mono text-xs text-on-surface-variant">{practiceRecords.length}</span>
            </div>
            {practiceRecords.length > 0 ? (
              <div className="flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1">
                {practiceRecords.slice(0, 8).map((record) => (
                  <div key={record.runId} className="rounded-lg border border-glass-border/70 bg-[#0B0C0E] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="line-clamp-1 text-xs font-bold text-white">{record.title}</h3>
                      <span className={"rounded border px-2 py-0.5 font-mono text-[10px] uppercase " + practiceStatusClass(record.status)}>
                        {record.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase text-on-surface-variant">
                      <span>{record.savedToCloud ? "cloud saved" : "local review"}</span>
                      <span>/</span>
                      <span>{record.source ?? "vibequest"}</span>
                      <span>/</span>
                      <span>{new Date(record.updatedAt).toLocaleDateString()}</span>
                    </div>
                    {record.warning ? (
                      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-warning-amber">{record.warning}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => onOpenPracticeRecord(record)} className="rounded border border-electric-blue/30 px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-electric-blue hover:bg-electric-blue/10">
                        {record.questSnapshot ? "Review / Continue" : "Details"}
                      </button>
                      <button onClick={() => onRedoPracticeRecord(record)} className="rounded border border-glass-border px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-on-surface-variant hover:text-white">
                        Redo Similar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-glass-border p-5 text-center text-xs text-on-surface-variant">
                Generate, verify, and finish a quest to build your learning trail.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-glass-border bg-[#16181D] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-glass-border pb-3">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Reward Claims</h2>
              <span className="font-mono text-xs text-on-surface-variant">{rewardClaims.length}</span>
            </div>
            {rewardClaims.length > 0 ? (
              <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
                {rewardClaims.slice(0, 8).map((claim) => (
                  <div key={claim.claim_id} className="rounded-lg border border-glass-border/70 bg-[#0B0C0E] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant">{shortId(claim.run_id)}</span>
                      <span className={"rounded border px-2 py-0.5 font-mono text-[10px] uppercase " + rewardStatusClass(claim.status)}>
                        {claim.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold text-white">{claim.amount_shannons} {claim.currency}</p>
                    <p className="mt-1 truncate font-mono text-[10px] text-on-surface-variant">
                      {claim.fiber_payment?.payment_hash ? `payment ${shortId(claim.fiber_payment.payment_hash)}` : claim.fiber_payment?.status ?? "no payment receipt yet"}
                    </p>
                    {claim.error ? <p className="mt-1 line-clamp-2 text-[11px] text-red-300">{claim.error}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-glass-border p-5 text-center text-xs text-on-surface-variant">
                Completed quests with reward invoices will appear here.
              </div>
            )}
          </div>
          <div className="rounded-xl border border-glass-border bg-[#16181D] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-glass-border pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-electric-blue" />
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">System Log</h2>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">{activities.length}</span>
            </div>
            <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-1">
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-lg border border-glass-border/70 bg-[#0B0C0E]/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-bold text-white">{activity.title}</h3>
                    {activity.ready ? <CheckCircle className="h-3.5 w-3.5 text-cyber-green" /> : <Clock className="h-3.5 w-3.5 text-warning-amber" />}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-on-surface-variant">{activity.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-glass-border bg-[#16181D] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-glass-border pb-3">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Proof History</h2>
              <span className="font-mono text-xs text-on-surface-variant">{proofLogs.length}</span>
            </div>
            <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1">
              {proofLogs.length > 0 ? (
                proofLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-glass-border/70 bg-[#0B0C0E] p-3 font-mono text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase text-white">{log.type}</span>
                      <span className="rounded border border-cyber-green/20 bg-cyber-green/10 px-2 py-0.5 text-[10px] uppercase text-cyber-green">
                        {log.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-on-surface-variant">Proof {log.id} / {log.timestamp}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-glass-border p-5 text-center text-xs text-on-surface-variant">
                  No signed wallet proof yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-glass-border bg-[#16181D] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-glass-border pb-3">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Run Checklist</h2>
              <span className="font-mono text-xs text-cyber-green">{passedGates}/{gates.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {gates.map((gate) => (
                <div key={gate.id} className="flex items-start gap-3 rounded-lg bg-[#0B0C0E]/70 p-3">
                  {gate.isCompleted ? <CheckCircle className="mt-0.5 h-4 w-4 text-cyber-green" /> : <XCircle className="mt-0.5 h-4 w-4 text-on-surface-variant" />}
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase text-white">{gate.name}</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-on-surface-variant">{gate.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  ready,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  ready: boolean;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className={"flex min-h-44 flex-col justify-between rounded-xl border p-5 " + (ready ? "border-glass-border bg-[#16181D]" : "border-warning-amber/25 bg-warning-amber/5")}>
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">{icon}</div>
      </div>
      <div>
        <span className={"font-mono text-xs font-bold uppercase " + (ready ? "text-cyber-green" : "text-warning-amber")}>{value}</span>
        <p className="mt-1 line-clamp-2 text-lg font-bold text-white">{detail}</p>
        <button onClick={onAction} className="mt-4 text-xs font-bold uppercase tracking-wider text-electric-blue hover:underline">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function buildActivities({
  walletBound,
  proofLogs,
  infraReady,
  rewardLedgerReady,
  questData,
  passedGates,
  gateCount,
  bossFightSolved,
  shipped,
  learningModule,
  completedLessons,
  lessonCount,
}: {
  walletBound: boolean;
  proofLogs: ProofLog[];
  infraReady: boolean;
  rewardLedgerReady: boolean;
  questData: QuestData | null;
  passedGates: number;
  gateCount: number;
  bossFightSolved: boolean;
  shipped: boolean;
  learningModule: LearningModuleDto | null;
  completedLessons: number;
  lessonCount: number;
}) {
  const proofEvents = proofLogs.slice(0, 3).map((log) => ({
    id: "proof-" + log.id,
    title: "Wallet proof signed",
    description: log.type + " proof " + log.id + " returned " + log.status + ".",
    time: log.timestamp,
    ready: true,
  }));

  return [
    {
      id: "wallet",
      title: walletBound ? "Wallet ready" : "Wallet proof required",
      description: walletBound ? "A JoyID proof is bound and quest generation is unlocked." : "Connect JoyID and sign a VibeQuest proof before generating quests.",
      time: "now",
      ready: walletBound,
    },
    {
      id: "infra",
      title: infraReady ? "Generation backend ready" : "Generation backend blocked",
      description: infraReady ? "OpenAI, CKB RPC, and Fiber RPC are reachable." : "OpenAI, CKB RPC, or Fiber RPC is not ready yet.",
      time: "live",
      ready: infraReady,
    },
    {
      id: "ledger",
      title: rewardLedgerReady ? "Reward ledger ready" : "Reward ledger waiting",
      description: rewardLedgerReady ? "MongoDB can store quest runs and reward claims." : "MongoDB is not reachable yet, so reward claims cannot be locked.",
      time: "live",
      ready: rewardLedgerReady,
    },
    {
      id: "learning",
      title: learningModule ? "Learning path active" : "No learning path",
      description: learningModule ? `${learningModule.title}: ${completedLessons} of ${lessonCount} lessons complete.` : "Generate a module from your interests before jumping into quests.",
      time: learningModule ? "active" : "pending",
      ready: Boolean(learningModule),
    },
    {
      id: "quest",
      title: questData ? "Quest loaded" : "No active quest",
      description: questData ? questData.questName : "Generate a quest to populate the workbench and boss challenge.",
      time: questData ? "active" : "pending",
      ready: Boolean(questData),
    },
    {
      id: "gates",
      title: "Verification gates",
      description: passedGates + " of " + gateCount + " gates are complete.",
      time: bossFightSolved ? "boss solved" : "in progress",
      ready: passedGates === gateCount && bossFightSolved,
    },
    {
      id: "ship",
      title: shipped ? "Reward claim locked" : "Ship gate waiting",
      description: shipped ? "The verified run has a backend reward claim." : "Solve the boss and submit a Fiber invoice to lock the reward claim.",
      time: shipped ? "done" : "locked",
      ready: shipped,
    },
    ...proofEvents,
  ];
}

function practiceStatusClass(status: PracticeRecord["status"]) {
  if (status === "shipped" || status === "completed") {
    return "border-cyber-green/20 bg-cyber-green/10 text-cyber-green";
  }
  if (status === "verified") {
    return "border-electric-blue/20 bg-electric-blue/10 text-electric-blue";
  }
  return "border-warning-amber/20 bg-warning-amber/10 text-warning-amber";
}

function rewardStatusClass(status: string) {
  if (status === "paid") {
    return "border-cyber-green/20 bg-cyber-green/10 text-cyber-green";
  }
  if (status === "failed") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  return "border-electric-blue/20 bg-electric-blue/10 text-electric-blue";
}

function shortId(value: string) {
  if (value.length <= 18) {
    return value;
  }
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}
