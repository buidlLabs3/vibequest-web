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

export interface BossFight {
  title: string;
  challenge: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  hint: string;
  victoryMessage: string;
}

export interface QuestData {
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
