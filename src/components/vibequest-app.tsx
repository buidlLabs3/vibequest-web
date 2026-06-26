"use client";

import { CkbWalletProvider } from "@/components/ckb-wallet-provider";
import { VibeQuestWorkbench } from "@/components/vibequest-workbench";

export function VibeQuestApp() {
  return (
    <CkbWalletProvider>
      <VibeQuestWorkbench />
    </CkbWalletProvider>
  );
}
