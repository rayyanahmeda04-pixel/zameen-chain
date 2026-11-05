import React, { useState } from 'react';
import {
  Activity,
  Copy,
  Check,
  Box,
  Cpu,
  Clock
} from 'lucide-react';
import { CONTRACT_ADDRESS } from '../utils/web3Service';
import { shortenAddress, resolveWalletLabel } from '../utils/formatters';

export default function LedgerExplorer({
  transactions = [],
  networkMode,
  blockNumber,
  plotsCount
}) {
  const [filterType, setFilterType] = useState('ALL');
  const [copiedHash, setCopiedHash] = useState(null);

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'PLOT_MINTED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'PLOT_LISTED':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'ESCROW_LOCKED':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'TITLE_TRANSFERRED':
        return 'bg-teal-500/20 text-teal-200 border-teal-400/40';
      case 'STAY_ORDER':
      case 'EMERGENCY_FREEZE':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredTx = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Telemetry Header */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-3">
              <Activity className="w-3.5 h-3.5" />
              <span>Real-Time Cadastral Block Explorer</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Immutable Sovereign Audit Log & Smart Contract Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl">
              Every plot allotment, marketplace listing, atomic escrow deposit, deed transfer, and High Court restraining order is permanently hashed and verifiable below.
            </p>
          </div>

          {/* Contract Address Card */}
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-4 shrink-0 space-y-2 min-w-[270px]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                ZameenChain Contract
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono text-[10px] font-bold">
                Solidity ^0.8.24
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-white/[0.06]">
              <span className="font-mono text-xs text-slate-200">
                {shortenAddress(CONTRACT_ADDRESS, 10, 8)}
              </span>
              <button
                onClick={() => copyText(CONTRACT_ADDRESS)}
                className="text-slate-400 hover:text-emerald-400 transition cursor-pointer"
                title="Copy Contract Address"
              >
                {copiedHash === CONTRACT_ADDRESS ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Head Block: <strong className="text-white font-mono">#{blockNumber.toLocaleString()}</strong></span>
              <span>State: <strong className="text-emerald-400">{plotsCount} Parcels</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] p-3.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { key: 'ALL', label: 'All Events' },
            { key: 'PLOT_MINTED', label: 'Minted Deeds' },
            { key: 'PLOT_LISTED', label: 'Listings' },
            { key: 'ESCROW_LOCKED', label: 'Escrow Locks' },
            { key: 'TITLE_TRANSFERRED', label: 'Transfers' },
            { key: 'STAY_ORDER', label: 'Court Stay Orders' }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                filterType === f.key
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-white/[0.06]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Engine: <strong className="text-teal-300">{networkMode === 'LIVE_EVM' ? 'Live Hardhat RPC (31337)' : 'Sovereign Cloud EVM'}</strong>
        </span>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
        {filteredTx.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Box className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>No matching blockchain events recorded in this filter yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {filteredTx.map((tx, idx) => {
              const actorLabel = resolveWalletLabel(tx.actor);
              return (
                <div
                  key={`${tx.hash}-${idx}`}
                  className="p-4 sm:p-5 hover:bg-white/[0.02] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${getBadgeStyle(tx.type)}`}>
                        {tx.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-300">
                        {tx.plotCode}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Box className="w-3 h-3" /> Block #{tx.blockNumber}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-100">
                      {tx.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>
                        Signer: <strong className="text-slate-200">{shortenAddress(tx.actor, 8, 6)}</strong>
                        {actorLabel && <span className="text-slate-500 font-sans"> ({actorLabel})</span>}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 font-sans">
                        <Clock className="w-3 h-3" />
                        {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>

                  {/* Tx Hash Pill */}
                  <div className="flex items-center gap-2 bg-slate-950/80 border border-white/[0.08] px-3 py-2 rounded-xl self-start md:self-center shrink-0">
                    <span className="text-[11px] font-mono text-teal-300">
                      Tx: {shortenAddress(tx.hash, 10, 6)}
                    </span>
                    <button
                      onClick={() => copyText(tx.hash)}
                      className="text-slate-400 hover:text-white transition cursor-pointer"
                      title="Copy Transaction Hash"
                    >
                      {copiedHash === tx.hash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
