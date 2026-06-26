import { useEffect, useState, type ReactNode } from "react";
import {
  Clock,
  Fingerprint,
  Key,
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
  const [selectedWalletType, setSelectedWalletType] = useState<"joyid" | "ckbsigner">("joyid");
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
        ? "[SIGNER] Requesting CKB secp256k1 signature through connected wallet."
        : "[SIGNER] Opening wallet connector. Choose a CKB secp256k1 signer.",
      "[SIGNER] Challenge includes wallet address, timestamp, and VibeQuest run purpose.",
    ]);

    try {
      await onBindWallet();
      setStatus("success");
      setStatusLog((prev) => [
        ...prev,
        "[CRYPT] Signature received from wallet provider.",
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
              <p className="text-xs text-on-surface-variant">Choose a signer and bind a proof for VibeQuest runs.</p>
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SignerOption
                    active={selectedWalletType === "joyid"}
                    icon={<Fingerprint className="h-6 w-6 text-electric-blue" />}
                    title="JoyID Passkey"
                    description="Use a passkey signer when JoyID is available in your browser."
                    tone="blue"
                    onClick={() => setSelectedWalletType("joyid")}
                  />
                  <SignerOption
                    active={selectedWalletType === "ckbsigner"}
                    icon={<Key className="h-6 w-6 text-cyber-green" />}
                    title="CKB Signer"
                    description="Use a CKB secp256k1 signer exposed through the wallet connector."
                    tone="green"
                    onClick={() => setSelectedWalletType("ckbsigner")}
                  />
                </div>

                <button
                  onClick={() => void handleStartSignature()}
                  disabled={signing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-electric-blue py-4 text-sm font-extrabold uppercase tracking-wider text-[#0B0C0E] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:brightness-50"
                >
                  {signing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}
                  {signing ? "Waiting for signature..." : "Sign VibeQuest Proof"}
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
                  No wallet proof signed yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignerOption({
  active,
  icon,
  title,
  description,
  tone,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  tone: "blue" | "green";
  onClick: () => void;
}) {
  const activeClass = tone === "blue"
    ? "border-electric-blue bg-electric-blue/5"
    : "border-cyber-green bg-cyber-green/5";
  const labelClass = tone === "blue"
    ? "border-electric-blue/25 bg-electric-blue/15 text-electric-blue"
    : "border-cyber-green/25 bg-cyber-green/15 text-cyber-green";

  return (
    <button
      onClick={onClick}
      className={"flex min-h-40 flex-col gap-4 rounded-xl border p-5 text-left transition-all hover:bg-white/5 " + (active ? activeClass : "border-glass-border")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">{icon}</div>
        {active && <span className={"rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase " + labelClass}>Selected</span>}
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{description}</p>
      </div>
    </button>
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
