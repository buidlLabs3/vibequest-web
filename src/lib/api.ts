export type Difficulty = "novice" | "builder" | "boss";

export type QuestBlueprint = {
  title: string;
  premise: string;
  build_objective: string;
  comprehension_gates: string[];
  boss_fight: string;
  reward_logic: string;
  ckb_fiber_hooks: string[];
  workbench_files: WorkbenchFile[];
};

export type WorkbenchFile = {
  path: string;
  language: string;
  content: string;
};

export type GenerateQuestResponse = {
  run_id: string;
  source: "open-ai" | "core-fallback";
  wallet: WalletBinding;
  quest: QuestBlueprint;
  ship_requirements: ShipRequirements;
};

export type WalletBinding = {
  address: string;
  identity: string;
  sign_type: string;
  message: string;
};

export type WalletProof = {
  address: string;
  message: string;
  signature: {
    signature: string;
    identity: string;
    sign_type: string;
  };
};

export type ShipRequirements = {
  ckb_rpc_ready: boolean;
  fiber_rpc_ready: boolean;
  can_claim_rewards: boolean;
};

export type HealthResponse = {
  service: string;
  status: "ok";
  environment: string;
  ai_layer: "open-ai";
  integrations: {
    openai: boolean;
    ckb_rpc: boolean;
    fiber_rpc: boolean;
    mongodb: boolean;
  };
  missing: string[];
  timestamp: string;
};

export type GenerateQuestRequest = {
  build_prompt: string;
  skill_track: string;
  difficulty: Difficulty;
  wallet: WalletProof;
};

export type StoredGateProgress = {
  id: string;
  name: string;
  description: string;
  is_completed: boolean;
};

export type QuestProgress = {
  gates: StoredGateProgress[];
  boss_fight_solved: boolean;
  shipped: boolean;
};

export type QuestRunStatus = "in-progress" | "completed";

export type QuestRunRecord = {
  run_id: string;
  user_address: string;
  build_prompt: string;
  skill_track: string;
  difficulty: Difficulty;
  source: "open-ai" | "core-fallback";
  quest: QuestBlueprint;
  ship_requirements: ShipRequirements;
  progress: QuestProgress;
  status: QuestRunStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type UserQuestCounts = {
  created: number;
  completed: number;
  uncompleted: number;
};

export type UserQuestHistoryResponse = {
  user: {
    address: string;
    quest_counts: UserQuestCounts;
    created_at: string;
    updated_at: string;
    last_seen_at: string;
  } | null;
  stats: UserQuestCounts;
  active_run: QuestRunRecord | null;
  runs: QuestRunRecord[];
};

export type UpdateQuestProgressRequest = {
  wallet: WalletProof;
  gates?: StoredGateProgress[];
  boss_fight_solved?: boolean;
  shipped?: boolean;
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "/api/core";

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Backend health check failed.");
  }

  return response.json() as Promise<HealthResponse>;
}

export async function generateQuest(
  payload: GenerateQuestRequest,
): Promise<GenerateQuestResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/quests/generate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = response.status === 504
      ? "Quest generation timed out before vibequest-core returned. Try again with a shorter prompt."
      : "Quest generation failed. Check that vibequest-core is running.";
    const bodyText = await response.text().catch(() => "");

    try {
      const body = JSON.parse(bodyText) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      if (bodyText.includes("FUNCTION_INVOCATION_TIMEOUT")) {
        message = "Quest generation timed out on Vercel before the AI response completed.";
      }
    }

    throw new Error(message);
  }

  return response.json() as Promise<GenerateQuestResponse>;
}


export async function getUserQuestHistory(address: string): Promise<UserQuestHistoryResponse> {
  const response = await fetch(API_BASE_URL + "/users/" + encodeURIComponent(address) + "/quests", {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "Quest history failed to load."));
  }

  return response.json() as Promise<UserQuestHistoryResponse>;
}

export async function updateQuestProgress(
  runId: string,
  payload: UpdateQuestProgressRequest,
): Promise<QuestRunRecord> {
  const response = await fetch(API_BASE_URL + "/quests/" + encodeURIComponent(runId) + "/progress", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "Quest progress failed to save."));
  }

  return response.json() as Promise<QuestRunRecord>;
}

async function apiErrorMessage(response: Response, fallback: string) {
  const bodyText = await response.text().catch(() => "");
  try {
    const body = JSON.parse(bodyText) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return bodyText || fallback;
  }
}
