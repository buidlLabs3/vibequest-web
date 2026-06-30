"use client";

import { ccc, useCcc, useSigner } from "@ckb-ccc/connector-react";
import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";

import DashboardView from "@/components/DashboardView";
import LandingPage from "@/components/LandingPage";
import LearningModeView, { type TutorMessage } from "@/components/LearningModeView";
import Navbar from "@/components/Navbar";
import QuestRunView from "@/components/QuestRunView";
import ShipGateView from "@/components/ShipGateView";
import WalletConnectModal from "@/components/WalletConnectModal";
import WorkbenchView from "@/components/WorkbenchView";
import {
  askAndSaveLearningTutor,
  askLearningTutor,
  completeQuest,
  generateLearningModule,
  generateQuest,
  getHealth,
  getLearningSession,
  getUserQuestHistory,
  saveLearningSession,
  updateQuestProgress,
  type BossAttemptRecord,
  type BossAttemptRequest,
  type Difficulty,
  type GenerateQuestResponse,
  type HealthResponse,
  type LearningModuleDto,
  type LearningQuestLink,
  type LearningSessionRecord,
  type LearningTutorMessageDto,
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
  | "learn"
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
  learningSession: "vibequest.learningSession.v1",
} as const;

const TAB_IDS = new Set<TabId>([
  "landing",
  "dashboard",
  "learn",
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
  const [learningModule, setLearningModule] = useState<LearningModuleDto | null>(null);
  const [learningGenerating, setLearningGenerating] = useState(false);
  const [learningError, setLearningError] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["CKB Foundations", "Fiber Payments"]);
  const [learnerGoal, setLearnerGoal] = useState("Teach me CKB/Fiber well enough to understand generated code, explain the trust boundary, and complete practical quests.");
  const [learnerBackground, setLearnerBackground] = useState("Vibecoder");
  const [learningPace, setLearningPace] = useState("Focused");
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [checkpointAnswers, setCheckpointAnswers] = useState<Record<string, number>>({});
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [learningModuleId, setLearningModuleId] = useState<string | null>(null);
  const [learningSyncState, setLearningSyncState] = useState<"idle" | "loading" | "saving" | "saved" | "local-only">("idle");
  const [pendingLearningQuestContext, setPendingLearningQuestContext] = useState<LearningQuestLink | null>(null);
  const lastSavedLearningSnapshotRef = useRef<string | null>(null);

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
    const restoredLearningSession = parseLearningSession(window.localStorage.getItem(STORAGE_KEYS.learningSession));

    if (restoredLearningSession) {
      setLearningModule(restoredLearningSession.module);
      setLearningModuleId(restoredLearningSession.moduleId ?? null);
      setSelectedInterests(restoredLearningSession.selectedInterests);
      setLearnerGoal(restoredLearningSession.learnerGoal);
      setLearnerBackground(restoredLearningSession.background);
      setLearningPace(restoredLearningSession.pace);
      setActiveLessonIndex(restoredLearningSession.activeLessonIndex);
      setCheckpointAnswers(restoredLearningSession.checkpointAnswers);
      setTutorMessages(restoredLearningSession.tutorMessages);
    }

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
    if (!sessionReady || typeof window === "undefined") {
      return;
    }

    if (!learningModule) {
      window.localStorage.removeItem(STORAGE_KEYS.learningSession);
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEYS.learningSession,
      JSON.stringify({
        moduleId: learningModuleId,
        module: learningModule,
        selectedInterests,
        learnerGoal,
        background: learnerBackground,
        pace: learningPace,
        activeLessonIndex,
        checkpointAnswers,
        tutorMessages,
        updatedAt: new Date().toISOString(),
      }),
    );
  }, [activeLessonIndex, checkpointAnswers, learnerBackground, learnerGoal, learningModule, learningModuleId, learningPace, selectedInterests, sessionReady, tutorMessages]);

  useEffect(() => {
    if (!sessionReady || !walletProof || !learningModule || learningSyncState === "loading") {
      return;
    }

    const payload = {
      wallet: walletProof,
      module_id: learningModuleId,
      module: learningModule,
      selected_interests: selectedInterests,
      learner_goal: learnerGoal,
      background: learnerBackground,
      pace: learningPace,
      active_lesson_index: activeLessonIndex,
      checkpoint_answers: checkpointAnswers,
      tutor_messages: tutorMessages.map(mapTutorMessageDto),
    };
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSavedLearningSnapshotRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      lastSavedLearningSnapshotRef.current = snapshot;
      setLearningSyncState("saving");
      void saveLearningSession(walletProof.address, payload)
        .then((session) => {
          setLearningModuleId(session.module_id);
          setLearningSyncState("saved");
          setLearningError(null);
        })
        .catch((error) => {
          setLearningSyncState("local-only");
          setLearningError(error instanceof Error ? normalizeHistoryError(error.message) : "Learning progress is saved locally for now.");
        });
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [activeLessonIndex, checkpointAnswers, learnerBackground, learnerGoal, learningModule, learningModuleId, learningPace, learningSyncState, selectedInterests, sessionReady, tutorMessages, walletProof]);

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
    setPendingLearningQuestContext(run.learning_context ?? null);

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
    setPendingLearningQuestContext(run.learning_context ?? null);
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

  const applyLearningSession = useCallback((session: LearningSessionRecord) => {
    setLearningModuleId(session.module_id);
    setLearningModule(session.module);
    setSelectedInterests(session.selected_interests);
    setLearnerGoal(session.learner_goal);
    setLearnerBackground(session.background);
    setLearningPace(session.pace);
    setActiveLessonIndex(session.active_lesson_index);
    setCheckpointAnswers(session.checkpoint_answers);
    const tutorMessages = session.tutor_messages.map(mapTutorMessage);
    setTutorMessages(tutorMessages);
    lastSavedLearningSnapshotRef.current = JSON.stringify({
      wallet: walletProof,
      module_id: session.module_id,
      module: session.module,
      selected_interests: session.selected_interests,
      learner_goal: session.learner_goal,
      background: session.background,
      pace: session.pace,
      active_lesson_index: session.active_lesson_index,
      checkpoint_answers: session.checkpoint_answers,
      tutor_messages: tutorMessages.map(mapTutorMessageDto),
    });
    setLearningSyncState("saved");
  }, [walletProof]);

  const loadLearningSession = useCallback(async (address: string) => {
    setLearningSyncState("loading");
    try {
      const response = await getLearningSession(address);
      if (response.session) {
        applyLearningSession(response.session);
      } else {
        setLearningSyncState("idle");
      }
    } catch (error) {
      setLearningSyncState("local-only");
      setLearningError(error instanceof Error ? normalizeHistoryError(error.message) : "Learning session is local-only for now.");
    }
  }, [applyLearningSession]);

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
    void loadLearningSession(walletProof.address);
  }, [loadLearningSession, loadQuestHistory, walletProof?.address]);

  const persistCurrentProgress = useCallback(
    async (next: { gates?: VerificationGate[]; bossFightSolved?: boolean; bossAttempt?: BossAttemptRequest }) => {
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
          boss_attempt: next.bossAttempt,
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

  const handleBossAttempt = useCallback((attempt: BossAttemptRequest, solved: boolean) => {
    setQuestData((previous) => {
      if (!previous) {
        return previous;
      }

      const attemptRecord: BossAttemptRecord = {
        ...attempt,
        created_at: new Date().toISOString(),
      };

      return {
        ...previous,
        bossAttempts: [...(previous.bossAttempts ?? []), attemptRecord].slice(-20),
      };
    });

    void persistCurrentProgress({ bossFightSolved: solved || bossFightSolved, bossAttempt: attempt });
  }, [bossFightSolved, persistCurrentProgress]);


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
    setLearningModuleId(null);
    setLearningSyncState(learningModule ? "local-only" : "idle");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEYS.activeQuestSession);
    }
  }, [learningModule]);

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
          learning_context: pendingLearningQuestContext,
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
    [loadQuestHistory, pendingLearningQuestContext, refreshHealth, upsertPracticeRecord, walletProof],
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

  const handleGenerateLearningModule = useCallback(async () => {
    setLearningGenerating(true);
    setLearningError(null);
    setTutorMessages([]);
    setCheckpointAnswers({});
    setActiveLessonIndex(0);
    setPendingLearningQuestContext(null);

    try {
      const response = await generateLearningModule({
        interests: selectedInterests,
        learner_goal: learnerGoal,
        background: learnerBackground,
        pace: learningPace,
      });
      setLearningModuleId(response.module_id);
      setLearningModule(response.module);
      setLearningSyncState(walletProof ? "saving" : "local-only");
    } catch (error) {
      setLearningError(error instanceof Error ? error.message : "Learning module generation failed.");
    } finally {
      setLearningGenerating(false);
    }
  }, [learnerBackground, learnerGoal, learningPace, selectedInterests, walletProof]);

  const handleAskLearningTutor = useCallback(async () => {
    const lesson = learningModule?.lessons[activeLessonIndex];
    if (!learningModule || !lesson || !tutorQuestion.trim()) {
      return null;
    }

    const payload = {
      module_title: learningModule.title,
      lesson_title: lesson.title,
      lesson_context: `${lesson.why_it_matters}\n${lesson.explanation}\nCheckpoint: ${lesson.checkpoint.question}`,
      question: tutorQuestion,
    };

    setTutorLoading(true);
    setLearningError(null);
    try {
      if (walletProof) {
        const response = await askAndSaveLearningTutor(walletProof.address, {
          wallet: walletProof,
          ...payload,
        });
        if (response.session) {
          applyLearningSession(response.session);
        }
        return response.answer;
      }

      setLearningSyncState("local-only");
      return await askLearningTutor(payload);
    } catch (error) {
      setLearningError(error instanceof Error ? error.message : "Learning tutor failed to answer.");
      return null;
    } finally {
      setTutorLoading(false);
    }
  }, [activeLessonIndex, applyLearningSession, learningModule, tutorQuestion, walletProof]);

  const handleStartLessonQuest = useCallback((prompt: string) => {
    const lesson = learningModule?.lessons[activeLessonIndex];
    if (!learningModule || !lesson) {
      return;
    }

    const answeredCorrectly = checkpointAnswers[lesson.id] === lesson.checkpoint.correct_index;
    if (!answeredCorrectly) {
      setLearningError("Pass the active lesson checkpoint before generating its practice quest.");
      setActiveTab("learn");
      return;
    }

    const wrongGaps = lesson.checkpoint.options
      .filter((_, index) => index !== lesson.checkpoint.correct_index)
      .map((option) => option.feedback)
      .slice(0, 2)
      .join(" ");
    const questPrompt = [
      prompt.trim() || learningModule.capstone_quest_prompt,
      `Learning source: ${learningModule.title} / ${lesson.title}.`,
      `Learner goal: ${learnerGoal}.`,
      `Concepts to practice: ${lesson.concepts.join(", ")}.`,
      `Checkpoint they passed: ${lesson.checkpoint.question}`,
      `Make the boss challenge test this exact misunderstanding: ${wrongGaps || lesson.checkpoint.explanation}`,
    ].filter(Boolean).join(" ");

    setBuildRequest(questPrompt);
    setPendingLearningQuestContext({
      module_id: learningModuleId ?? learningModule.title,
      lesson_id: lesson.id,
      module_title: learningModule.title,
      lesson_title: lesson.title,
      checkpoint_question: lesson.checkpoint.question,
    });
    setSkillTrack(
      selectedInterests.some((interest) => interest.toLowerCase().includes("fiber"))
        ? "Fiber Builder"
        : "CKB Fundamentals",
    );
    setDifficulty("BUILDER");
    setGenerationError(null);
    setLearningError(null);
    setActiveTab("quest-run");
  }, [activeLessonIndex, checkpointAnswers, learnerGoal, learningModule, learningModuleId, selectedInterests]);

  const handleGenerateActiveLessonQuest = useCallback(() => {
    const lesson = learningModule?.lessons[activeLessonIndex];
    if (!lesson || !learningModule) {
      setActiveTab("learn");
      return;
    }

    handleStartLessonQuest(lesson.quest_bridge || learningModule.capstone_quest_prompt);
  }, [activeLessonIndex, handleStartLessonQuest, learningModule]);

  const openLearningSource = useCallback((context: LearningQuestLink) => {
    const lessonIndex = learningModule?.lessons.findIndex((lesson) => lesson.id === context.lesson_id) ?? -1;
    if (lessonIndex >= 0) {
      setActiveLessonIndex(lessonIndex);
    }
    setLearningError(null);
    setActiveTab("learn");
  }, [learningModule]);

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

        {activeTab === "learn" && (
          <LearningModeView
            module={learningModule}
            generating={learningGenerating}
            tutorLoading={tutorLoading}
            syncState={learningSyncState}
            error={learningError}
            selectedInterests={selectedInterests}
            setSelectedInterests={setSelectedInterests}
            learnerGoal={learnerGoal}
            setLearnerGoal={setLearnerGoal}
            background={learnerBackground}
            setBackground={setLearnerBackground}
            pace={learningPace}
            setPace={setLearningPace}
            activeLessonIndex={activeLessonIndex}
            setActiveLessonIndex={setActiveLessonIndex}
            checkpointAnswers={checkpointAnswers}
            setCheckpointAnswers={setCheckpointAnswers}
            tutorMessages={tutorMessages}
            setTutorMessages={setTutorMessages}
            tutorQuestion={tutorQuestion}
            setTutorQuestion={setTutorQuestion}
            onGenerateModule={handleGenerateLearningModule}
            onAskTutor={handleAskLearningTutor}
            onStartLessonQuest={handleStartLessonQuest}
            canStartLessonQuest={Boolean(learningModule?.lessons[activeLessonIndex] && checkpointAnswers[learningModule.lessons[activeLessonIndex].id] === learningModule.lessons[activeLessonIndex].checkpoint.correct_index)}
          />
        )}

        {activeTab === "workbench" && (
          <WorkbenchView
            walletBound={walletBound}
            onConnectWallet={() => setWalletModalOpen(true)}
            questData={enhancedQuestData}
            onOpenQuestRun={() => setActiveTab("quest-run")}
            onOpenLearningSource={openLearningSource}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            gates={gates}
            setGates={handleSetGates}
            bossFightSolved={bossFightSolved}
            shipped={shipped}
            onShip={() => setActiveTab("ship-gate")}
            onChallengeComplete={() => markCurrentPracticeRecord("completed")}
            onBossAttempt={handleBossAttempt}
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
            learningModule={learningModule}
            activeLessonIndex={activeLessonIndex}
            checkpointAnswers={checkpointAnswers}
            gates={gates}
            bossFightSolved={bossFightSolved}
            shipped={shipped}
            onConnectWallet={() => setWalletModalOpen(true)}
            onOpenQuestRun={() => { setPendingLearningQuestContext(null); setActiveTab("quest-run"); }}
            onOpenLearn={() => setActiveTab("learn")}
            onGenerateActiveLessonQuest={handleGenerateActiveLessonQuest}
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
            learningQuestOrigin={pendingLearningQuestContext ? `${pendingLearningQuestContext.module_title} / ${pendingLearningQuestContext.lesson_title}` : null}
            onClearLearningQuest={() => setPendingLearningQuestContext(null)}
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

type LearningSession = {
  moduleId?: string | null;
  module: LearningModuleDto;
  selectedInterests: string[];
  learnerGoal: string;
  background: string;
  pace: string;
  activeLessonIndex: number;
  checkpointAnswers: Record<string, number>;
  tutorMessages: TutorMessage[];
  updatedAt: string;
};

function parseLearningSession(value: string | null): LearningSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as LearningSession;
    if (
      isLearningModule(parsed.module) &&
      Array.isArray(parsed.selectedInterests) &&
      parsed.selectedInterests.every((interest) => typeof interest === "string") &&
      typeof parsed.learnerGoal === "string" &&
      typeof parsed.background === "string" &&
      typeof parsed.pace === "string" &&
      typeof parsed.activeLessonIndex === "number" &&
      isNumberRecord(parsed.checkpointAnswers) &&
      Array.isArray(parsed.tutorMessages) &&
      parsed.tutorMessages.every(isTutorMessage) &&
      typeof parsed.updatedAt === "string"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function isLearningModule(value: unknown): value is LearningModuleDto {
  const learningModuleValue = value as LearningModuleDto;

  return Boolean(
    learningModuleValue &&
      typeof learningModuleValue.title === "string" &&
      typeof learningModuleValue.learner_profile === "string" &&
      typeof learningModuleValue.outcome === "string" &&
      Array.isArray(learningModuleValue.lessons) &&
      learningModuleValue.lessons.length > 0 &&
      learningModuleValue.lessons.every((lesson) =>
        lesson &&
        typeof lesson.id === "string" &&
        typeof lesson.title === "string" &&
        typeof lesson.explanation === "string" &&
        Array.isArray(lesson.concepts) &&
        lesson.checkpoint &&
        typeof lesson.checkpoint.question === "string" &&
        Array.isArray(lesson.checkpoint.options) &&
        typeof lesson.checkpoint.correct_index === "number",
      ),
  );
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((item) => typeof item === "number");
}

function isTutorMessage(value: unknown): value is TutorMessage {
  const message = value as TutorMessage;

  return Boolean(
    message &&
      typeof message.id === "string" &&
      (message.role === "learner" || message.role === "mentor") &&
      typeof message.text === "string",
  );
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

function mapQuestResponse(response: GenerateQuestResponse, bossAttempts: BossAttemptRecord[] = []): QuestData {
  const files = response.quest.workbench_files.map((file) => ({
    name: file.path.split("/").pop() ?? file.path,
    path: file.path,
    content: file.content,
    description: `${file.language.toUpperCase()} workbench file generated for ${response.quest.title}.`,
  }));

  return {
    runId: response.run_id,
    source: response.source,
    learningContext: response.learning_context ?? null,
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
    bossAttempts,
  };
}

function mapQuestRunRecord(run: QuestRunRecord): QuestData {
  return mapQuestResponse({
    run_id: run.run_id,
    source: run.source,
    learning_context: run.learning_context ?? null,
    wallet: {
      address: run.user_address,
      identity: "",
      sign_type: "JoyId",
      message: "",
    },
    quest: run.quest,
    ship_requirements: run.ship_requirements,
    persistence: { saved: true, warning: null },
  }, run.boss_attempts ?? []);
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
  const brief = response.quest.challenge_brief;

  if (brief && brief.correct_answer && brief.wrong_answers?.length) {
    const correctIndex = stableChoiceIndex(response.run_id, response.quest.title, brief.invariant || brief.correct_answer);
    const correct = {
      label: brief.correct_answer,
      rationale: `Correct. ${brief.invariant} Focus: ${brief.code_focus} Test: ${brief.test_focus}`,
    };
    const distractors = brief.wrong_answers.slice(0, 3).map((answer) => ({
      label: answer.label,
      rationale: answer.feedback,
    }));

    return {
      title: response.quest.title,
      challenge: `${response.quest.boss_fight} ${brief.attack_scenario}`.trim(),
      question: brief.question,
      options: insertAt(distractors, correct, correctIndex),
      correctAnswerIndex: correctIndex,
      hint: brief.hint,
      victoryMessage: `You defended the generated code invariant: ${brief.invariant}`,
      insight: `${brief.follow_up_question} Code focus: ${brief.code_focus}. Test focus: ${brief.test_focus}.`,
      resources: mergeResources(brief.resources ?? [], insights.resources),
    };
  }

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

function mergeResources(primary: LearningResource[], fallback: LearningResource[]) {
  const seen = new Set<string>();
  return [...primary, ...fallback]
    .filter((resource) => {
      if (!resource.url || seen.has(resource.url)) {
        return false;
      }
      seen.add(resource.url);
      return true;
    })
    .slice(0, 3);
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
    learningContext: response.learning_context ?? null,
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

function mapTutorMessage(message: LearningTutorMessageDto): TutorMessage {
  return {
    id: message.id,
    role: message.role,
    text: message.text,
    why: message.why ?? undefined,
    followUp: message.follow_up ?? undefined,
  };
}

function mapTutorMessageDto(message: TutorMessage): LearningTutorMessageDto {
  return {
    id: message.id,
    role: message.role,
    text: message.text,
    why: message.why ?? null,
    follow_up: message.followUp ?? null,
    created_at: message.createdAt ?? stableTutorTimestamp(message.id),
  };
}

function stableTutorTimestamp(id: string) {
  const match = id.match(/(\d{10,})/);
  const timestamp = match ? Number(match[1]) : 0;

  return Number.isFinite(timestamp) && timestamp > 0
    ? new Date(timestamp).toISOString()
    : new Date(0).toISOString();
}

function shortAddress(address: string) {
  if (address.length <= 16) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}
