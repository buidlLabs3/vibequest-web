import { useEffect, useState } from "react";
import {
  Clock,
  Fingerprint,
  RefreshCw,
  ShieldCheck,
  Terminal as TermIcon,
  Wallet,
  X,
} from "lucide-react";

import type { ProofLog } from "@/lib/workbench-types";

interface WalletConnectModalProps {
  open: boolean;
  walletBound: boolean;
  onBindWallet: () => Promise<void>;
  onUnbindWallet: () => void;
  onClose: () => void;
  proofLogs: ProofLog[];
  address?: string;
  signerReady: boolean;
}

export default function WalletConnectModal({
  open,
  walletBound,
  onBindWallet,
  onUnbindWallet,
  onClose,
  proofLogs,
  address,
  signerReady,
}: WalletConnectModalProps) {
  const [signing, setSigning] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "signing" | "success" | "error">("idle");

  useEffect(() => {
    if (open) {
      setStatus(walletBound ? "success" : "idle");
      setStatusLog([]);
    }
  }, [open, walletBound]);

  if (!open) {
    return null;
  }

  const handleStartSignature = async () => {
    setSigning(true);
    setStatus("signing");
    setStatusLog([
      signerReady
        ? "[JOYID] Requesting passkey signature through JoyID."
        : "[JOYID] Opening wallet connector. Choose JoyID Passkey.",
      "[JOYID] Challenge includes wallet address, timestamp, and VibeQuest run purpose.",
    ]);

    try {
      await onBindWallet();
      setStatus("success");
      setStatusLog((prev) => [
        ...prev,
        "[JOYID] Signature received from JoyID.",
        "[CRYPT] Proof is bound to this VibeQuest session.",
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet proof signing failed.";
      setStatus("error");
      setStatusLog((prev) => [...prev, "[ERROR] " + message]);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-glass-border bg-[#101218] shadow-2xl">
        <div className="flex items-center justify-between border-b border-glass-border bg-[#161A22] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-electric-blue/20 bg-electric-blue/10">
              <Wallet className="h-5 w-5 text-electric-blue" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Connect Wallet</h2>
              <p className="text-xs text-on-surface-variant">Bind a JoyID passkey proof for VibeQuest runs.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Close wallet connector"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="border-b border-glass-border p-5 lg:border-b-0 lg:border-r">
            {!walletBound ? (
              <div className="flex flex-col gap-5">
                <div className="rounded-xl border border-cyber-green/25 bg-cyber-green/5 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyber-green/20 bg-cyber-green/10">
                      <Fingerprint className="h-6 w-6 text-cyber-green" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">JoyID Passkey required</h3>
                      <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                        VibeQuest uses JoyID for quest generation. Authenticate with your passkey and sign one proof to unlock the workbench.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => void handleStartSignature()}
                  disabled={signing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-electric-blue py-4 text-sm font-extrabold uppercase tracking-wider text-[#0B0C0E] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-50"
                >
                  {signing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                  {signing ? "Waiting for JoyID..." : signerReady ? "Sign JoyID Proof" : "Choose JoyID"}
                </button>
              </div>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-xl border border-cyber-green/25 bg-cyber-green/5 p-6 text-center">
                <ShieldCheck className="h-14 w-14 text-cyber-green" />
                <div>
                  <h3 className="text-lg font-bold text-white">Wallet Proof Bound</h3>
                  <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                    Active proof: <span className="font-mono text-cyber-green">{shortAddress(address)}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={onClose}
                    className="rounded-lg bg-cyber-green px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:brightness-110"
                  >
                    Continue
                  </button>
                  <button
                    onClick={onUnbindWallet}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 font-mono text-xs uppercase text-red-400 hover:bg-red-500/10"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {statusLog.length > 0 && (
              <div className="mt-5 rounded-xl border border-glass-border bg-[#0B0C0E] p-4 font-mono text-[11px] text-electric-blue">
                <div className="mb-2 flex items-center justify-between border-b border-glass-border pb-2 text-[10px] uppercase text-on-surface-variant">
                  <span>Signer Console</span>
                  <span>{status.toUpperCase()}</span>
                </div>
                <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                  {statusLog.map((log, index) => (
                    <span key={index}>{log}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between border-b border-glass-border pb-3">
              <div className="flex items-center gap-2">
                <TermIcon className="h-4 w-4 text-electric-blue" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">Proof History</span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant">{proofLogs.length} proofs</span>
            </div>

            <div className="flex max-h-[330px] flex-col gap-2 overflow-y-auto pr-1">
              {proofLogs.length > 0 ? (
                proofLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-glass-border/70 bg-[#0B0C0E] p-3 font-mono text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold uppercase text-white">{log.type}</span>
                      <span className="rounded border border-cyber-green/20 bg-cyber-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-cyber-green">
                        {log.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-on-surface-variant">Proof {log.id} / {log.timestamp}</p>
                  </div>
                ))
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-glass-border p-6 text-center text-xs text-on-surface-variant">
                  <Clock className="mb-2 h-8 w-8 opacity-50" />
                  No JoyID proof signed yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function shortAddress(address?: string) {
  if (!address) {
    return "pending";
  }

  if (address.length <= 18) {
    return address;
  }

  return address.slice(0, 10) + "..." + address.slice(-8);
}
