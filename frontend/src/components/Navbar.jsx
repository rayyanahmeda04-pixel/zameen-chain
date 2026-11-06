import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  LogOut,
  LogIn,
  Shield,
  Copy,
  Check,
  AlertOctagon,
  ChevronRight
} from 'lucide-react';
import { shortenAddress } from '../utils/formatters';

const TAB_TITLES = {
  verify: { group: 'Public Registry', title: 'Title Verification & Overview' },
  map: { group: 'Public Registry', title: 'Karachi Cadastral GIS Map' },
  directory: { group: 'Public Registry', title: 'Parcel Cadastre Directory' },
  explorer: { group: 'Public Registry', title: 'Immutable Audit Ledger' },
  buyer: { group: 'Citizen Workspace', title: 'Buyer Marketplace & Escrow' },
  seller: { group: 'Citizen Workspace', title: 'Owner Title Portfolio' },
  registrar: { group: 'Authority Desk', title: 'KDA Sub-Registrar Terminal' },
  admin: { group: 'Authority Desk', title: 'Ministry Executive Governance' }
};

export default function Navbar({
  activeTab = 'verify',
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
          dot: 'bg-amber-600',
          bg: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'REGISTRAR':
        return {
          label: 'KDA Registrar',
          shortLabel: 'KDA',
          dot: 'bg-[#0B5D46]',
          bg: 'bg-emerald-50 text-[#0B5D46] border-emerald-200'
        };
      case 'SELLER':
        return {
          label: 'Title Holder',
          shortLabel: 'Owner',
          dot: 'bg-emerald-600',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'BUYER':
        return {
          label: 'Verified Buyer',
          shortLabel: 'Buyer',
          dot: 'bg-blue-600',
          bg: 'bg-blue-50 text-blue-800 border-blue-200'
        };
      default:
        return {
          label: 'Public Citizen',
          shortLabel: 'Citizen',
          dot: 'bg-zinc-400',
          bg: 'bg-zinc-100 text-zinc-700 border-zinc-200'
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
  const activeMeta = TAB_TITLES[activeTab] || TAB_TITLES.verify;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E4E4E0] print:hidden">
      {isEmergencyFrozen && (
        <div className="h-[2px] w-full bg-red-600" />
      )}

      <div className="px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Brand OR Desktop Institutional Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile / Tablet Brand Mark (< lg) */}
          <div
            onClick={onSelectHome}
            className="flex lg:hidden items-center gap-2.5 cursor-pointer select-none min-w-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0B5D46] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-bold tracking-tight text-[#111315] block leading-none">
                ZameenChain
              </span>
              <span className="text-[10px] text-zinc-500 font-medium block mt-0.5 truncate">
                Sindh Land Registry
              </span>
            </div>
          </div>

          {/* Desktop Breadcrumb (lg+) */}
          <div className="hidden lg:flex items-center gap-2 text-xs min-w-0">
            <span
              onClick={onSelectHome}
              className="text-zinc-500 hover:text-[#111315] font-medium cursor-pointer transition"
            >
              {activeMeta.group}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-semibold text-[#111315] truncate">
              {activeMeta.title}
            </span>
          </div>
        </div>

        {/* Right: Telemetry, Wallet & Identity Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Chain Status Pill (xl+) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#E4E4E0] text-[11px] font-mono text-zinc-600 tabular-nums">
            {isEmergencyFrozen ? (
              <>
                <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                <span className="text-red-700 font-semibold font-sans">Market Frozen</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                <span className="font-sans font-medium text-zinc-700">
                  {networkMode === 'LIVE_EVM' ? 'Hardhat EVM' : 'Sindh Cloud Ledger'}
                </span>
                <span className="text-zinc-300">|</span>
                <span className="text-zinc-500">#{blockNumber.toLocaleString()}</span>
              </>
            )}
          </div>

          {/* Browser Web3 Wallet Connect (md+) */}
          {isMetaMaskConnected ? (
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[#0B5D46] text-xs font-mono whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>{shortenAddress(account, 5, 4)}</span>
            </div>
          ) : (
            <button
              onClick={connectMetaMask}
              title="Connect Browser Web3 Wallet"
              className="hidden md:flex items-center gap-1.5 bg-white hover:bg-[#F7F7F5] text-zinc-700 hover:text-[#111315] font-medium text-xs px-3 py-1.5 rounded-lg border border-[#D4D4CE] transition cursor-pointer whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            >
              <Wallet className="w-3.5 h-3.5 text-zinc-500" />
              <span>Connect Wallet</span>
            </button>
          )}

          {/* User Profile OR Sign In */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#FBFBFA] border border-[#E4E4E0] p-1 sm:pl-2.5 rounded-lg text-xs">
              {/* Mobile Profile Chip */}
              <button
                type="button"
                onClick={copyWallet}
                title="Tap to copy wallet address"
                className="flex sm:hidden items-center gap-1.5 pl-0.5 pr-1 py-0.5 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-[#0B5D46] flex items-center justify-center text-white font-semibold text-[10px] shrink-0">
                  {getInitials(currentUser.name)}
                </div>
                <div className="text-left leading-tight">
                  <span className="font-semibold text-[#111315] text-[11px] block max-w-[72px] truncate">
                    {copied ? 'Copied!' : firstName}
                  </span>
                  <span className="text-[9px] text-zinc-500 flex items-center gap-1 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.shortLabel}
                  </span>
                </div>
              </button>

              {/* Desktop Profile Details */}
              <div className="hidden sm:flex w-7 h-7 rounded-md bg-[#0B5D46] items-center justify-center text-white font-semibold text-[11px] shrink-0">
                {getInitials(currentUser.name)}
              </div>

              <div className="pr-1 hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[#111315] text-xs max-w-[130px] truncate">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyWallet}
                  title="Copy active wallet address"
                  className="text-[10px] text-zinc-500 hover:text-[#111315] font-mono flex items-center gap-1 transition cursor-pointer"
                >
                  <span>{shortenAddress(account, 6, 4)}</span>
                  {copied ? (
                    <Check className="w-2.5 h-2.5 text-[#059669]" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 opacity-70" />
                  )}
                </button>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-md bg-white hover:bg-red-50 text-zinc-500 hover:text-red-600 border border-[#E4E4E0] hover:border-red-200 transition cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 bg-[#111315] hover:bg-[#27272A] text-white font-medium text-xs px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg transition cursor-pointer whitespace-nowrap shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden">Sign In</span>
              <span className="hidden sm:inline">Portal Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
