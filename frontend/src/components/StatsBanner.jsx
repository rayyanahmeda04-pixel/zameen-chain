import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { toEthNumber, formatPkrFromEth } from '../utils/formatters';

export default function StatsBanner({ plots }) {
  const totalPlots = plots.length;
  const totalArea = plots.reduce((acc, p) => acc + Number(p.squareYards || 0), 0);
  const disputedCount = plots.filter((p) => p.isDisputed).length;
  const listedPlots = plots.filter((p) => Number(p.status) === 1 && !p.isDisputed);
  const escrowPlots = plots.filter((p) => Number(p.status) === 2);

  const activeMarketEth = [...listedPlots, ...escrowPlots].reduce(
    (sum, p) => sum + toEthNumber(p.price),
    0
  );

  return (
    <section className="mb-6 bg-white border border-[#E4E4E0] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(16,24,40,0.04)] print:hidden">
      {/* Top Sovereign Accent Hairline */}
      <div className="h-[3px] w-full bg-[#0B5D46]" />

      {/* Upper Institutional Brief */}
      <div className="p-5 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F4F4F1] border border-[#E4E4E0] text-[11px] font-medium text-zinc-700 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B5D46] shrink-0" />
            <span>Government of Sindh • Board of Revenue & KDA</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-[28px] font-bold text-[#111315] tracking-[-0.025em] leading-[1.2]">
            Karachi Sovereign Land Cadastre & Atomic Escrow
          </h1>

          <p className="mt-2 text-xs sm:text-[13px] text-zinc-600 leading-relaxed">
            Official cryptographic registry preventing duplicate allotment files, unauthorized mutations, and token-money fraud. Every parcel carries an immutable Form-VII Digital Sanad and live Sindh High Court stay-order screening.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-zinc-600 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0B5D46] shrink-0" />
              Anti-Duplicate File Guard
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0B5D46] shrink-0" />
              100% Refundable Smart Escrow
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0B5D46] shrink-0" />
              SHC Lis Pendens Lock
            </span>
          </div>
        </div>

        {/* Active Market Volume Callout */}
        <div className="bg-[#FBFBFA] border border-[#E4E4E0] rounded-lg p-3.5 sm:p-4 shrink-0 sm:min-w-[220px] flex sm:block items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-500 block">
              Active Market Volume
            </span>
            <p className="text-lg sm:text-2xl font-bold text-[#111315] font-mono tabular-nums mt-0.5">
              {activeMarketEth.toFixed(1)} ETH
            </p>
          </div>
          <p className="text-xs font-medium text-[#0B5D46] sm:mt-0.5 text-right sm:text-left tabular-nums">
            ≈ {formatPkrFromEth(activeMarketEth)}
          </p>
        </div>
      </div>

      {/* 4-Column Hairline Divided Telemetry Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[#E4E4E0] bg-[#FBFBFA] divide-y sm:divide-y-0 divide-x divide-[#E4E4E0] tabular-nums">
        <div className="p-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-medium">Titled Parcels</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-[#065F46] border border-emerald-200">
              On-Chain
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#111315] mt-1">{totalPlots}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">Karachi Metro Grid</p>
        </div>

        <div className="p-3.5 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-medium">Surveyed Area</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
              Form-VII
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#111315] mt-1">
            {totalArea.toLocaleString()}{' '}
            <span className="text-xs font-medium text-zinc-500">Sq.Yd</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">Geo-Referenced Sanads</p>
        </div>

        <div className="p-3.5 sm:px-6 sm:py-4 border-t lg:border-t-0 border-[#E4E4E0]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-medium">Marketplace</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              Escrow
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#111315] mt-1">
            {listedPlots.length}{' '}
            <span className="text-xs font-medium text-zinc-500">Listed</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
            {escrowPlots.length} Locked in Vault
          </p>
        </div>

        <div className="p-3.5 sm:px-6 sm:py-4 border-t lg:border-t-0 border-[#E4E4E0]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-zinc-500 font-medium">Stay Orders</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
              SHC Lock
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[#111315] mt-1">{disputedCount}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5 truncate">Court Frozen Parcels</p>
        </div>
      </div>
    </section>
  );
}
