import React from 'react';
import { ShieldCheck, AlertOctagon, TrendingUp, Layers, Compass, Building, Award, CheckCircle2 } from 'lucide-react';

export default function StatsBanner({ plots }) {
  const totalPlots = plots.length;
  const totalArea = plots.reduce((acc, p) => acc + Number(p.squareYards || 0), 0);
  const disputedCount = plots.filter((p) => p.isDisputed).length;
  const listedCount = plots.filter((p) => Number(p.status) === 1).length;
  const escrowCount = plots.filter((p) => Number(p.status) === 2).length;

  return (
    <div className="mb-10 space-y-6">
      
      {/* Sovereign Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-10 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl">
        {/* Subtle decorative radial background glows */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Sovereign Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4 backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="tracking-wide uppercase font-bold text-[11px]">Government of Sindh • Karachi Land Authority (KDA)</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Decentralized Karachi Cadastre &{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Anti-Qabza Title Ledger
            </span>
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-2xl">
            Protecting Karachi property owners against illegal file tampering, duplicate allotments, and land grabbing. 
            Backed by immutable smart contract deeds, atomic escrow settlement, and Sindh High Court stay order integration.
          </p>
        </div>

        {/* Cadastral Security Guarantees */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/[0.08] flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic Title Deeds</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>Zero Advance Token Fraud</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Sindh High Court Stay Alerts</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Sub-Registrar Digital Stamping</span>
          </div>
        </div>
      </div>

      {/* Metric HUD Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Registered Plots */}
        <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/40 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors group-hover:bg-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              Live Cadastre
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Verified Plots</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">{totalPlots}</p>
            <p className="text-[11px] text-emerald-400/90 font-medium mt-1 flex items-center gap-1">
              <span>Karachi Urban Divisions</span>
            </p>
          </div>
        </div>

        {/* Card 2: Sovereign Surveyed Area */}
        <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] hover:border-teal-500/40 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center transition-colors group-hover:bg-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-950/60 text-teal-300 border border-teal-800/60">
              100% Guaranteed
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Cadastral Surveyed Area</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
              {totalArea.toLocaleString()} <span className="text-sm font-medium text-slate-400">Sq. Yds</span>
            </p>
            <p className="text-[11px] text-teal-400/90 font-medium mt-1">
              Tamper-Proof Sanads Issued
            </p>
          </div>
        </div>

        {/* Card 3: Active For Sale */}
        <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/40 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center transition-colors group-hover:bg-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/60">
              Escrow Shield
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Marketplace Listed</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">
              {listedCount} <span className="text-sm font-normal text-slate-400">Plots</span>
            </p>
            <p className="text-[11px] text-amber-400/90 font-medium mt-1">
              {escrowCount > 0 ? `${escrowCount} Locked in Escrow` : 'Protected by Smart Contract'}
            </p>
          </div>
        </div>

        {/* Card 4: Disputed Parcels Flagged */}
        <div className="group relative bg-slate-900/50 backdrop-blur-xl border border-white/[0.08] hover:border-rose-500/40 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center transition-colors group-hover:bg-rose-500/20">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800/60">
              Lis Pendens
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Court Stay Orders Flagged</p>
            <p className="text-2xl sm:text-3xl font-black text-white mt-0.5 tracking-tight">{disputedCount}</p>
            <p className="text-[11px] text-rose-400 font-medium mt-1">
              Fraudulent Transfer Blocked
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
