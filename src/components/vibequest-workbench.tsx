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
  ActiveQuestSession,
  BossFight,
  LearningResource,
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
  activeQuestSession: "vibequest.activeQuestSession.v1",
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

  const generationBackendReady = Boolean(
    health?.integrations.openai &&
      health.integrations.ckb_rpc &&
      health.integrations.fiber_rpc,
  );
  const rewardLedgerReady = Boolean(health?.integrations.mongodb);
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
    const restoredActiveSession = parseActiveQuestSession(window.localStorage.getItem(STORAGE_KEYS.activeQuestSession));

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

    if (restoredActiveSession) {
      setQuestData(restoredActiveSession.questData);
      setSelectedFile(
        restoredActiveSession.questData.files.find((file) => file.path === restoredActiveSession.selectedFilePath) ??
          restoredActiveSession.questData.files[0] ??
          null,
      );
      setGates(restoredActiveSession.gates);
      setBossFightSolved(restoredActiveSession.bossFightSolved);
      setShipped(restoredActiveSession.shipped);
      setBuildRequest(restoredActiveSession.buildRequest);
      setSkillTrack(restoredActiveSession.skillTrack);
      setDifficulty(restoredActiveSession.difficulty);
      setGenerationError(restoredActiveSession.generationError ?? null);
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
    if (!sessionReady || typeof window === "undefined") {
      return;
    }

    if (!questData) {
      window.localStorage.removeItem(STORAGE_KEYS.activeQuestSession);
      return;
    }

    const session: ActiveQuestSession = {
      questData,
      selectedFilePath: selectedFile?.path ?? null,
      gates,
      bossFightSolved,
      shipped,
      buildRequest,
      skillTrack,
      difficulty,
      generationError,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEYS.activeQuestSession, JSON.stringify(session));
  }, [bossFightSolved, buildRequest, difficulty, gates, generationError, questData, selectedFile?.path, sessionReady, shipped, skillTrack]);

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
          return { ...gate, isCompleted: generationBackendReady };
        }

        return gate;
      }),
    );
  }, [generationBackendReady, walletBound]);

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
          questSnapshot: questData,
          gates,
          bossFightSolved,
          shipped: options?.shipped ?? shipped,
          buildRequest,
          skillTrack,
          difficulty,
        };

        return [
          merged,
          ...previous.filter((record) => record.runId !== questData.runId),
        ]
          .sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt))
          .slice(0, 30);
      });
    },
    [bossFightSolved, buildRequest, difficulty, gates, generationError, questData, shipped, skillTrack, walletProof],
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
      questSnapshot: mappedQuest,
      gates: mappedQuest.gates,
      bossFightSolved: run.progress.boss_fight_solved,
      shipped: run.progress.shipped,
      buildRequest: run.build_prompt,
      skillTrack: run.skill_track,
      difficulty: run.difficulty.toUpperCase(),
    });
  }, [upsertPracticeRecord]);

  const openQuestRunRecord = useCallback((run: QuestRunRecord) => {
    applyQuestRun(run);
    setGenerationError(null);
    setActiveTab("workbench");
  }, [applyQuestRun]);

  const openPracticeRecord = useCallback((record: PracticeRecord) => {
    if (!record.questSnapshot) {
      setHistoryError("This older local record has no saved workspace snapshot. Redo a similar quest to rebuild it.");
      return;
    }

    setQuestData(record.questSnapshot);
    setSelectedFile(record.questSnapshot.files[0] ?? null);
    setGates(record.gates ?? record.questSnapshot.gates);
    setBossFightSolved(record.bossFightSolved ?? (record.status === "completed" || record.status === "shipped"));
    setShipped(record.shipped ?? record.status === "shipped");
    setBuildRequest(record.buildRequest ?? record.title);
    if (record.skillTrack) setSkillTrack(record.skillTrack);
    if (record.difficulty) setDifficulty(record.difficulty);
    setGenerationError(record.warning ?? null);
    setActiveTab("workbench");
  }, []);

  const redoQuestRun = useCallback((run: QuestRunRecord) => {
    setBuildRequest(run.build_prompt);
    setSkillTrack(run.skill_track);
    setDifficulty(run.difficulty.toUpperCase());
    setGenerationError(null);
    setActiveTab("quest-run");
  }, []);

  const redoPracticeRecord = useCallback((record: PracticeRecord) => {
    setBuildRequest(record.buildRequest ?? record.title);
    if (record.skillTrack) setSkillTrack(record.skillTrack);
    if (record.difficulty) setDifficulty(record.difficulty);
    setGenerationError(null);
    setActiveTab("quest-run");
  }, []);

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
        const shouldApplyHistoryRun = Boolean(preferredRunId || !questData?.runId);

        if (activeRun && shouldApplyHistoryRun) {
          applyQuestRun(activeRun);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Quest history failed to load.";
        setHistoryError(normalizeHistoryError(message));
      } finally {
        setHistoryLoading(false);
      }
    },
    [applyQuestRun, questData?.runId],
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
        const message = error instanceof Error ? error.message : "Quest progress failed to save.";
        setHistoryError(normalizeHistoryError(message));
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
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEYS.activeQuestSession);
    }
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
        setGenerationError(null);
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
          questSnapshot: mappedQuest,
          gates: mappedQuest.gates,
          bossFightSolved: false,
          shipped: false,
          buildRequest: request,
          skillTrack: track,
          difficulty: rawDifficulty,
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
            ckbRpcOnline={generationBackendReady}
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
            onOpenQuestRunRecord={openQuestRunRecord}
            onOpenPracticeRecord={openPracticeRecord}
            onRedoQuestRun={redoQuestRun}
            onRedoPracticeRecord={redoPracticeRecord}
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
            ckbRpcOnline={generationBackendReady}
            rewardLedgerOnline={rewardLedgerReady}
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

