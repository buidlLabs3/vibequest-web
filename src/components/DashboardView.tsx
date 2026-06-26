import { type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle,
  Clock,
  Code2,
  LayoutDashboard,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

import type { HealthResponse } from "@/lib/api";
import type { ProofLog, QuestData, VerificationGate } from "@/lib/workbench-types";

interface DashboardViewProps {
  walletBound: boolean;
  walletLabel?: string;
  proofLogs: ProofLog[];
  health: HealthResponse | null;
  questData: QuestData | null;
  gates: VerificationGate[];
  bossFightSolved: boolean;
  shipped: boolean;
  onConnectWallet: () => void;
  onOpenQuestRun: () => void;
  onOpenWorkbench: () => void;
  onOpenShipGate: () => void;
}

export default function DashboardView({
  walletBound,
  walletLabel,
  proofLogs,
  health,
  questData,
  gates,
  bossFightSolved,
  shipped,
  onConnectWallet,
  onOpenQuestRun,
  onOpenWorkbench,
  onOpenShipGate,
}: DashboardViewProps) {
  const infraReady = Boolean(
    health?.integrations.openai && health.integrations.ckb_rpc && health.integrations.fiber_rpc,
  );
  const passedGates = gates.filter((gate) => gate.isCompleted).length;
  const activities = buildActivities({
    walletBound,
    proofLogs,
    infraReady,
    questData,
    passedGates,
    gateCount: gates.length,
    bossFightSolved,
    shipped,
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
          onClick={walletBound ? onOpenQuestRun : onConnectWallet}
          className="flex items-center justify-center gap-2 rounded-xl bg-electric-blue px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-black transition-all hover:brightness-110"
        >
          {walletBound ? "Start Quest" : "Connect Wallet"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={<Wallet className="h-5 w-5 text-electric-blue" />}
          label="Wallet Proof"
          value={walletBound ? "Bound" : "Missing"}
          detail={walletBound ? walletLabel ?? "CKB signer" : "Sign once to unlock quest generation"}
          ready={walletBound}
          actionLabel={walletBound ? "Manage" : "Connect"}
          onAction={onConnectWallet}
        />
        <MetricCard
          icon={<Code2 className="h-5 w-5 text-warning-amber" />}
          label="Active Quest"
          value={questData ? "Loaded" : "None"}
          detail={questData?.questName ?? "Generate a quest to begin"}
          ready={Boolean(questData)}
          actionLabel={questData ? "Workbench" : "Generate"}
          onAction={questData ? onOpenWorkbench : onOpenQuestRun}
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

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_420px]">
        <div className="rounded-xl border border-glass-border bg-[#16181D] p-5">
          <div className="mb-4 flex items-center justify-between border-b border-glass-border pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-electric-blue" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Activity Stream</h2>
            </div>
            <span className="font-mono text-xs text-on-surface-variant">{activities.length} events</span>
          </div>

          <div className="flex flex-col gap-3">
            {activities.map((activity) => (
              <div key={activity.id} className="grid grid-cols-[24px_1fr] gap-3 rounded-lg border border-glass-border/70 bg-[#0B0C0E]/70 p-4">
                <div className="mt-0.5">
                  {activity.ready ? <CheckCircle className="h-4 w-4 text-cyber-green" /> : <Clock className="h-4 w-4 text-warning-amber" />}
                </div>
                <div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-sm font-bold text-white">{activity.title}</h3>
                    <span className="font-mono text-[10px] uppercase text-on-surface-variant">{activity.time}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
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
  questData,
  passedGates,
  gateCount,
  bossFightSolved,
  shipped,
}: {
  walletBound: boolean;
  proofLogs: ProofLog[];
  infraReady: boolean;
  questData: QuestData | null;
  passedGates: number;
  gateCount: number;
  bossFightSolved: boolean;
  shipped: boolean;
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
      description: walletBound ? "A CKB proof is bound and quest generation is unlocked." : "Connect a signer and sign a VibeQuest proof before generating quests.",
      time: "now",
      ready: walletBound,
    },
    {
      id: "infra",
      title: infraReady ? "Backend ready" : "Backend blocked",
      description: infraReady ? "OpenAI, CKB RPC, and Fiber RPC are reachable." : "Backend services are not ready yet.",
      time: "live",
      ready: infraReady,
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
      title: shipped ? "Proof envelope locked" : "Ship gate waiting",
      description: shipped ? "The verified run is ready for reward claim wiring." : "Solve the boss and complete gates to lock the proof envelope.",
      time: shipped ? "done" : "locked",
      ready: shipped,
    },
    ...proofEvents,
  ];
}
