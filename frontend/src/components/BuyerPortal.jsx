import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck, ArrowRight, CheckCircle2, Clock, FileText, Tag, MapPin } from 'lucide-react';
import { ethers } from 'ethers';

export default function BuyerPortal({
  plots,
  activeRole,
  onDepositEscrow,
  onSelectPlot
}) {
  const [filterScheme, setFilterScheme] = useState('ALL');

  // Plots currently listed for sale
  const availablePlots = plots.filter((p) => Number(p.status) === 1 && !p.isDisputed);

  // Plots where buyer has already deposited into escrow or purchased
  const myEscrows = plots.filter((p) => {
    // Escrow pending
    return Number(p.status) === 2;
  });

  const filteredPlots = availablePlots.filter((p) => {
    if (filterScheme !== 'ALL' && !p.schemeName.toLowerCase().includes(filterScheme.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Buyer Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 md:p-10 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="tracking-wide uppercase font-bold text-[10px]">Buyer Portal & Atomic Escrow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Karachi Verified Land Marketplace
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Browse clean, unencumbered plots certified by KDA Sub-Registrars. Your purchase payment is locked in the Smart Contract Escrow until the deed is legally stamped in your name.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] p-4 rounded-2xl shadow-lg shrink-0">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Available For Sale</span>
            <span className="text-2xl font-black text-white tracking-tight">{availablePlots.length} Plots</span>
          </div>
        </div>
      </div>

      {/* Escrow Guarantee Notice */}
      <div className="p-4 rounded-2xl bg-cyan-950/20 backdrop-blur-md border border-cyan-500/30 flex items-center gap-3 text-xs text-cyan-200 shadow-md">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
        <span className="leading-relaxed">
          <strong className="text-white font-bold">100% Anti-Fraud Escrow Guarantee:</strong> When you buy, your ETH is NOT sent directly to the seller. Funds are locked inside the immutable Ethereum Smart Contract. If paperwork or clearance fails, your payment is refunded immediately.
        </span>
      </div>

      {/* Available Plots for Sale */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            Verified Plots Ready for Purchase
          </h3>

          <div className="flex items-center gap-1.5 text-xs">
            {['ALL', 'Scheme 33', 'Gulshan', 'Clifton'].map((area) => (
              <button
                key={area}
                onClick={() => setFilterScheme(area)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  filterScheme === area
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {area === 'ALL' ? 'All Areas' : area}
              </button>
            ))}
          </div>
        </div>

        {filteredPlots.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            No properties currently listed for sale in this area. Sellers can list properties in the Seller Portal.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPlots.map((plot) => (
              <div
                key={plot.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 transition hover:border-cyan-500/50 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                        {plot.kdaPlotNumber}
                      </span>
                      <h4 className="text-lg font-bold text-slate-100 mt-2">{plot.schemeName}</h4>
                      <p className="text-xs text-slate-400">{plot.sector}, Plot #{plot.plotNumber}</p>
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {ethers.formatEther(plot.price)} ETH
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800 my-4 text-xs">
                    <div>
                      <span className="text-slate-500">Plot Size:</span>
                      <p className="font-semibold text-slate-200">{plot.squareYards} Sq. Yards</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Category:</span>
                      <p className="font-semibold text-slate-200 uppercase">{plot.plotCategory}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Current Owner:</span>
                      <p className="font-mono text-slate-300 text-[11px] truncate">{plot.currentOwner}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onDepositEscrow(plot)}
                    className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Deposit {ethers.formatEther(plot.price)} ETH into Escrow</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectPlot(plot)}
                    className="w-full bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-800 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>Inspect Clean Title Deed</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Escrow Tracking Section */}
      <div className="bg-slate-900/80 border border-cyan-500/30 p-6 md:p-8 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-slate-100">
              My Active Escrow Deals & Purchases
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
            {myEscrows.length} In Progress
          </span>
        </div>

        {myEscrows.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
            No active escrow deals. When you click "Deposit into Escrow" on a listed plot, your locked deal will appear here until KDA certifies the deed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEscrows.map((plot) => (
              <div
                key={plot.id}
                className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/40 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                      {plot.kdaPlotNumber}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                      Awaiting Registrar
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-100 mt-2">{plot.schemeName}</h4>
                  <p className="text-xs text-slate-400">{plot.sector}, Plot #{plot.plotNumber} • {plot.squareYards} Sq. Yds</p>

                  <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Locked Deposit:</span>
                      <span className="font-bold text-amber-400">{plot.price ? ethers.formatEther(plot.price) : '0'} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Seller:</span>
                      <span className="font-mono text-slate-300 text-[11px] truncate max-w-[150px]">{plot.currentOwner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Smart Contract Vault:</span>
                      <span className="text-emerald-400 font-medium">Guaranteed Escrow</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectPlot(plot)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2 rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>Inspect Title & Escrow Sanad</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
