"use client";

import { ccc, useCcc, useSigner } from "@ckb-ccc/connector-react";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";

import DashboardView from "@/components/DashboardView";
import LandingPage from "@/components/LandingPage";
import Navbar from "@/components/Navbar";
import QuestRunView from "@/components/QuestRunView";
import ShipGateView from "@/components/ShipGateView";
import WalletConnectModal from "@/components/WalletConnectModal";
import WorkbenchView from "@/components/WorkbenchView";
import {
  completeQuest,
  generateQuest,
  getHealth,
  getUserQuestHistory,
  updateQuestProgress,
  type Difficulty,
  type GenerateQuestResponse,
  type HealthResponse,
  type QuestRunRecord,
  type RewardClaimRecord,
  type UserQuestCounts,
  type WalletProof,
} from "@/lib/api";
import type {
  BossFight,
  PracticeRecord,
  ProofLog,
  QuestData,
  VerificationGate,
  WorkbenchFile,
} from "@/lib/workbench-types";

type TabId =
  | "landing"
  | "dashboard"
  | "workbench"
  | "quest-run"
  | "ship-gate";

const DEFAULT_BUILD_REQUEST =
  "Build a Fiber-powered paid content app with CKB proof receipts, a creator payout split, and a test that blocks unpaid reads.";

const STORAGE_KEYS = {
  activeTab: "vibequest.activeTab",
  walletProof: "vibequest.walletProof.joyid.v1",
  legacyWalletProof: "vibequest.walletProof",
  legacySecpWalletProof: "vibequest.walletProof.v2",
  proofLogs: "vibequest.proofLogs",
  practiceRecords: "vibequest.practiceRecords.v1",
} as const;

const TAB_IDS = new Set<TabId>([
  "landing",
  "dashboard",
  "workbench",
  "quest-run",
  "ship-gate",
]);

const EMPTY_GATES: VerificationGate[] = [
  {
    id: "identity",
    name: "Wallet Proof",
    description: "A signed JoyID passkey proof is bound to this quest session.",
    isCompleted: false,
  },
  {
    id: "infrastructure",
    name: "Backend Readiness",
    description: "vibequest-core reports OpenAI, CKB RPC, and Fiber RPC ready.",
    isCompleted: false,
  },
  {
    id: "verification",
    name: "Generated Workspace Checks",
    description: "Generated files pass proof, test, and denial-path checks.",
    isCompleted: false,
  },
];

