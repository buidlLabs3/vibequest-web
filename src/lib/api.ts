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
  source: "open-ai";
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
