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

export type PersistenceStatus = {
  saved: boolean;
  warning: string | null;
};

export type GenerateQuestResponse = {
  run_id: string;
  source: "open-ai";
  learning_context?: LearningQuestLink | null;
  wallet: WalletBinding;
  quest: QuestBlueprint;
  ship_requirements: ShipRequirements;
  persistence?: PersistenceStatus;
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
    fiber_payout: boolean;
    mongodb: boolean;
  };
  missing: string[];
  timestamp: string;
};

export type LearningQuestLink = {
  module_id: string;
  lesson_id: string;
  module_title: string;
  lesson_title: string;
  checkpoint_question: string;
};

export type GenerateQuestRequest = {
  build_prompt: string;
  skill_track: string;
  difficulty: Difficulty;
  wallet: WalletProof;
  learning_context?: LearningQuestLink | null;
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

export type RewardSnapshot = {
  amount_shannons: string;
  currency: string;
  sponsor: string;
};

export type FiberPaymentReceipt = {
  payment_hash: string | null;
  status: string | null;
  fee: string | null;
  raw: unknown;
};

export type RewardClaimStatus = "pending" | "verified" | "paying" | "paid" | "failed";

export type RewardClaimRecord = {
  claim_id: string;
  run_id: string;
  user_address: string;
  amount_shannons: string;
  currency: string;
  status: RewardClaimStatus;
  fiber_payment: FiberPaymentReceipt | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
};

export type QuestRunRecord = {
  run_id: string;
  user_address: string;
  build_prompt: string;
  skill_track: string;
  difficulty: Difficulty;
  learning_context?: LearningQuestLink | null;
  source: "open-ai";
  quest: QuestBlueprint;
  ship_requirements: ShipRequirements;
  progress: QuestProgress;
  status: QuestRunStatus;
  reward: RewardSnapshot;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type UserQuestCounts = {
  created: number;
  completed: number;
  uncompleted: number;
};


export type LearningResourceDto = {
  title: string;
  url: string;
  reason: string;
};

export type LearningOptionDto = {
  label: string;
  feedback: string;
};

export type LearningCheckpointDto = {
  question: string;
  options: LearningOptionDto[];
  correct_index: number;
  explanation: string;
  follow_up_question: string;
};

export type LearningLessonDto = {
  id: string;
  title: string;
  why_it_matters: string;
  explanation: string;
  concepts: string[];
  checkpoint: LearningCheckpointDto;
  quest_bridge: string;
};

export type LearningModuleDto = {
  title: string;
  learner_profile: string;
  outcome: string;
  lessons: LearningLessonDto[];
  capstone_quest_prompt: string;
  resources: LearningResourceDto[];
};

export type GenerateLearningModuleRequest = {
  interests: string[];
  learner_goal: string;
  background: string;
  pace: string;
};

export type GenerateLearningModuleResponse = {
  module_id: string;
  source: "open-ai";
  module: LearningModuleDto;
};

export type LearningTutorRequest = {
  module_title: string;
  lesson_title: string;
  lesson_context: string;
  question: string;
};

export type LearningTutorResponse = {
  source: "open-ai";
  answer: string;
  why_it_matters: string;
  follow_up_question: string;
  references: LearningResourceDto[];
};


export type LearningTutorMessageDto = {
  id: string;
  role: "learner" | "mentor";
  text: string;
  why?: string | null;
  follow_up?: string | null;
  created_at: string;
};

export type LearningSessionRecord = {
  module_id: string;
  user_address: string;
  source: "open-ai";
  module: LearningModuleDto;
  selected_interests: string[];
  learner_goal: string;
  background: string;
  pace: string;
  active_lesson_index: number;
  checkpoint_answers: Record<string, number>;
  tutor_messages: LearningTutorMessageDto[];
  created_at: string;
  updated_at: string;
};

export type LearningSessionResponse = {
  session: LearningSessionRecord | null;
};

export type SaveLearningSessionRequest = {
  wallet: WalletProof;
  module_id?: string | null;
  module: LearningModuleDto;
  selected_interests: string[];
  learner_goal: string;
  background: string;
  pace: string;
  active_lesson_index: number;
  checkpoint_answers: Record<string, number>;
  tutor_messages: LearningTutorMessageDto[];
};

export type SaveTutorExchangeRequest = {
  wallet: WalletProof;
  module_title: string;
  lesson_title: string;
  lesson_context: string;
  question: string;
};

export type SavedTutorExchangeResponse = {
  answer: LearningTutorResponse;
  session: LearningSessionRecord | null;
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
  reward_claims: RewardClaimRecord[];
};

export type UpdateQuestProgressRequest = {
  wallet: WalletProof;
  gates?: StoredGateProgress[];
  boss_fight_solved?: boolean;
  shipped?: boolean;
};

export type CompleteQuestRequest = {
  wallet: WalletProof;
  gates: StoredGateProgress[];
  boss_fight_solved: boolean;
  fiber_invoice: string;
};

export type CompleteQuestResponse = {
  run: QuestRunRecord;
  claim: RewardClaimRecord;
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



export async function generateLearningModule(
  payload: GenerateLearningModuleRequest,
): Promise<GenerateLearningModuleResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/learning/module`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "Learning module generation failed."));
  }

  return response.json() as Promise<GenerateLearningModuleResponse>;
}

export async function askLearningTutor(
  payload: LearningTutorRequest,
): Promise<LearningTutorResponse> {
  const response = await fetch(`${API_BASE_URL}/ai/learning/tutor`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "Learning tutor failed to answer."));
  }

  return response.json() as Promise<LearningTutorResponse>;
}


export async function getLearningSession(address: string): Promise<LearningSessionResponse> {
  const response = await fetch(API_BASE_URL + "/users/" + encodeURIComponent(address) + "/learning", {
    method: "GET",
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "Learning session failed to load."));
  }

  return response.json() as Promise<LearningSessionResponse>;
}

export async function saveLearningSession(
  address: string,
  payload: SaveLearningSessionRequest,
): Promise<LearningSessionRecord> {
  const response = await fetch(API_BASE_URL + "/users/" + encodeURIComponent(address) + "/learning", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "Learning session failed to save."));
  }

  return response.json() as Promise<LearningSessionRecord>;
}

export async function askAndSaveLearningTutor(
  address: string,
  payload: SaveTutorExchangeRequest,
): Promise<SavedTutorExchangeResponse> {
  const response = await fetch(API_BASE_URL + "/users/" + encodeURIComponent(address) + "/learning/tutor", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "Learning tutor failed to answer."));
  }

  return response.json() as Promise<SavedTutorExchangeResponse>;
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

export async function completeQuest(
  runId: string,
  payload: CompleteQuestRequest,
): Promise<CompleteQuestResponse> {
  const response = await fetch(API_BASE_URL + "/quests/" + encodeURIComponent(runId) + "/complete", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, "Quest completion failed."));
  }

  return response.json() as Promise<CompleteQuestResponse>;
}

async function apiErrorMessage(response: Response, fallback: string) {
  const bodyText = await response.text().catch(() => "");
  let message = fallback;

  try {
    const body = JSON.parse(bodyText) as { error?: string };
    message = body.error ?? fallback;
  } catch {
    message = bodyText || fallback;
  }

  return cleanApiErrorMessage(message, response.status, fallback);
}

function cleanApiErrorMessage(message: string, status: number, fallback: string) {
  const lower = message.toLowerCase();

  if (
    lower.includes("server selection timeout") ||
    lower.includes("replicasetnoprimary") ||
    lower.includes("systemoverloadederror") ||
    lower.includes("database operation failed") ||
    lower.includes("mongodb")
  ) {
    return "Quest history is temporarily unavailable. Please refresh in a moment.";
  }

  if (lower.includes("openai") || lower.includes("ai quest generation")) {
    return message;
  }

  if (status >= 500 && message.length > 180) {
    return fallback;
  }

  return message || fallback;
}