export function VibeQuestWorkbench() {
  const { open } = useCcc();
  const signer = useSigner();
  const [activeTab, setActiveTab] = useState<TabId>("landing");
  const [sessionReady, setSessionReady] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [walletProof, setWalletProof] = useState<WalletProof | null>(null);
  const [questData, setQuestData] = useState<QuestData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [bossFightSolved, setBossFightSolved] = useState(false);
  const [shipped, setShipped] = useState(false);
  const [buildRequest, setBuildRequest] = useState(DEFAULT_BUILD_REQUEST);
  const [skillTrack, setSkillTrack] = useState("Fiber Builder");
  const [difficulty, setDifficulty] = useState("BUILDER");
  const [selectedFile, setSelectedFile] = useState<WorkbenchFile | null>(null);
  const [gates, setGates] = useState<VerificationGate[]>(EMPTY_GATES);
  const [proofLogs, setProofLogs] = useState<ProofLog[]>([]);
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [questRuns, setQuestRuns] = useState<QuestRunRecord[]>([]);
  const [rewardClaims, setRewardClaims] = useState<RewardClaimRecord[]>([]);
  const [shipping, setShipping] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const [questStats, setQuestStats] = useState<UserQuestCounts>({
    created: 0,
    completed: 0,
    uncompleted: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const infrastructureReady = Boolean(
    health?.integrations.openai &&
      health.integrations.ckb_rpc &&
      health.integrations.fiber_rpc &&
      health.integrations.mongodb,
  );
  const walletBound = Boolean(walletProof);
  const walletAddress = walletProof?.address;
  const walletPracticeRecords = useMemo(
    () => practiceRecords.filter((record) => record.walletAddress === walletAddress),
    [practiceRecords, walletAddress],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const restoredTab = parseTabId(window.location.hash.slice(1)) ?? parseTabId(window.localStorage.getItem(STORAGE_KEYS.activeTab));
    const restoredWalletProof = parseWalletProof(window.localStorage.getItem(STORAGE_KEYS.walletProof));
    window.localStorage.removeItem(STORAGE_KEYS.legacyWalletProof);
    window.localStorage.removeItem(STORAGE_KEYS.legacySecpWalletProof);
    const restoredProofLogs = parseProofLogs(window.localStorage.getItem(STORAGE_KEYS.proofLogs));
    const restoredPracticeRecords = parsePracticeRecords(window.localStorage.getItem(STORAGE_KEYS.practiceRecords));

    if (restoredTab) {
      setActiveTab(restoredTab);
    }

    if (restoredWalletProof) {
      setWalletProof(restoredWalletProof);
    }

    if (restoredProofLogs.length > 0) {
      setProofLogs(restoredProofLogs);
    }

    if (restoredPracticeRecords.length > 0) {
      setPracticeRecords(restoredPracticeRecords);
    }

    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (!sessionReady || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.activeTab, activeTab);
    const nextHash = `#${activeTab}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
    }
  }, [activeTab, sessionReady]);

  useEffect(() => {
    if (!sessionReady || typeof window === "undefined") {
      return;
    }

    if (walletProof) {
      window.localStorage.setItem(STORAGE_KEYS.walletProof, JSON.stringify(walletProof));
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.walletProof);
    }
  }, [sessionReady, walletProof]);

  useEffect(() => {
    if (!sessionReady || typeof window === "undefined") {
      return;
    }

    if (proofLogs.length > 0) {
      window.localStorage.setItem(STORAGE_KEYS.proofLogs, JSON.stringify(proofLogs));
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.proofLogs);
    }
  }, [proofLogs, sessionReady]);

  useEffect(() => {
    if (!sessionReady || typeof window === "undefined") {
      return;
    }

    if (practiceRecords.length > 0) {
      window.localStorage.setItem(STORAGE_KEYS.practiceRecords, JSON.stringify(practiceRecords));
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.practiceRecords);
    }
  }, [practiceRecords, sessionReady]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleHashChange = () => {
      const nextTab = parseTabId(window.location.hash.slice(1));
      if (nextTab) {
        setActiveTab(nextTab);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const nextHealth = await getHealth();
      setHealth(nextHealth);
      return nextHealth;
    } catch {
      setHealth(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    setGates((previous) =>
      previous.map((gate) => {
        if (gate.id === "identity") {
          return { ...gate, isCompleted: walletBound };
        }

        if (gate.id === "infrastructure") {
          return { ...gate, isCompleted: infrastructureReady };
        }

        return gate;
      }),
    );
  }, [infrastructureReady, walletBound]);

  const upsertPracticeRecord = useCallback((nextRecord: PracticeRecord) => {
    setPracticeRecords((previous) => {
      const existing = previous.find((record) => record.runId === nextRecord.runId);
      const merged = existing ? { ...existing, ...nextRecord } : nextRecord;
      return [
        merged,
        ...previous.filter((record) => record.runId !== nextRecord.runId),
      ]
        .sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt))
        .slice(0, 30);
    });
  }, []);

  const markCurrentPracticeRecord = useCallback(
    (status: PracticeRecord["status"], options?: { shipped?: boolean; savedToCloud?: boolean }) => {
      if (!walletProof || !questData) {
        return;
      }

      const now = new Date().toISOString();
      setPracticeRecords((previous) => {
        const existing = previous.find((record) => record.runId === questData.runId);
        const requestedStatus = options?.shipped ? "shipped" : status;
        const nextStatus = existing
          ? higherPracticeStatus(existing.status, requestedStatus)
          : requestedStatus;
        const completedAt = nextStatus === "completed" || nextStatus === "shipped"
          ? existing?.completedAt ?? now
          : existing?.completedAt ?? null;
        const merged: PracticeRecord = {
          runId: questData.runId,
          walletAddress: walletProof.address,
          title: questData.questName,
          source: questData.source,
          status: nextStatus,
          savedToCloud: options?.savedToCloud ?? existing?.savedToCloud ?? false,
          warning: generationError ?? existing?.warning ?? null,
          updatedAt: now,
          completedAt,
        };

        return [
          merged,
          ...previous.filter((record) => record.runId !== questData.runId),
        ]
          .sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt))
          .slice(0, 30);
      });
    },
    [generationError, questData, walletProof],
  );

  const applyQuestRun = useCallback((run: QuestRunRecord) => {
    const mappedQuest = mapQuestRunRecord(run);
    setQuestData(mappedQuest);
    setSelectedFile(mappedQuest.files[0] ?? null);
    setGates(run.progress.gates.map((gate) => ({
      id: gate.id,
      name: gate.name,
      description: gate.description,
      isCompleted: gate.is_completed,
    })));
    setBossFightSolved(run.progress.boss_fight_solved);
    setShipped(run.progress.shipped);
    setBuildRequest(run.build_prompt);
    setSkillTrack(run.skill_track);
    setDifficulty(run.difficulty.toUpperCase());

    const verificationPassed = Boolean(
      run.progress.gates.find((gate) => gate.id === "verification")?.is_completed,
    );

    upsertPracticeRecord({
      runId: run.run_id,
      walletAddress: run.user_address,
      title: run.quest.title,
      source: run.source,
      status: run.progress.shipped ? "shipped" : run.progress.boss_fight_solved ? "completed" : verificationPassed ? "verified" : "generated",
      savedToCloud: true,
      warning: null,
      updatedAt: run.updated_at,
      completedAt: run.completed_at,
    });
  }, [upsertPracticeRecord]);

  const loadQuestHistory = useCallback(
    async (address: string, preferredRunId?: string) => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const history = await getUserQuestHistory(address);
        setQuestRuns(history.runs);
        setRewardClaims(history.reward_claims ?? []);
        setQuestStats(history.stats);

        const activeRun = preferredRunId
          ? history.runs.find((run) => run.run_id === preferredRunId) ?? history.active_run
          : history.active_run;

        if (activeRun) {
          applyQuestRun(activeRun);
        }
      } catch (error) {
        setHistoryError(error instanceof Error ? error.message : "Quest history failed to load.");
      } finally {
        setHistoryLoading(false);
      }
    },
    [applyQuestRun],
  );

  useEffect(() => {
    if (!walletProof?.address) {
      return;
    }

    void loadQuestHistory(walletProof.address);
  }, [loadQuestHistory, walletProof?.address]);

  const persistCurrentProgress = useCallback(
    async (next: { gates?: VerificationGate[]; bossFightSolved?: boolean }) => {
      if (!walletProof || !questData?.runId) {
        return;
      }

      try {
        const updated = await updateQuestProgress(questData.runId, {
          wallet: walletProof,
          gates: (next.gates ?? gates).map((gate) => ({
            id: gate.id,
            name: gate.name,
            description: gate.description,
            is_completed: gate.isCompleted,
          })),
          boss_fight_solved: next.bossFightSolved ?? bossFightSolved,
        });
        void loadQuestHistory(walletProof.address, updated.run_id);
      } catch (error) {
        setHistoryError(error instanceof Error ? error.message : "Quest progress failed to save.");
      }
    },
    [bossFightSolved, gates, loadQuestHistory, questData?.runId, walletProof],
  );

  const handleSetGates = useCallback(
    (next: SetStateAction<VerificationGate[]>) => {
      setGates((previous) => {
        const resolved = typeof next === "function" ? next(previous) : next;
        void persistCurrentProgress({ gates: resolved });
        return resolved;
      });
    },
    [persistCurrentProgress],
  );

  const handleSetBossFightSolved = useCallback(
    (next: SetStateAction<boolean>) => {
      setBossFightSolved((previous) => {
        const resolved = typeof next === "function" ? next(previous) : next;
        void persistCurrentProgress({ bossFightSolved: resolved });
        return resolved;
      });
    },
    [persistCurrentProgress],
  );

  const bindWalletProof = useCallback(async () => {
    if (!signer) {
      open();
      throw new Error("Choose JoyID, then sign the proof message.");
    }

    if (signer.signType !== ccc.SignerSignType.JoyId) {
      setWalletProof(null);
      open();
      throw new Error("VibeQuest uses JoyID for quest generation. Choose JoyID and sign again.");
    }

    const address = (await signer.getRecommendedAddress()).toString();
    const issuedAt = new Date().toISOString();
    const message = [
      "VibeQuest wallet proof",
      `Address: ${address}`,
      `Issued: ${issuedAt}`,
      "Purpose: bind generated quest runs, proof notes, and reward claims to this signer.",
    ].join("\n");

    const signed = await signer.signMessage(message);
    const proof: WalletProof = {
      address,
      message,
      signature: {
        signature: signed.signature,
        identity: signed.identity,
        sign_type: normalizeJoyIdSignType(signed.signType),
      },
    };

    setWalletProof(proof);
    setProofLogs((previous) => [
      {
        id: proof.signature.signature.slice(2, 10),
        type: proof.signature.sign_type,
        timestamp: new Date().toLocaleTimeString(),
        status: "SUCCESS",
      },
      ...previous,
    ]);
  }, [open, signer]);

  const unbindWalletProof = useCallback(() => {
    setWalletProof(null);
    setProofLogs([]);
    setQuestData(null);
    setSelectedFile(null);
    setBossFightSolved(false);
    setShipped(false);
    setQuestRuns([]);
    setRewardClaims([]);
    setQuestStats({ created: 0, completed: 0, uncompleted: 0 });
    setHistoryError(null);
    setShipError(null);
  }, []);

  const handleGenerateQuest = useCallback(
    async (request: string, track: string, rawDifficulty: string) => {
      setGenerationError(null);
      setShipError(null);

      if (!walletProof || !isJoyIdSignType(walletProof.signature.sign_type)) {
        setWalletProof(null);
        setGenerationError("Sign a fresh JoyID proof before generating a quest.");
        setWalletModalOpen(true);
        return false;
      }

      await refreshHealth();

      setGenerating(true);
      setBossFightSolved(false);
      setShipped(false);
      setSelectedFile(null);
      setGates((previous) =>
        previous.map((gate) =>
          gate.id === "verification" ? { ...gate, isCompleted: false } : gate,
        ),
      );

      try {
        const response = await generateQuest({
          build_prompt: request,
          skill_track: track,
          difficulty: normalizeDifficulty(rawDifficulty),
          wallet: walletProof,
        });
        if (response.source !== "open-ai") {
          throw new Error("AI quest generation did not complete. Please regenerate the quest.");
        }

        const mappedQuest = mapQuestResponse(response);
        setQuestData(mappedQuest);
        setSelectedFile(mappedQuest.files[0] ?? null);
        const warningText = response.persistence?.warning ?? null;
        setGenerationError(warningText);
        upsertPracticeRecord({
          runId: response.run_id,
          walletAddress: walletProof.address,
          title: mappedQuest.questName,
          source: response.source,
          status: "generated",
          savedToCloud: response.persistence?.saved !== false,
          warning: warningText,
          updatedAt: new Date().toISOString(),
          completedAt: null,
        });
        void loadQuestHistory(walletProof.address, response.run_id);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Quest generation failed.";
        if (message.includes("JoyID")) {
          setWalletProof(null);
          setProofLogs([]);
          setWalletModalOpen(true);
          setGenerationError("Your saved wallet proof is not a JoyID proof. Sign again with JoyID.");
        } else {
          setGenerationError(message);
        }
        return false;
      } finally {
        setGenerating(false);
      }
    },
    [loadQuestHistory, refreshHealth, upsertPracticeRecord, walletProof],
  );

  const handleShipCargo = useCallback(
    async (fiberInvoice: string) => {
      if (!walletProof || !questData?.runId) {
        setShipError("Connect JoyID and generate a quest before claiming rewards.");
        return;
      }

      setShipping(true);
      setShipError(null);

      try {
        const response = await completeQuest(questData.runId, {
          wallet: walletProof,
          gates: gates.map((gate) => ({
            id: gate.id,
            name: gate.name,
            description: gate.description,
            is_completed: gate.isCompleted,
          })),
          boss_fight_solved: bossFightSolved,
          fiber_invoice: fiberInvoice,
        });
        applyQuestRun(response.run);
        markCurrentPracticeRecord("completed", { shipped: true, savedToCloud: true });
        setRewardClaims((previous) => [
          response.claim,
          ...previous.filter((claim) => claim.claim_id !== response.claim.claim_id),
        ]);
        await loadQuestHistory(walletProof.address, response.run.run_id);
        setActiveTab("dashboard");
      } catch (error) {
        setShipError(error instanceof Error ? error.message : "Quest completion failed.");
      } finally {
        setShipping(false);
      }
    },
    [applyQuestRun, bossFightSolved, gates, loadQuestHistory, markCurrentPracticeRecord, questData?.runId, walletProof],
  );

  const activeRewardClaim = useMemo(
    () => rewardClaims.find((claim) => claim.run_id === questData?.runId) ?? null,
    [questData?.runId, rewardClaims],
  );

  const setActiveTabStrict = useCallback((tab: string) => {
    setActiveTab(tab as TabId);
  }, []);

  const enhancedQuestData = useMemo(() => {
    if (!questData || !generationError) {
      return questData;
    }

    return {
      ...questData,
      description: `${questData.description}\n\nLatest backend error: ${generationError}`,
    };
  }, [generationError, questData]);

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-on-surface font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTabStrict}
        walletBound={walletBound}
        onConnectWallet={() => setWalletModalOpen(true)}
        onDisconnectWallet={unbindWalletProof}
        walletLabel={walletProof ? shortAddress(walletProof.address) : undefined}
      />

      <main className="flex-1">
        {activeTab === "landing" && (
          <LandingPage
            onEnterWorkbench={() => setActiveTab("workbench")}
            walletBound={walletBound}
            onConnectWallet={() => setWalletModalOpen(true)}
          />
        )}

        {activeTab === "workbench" && (
          <WorkbenchView
            walletBound={walletBound}
            onConnectWallet={() => setWalletModalOpen(true)}
            questData={enhancedQuestData}
            onOpenQuestRun={() => setActiveTab("quest-run")}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            gates={gates}
            setGates={handleSetGates}
            bossFightSolved={bossFightSolved}
            setBossFightSolved={handleSetBossFightSolved}
            shipped={shipped}
            onShip={() => setActiveTab("ship-gate")}
            onChallengeComplete={() => markCurrentPracticeRecord("completed")}
            onWorkspaceVerified={() => markCurrentPracticeRecord("verified")}
            ckbRpcOnline={infrastructureReady}
            generationError={generationError}
          />
        )}

        {activeTab === "dashboard" && (
          <DashboardView
            walletBound={walletBound}
            walletLabel={walletProof ? shortAddress(walletProof.address) : undefined}
            proofLogs={proofLogs}
            health={health}
            questData={enhancedQuestData}
            gates={gates}
            bossFightSolved={bossFightSolved}
            shipped={shipped}
            onConnectWallet={() => setWalletModalOpen(true)}
            onOpenQuestRun={() => setActiveTab("quest-run")}
            onOpenWorkbench={() => setActiveTab("workbench")}
            onOpenShipGate={() => setActiveTab("ship-gate")}
            questRuns={questRuns}
            questStats={questStats}
            rewardClaims={rewardClaims}
            practiceRecords={walletPracticeRecords}
            historyLoading={historyLoading}
            historyError={historyError}
          />
        )}

        {activeTab === "quest-run" && (
          <QuestRunView
            onGenerateQuest={handleGenerateQuest}
            generating={generating}
            buildRequest={buildRequest}
            setBuildRequest={setBuildRequest}
            skillTrack={skillTrack}
            setSkillTrack={setSkillTrack}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            setActiveTab={setActiveTabStrict}
            generationError={generationError}
          />
        )}

        {activeTab === "ship-gate" && (
          <ShipGateView
            walletBound={walletBound}
            ckbRpcOnline={infrastructureReady}
            questData={enhancedQuestData}
            gates={gates}
            bossFightSolved={bossFightSolved}
            shipped={shipped}
            shipping={shipping}
            shipError={shipError}
            rewardClaim={activeRewardClaim}
            onShip={handleShipCargo}
          />
        )}
      </main>

      <WalletConnectModal
        open={walletModalOpen}
        walletBound={walletBound}
        onBindWallet={bindWalletProof}
        onUnbindWallet={unbindWalletProof}
        onClose={() => setWalletModalOpen(false)}
        proofLogs={proofLogs}
        address={walletProof?.address}
        signerReady={Boolean(signer)}
      />
    </div>
  );
}

function parseTabId(value: string | null): TabId | null {
  if (!value) {
    return null;
  }

  if (value === "infrastructure") {
    return "workbench";
  }

  return TAB_IDS.has(value as TabId) ? (value as TabId) : null;
}

function parseWalletProof(value: string | null): WalletProof | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as WalletProof;
    if (
      typeof parsed.address === "string" &&
      typeof parsed.message === "string" &&
      typeof parsed.signature?.signature === "string" &&
      typeof parsed.signature.identity === "string" &&
      typeof parsed.signature.sign_type === "string"
    ) {
      return {
        ...parsed,
        signature: {
          ...parsed.signature,
          sign_type: normalizeJoyIdSignType(parsed.signature.sign_type),
        },
      };
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeJoyIdSignType(value: unknown): string {
  const raw = String(value ?? "").trim();

  return isJoyIdSignType(raw) ? "JoyId" : raw;
}

function isJoyIdSignType(value: unknown): boolean {
  const compact = String(value ?? "").trim().replace(/[\s_.:-]/g, "").toLowerCase();

  return compact === "joyid" || compact === "signersigntypejoyid";
}

function parseProofLogs(value: string | null): ProofLog[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as ProofLog[];
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (log) =>
          typeof log.id === "string" &&
          typeof log.type === "string" &&
          typeof log.timestamp === "string" &&
          typeof log.status === "string",
      );
    }
  } catch {
    return [];
  }

  return [];
}

function parsePracticeRecords(value: string | null): PracticeRecord[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as PracticeRecord[];
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (record) =>
          typeof record.runId === "string" &&
          typeof record.walletAddress === "string" &&
          typeof record.title === "string" &&
          isPracticeRecordStatus(record.status) &&
          typeof record.savedToCloud === "boolean" &&
          typeof record.updatedAt === "string",
      );
    }
  } catch {
    return [];
  }

  return [];
}

function isPracticeRecordStatus(value: unknown): value is PracticeRecord["status"] {
  return value === "generated" || value === "verified" || value === "completed" || value === "shipped";
}

function higherPracticeStatus(
  current: PracticeRecord["status"],
  next: PracticeRecord["status"],
): PracticeRecord["status"] {
  const rank: Record<PracticeRecord["status"], number> = {
    generated: 0,
    verified: 1,
    completed: 2,
    shipped: 3,
  };

  return rank[next] >= rank[current] ? next : current;
}

function normalizeDifficulty(value: string): Difficulty {
  const normalized = value.toLowerCase();
  if (normalized === "novice" || normalized === "boss") {
    return normalized;
  }
  return "builder";
}

function mapQuestResponse(response: GenerateQuestResponse): QuestData {
  const files = response.quest.workbench_files.map((file) => ({
    name: file.path.split("/").pop() ?? file.path,
    path: file.path,
    content: file.content,
    description: `${file.language.toUpperCase()} workbench file generated for ${response.quest.title}.`,
  }));

  return {
    runId: response.run_id,
    source: response.source,
    questName: response.quest.title,
    description: `${response.quest.premise}\n\n${response.quest.build_objective}\n\nReward logic: ${response.quest.reward_logic}`,
    files,
    gates: response.quest.comprehension_gates.map((gate, index) => ({
      id: `gate-${index + 1}`,
      name: `Gate ${index + 1}`,
      description: gate,
      isCompleted: false,
    })),
    bossFight: buildBossFight(response),
  };
}

function mapQuestRunRecord(run: QuestRunRecord): QuestData {
  return mapQuestResponse({
    run_id: run.run_id,
    source: run.source,
    wallet: {
      address: run.user_address,
      identity: "",
      sign_type: "JoyId",
      message: "",
    },
    quest: run.quest,
    ship_requirements: run.ship_requirements,
  });
}

function buildBossFight(response: GenerateQuestResponse): BossFight {
  return {
    title: response.quest.title,
    challenge: response.quest.boss_fight,
    question: "What must you prove before VibeQuest should unlock rewards for this generated run?",
    options: [
      "That the wallet proof is valid, the generated code is understood, and the trust boundary is defended.",
      "That the AI generated enough files to look complete.",
      "That the frontend can render without opening the workbench files.",
      "That a reward amount exists even if the user cannot explain the diff.",
    ],
    correctAnswerIndex: 0,
    hint: response.quest.ckb_fiber_hooks.join(" "),
    victoryMessage: "You connected the wallet proof, quest code, and reward gates into one defended shipping path.",
  };
}

function shortAddress(address: string) {
  if (address.length <= 16) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
