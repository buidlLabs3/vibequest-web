"use client";

import { useCcc, useSigner } from "@ckb-ccc/connector-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import DashboardView from "@/components/DashboardView";
import InfrastructureView from "@/components/InfrastructureView";
import LandingPage from "@/components/LandingPage";
import Navbar from "@/components/Navbar";
import QuestRunView from "@/components/QuestRunView";
import ShipGateView from "@/components/ShipGateView";
import WalletConnectModal from "@/components/WalletConnectModal";
import WorkbenchView from "@/components/WorkbenchView";
import {
  generateQuest,
  getHealth,
  type Difficulty,
  type GenerateQuestResponse,
  type HealthResponse,
  type WalletProof,
} from "@/lib/api";
import type {
  BossFight,
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
  | "infrastructure"
  | "ship-gate";

const DEFAULT_BUILD_REQUEST =
  "Build a Fiber-powered paid content app with CKB proof receipts, a creator payout split, and a test that blocks unpaid reads.";

const STORAGE_KEYS = {
  activeTab: "vibequest.activeTab",
  walletProof: "vibequest.walletProof",
  proofLogs: "vibequest.proofLogs",
} as const;

const TAB_IDS = new Set<TabId>([
  "landing",
  "dashboard",
  "workbench",
  "quest-run",
  "infrastructure",
  "ship-gate",
]);

const EMPTY_GATES: VerificationGate[] = [
  {
    id: "identity",
    name: "Wallet Proof",
    description: "A signed CKB secp256k1 wallet proof is bound to this quest session.",
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
  const [healthError, setHealthError] = useState<string | null>(null);
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

  const infrastructureReady = Boolean(
    health?.integrations.openai &&
      health.integrations.ckb_rpc &&
      health.integrations.fiber_rpc,
  );
  const walletBound = Boolean(walletProof);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const restoredTab = parseTabId(window.location.hash.slice(1)) ?? parseTabId(window.localStorage.getItem(STORAGE_KEYS.activeTab));
    const restoredWalletProof = parseWalletProof(window.localStorage.getItem(STORAGE_KEYS.walletProof));
    const restoredProofLogs = parseProofLogs(window.localStorage.getItem(STORAGE_KEYS.proofLogs));

    if (restoredTab) {
      setActiveTab(restoredTab);
    }

    if (restoredWalletProof) {
      setWalletProof(restoredWalletProof);
    }

    if (restoredProofLogs.length > 0) {
      setProofLogs(restoredProofLogs);
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
      setHealthError(null);
      return nextHealth;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backend health check failed.";
      setHealth(null);
      setHealthError(message);
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

  const bindWalletProof = useCallback(async () => {
    if (!signer) {
      open();
      throw new Error("Choose a CKB secp256k1 signer, then sign the proof message.");
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
        sign_type: normalizeCkbSignType(signed.signType),
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
  }, []);

  const handleGenerateQuest = useCallback(
    async (request: string, track: string, rawDifficulty: string) => {
      setGenerationError(null);

      if (!walletProof) {
        setGenerationError("Sign a CKB wallet proof before generating a quest.");
        setWalletModalOpen(true);
        return false;
      }

      const currentHealth = health ?? (await refreshHealth());
      if (!currentHealth?.integrations.openai) {
        setGenerationError(
          currentHealth?.missing.includes("OPENAI_API_KEY")
            ? "OpenAI is missing on vibequest-core. Add OPENAI_API_KEY before generating live quests."
            : "OpenAI is not reachable through vibequest-core yet.",
        );
        return false;
      }

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
        const mappedQuest = mapQuestResponse(response);
        setQuestData(mappedQuest);
        setSelectedFile(mappedQuest.files[0] ?? null);
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Quest generation failed.";
        setGenerationError(message);
        return false;
      } finally {
        setGenerating(false);
      }
    },
    [health, refreshHealth, walletProof],
  );

  const handleResolveInfrastructure = useCallback(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const handleShipCargo = useCallback(() => {
    setShipped(true);
    setActiveTab("workbench");
  }, []);

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
            onGenerateQuest={handleGenerateQuest}
            generating={generating}
            buildRequest={buildRequest}
            setBuildRequest={setBuildRequest}
            skillTrack={skillTrack}
            setSkillTrack={setSkillTrack}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            gates={gates}
            setGates={setGates}
            bossFightSolved={bossFightSolved}
            setBossFightSolved={setBossFightSolved}
            shipped={shipped}
            onShip={handleShipCargo}
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
            healthError={healthError}
            questData={enhancedQuestData}
            gates={gates}
            bossFightSolved={bossFightSolved}
            shipped={shipped}
            onConnectWallet={() => setWalletModalOpen(true)}
            onOpenQuestRun={() => setActiveTab("quest-run")}
            onOpenWorkbench={() => setActiveTab("workbench")}
            onOpenInfrastructure={() => setActiveTab("infrastructure")}
            onOpenShipGate={() => setActiveTab("ship-gate")}
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

        {activeTab === "infrastructure" && (
          <InfrastructureView
            ckbRpcOnline={infrastructureReady}
            onResolveCkbRpc={handleResolveInfrastructure}
            health={health}
            healthError={healthError}
            onRefreshHealth={refreshHealth}
            onOpenQuestRun={() => setActiveTab("quest-run")}
            onOpenWorkbench={() => setActiveTab("workbench")}
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
          sign_type: normalizeCkbSignType(parsed.signature.sign_type),
        },
      };
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeCkbSignType(value: unknown): string {
  const raw = String(value ?? "").trim();
  const compact = raw.replace(/[\s_.-]/g, "").toLowerCase();

  if (compact.endsWith("ckbsecp256k1") || compact === "secp256k1") {
    return "CkbSecp256k1";
  }

  return raw;
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
