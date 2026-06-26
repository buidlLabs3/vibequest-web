import { useState } from "react";
import { 
  Wallet, 
  Fingerprint, 
  Key, 
  ShieldCheck, 
  Terminal as TermIcon, 
  CheckCircle, 
  RefreshCw,
  X,
  Clock
} from "lucide-react";
import { ProofLog } from "@/lib/workbench-types";

interface WalletProofViewProps {
  walletBound: boolean;
  onBindWallet: () => Promise<void>;
  onUnbindWallet: () => void;
  proofLogs: ProofLog[];
  address?: string;
  signerReady: boolean;
}

export default function WalletProofView({
  walletBound,
  onBindWallet,
  onUnbindWallet,
  proofLogs,
  address,
  signerReady,
}: WalletProofViewProps) {
  const [selectedWalletType, setSelectedWalletType] = useState<"joyid" | "ckbsigner">("joyid");
  const [signing, setSigning] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simLog, setSimLog] = useState<string[]>([]);

  const handleStartSignature = async () => {
    setSigning(true);
    setShowSim(true);
    setSimStep(2);
    setSimLog([
      signerReady
        ? `[SIGNER] Requesting CKB secp256k1 signature through connected wallet...`
        : "[SIGNER] Opening wallet connector. Choose a CKB secp256k1 signer.",
      "[SIGNER] Challenge payload includes the VibeQuest run purpose and wallet address.",
    ]);

    try {
      await onBindWallet();
      setSimLog((prev) => [
        ...prev,
        "[CRYPT ENGINE] Signature received from wallet provider.",
        "[CRYPT ENGINE] Public key identity and address lock will be verified by vibequest-core.",
        "[CRYPT ENGINE] Wallet proof bound successfully.",
      ]);
      setSimStep(3);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet proof signing failed.";
      setSimLog((prev) => [...prev, `[ERROR] ${message}`]);
      setSimStep(1);
    } finally {
      setSigning(false);
    }
  };

  const handlePasskeyConfirm = () => {
    void handleStartSignature();
  };

  return (
    <div className="bg-[#0B0C0E] text-on-surface font-sans p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8 min-h-screen">
      {/* Upper header */}
      <div className="border-b border-glass-border pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Wallet className="text-electric-blue w-8 h-8" />
          Wallet Proof Binding
        </h1>
        <p className="text-on-surface-variant text-sm mt-1 max-w-xl">
          Bind a secure cryptographically signed proof to claim your sandbox environment. This proof unlocks cell model actions and verifies your identity across gates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: SIGNER OPTIONS (span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[#16181D] border border-glass-border rounded-xl p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Select Wallet Signer Type
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* JOYID PASSKEY */}
              <div
                onClick={() => setSelectedWalletType("joyid")}
                className={`p-5 rounded-xl border flex flex-col gap-4 cursor-pointer transition-all ${
                  selectedWalletType === "joyid"
                    ? "border-electric-blue bg-electric-blue/5"
                    : "border-glass-border hover:bg-white/5"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-electric-blue/15 flex items-center justify-center border border-electric-blue/20">
                    <Fingerprint className="text-electric-blue w-6 h-6" />
                  </div>
                  {selectedWalletType === "joyid" && (
                    <span className="text-[10px] font-mono text-electric-blue bg-electric-blue/15 border border-electric-blue/25 px-2 py-0.5 rounded font-bold uppercase">
                      SELECTED
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">JoyID (Passkey)</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                    Zero gas, zero passphrases. Authenticate instantly using biometrics (TouchID, FaceID) via WebAuthn.
                  </p>
                </div>
              </div>

              {/* CKB SIGNER */}
              <div
                onClick={() => setSelectedWalletType("ckbsigner")}
                className={`p-5 rounded-xl border flex flex-col gap-4 cursor-pointer transition-all ${
                  selectedWalletType === "ckbsigner"
                    ? "border-cyber-green bg-cyber-green/5"
                    : "border-glass-border hover:bg-white/5"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-cyber-green/15 flex items-center justify-center border border-cyber-green/20">
                    <Key className="text-cyber-green w-6 h-6" />
                  </div>
                  {selectedWalletType === "ckbsigner" && (
                    <span className="text-[10px] font-mono text-cyber-green bg-cyber-green/15 border border-cyber-green/25 px-2 py-0.5 rounded font-bold uppercase">
                      SELECTED
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">CKB Signer</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                    Standard cryptographic signer lock. Direct interface for hardware security keys and local CKB nodes.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions button */}
            {!walletBound ? (
              <button
                onClick={handleStartSignature}
                disabled={signing}
                className="w-full py-4 bg-electric-blue hover:brightness-110 disabled:brightness-50 text-[#0B0C0E] font-bold text-sm tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {signing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting Signer...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    Sign VibeQuest Proof Message
                  </>
                )}
              </button>
            ) : (
              <div className="bg-cyber-green/5 border border-cyber-green/25 p-5 rounded-xl flex flex-col gap-4 text-center items-center justify-center">
                <ShieldCheck className="w-12 h-12 text-cyber-green" />
                <div>
                  <h3 className="text-lg font-bold text-white">Signer Cryptographically Bound</h3>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto leading-relaxed">
                    Identity verified for wallet address: <span className="text-cyber-green font-mono">{shortAddress(address)}</span>. Your active session sandbox has been validated!
                  </p>
                </div>
                <button
                  onClick={onUnbindWallet}
                  className="px-4 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-mono text-xs uppercase rounded transition-colors cursor-pointer"
                >
                  Unbind Signer Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT SIGNER PROOFS LOGS (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#16181D] border border-glass-border rounded-xl p-5 flex flex-col gap-4 h-[350px] overflow-hidden">
            <div className="flex items-center gap-2 border-b border-glass-border pb-3 justify-between">
              <div className="flex items-center gap-2">
                <TermIcon className="text-electric-blue w-5 h-5" />
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Recent Proof Witness History
                </h2>
              </div>
              <span className="font-mono text-xs opacity-50">
                Live Console
              </span>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
              {proofLogs.length > 0 ? (
                proofLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#0B0C0E] border border-glass-border/70 rounded-lg flex items-center justify-between font-mono text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white font-semibold uppercase">{log.type}</span>
                      <span className="text-[10px] text-on-surface-variant opacity-60">
                        PROOF ID: {log.id} / SEC: {log.timestamp}
                      </span>
                    </div>
                    <span className="text-cyber-green font-semibold bg-cyber-green/10 px-2 py-0.5 rounded text-[10px] uppercase border border-cyber-green/20">
                      {log.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 text-on-surface-variant font-mono text-xs p-8">
                  <Clock className="w-8 h-8 mb-2" />
                  <span>No cryptographic proof signatures generated yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* JOYID PASSKEY AUTHSIM MODAL DIALOG */}
      {showSim && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1D24] border border-[#2D3343] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-[#242936] border-b border-[#2D3343] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Fingerprint className="text-electric-blue w-5 h-5 animate-pulse" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  CKB Signer Verification
                </span>
              </div>
              <button 
                onClick={() => { setShowSim(false); setSigning(false); }}
                className="text-on-surface-variant hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5">
              {simStep === 1 && (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <div className="w-20 h-20 rounded-full bg-electric-blue/10 border-2 border-dashed border-electric-blue/30 flex items-center justify-center animate-spin-slow">
                    <Fingerprint className="text-electric-blue w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Verify Secure Passkey</h3>
                    <p className="text-xs text-on-surface-variant mt-1.5 max-w-xs">
                      VibeQuest Workbench is requesting a CKB secp256k1 signature proof. Confirm the wallet prompt to bind this run.
                    </p>
                  </div>
                  <button
                    onClick={handlePasskeyConfirm}
                    className="w-full mt-2 py-3 bg-electric-blue text-black font-extrabold text-sm rounded-lg hover:brightness-110 uppercase tracking-wider cursor-pointer"
                  >
                    Open Wallet Signature Prompt
                  </button>
                </div>
              )}

              {simStep === 2 && (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <RefreshCw className="w-12 h-12 text-electric-blue animate-spin" />
                  <div>
                    <h3 className="font-bold text-white text-base">Processing Witness Signatures...</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Generating cryptographic witness for transaction lock scripts.
                    </p>
                  </div>
                </div>
              )}

              {simStep === 3 && (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <CheckCircle className="w-14 h-14 text-cyber-green animate-bounce" />
                  <div>
                    <h3 className="font-bold text-white text-lg">Signature Proof Authenticated!</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      VibeQuest Proof challenge solved and bound.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSim(false)}
                    className="px-6 py-2 bg-[#2D3343] hover:bg-[#394154] text-white font-mono text-xs uppercase tracking-wider rounded cursor-pointer"
                  >
                    Close Terminal
                  </button>
                </div>
              )}

              {/* Live console logs */}
              <div className="bg-[#0B0C0E] border border-glass-border rounded-lg p-3.5 font-mono text-[10px] text-electric-blue h-36 overflow-y-auto">
                {simLog.map((log, index) => (
                  <div key={index} className="leading-relaxed mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}
