export interface WorkbenchFile {
  name: string;
  path: string;
  content: string;
  description: string;
}

export interface VerificationGate {
  id: string;
  name: string;
  description: string;
  isCompleted: boolean;
}

export interface BossOption {
  label: string;
  rationale: string;
}

export interface BossFight {
  title: string;
  challenge: string;
  question: string;
  options: BossOption[];
  correctAnswerIndex: number;
  hint: string;
  victoryMessage: string;
  insight: string;
  resources: LearningResource[];
}

export interface LearningResource {
  title: string;
  url: string;
  reason: string;
}

export interface QuestData {
  runId: string;
  source?: string;
  questName: string;
  description: string;
  files: WorkbenchFile[];
  gates: VerificationGate[];
  bossFight: BossFight;
}

export interface ProofLog {
  id: string;
  type: string;
  timestamp: string;
  status: string;
}

export type PracticeRecordStatus = "generated" | "verified" | "completed" | "shipped";

export interface PracticeRecord {
  runId: string;
  walletAddress: string;
  title: string;
  source?: string;
  status: PracticeRecordStatus;
  savedToCloud: boolean;
  warning?: string | null;
  updatedAt: string;
  completedAt?: string | null;
}
