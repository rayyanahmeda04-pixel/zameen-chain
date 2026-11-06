import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  LogOut,
  LogIn,
  Shield,
  Copy,
  Check,
  AlertOctagon
} from 'lucide-react';
import { shortenAddress } from '../utils/formatters';

export default function Navbar({
  currentUser,
  onOpenAuth,
  onLogout,
  account,
  isMetaMaskConnected,
  connectMetaMask,
  networkMode = 'CLOUD_LEDGER',
  blockNumber = 18420118,
  isEmergencyFrozen = false,
  onSelectHome
}) {
  const [copied, setCopied] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Chief Admin',
          shortLabel: 'Admin',
          dot: 'bg-amber-400',
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40'
        };
      case 'REGISTRAR':
        return {
          label: 'KDA Registrar',
          shortLabel: 'KDA',
          dot: 'bg-emerald-400',
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
        };
      case 'SELLER':
        return {
          label: 'Title Holder',
          shortLabel: 'Owner',
          dot: 'bg-teal-400',
          bg: 'bg-teal-500/15 text-teal-300 border-teal-500/40'
        };
      case 'BUYER':
        return {
          label: 'Verified Buyer',
          shortLabel: 'Buyer',
          dot: 'bg-cyan-400',
          bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
        };
      default:
        return {
          label: 'Public Citizen',
          shortLabel: 'Citizen',
          dot: 'bg-slate-400',
          bg: 'bg-slate-800/80 text-slate-300 border-slate-700'
        };
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const copyWallet = () => {
    if (!account || account.startsWith('0x000000')) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const badge = currentUser ? getRoleBadge(currentUser.role) : null;
  const firstName = currentUser?.name ? currentUser.name.trim().split(' ')[0] : '';

  return (
    <header className="sticky top-0 z-40 bg-[#050a12]/90 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl print:hidden">
      {/* Top sovereign accent bar */}
      <div
        className={`h-[2px] w-full transition-colors duration-500 ${
          isEmergencyFrozen
            ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600'
            : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 opacity-85'
        }`}
      />

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-3">
          {/* Logo & Sovereign Branding */}
          <div
            onClick={onSelectHome}
            className="flex items-center gap-2.5 sm:gap-3.5 group cursor-pointer select-none min-w-0"
          >
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-25 blur-md group-hover:opacity-60 transition duration-500" />
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-950 p-[1px] shadow-lg">
                <div className="w-full h-full bg-[#070f1b] rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 transition-transform group-hover:scale-110 duration-300" />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-white whitespace-nowrap">
                  Zameen
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    Chain
                  </span>
                </span>
                <span className="hidden md:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  Sovereign Cadastre
                </span>
              </div>

              {/* Compact single-line subtitle on mobile, full subtitle on sm+ */}
              <p className="text-[10px] sm:hidden font-medium text-slate-400 truncate">
                Govt. of Sindh • <span className="text-emerald-400/90 font-semibold">KDA Registry</span>
              </p>
              <p className="hidden sm:flex text-[11px] font-medium text-slate-400 items-center gap-1.5 mt-0.5 whitespace-nowrap">
                <span>Government of Sindh</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400/90 font-semibold">Board of Revenue & KDA</span>
              </p>
            </div>
          </div>

          {/* Right Telemetry & Account Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Blockchain Telemetry Pill */}
            <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/70 border border-white/[0.07] text-xs font-mono">
              {isEmergencyFrozen ? (
                <>
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span className="text-[11px] text-rose-300 font-bold">MARKET FROZEN</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        networkMode === 'LIVE_EVM' ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        networkMode === 'LIVE_EVM' ? 'bg-emerald-500' : 'bg-cyan-500'
                      }`}
                    />
                  </span>
                  <span className="text-[11px] text-slate-300 font-semibold">
                    {networkMode === 'LIVE_EVM' ? 'EVM RPC 31337' : 'Cloud EVM Synced'}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-[11px] text-emerald-400">#{blockNumber.toLocaleString()}</span>
                </>
              )}
            </div>

            {/* User Profile Card OR Sign In */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5 bg-slate-900/85 backdrop-blur-md border border-white/[0.08] p-1 sm:p-1.5 sm:pl-3 rounded-xl sm:rounded-2xl text-xs shadow-lg">
                {/* Mobile tappable profile + wallet copy */}
                <button
                  type="button"
                  onClick={copyWallet}
                  title="Tap to copy wallet address"
                  className="flex sm:hidden items-center gap-1.5 pl-1 pr-1.5 py-0.5 rounded-lg cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-[11px] shrink-0">
                    {getInitials(currentUser.name)}
                  </div>
                  <div className="text-left leading-tight">
                    <span className="font-bold text-slate-100 text-[11px] block max-w-[74px] truncate">
                      {copied ? 'Copied!' : firstName}
                    </span>
                    <span className="text-[9px] text-slate-400 flex items-center gap-1 font-semibold">
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.shortLabel}
                    </span>
                  </div>
                </button>

                {/* Desktop avatar + full details */}
                <div className="hidden sm:flex w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 items-center justify-center text-emerald-300 font-bold text-xs shrink-0">
                  {getInitials(currentUser.name)}
                </div>

                <div className="pr-1 hidden sm:block">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-xs max-w-[130px] truncate">
                      {currentUser.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={copyWallet}
                    title="Click to copy active wallet address"
                    className="text-[10px] text-slate-400 hover:text-emerald-300 font-mono flex items-center gap-1 mt-0.5 transition cursor-pointer"
                  >
                    <span>{shortenAddress(account, 6, 4)}</span>
                    {copied ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 opacity-70" />
                    )}
                  </button>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 hover:border-rose-800/50 transition cursor-pointer border border-white/[0.06] shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="relative group overflow-hidden rounded-xl p-[1px] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-xl opacity-90 group-hover:opacity-100" />
                <span className="relative flex items-center gap-1.5 sm:gap-2 bg-[#08101c] text-white font-bold text-xs px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition duration-300 group-hover:bg-[#08101c]/80 whitespace-nowrap">
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                  <span className="sm:hidden">Sign In</span>
                  <span className="hidden sm:inline">Portal Sign In</span>
                </span>
              </button>
            )}

            {/* MetaMask Wallet Connect */}
            {isMetaMaskConnected ? (
              <div className="hidden md:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/40 px-3 py-2 rounded-xl text-emerald-300 text-xs font-mono whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{shortenAddress(account, 5, 4)}</span>
              </div>
            ) : (
              <button
                onClick={connectMetaMask}
                title="Connect Browser Web3 Wallet"
                className="hidden md:flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs px-3 py-2.5 rounded-xl border border-white/[0.08] transition hover:border-white/20 cursor-pointer whitespace-nowrap"
              >
                <Wallet className="w-3.5 h-3.5 text-teal-400" />
                <span>Web3 Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
