"use client";

import { CkbWalletProvider } from "@/components/ckb-wallet-provider";
import { QuestArena } from "@/components/quest-arena";

export function VibeQuestApp() {
  return (
    <CkbWalletProvider>
      <QuestArena />
    </CkbWalletProvider>
  );
}
