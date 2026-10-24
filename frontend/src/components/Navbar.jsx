import React from 'react';
import { Building2, User, Wallet, CheckCircle2, LogOut, KeyRound, LogIn, Shield, Activity } from 'lucide-react';

export default function Navbar({
  currentUser,
  onOpenAuth,
  onLogout,
  account,
  isMetaMaskConnected,
  connectMetaMask
}) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return { label: '👑 Chief Admin', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20' };
      case 'REGISTRAR':
        return { label: '🏛️ KDA Registrar', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/20' };
      case 'SELLER':
        return { label: '👤 Property Owner', bg: 'bg-teal-500/15 text-teal-300 border-teal-500/40 ring-1 ring-teal-500/20' };
      case 'BUYER':
        return { label: '🤝 Verified Buyer', bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 ring-1 ring-cyan-500/20' };
      default:
        return { label: '🔍 Public Citizen', bg: 'bg-slate-800/80 text-slate-300 border-slate-700' };
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const badge = currentUser ? getRoleBadge(currentUser.role) : null;

  return (
    <header className="sticky top-0 z-40 bg-[#070c14]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl transition-all">
      {/* Top subtle sovereign accent gradient stripe */}
      <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Government Authority Branding */}
          <div className="flex items-center gap-3.5 group cursor-default">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-30 blur-md group-hover:opacity-60 transition duration-500" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-950 p-[1px] shadow-lg">
                <div className="w-full h-full bg-[#08101a] rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-400 transition-transform group-hover:scale-110 duration-300" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">
                  Zameen<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Chain</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Karachi Cadastre
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Government of Sindh</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400/90 font-semibold">Anti-Qabza Title Ledger</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Network Beacon + User Status / Login */}
          <div className="flex items-center gap-3">
            
            {/* Live Blockchain Network Beacon */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs font-mono text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] text-slate-400">Node:</span>
              <span className="text-[11px] text-emerald-300 font-semibold">Hardhat 31337</span>
            </div>

            {/* User Profile Card OR Sign In */}
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-white/[0.08] p-1.5 pl-3 rounded-2xl text-xs shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xs">
                  {getInitials(currentUser.name)}
                </div>

                <div className="pr-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-xs">{currentUser.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {currentUser.email}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 hover:border-rose-800/50 transition cursor-pointer border border-white/[0.06]"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="relative group overflow-hidden rounded-xl p-[1px] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-xl transition-all duration-300 group-hover:opacity-100 opacity-80" />
                <span className="relative flex items-center gap-2 bg-[#08101a] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-300 group-hover:bg-opacity-80">
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Sign In / Register</span>
                </span>
              </button>
            )}

            {/* MetaMask Status Indicator */}
            {isMetaMaskConnected ? (
              <div className="hidden sm:flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-3 py-2 rounded-xl text-emerald-300 text-xs font-mono shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            ) : (
              <button
                onClick={connectMetaMask}
                className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs px-3.5 py-2.5 rounded-xl border border-white/[0.08] transition hover:border-white/20 cursor-pointer shadow-sm"
              >
                <Wallet className="w-3.5 h-3.5 text-teal-400" />
                <span>MetaMask</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}
