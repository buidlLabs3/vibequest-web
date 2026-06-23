export type Difficulty = "novice" | "builder" | "boss";

export type QuestBlueprint = {
  title: string;
  premise: string;
  build_objective: string;
  comprehension_gates: string[];
  boss_fight: string;
  reward_logic: string;
  ckb_fiber_hooks: string[];
};

export type GenerateQuestResponse = {
  run_id: string;
  source: "open-ai" | "fallback";
  quest: QuestBlueprint;
};

export type GenerateQuestRequest = {
  build_prompt: string;
  skill_track: string;
  difficulty: Difficulty;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";

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
    let message = "Quest generation failed. Check that vibequest-core is running.";

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Keep the generic error when the backend does not return JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<GenerateQuestResponse>;
}
