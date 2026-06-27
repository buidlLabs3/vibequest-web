"use client";

import { ccc } from "@ckb-ccc/connector-react";
import { useMemo, type ReactNode } from "react";

export function CkbWalletProvider({ children }: { children: ReactNode }) {
  const testnetClient = useMemo(() => new ccc.ClientPublicTestnet(), []);

  return (
    <ccc.Provider
      defaultClient={testnetClient}
      name="VibeQuest"
      preferredNetworks={[
        {
          addressPrefix: "ckt",
          signerType: ccc.SignerType.CKB,
          network: "nervos_testnet",
        },
      ]}
      signerFilter={async (signerInfo) =>
        signerInfo.signer.type === ccc.SignerType.CKB &&
        signerInfo.signer.signType === ccc.SignerSignType.JoyId
      }
    >
      {children}
    </ccc.Provider>
  );
}
