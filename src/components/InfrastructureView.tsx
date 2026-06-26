import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Cpu,
  Layers,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Workflow,
  GitBranch,
  Play,
  ArrowRight,
} from "lucide-react";

import type { HealthResponse } from "@/lib/api";

interface InfrastructureViewProps {
  ckbRpcOnline: boolean;
  onResolveCkbRpc: () => void;
  health: HealthResponse | null;
  healthError: string | null;
  onRefreshHealth: () => Promise<HealthResponse | null>;
  onOpenQuestRun: () => void;
  onOpenWorkbench: () => void;
}

export default function InfrastructureView({
  ckbRpcOnline,
  onResolveCkbRpc,
  health,
  healthError,
  onRefreshHealth,
  onOpenQuestRun,
  onOpenWorkbench,
}: InfrastructureViewProps) {
  const [resyncing, setResyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);

  const coreOnline = Boolean(health) && !healthError;
  const openAiOnline = Boolean(health?.integrations.openai);
  const ckbOnline = Boolean(health?.integrations.ckb_rpc ?? ckbRpcOnline);
  const fiberOnline = Boolean(health?.integrations.fiber_rpc);
  const allOnline = coreOnline && openAiOnline && ckbOnline && fiberOnline;

  const initialLogs = useMemo(() => {
    const missing = health?.missing.length ? health.missing.join(", ") : "none";

    if (healthError) {
      return [
        "[VQ-INFRA] Backend health probe failed.",
        "[VQ-INFRA] ERROR: " + healthError,
        "[VQ-INFRA] Check vibequest-core deployment URL and local proxy settings.",
      ];
    }

    if (!health) {
      return [
        "[VQ-INFRA] Waiting for vibequest-core health response...",
        "[VQ-INFRA] No infrastructure claims are marked operational until /health returns.",
      ];
    }

    return [
      "[VQ-INFRA] Core service " + (coreOnline ? "OPERATIONAL" : "BLOCKED") + ". Environment: " + health.environment + ".",
      openAiOnline
        ? "[VQ-INFRA] OpenAI Responses API configured. Quest generation is enabled."
        : "[VQ-INFRA] BLOCKED: OpenAI key is missing or unreachable. Quest generation disabled.",
      ckbOnline
        ? "[VQ-INFRA] CKB RPC configured and reachable through vibequest-core."
        : "[VQ-INFRA] BLOCKED: CKB RPC URL missing or unavailable.",
      fiberOnline
        ? "[VQ-INFRA] Fiber RPC configured and reachable through vibequest-core."
        : "[VQ-INFRA] BLOCKED: Fiber RPC URL missing or unavailable.",
      "[VQ-INFRA] Missing configuration: " + missing + ".",
      "[VQ-INFRA] Health timestamp: " + health.timestamp + ".",
    ];
  }, [ckbOnline, coreOnline, fiberOnline, health, healthError, openAiOnline]);

  useEffect(() => {
    setSyncLogs(initialLogs);
  }, [initialLogs]);

  const handleForceResync = async () => {
    setResyncing(true);
    setSyncProgress(0);
    setSyncLogs((prev) => [
      ...prev,
      "[VQ-INFRA] Refreshing backend health state through /health...",
      "[VQ-INFRA] Rechecking OpenAI, CKB RPC, and Fiber RPC readiness.",
    ]);

    const steps = [
      { progress: 20, log: "[SYNC] Opening health probe to vibequest-core..." },
      { progress: 45, log: "[SYNC] Validating OpenAI configuration state..." },
      { progress: 70, log: "[SYNC] Validating CKB and Fiber RPC configuration state..." },
      { progress: 90, log: "[SYNC] Reading missing configuration list from backend..." },
    ];

    for (const step of steps) {
      await delay(180);
      setSyncProgress(step.progress);
      setSyncLogs((prev) => [...prev, step.log]);
    }

    const nextHealth = await onRefreshHealth();
    setSyncProgress(100);
    setSyncLogs((prev) => [
      ...prev,
      nextHealth
        ? "[VQ-INFRA] Backend health refreshed. Status cards now reflect live configuration."
        : "[VQ-INFRA] Refresh failed. Backend remains unreachable from this client.",
    ]);
    setResyncing(false);
    onResolveCkbRpc();
  };

  return (
    <div className="bg-[#0B0C0E] text-on-surface font-sans p-4 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-8 min-h-screen">
      <div className="border-b border-glass-border pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Layers className="text-electric-blue w-8 h-8" />
          System Infrastructure
        </h1>
        <p className="text-on-surface-variant text-sm mt-1 max-w-xl">
          Live readiness for vibequest-core, OpenAI quest generation, CKB RPC, and Fiber RPC. The workbench only unlocks generation when these checks pass.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          index="01"
          label="VibeQuest Core"
          title="VQ-CORE Engine"
          detail={coreOnline ? "ENV: " + (health?.environment ?? "unknown") : "HEALTH: UNREACHABLE"}
          online={coreOnline}
          icon={<Cpu className="text-electric-blue w-3.5 h-3.5" />}
        />
        <StatusCard
          index="02"
          label="AI Orchestration"
          title="OpenAI API Engine"
          detail={openAiOnline ? "MODEL: gpt-5.5 / WIRE: responses" : "MISSING: OPENAI_API_KEY"}
          online={openAiOnline}
          icon={<Workflow className="text-purple-400 w-3.5 h-3.5" />}
          accent="purple"
        />
        <StatusCard
          index="03"
          label="CKB RPC Client"
          title="Nervos Node RPC"
          detail={ckbOnline ? "RPC: CONFIGURED" : "RPC: BLOCKED"}
          online={ckbOnline}
          icon={<GitBranch className={ckbOnline ? "text-cyber-green w-3.5 h-3.5" : "text-red-500 w-3.5 h-3.5 animate-pulse"} />}
        />
        <StatusCard
          index="04"
          label="State Channels"
          title="Fiber RPC Service"
          detail={fiberOnline ? "RPC: CONFIGURED" : "RPC: BLOCKED"}
          online={fiberOnline}
          icon={<Zap className={fiberOnline ? "text-warning-amber w-3.5 h-3.5" : "text-red-500 w-3.5 h-3.5 animate-pulse"} />}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-[#0B0C0E] border border-glass-border rounded-xl p-5 font-mono text-xs text-cyber-green flex flex-col gap-1 h-[360px] overflow-y-auto shadow-inner relative">
            <div className="text-[10px] uppercase font-bold text-on-surface-variant border-b border-glass-border pb-2 mb-3 flex justify-between">
              <span>SYSTEM DIAGNOSTIC RUN LOGS</span>
              <span>STATE: {resyncing ? "REFRESHING" : allOnline ? "READY" : "BLOCKED"}</span>
            </div>
            <div className="space-y-1">
              {syncLogs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  {log}
                </div>
              ))}
              {resyncing && (
                <div className="mt-4 pt-2 border-t border-glass-border/30">
                  <span className="text-white block mb-1">REFRESHING HEALTH ({syncProgress}%)</span>
                  <div className="w-full bg-[#16181D] rounded-full h-2 overflow-hidden border border-glass-border">
                    <div
                      className="bg-electric-blue h-full transition-all duration-300"
                      style={{ width: syncProgress + "%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#16181D] border border-glass-border rounded-xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-glass-border pb-3">
              <span className={allOnline ? "w-2.5 h-2.5 rounded-full bg-cyber-green" : "w-2.5 h-2.5 rounded-full bg-warning-amber"}></span>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Infrastructure Controls
              </h2>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              This is the pre-flight gate for generation. When every service is green, move straight into a quest run or open the current workbench.
            </p>

            {!allOnline && health?.missing.length ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-xs font-mono text-red-300 leading-relaxed">
                <div className="flex items-center gap-2 font-bold uppercase mb-2">
                  <AlertTriangle className="w-4 h-4" /> Missing
                </div>
                {health.missing.join(", ")}
              </div>
            ) : null}

            {allOnline ? (
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-cyber-green/10 border border-cyber-green/20 rounded-lg flex items-start gap-3">
                  <CheckCircle className="text-cyber-green w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-xs text-cyber-green font-semibold uppercase block">
                      Generation stack ready
                    </span>
                    <span className="text-xs text-on-surface-variant leading-relaxed block mt-1">
                      OpenAI, CKB RPC, and Fiber RPC are reachable. You can generate a live quest now.
                    </span>
                  </div>
                </div>
                <button
                  onClick={onOpenQuestRun}
                  className="w-full py-3.5 bg-cyber-green hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Start Quest Run
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenWorkbench}
                  className="w-full py-3 border border-electric-blue/30 text-electric-blue hover:bg-electric-blue/5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Open Workbench
                </button>
              </div>
            ) : (
              <button
                onClick={() => void handleForceResync()}
                disabled={resyncing}
                className="w-full py-4 bg-warning-amber hover:brightness-110 disabled:brightness-50 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {resyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Refreshing health...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Refresh Backend Health
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  index,
  label,
  title,
  detail,
  online,
  icon,
  accent = "green",
}: {
  index: string;
  label: string;
  title: string;
  detail: string;
  online: boolean;
  icon: ReactNode;
  accent?: "green" | "purple" | "amber";
}) {
  const statusClass = online ? "text-cyber-green" : "text-red-500 animate-pulse";
  const iconFrame = accent === "purple"
    ? "bg-purple-500/10 border-purple-500/20"
    : accent === "amber"
      ? "bg-warning-amber/10 border-warning-amber/20"
      : "bg-cyber-green/10 border-cyber-green/20";
  const cardClass = online
    ? "bg-[#16181D] border border-glass-border rounded-xl p-5 flex flex-col justify-between h-40"
    : "bg-red-950/10 border border-red-900/30 rounded-xl p-5 flex flex-col justify-between h-40";

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-start">
        <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
          {index} / {label}
        </span>
        <div className={"w-6 h-6 rounded flex items-center justify-center border " + iconFrame}>
          {icon}
        </div>
      </div>
      <div>
        <span className={"text-xs font-mono font-semibold block uppercase tracking-wide " + statusClass}>
          {online ? "● Operational" : "● Blocked"}
        </span>
        <span className="text-white text-lg font-bold block mt-1">{title}</span>
        <span className="text-[10px] font-mono text-on-surface-variant mt-0.5 block leading-none">
          {detail}
        </span>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
