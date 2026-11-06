import React, { useState } from 'react';
import {
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
        return 'bg-emerald-50 text-[#065F46] border-emerald-200';
      case 'PLOT_LISTED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ESCROW_LOCKED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'TITLE_TRANSFERRED':
        return 'bg-[#F4F4F1] text-[#111315] border-[#D4D4CE]';
      case 'STAY_ORDER':
      case 'EMERGENCY_FREEZE':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const filteredTx = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Telemetry Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#E4E4E0] shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#0B5D46] mb-1">
              Cryptographic Audit Log
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-[#111315] tracking-[-0.02em]">
              Immutable Sovereign Ledger & Smart Contract Telemetry
            </h2>
            <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed">
              Every plot allotment, marketplace listing, atomic escrow deposit, deed mutation, and High Court stay order is permanently hashed and auditable below.
            </p>
          </div>

          {/* Contract Address Card */}
          <div className="bg-[#FBFBFA] border border-[#E4E4E0] rounded-lg p-3.5 shrink-0 space-y-2 w-full lg:w-auto lg:min-w-[275px] tabular-nums">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-zinc-600 font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#0B5D46] shrink-0" />
                <span>ZameenChain Contract</span>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-[#E4E4E0] text-zinc-700 font-mono text-[10px] font-medium whitespace-nowrap">
                Solidity ^0.8.24
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-md border border-[#E4E4E0]">
              <span className="font-mono text-xs text-[#111315] truncate">
                {shortenAddress(CONTRACT_ADDRESS, 10, 8)}
              </span>
              <button
                onClick={() => copyText(CONTRACT_ADDRESS)}
                className="text-zinc-400 hover:text-[#111315] transition cursor-pointer shrink-0 p-0.5"
                title="Copy Contract Address"
              >
                {copiedHash === CONTRACT_ADDRESS ? (
                  <Check className="w-3.5 h-3.5 text-[#059669]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
              <span>Block <strong className="text-[#111315] font-mono">#{blockNumber.toLocaleString()}</strong></span>
              <span>State: <strong className="text-[#0B5D46]">{plotsCount} Parcels</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-[#E4E4E0] p-3 rounded-xl shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap text-xs">
          {[
            { key: 'ALL', label: 'All Events' },
            { key: 'PLOT_MINTED', label: 'Minted Deeds' },
            { key: 'PLOT_LISTED', label: 'Listings' },
            { key: 'ESCROW_LOCKED', label: 'Escrow Locks' },
            { key: 'TITLE_TRANSFERRED', label: 'Transfers' },
            { key: 'STAY_ORDER', label: 'Stay Orders' }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === f.key
                  ? 'bg-[#111315] text-white font-semibold'
                  : 'bg-[#F7F7F5] hover:bg-[#ECECE7] text-zinc-700 border border-[#E4E4E0]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-mono text-zinc-500 shrink-0">
          Node: <strong className="text-[#111315]">{networkMode === 'LIVE_EVM' ? 'Hardhat RPC (31337)' : 'Sindh Cloud Ledger'}</strong>
        </span>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-[#E4E4E0] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
        {filteredTx.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 text-xs">
            <Box className="w-7 h-7 text-zinc-300 mx-auto mb-2" />
            <p>No matching blockchain events recorded in this filter yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E4E0]">
            {filteredTx.map((tx, idx) => {
              const actorLabel = resolveWalletLabel(tx.actor);
              return (
                <div
                  key={`${tx.hash}-${idx}`}
                  className="p-4 sm:px-5 hover:bg-[#FBFBFA] transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${getBadgeStyle(tx.type)}`}>
                        {tx.type}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#111315] break-all">
                        {tx.plotCode}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 whitespace-nowrap tabular-nums">
                        <Box className="w-3 h-3 shrink-0" /> Block #{tx.blockNumber}
                      </span>
                    </div>

                    <p className="text-xs sm:text-[13px] font-medium text-[#111315] break-words">
                      {tx.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 font-mono">
                      <span>
                        Signer: <strong className="text-zinc-800">{shortenAddress(tx.actor, 8, 6)}</strong>
                        {actorLabel && <span className="text-zinc-500 font-sans"> ({actorLabel})</span>}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400 font-sans">
                        <Clock className="w-3 h-3 shrink-0" />
                        {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>

                  {/* Tx Hash Pill */}
                  <div className="flex items-center justify-between md:justify-start gap-2 bg-[#F7F7F5] border border-[#E4E4E0] px-2.5 py-1.5 rounded-lg w-full md:w-auto shrink-0">
                    <span className="text-[11px] font-mono text-zinc-700">
                      Tx: {shortenAddress(tx.hash, 10, 6)}
                    </span>
                    <button
                      onClick={() => copyText(tx.hash)}
                      className="text-zinc-400 hover:text-[#111315] transition cursor-pointer p-0.5"
                      title="Copy Transaction Hash"
                    >
                      {copiedHash === tx.hash ? (
                        <Check className="w-3.5 h-3.5 text-[#059669]" />
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
