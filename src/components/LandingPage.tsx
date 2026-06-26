/* eslint-disable @next/next/no-img-element */
import { motion } from "@/components/motion-shim";
import { Bolt, Shield, Award, Wallet } from "lucide-react";

interface LandingPageProps {
  onEnterWorkbench: () => void;
  walletBound: boolean;
  onConnectWallet: () => void;
}

export default function LandingPage({
  onEnterWorkbench,
  walletBound,
  onConnectWallet,
}: LandingPageProps) {
  return (
    <div className="bg-[#0B0C0E] text-on-surface font-sans selection:bg-electric-blue/30 overflow-x-hidden min-h-screen">
      {/* Background Scanline & Glows */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-electric-blue/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyber-green/5 blur-[150px] rounded-full"></div>
      </div>

      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-36 px-4 md:px-8 text-center max-w-6xl mx-auto z-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-green/10 border border-cyber-green/20 mb-8 animate-pulse"
        >
          <span className="w-2 h-2 rounded-full bg-cyber-green"></span>
          <span className="font-mono text-xs uppercase tracking-wider text-cyber-green">
            CKB/Fiber Testnet Live
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-7xl lg:text-8xl leading-[1.1] font-extrabold text-white mb-6 tracking-tight"
        >
          Sign the run,
          <br />
          <span className="text-electric-blue font-extrabold">generate the code,</span>
          <br />
          prove the diff.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl text-lg md:text-2xl text-on-surface-variant mb-12 font-light mx-auto leading-relaxed"
        >
          The gamified AI workbench for building on <span className="text-white font-semibold">CKB</span> and{" "}
          <span className="text-white font-semibold">Fiber</span>. Turn technical execution into measurable proof.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center"
        >
          <button
            onClick={onEnterWorkbench}
            className="w-full sm:w-auto px-10 py-5 bg-electric-blue text-[#0B0C0E] font-bold text-lg rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)] cursor-pointer"
          >
            Enter Workbench
          </button>
          {!walletBound ? (
            <button
              onClick={onConnectWallet}
              className="w-full sm:w-auto px-10 py-5 bg-transparent border border-glass-border text-electric-blue font-bold text-lg rounded-xl hover:bg-electric-blue/5 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Wallet className="w-5 h-5" />
              Connect Signer
            </button>
          ) : (
            <button
              onClick={onEnterWorkbench}
              className="w-full sm:w-auto px-10 py-5 bg-transparent border border-cyber-green text-cyber-green font-bold text-lg rounded-xl hover:bg-cyber-green/5 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" />
              Signer Bound
            </button>
          )}
        </motion.div>
      </section>

      {/* Feature Bento Grid */}
      <section className="w-full py-16 px-4 md:px-8 max-w-7xl mx-auto z-20 relative">
        <div className="flex flex-col gap-2 mb-12">
          <span className="font-mono text-sm text-electric-blue uppercase tracking-widest font-semibold">
            Workbench Core
          </span>
          <h2 className="text-3xl md:text-5xl text-white font-bold tracking-tight">
            Protocol-Grade Tooling
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* AI Quest Gen */}
          <div className="md:col-span-8 group relative overflow-hidden bg-[#16181D] rounded-2xl border border-glass-border p-8 h-[380px] flex flex-col justify-end transition-all hover:border-electric-blue/30">
            <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-50 transition-opacity">
              <img
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWGp7Y7Ru3F0ueZgvNVVDggYGoygdzX-I4z2EieUKGFG18oxGNSO1BqW0uGTI36F4HuC5JeLwSrmanU9hodVYKfECcmPz48nbhsORjZpmTOO2x5-j0AW8Utu91f5vqSGr7E7vshLwuSFZlDKiTCe-QJmIuCcGqXKO9MK_8F3QW1qtnhSX_CoYz3sWJhfIr90uXXM9y3rh0mjcpWFOgW8VJECXTr6uK9HvZmS2sluu2QxqVrTChvOIyHg"
                alt="AI circuit patterns"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#16181D] via-[#16181D]/40 to-transparent"></div>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Bolt className="text-electric-blue w-6 h-6 animate-pulse" />
                <h3 className="text-2xl md:text-3xl text-white font-bold">AI-Driven Quest Generation</h3>
              </div>
              <p className="text-on-surface-variant max-w-md">
                Dynamically generated coding challenges tailored to your skill level on CKB. Every quest is unique, every solution is verified by the LLM Workbench.
              </p>
            </div>
          </div>

          {/* Proof Gates */}
          <div className="md:col-span-4 bg-[#16181D] rounded-2xl border border-glass-border p-8 h-[380px] flex flex-col justify-between transition-all hover:border-cyber-green/30">
            <div>
              <div className="w-12 h-12 rounded-lg bg-cyber-green/10 flex items-center justify-center mb-6 border border-cyber-green/20">
                <Shield className="text-cyber-green w-6 h-6" />
              </div>
              <h3 className="text-xl md:text-2xl text-white font-bold mb-3">Proof-of-Understanding Gates</h3>
              <p className="text-on-surface-variant text-sm md:text-base">
                Cryptographic proofs that validate your logic, not just your syntax. Ensure your smart contracts meet cell requirements.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B0C0E] border border-dashed border-glass-border">
                <span className="font-mono text-xs opacity-60">Cell Logic Check</span>
                <span className="text-cyber-green text-xs font-semibold">VERIFIED</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0B0C0E] border border-dashed border-glass-border">
                <span className="font-mono text-xs opacity-60">Witness Verification</span>
                <span className="text-on-surface-variant text-xs">PENDING</span>
              </div>
            </div>
          </div>

          {/* Skill Badges */}
          <div className="md:col-span-5 bg-[#16181D] rounded-2xl border border-glass-border p-8 h-[360px] flex flex-col justify-center items-center text-center group hover:bg-[#242830] transition-colors">
            <div className="relative w-32 h-32 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-electric-blue/30 animate-spin-slow"></div>
              <div className="absolute inset-2 rounded-full bg-electric-blue/10 flex items-center justify-center">
                <Shield className="text-electric-blue w-12 h-12" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl text-white font-bold mb-2">CKB Skill Badges</h3>
            <p className="text-on-surface-variant text-sm md:text-base max-w-sm">
              Soulbound reputation tokens for builders. Tier-up from Cell Novice to Script Master.
            </p>
          </div>

          {/* Fiber Flows */}
          <div className="md:col-span-7 bg-[#16181D] rounded-2xl border border-glass-border p-8 h-[360px] flex flex-col md:flex-row gap-6 items-center group transition-all hover:border-warning-amber/30">
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl text-white font-bold mb-3">Fiber Reward Flows</h3>
              <p className="text-on-surface-variant text-sm md:text-base mb-6">
                Real-time payment channel settlement. Earn while you build with automated reward distribution via the Fiber Network.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 font-mono text-xs text-cyber-green font-semibold">
                  INSTANT SETTLEMENT
                </li>
                <li className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
                  LOW-LATENCY ROUTING
                </li>
              </ul>
            </div>
            <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden relative border border-glass-border">
              <img
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6VvYKfvrfQrAzWK4ExioxnPN8hBpnrw0EwqnQu8VB8UJPHeWO65yDXjtACA2p4Z76HqTBL3rOmuUB7wk3y_DsZoWop56QzpA0md_-7L0UNUjFbbGbZ7jX2D3wO3rEEzh3TLjqrkSzYPt8VSCgetYd0i9_HJOr86YvX1fwlXQ09dIjWJ7D5nMYSi7597xodQqg9Xv7dKHIaraelkSXpLkfYMnNFmhRW3JGbMoh0CjNaGHLDo2-YkvRng"
                alt="Fiber data streams"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16 border-y border-glass-border bg-[#16181D]/30 z-20 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col gap-1">
            <span className="text-electric-blue text-4xl md:text-5xl font-extrabold">Live</span>
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Quest Runs
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-cyber-green text-4xl md:text-5xl font-extrabold">Real</span>
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Wallet Proofs
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-white text-4xl md:text-5xl font-extrabold">API</span>
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Backend Health
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-warning-amber text-4xl md:text-5xl font-extrabold">Fiber</span>
            <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
              Reward Rail
            </span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full py-24 md:py-32 px-4 text-center relative overflow-hidden z-20 max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Ready to ship the future of BTC Layer 2?
        </h2>
        <p className="text-base md:text-xl text-on-surface-variant mb-12 font-light">
          Join the elite cohort of developers building the foundation of the programmable Bitcoin era on CKB.
        </p>
        <button
          onClick={onEnterWorkbench}
          className="px-12 py-6 bg-white text-[#0B0C0E] font-extrabold text-xl rounded-xl hover:bg-electric-blue hover:text-white hover:shadow-[0_0_40px_rgba(0,240,255,0.4)] transition-all active:scale-95 cursor-pointer"
        >
          Launch Workbench Now
        </button>
      </section>

      {/* Landing Footer */}
      <footer className="w-full py-16 px-4 md:px-8 border-t border-glass-border bg-[#0B0C0E] z-20 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex flex-col gap-4">
            <div className="text-electric-blue text-2xl font-bold tracking-tighter">VibeQuest</div>
            <p className="text-on-surface-variant max-w-xs text-sm font-mono">
              Terminal-Luxe AI Workbench for the next generation of cryptographic builders.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-white uppercase opacity-40">System</span>
              <button onClick={onEnterWorkbench} className="text-left text-sm text-on-surface-variant hover:text-electric-blue transition-colors">Infrastructure</button>
              <button onClick={onEnterWorkbench} className="text-left text-sm text-on-surface-variant hover:text-electric-blue transition-colors">Verification</button>
              <button onClick={onEnterWorkbench} className="text-left text-sm text-on-surface-variant hover:text-electric-blue transition-colors">Security</button>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-white uppercase opacity-40">Resources</span>
              <button onClick={onEnterWorkbench} className="text-left text-sm text-on-surface-variant hover:text-electric-blue transition-colors">Quest Docs</button>
              <button onClick={onEnterWorkbench} className="text-left text-sm text-on-surface-variant hover:text-electric-blue transition-colors">Infrastructure</button>
              <a href="https://github.com/buidlLabs3/vibequest-web" className="text-sm text-on-surface-variant hover:text-electric-blue transition-colors">GitHub</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-mono text-xs text-white uppercase opacity-40">Network</span>
              <button onClick={onEnterWorkbench} className="text-left text-sm text-on-surface-variant hover:text-electric-blue transition-colors">CKB Checks</button>
              <button onClick={onEnterWorkbench} className="text-left text-sm text-on-surface-variant hover:text-electric-blue transition-colors">Fiber Checks</button>
              <a href="https://www.nervos.org" className="text-sm text-on-surface-variant hover:text-electric-blue transition-colors">Nervos</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-glass-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-40">
          <span className="font-mono">(c) 2026 VibeQuest. BUILD_LOG_V2.4.0</span>
          <div className="flex gap-8">
            <span className="hover:opacity-100 cursor-pointer">PRIVACY_POLICY</span>
            <span className="hover:opacity-100 cursor-pointer">STATUS: /health gated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
