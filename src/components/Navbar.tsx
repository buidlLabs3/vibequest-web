import { Wallet } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  walletBound: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  walletLabel?: string;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  walletBound,
  onConnectWallet,
  onDisconnectWallet,
  walletLabel,
}: NavbarProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "learn", label: "Learn" },
    { id: "workbench", label: "Workbench" },
    { id: "quest-run", label: "Quest Run" },
    { id: "ship-gate", label: "Ship Gate" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0C0E]/90 backdrop-blur-md border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo and App Name */}
        <div 
          onClick={() => setActiveTab("landing")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-electric-blue to-cyber-green flex items-center justify-center font-bold text-black font-mono shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            V
          </div>
          <div>
            <span className="text-white font-bold text-lg font-sans tracking-tight group-hover:text-electric-blue transition-colors">
              VibeQuest
            </span>
            <span className="text-xs font-mono block text-on-surface-variant leading-none">
              WORKBENCH
            </span>
          </div>
        </div>

        {/* Dynamic Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-all relative cursor-pointer ${
                  isActive
                    ? "text-white bg-white/5 font-semibold"
                    : "text-on-surface-variant hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-electric-blue rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dynamic Signer Proof / Connection Status Badge */}
        <div className="flex items-center gap-4">
          {walletBound ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-mono text-cyber-green flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-ping"></span>
Wallet Bound
                </span>
                <span className="text-[10px] font-mono opacity-50">
                  {walletLabel ?? "JoyID"}
                </span>
              </div>
              <button
                onClick={onDisconnectWallet}
                className="px-3 py-1.5 rounded border border-cyber-green/20 bg-cyber-green/5 text-cyber-green hover:bg-cyber-green/10 text-xs font-mono transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="px-3.5 py-1.5 rounded-lg border border-warning-amber/30 bg-warning-amber/5 text-warning-amber hover:bg-warning-amber/10 text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 animate-pulse" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab bar */}
      <div className="lg:hidden flex items-center overflow-x-auto gap-1 px-4 py-2 border-t border-glass-border scrollbar-none bg-[#0B0C0E]/50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-electric-blue/15 text-electric-blue"
                  : "text-on-surface-variant hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
