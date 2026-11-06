import React from 'react';
import {
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  Layers,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { toEthNumber, formatPkrFromEth } from '../utils/formatters';

export default function StatsBanner({ plots, compactMobile = false }) {
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
    <div className={`mb-5 sm:mb-8 space-y-4 sm:space-y-5 print:hidden ${compactMobile ? 'hidden md:block' : ''}`}>
      {/* Sovereign Hero Header */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden p-5 sm:p-9 border border-white/[0.08] bg-gradient-to-br from-[#0c1829]/95 via-[#070d17]/95 to-[#050911] shadow-2xl backdrop-blur-2xl">
        {/* Ambient high-tech grid & glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3 sm:mb-4 backdrop-blur-md">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="tracking-wider uppercase font-bold text-[9px] sm:text-[10px] leading-tight">
                Govt. of Sindh • Karachi Development Authority (KDA)
              </span>
            </div>

            <h1 className="text-xl sm:text-4xl font-black text-white tracking-tight leading-[1.2] sm:leading-[1.15]">
              Sovereign Karachi Land Cadastre &{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Anti-Fraud Atomic Escrow
              </span>
            </h1>

            <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Eliminating forged allotment files, double-file fraud, and illegal land encroachment across Karachi. Every land parcel is anchored by an immutable cryptographic Sanad, smart-contract escrow vault, and live Sindh High Court injunction enforcement.
            </p>
          </div>

          {/* Active Market Liquidity Widget */}
          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 sm:p-4 shrink-0 sm:min-w-[230px] flex sm:block items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-0.5 sm:mb-1">
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Active Market Volume</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white font-mono">
                {activeMarketEth.toFixed(1)} ETH
              </p>
            </div>
            <p className="text-xs text-emerald-400 font-semibold sm:mt-0.5 text-right sm:text-left">
              ≈ {formatPkrFromEth(activeMarketEth)}
            </p>
          </div>
        </div>

        {/* Security Guarantees Strip */}
        <div className="relative z-10 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/[0.08] grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-y-2 gap-x-6 text-[11px] sm:text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span>Zero Duplicate Allotments</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
            <span>100% Refundable Smart Escrow</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            <span>Sindh High Court Lis Pendens Lock</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
            <span>KDA Sub-Registrar Key Sign</span>
          </div>
        </div>
      </div>

      {/* Telemetry Metric HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/55 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/40 p-3.5 sm:p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-2.5 sm:mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 whitespace-nowrap">
              On-Chain
            </span>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Titled Parcels</p>
            <p className="text-xl sm:text-3xl font-black text-white mt-0.5">{totalPlots}</p>
            <p className="text-[10px] sm:text-[11px] text-emerald-400/90 font-medium mt-0.5 truncate">
              Karachi Metro Grid
            </p>
          </div>
        </div>

        <div className="bg-slate-900/55 backdrop-blur-xl border border-white/[0.08] hover:border-teal-500/40 p-3.5 sm:p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-2.5 sm:mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-950/60 text-teal-300 border border-teal-800/60 whitespace-nowrap">
              Surveyed
            </span>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Cadastral Area</p>
            <p className="text-xl sm:text-3xl font-black text-white mt-0.5">
              {totalArea.toLocaleString()}{' '}
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Sq.Yd</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-teal-400/90 font-medium mt-0.5 truncate">
              Geo-Referenced Sanads
            </p>
          </div>
        </div>

        <div className="bg-slate-900/55 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 p-3.5 sm:p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-2.5 sm:mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 whitespace-nowrap">
              Vault
            </span>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Listed & Escrow</p>
            <p className="text-xl sm:text-3xl font-black text-white mt-0.5">
              {listedPlots.length}{' '}
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400">Listed</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-cyan-400 font-medium mt-0.5 truncate">
              {escrowPlots.length > 0
                ? `${escrowPlots.length} Locked in Vault`
                : 'Escrow Ready'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/55 backdrop-blur-xl border border-white/[0.08] hover:border-rose-500/40 p-3.5 sm:p-5 rounded-2xl transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5 mb-2.5 sm:mb-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800/60 whitespace-nowrap">
              Court Lock
            </span>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Stay Orders</p>
            <p className="text-xl sm:text-3xl font-black text-white mt-0.5">{disputedCount}</p>
            <p className="text-[10px] sm:text-[11px] text-rose-400 font-medium mt-0.5 truncate">
              Transfers Blocked
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
