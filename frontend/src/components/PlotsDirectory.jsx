import React, { useState } from 'react';
import { MapPin, ShieldCheck, AlertTriangle, Tag, ExternalLink, ArrowRight, User } from 'lucide-react';
import { ethers } from 'ethers';

export default function PlotsDirectory({
  plots,
  activeRole,
  onSelectPlot,
  onDepositEscrow,
  onListForSale,
  onDelist,
  onFlagDispute,
  onResolveDispute
}) {
  const [filterScheme, setFilterScheme] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredPlots = plots.filter((plot) => {
    if (filterScheme !== 'ALL' && !plot.schemeName.toLowerCase().includes(filterScheme.toLowerCase())) {
      return false;
    }
    if (filterStatus === 'FOR_SALE' && Number(plot.status) !== 1) return false;
    if (filterStatus === 'DISPUTED' && !plot.isDisputed) return false;
    if (filterStatus === 'ESCROW' && Number(plot.status) !== 2) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] p-3.5 rounded-2xl shadow-lg">
        
        {/* Karachi Area Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold mr-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Karachi Region:</span>
          </span>
          {['ALL', 'Scheme 33', 'Gulshan', 'Clifton', 'Surjani'].map((area) => (
            <button
              key={area}
              onClick={() => setFilterScheme(area)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer text-xs ${
                filterScheme === area
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.06]'
              }`}
            >
              {area === 'ALL' ? 'All Divisions' : area}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['ALL', 'FOR_SALE', 'DISPUTED', 'ESCROW'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer text-xs ${
                filterStatus === st
                  ? 'bg-white text-slate-950 font-bold shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.06]'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st === 'FOR_SALE' ? '🏷️ For Sale' : st === 'DISPUTED' ? '🚨 Disputed' : '⏳ In Escrow'}
            </button>
          ))}
        </div>

      </div>

      {/* Plots Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredPlots.map((plot) => {
          const isOwner = activeRole?.address && activeRole.address.toLowerCase() === plot.currentOwner.toLowerCase();
          const isRegistrar = activeRole?.role === 'REGISTRAR';
          const isBuyer = activeRole?.role === 'BUYER';
          const isListed = Number(plot.status) === 1;
          const isEscrow = Number(plot.status) === 2;

          return (
            <div
              key={plot.id}
              className={`group bg-slate-900/50 backdrop-blur-2xl border rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between ${
                plot.isDisputed
                  ? 'border-rose-500/30 hover:border-rose-500/60 shadow-rose-950/20'
                  : isListed
                  ? 'border-amber-500/30 hover:border-amber-500/60 shadow-amber-950/20'
                  : 'border-white/[0.08] hover:border-emerald-500/40 shadow-emerald-950/10'
              }`}
            >
              <div>
                
                {/* Card Top: Badges & Plot ID */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                      {plot.kdaPlotNumber}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-2 group-hover:text-emerald-300 transition-colors">
                      {plot.schemeName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {plot.sector}, Plot No. {plot.plotNumber}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  {plot.isDisputed ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Stay Order
                    </span>
                  ) : isListed ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                      <Tag className="w-3.5 h-3.5" />
                      For Sale
                    </span>
                  ) : isEscrow ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
                      Escrow Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Registered
                    </span>
                  )}
                </div>

                {/* Dispute Reason if active */}
                {plot.isDisputed && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300">
                    <span className="font-bold block mb-0.5 text-rose-200">Court Litigation Notice:</span>
                    {plot.disputeReason}
                  </div>
                )}

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/[0.08] my-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Cadastral Area:</span>
                    <p className="font-bold text-white text-sm">{plot.squareYards} Sq. Yards</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Land Category:</span>
                    <p className="font-bold text-emerald-400 uppercase text-sm">{plot.plotCategory}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Market Price:</span>
                    <p className="font-extrabold text-amber-400 text-sm">
                      {isListed ? `${ethers.formatEther(plot.price)} ETH` : 'Not Listed'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Karachi GPS Grid:</span>
                    <p className="font-mono text-slate-300 text-[11px]">{plot.latitude}, {plot.longitude}</p>
                  </div>
                </div>

                {/* Current Owner Info */}
                <div className="flex items-center gap-2.5 text-xs text-slate-300 mb-6 bg-slate-950/50 p-3 rounded-2xl border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registered Title Holder:</span>
                    <span className="font-mono text-slate-200 text-xs truncate block">{plot.currentOwner}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons based on User Role */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                
                {/* 1. Buyer action: Deposit Escrow */}
                {isListed && !plot.isDisputed && (
                  <button
                    onClick={() => onDepositEscrow(plot)}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Deposit {ethers.formatEther(plot.price)} ETH into Escrow</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* 2. Owner action: List or Delist */}
                {isOwner && !plot.isDisputed && (
                  <div className="flex gap-2">
                    {isListed ? (
                      <button
                        onClick={() => onDelist(plot.id)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2 rounded-xl border border-slate-700 cursor-pointer"
                      >
                        Delist Plot
                      </button>
                    ) : (
                      <button
                        onClick={() => onListForSale(plot)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 rounded-xl cursor-pointer"
                      >
                        List For Sale
                      </button>
                    )}
                  </div>
                )}

                {/* 3. Registrar actions: Flag/Resolve Dispute */}
                {isRegistrar && (
                  <div className="flex gap-2">
                    {plot.isDisputed ? (
                      <button
                        onClick={() => onResolveDispute(plot.id)}
                        className="flex-1 bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-200 text-xs font-semibold py-2 rounded-xl cursor-pointer"
                      >
                        Resolve Court Stay Order
                      </button>
                    ) : (
                      <button
                        onClick={() => onFlagDispute(plot.id)}
                        className="flex-1 bg-rose-950/50 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-semibold py-2 rounded-xl cursor-pointer"
                      >
                        Flag Court Stay Order
                      </button>
                    )}
                  </div>
                )}

                {/* Universal: View Audit Trail */}
                <button
                  onClick={() => onSelectPlot(plot)}
                  className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold py-2 rounded-xl border border-slate-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Inspect Deed & Blockchain History</span>
                </button>

              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