function normalizeHistoryError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("mongodb") || lower.includes("database") || lower.includes("server selection")) {
    return "Cloud reward ledger is temporarily unavailable. Local learning records are still available.";
  }

  return message;
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

function parseActiveQuestSession(value: string | null): ActiveQuestSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as ActiveQuestSession;
    if (
      isQuestData(parsed.questData) &&
      Array.isArray(parsed.gates) &&
      parsed.gates.every(isVerificationGate) &&
      typeof parsed.bossFightSolved === "boolean" &&
      typeof parsed.shipped === "boolean" &&
      typeof parsed.buildRequest === "string" &&
      typeof parsed.skillTrack === "string" &&
      typeof parsed.difficulty === "string" &&
      typeof parsed.updatedAt === "string"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function isQuestData(value: unknown): value is QuestData {
  const quest = value as QuestData;

  return Boolean(
    quest &&
      typeof quest.runId === "string" &&
      typeof quest.questName === "string" &&
      typeof quest.description === "string" &&
      Array.isArray(quest.files) &&
      quest.files.every(isWorkbenchFile) &&
      Array.isArray(quest.gates) &&
      quest.gates.every(isVerificationGate) &&
      quest.bossFight &&
      typeof quest.bossFight.title === "string" &&
      typeof quest.bossFight.question === "string",
  );
}

function isWorkbenchFile(value: unknown): value is WorkbenchFile {
  const file = value as WorkbenchFile;

  return Boolean(
    file &&
      typeof file.name === "string" &&
      typeof file.path === "string" &&
      typeof file.content === "string" &&
      typeof file.description === "string",
  );
}

function isVerificationGate(value: unknown): value is VerificationGate {
  const gate = value as VerificationGate;

  return Boolean(
    gate &&
      typeof gate.id === "string" &&
      typeof gate.name === "string" &&
      typeof gate.description === "string" &&
      typeof gate.isCompleted === "boolean",
  );
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

type CodeInsights = {
  primaryInvariant: string;
  denialPath: string;
  paymentProof: string;
  networkHook: string;
  riskFocus: string;
  vulnerableLine: string;
  testLine: string;
  reviewChecklist: string[];
  mentorPrompts: string[];
  resources: LearningResource[];
};

function buildBossFight(response: GenerateQuestResponse): BossFight {
  const questData = mapQuestBlueprintForAnalysis(response);
  const insights = analyzeQuestCode(questData);
  const correctIndex = stableChoiceIndex(response.run_id, response.quest.title, insights.riskFocus);
  const correct = {
    label: `Defend ${insights.riskFocus} by proving ${insights.primaryInvariant.toLowerCase()}`,
    rationale: `Correct. The generated code only deserves a badge after the learner can explain the invariant, point to ${insights.vulnerableLine}, and show the denial test at ${insights.testLine}.`,
  };
  const distractors = [
    {
      label: "Trust the generated implementation because it has a passing test file.",
      rationale: "A passing-looking test is not enough. Vibecoded systems fail when tests do not attack the trust boundary or replay/mismatch cases.",
    },
    {
      label: "Check only the wallet proof and skip the generated business logic.",
      rationale: "Wallet identity matters, but this quest is about whether the generated verifier binds payment, CKB state, and reader/action correctly.",
    },
    {
      label: "Claim rewards once the UI renders and a reward amount exists.",
      rationale: "Rendering and reward metadata do not prove understanding. The learner must defend the code path that blocks abuse.",
    },
  ];
  const options = insertAt(distractors, correct, correctIndex);

  return {
    title: response.quest.title,
    challenge: response.quest.boss_fight,
    question: `In this quest's generated code, what is the strongest proof that the AI output is safe to ship?`,
    options,
    correctAnswerIndex: correctIndex,
    hint: `${insights.paymentProof} ${insights.denialPath}`,
    victoryMessage: `You defended ${insights.riskFocus}, tied it to the generated tests, and turned the AI output into code you actually understand.`,
    insight: `Focus on ${insights.vulnerableLine}. That is where a vibecoder can accidentally trust a string, receipt, witness, channel state, or payout split without binding it to the action being authorized.`,
    resources: insights.resources,
  };
}

function mapQuestBlueprintForAnalysis(response: GenerateQuestResponse): QuestData {
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
    description: response.quest.build_objective,
    files,
    gates: [],
    bossFight: {
      title: response.quest.title,
      challenge: response.quest.boss_fight,
      question: "",
      options: [],
      correctAnswerIndex: 0,
      hint: "",
      victoryMessage: "",
      insight: "",
      resources: [],
    },
  };
}

function analyzeQuestCode(quest: QuestData): CodeInsights {
  const haystack = quest.files.map((file) => `${file.path}\n${file.content}`).join("\n");
  const lower = haystack.toLowerCase();
  const hasReceipt = /receipt|invoice|preimage|htlc/.test(lower);
  const hasWitness = /witness|script|cell|xudt|capacity|lock/.test(lower);
  const hasSplit = /split|bps|creator|platform|payout|balance/.test(lower);
  const hasChannel = /channel|state|route|hop|fiber/.test(lower);
  const hasDenial = /throw|reject|false|invalid|unpaid|forbid|deny|mismatch/.test(lower);
  const vulnerableLine = findLineReference(quest.files, /(verify|read|validate|authorize|can[A-Z]|return|throw|receipt|witness|invoice|preimage|split|payout)/i);
  const testLine = findLineReference(quest.files, /(test|it\(|expect|assert|throws|false|reject|unpaid|invalid|mismatch)/i);

  const primaryInvariant = hasSplit
    ? "the payout or balance split must match the authorized asset and state transition"
    : hasReceipt
      ? "the receipt proof must be bound to the exact reader, action, and content/cell state"
      : hasWitness
        ? "the CKB witness and script data must match the transaction state being accepted"
        : "the generated verifier must reject any input that is not explicitly authorized";
  const riskFocus = hasSplit
    ? "payout split integrity"
    : hasChannel
      ? "Fiber channel-state replay risk"
      : hasReceipt
        ? "receipt replay and unpaid-read risk"
        : hasWitness
          ? "CKB witness trust boundary"
          : "generated-code trust boundary";

  return {
    primaryInvariant,
    denialPath: hasDenial
      ? `There is a denial path to inspect at ${testLine}; make sure it attacks the same condition the verifier trusts.`
      : "The generated files do not make the denial path obvious, so the learner should add one before shipping.",
    paymentProof: hasReceipt
      ? "Payment proof is represented through receipt/invoice/preimage terms; verify it cannot be copied across users, content, or runs."
      : "Payment proof is indirect here; identify what state or witness stands in for payment authorization.",
    networkHook: hasWitness
      ? "CKB state appears through cell/script/witness/xUDT concepts; explain what is trusted on-chain versus checked locally."
      : hasChannel
        ? "Fiber state appears through channel/HTLC/route terms; explain what prevents replay or stale state acceptance."
        : "The quest mentions CKB/Fiber, but the code should be inspected for a concrete network-state binding.",
    riskFocus,
    vulnerableLine,
    testLine,
    reviewChecklist: [
      `Trace the accepting branch at ${vulnerableLine}.`,
      `Match every trusted field to a denial test around ${testLine}.`,
      "Ask what an attacker can copy, omit, or mutate without changing the UI.",
      "Explain the CKB/Fiber boundary in plain language before claiming the badge.",
    ],
    mentorPrompts: [
      "What does this verifier trust?",
      "How could this be replayed?",
      "Which test proves unpaid access is blocked?",
      "What should I patch before shipping?",
    ],
    resources: learningResourcesFor(lower),
  };
}

function findLineReference(files: WorkbenchFile[], pattern: RegExp) {
  for (const file of files) {
    const lines = file.content.split("\n");
    const index = lines.findIndex((line) => pattern.test(line));
    if (index >= 0) {
      return `${file.path}:${index + 1}`;
    }
  }

  return files[0] ? `${files[0].path}:1` : "generated workspace:1";
}

function learningResourcesFor(lower: string): LearningResource[] {
  const resources: LearningResource[] = [
    {
      title: "CKB Docs",
      url: "https://docs.nervos.org/",
      reason: "Use this to connect cells, scripts, witnesses, and transaction state to the generated verifier.",
    },
    {
      title: "Fiber Network Repository",
      url: "https://github.com/nervosnetwork/fiber",
      reason: "Use this when a quest mentions Fiber channels, HTLCs, invoices, routing, or off-chain payment state.",
    },
    {
      title: "JoyID Documentation",
      url: "https://docs.joy.id/",
      reason: "Use this to understand the wallet/passkey proof that binds the learner to a quest run.",
    },
  ];

  if (lower.includes("xudt") || lower.includes("sudt") || lower.includes("asset")) {
    resources.unshift({
      title: "CKB Token Standards",
      url: "https://docs.nervos.org/",
      reason: "Review token and asset concepts before trusting generated xUDT payout logic.",
    });
  }

  return resources.slice(0, 3);
}

function insertAt<T>(items: T[], item: T, index: number) {
  const next = [...items];
  next.splice(index, 0, item);
  return next;
}

function stableChoiceIndex(...parts: string[]) {
  const total = parts.join(":").split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return total % 4;
}

function shortAddress(address: string) {
  if (address.length <= 16) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
