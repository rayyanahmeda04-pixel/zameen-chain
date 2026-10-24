import React, { useState } from 'react';
import { Home, Tag, ShieldCheck, AlertTriangle, Layers, DollarSign, ArrowUpRight, FileText, CheckCircle2 } from 'lucide-react';
import { ethers } from 'ethers';

export default function SellerPortal({
  plots,
  activeRole,
  onListForSale,
  onDelist,
  onSelectPlot
}) {
  // Filter plots owned by current active role
  const myPlots = plots.filter(
    (p) => activeRole?.address && p.currentOwner.toLowerCase() === activeRole.address.toLowerCase()
  );

  const totalValue = myPlots.reduce((acc, p) => {
    return acc + (p.price ? Number(ethers.formatEther(p.price)) : 0);
  }, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Seller Portal Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 md:p-10 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide uppercase font-bold text-[10px]">Property Owner Console & Portfolio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Registered Karachi Landholdings
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Manage your verified plots, list for public sale with atomic smart contract escrow, track buyer offers, and inspect digital ownership sanads.
          </p>
        </div>

        {/* Portfolio Stats Card */}
        <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] p-4 rounded-2xl shadow-lg shrink-0">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Properties Owned</span>
            <span className="text-2xl font-black text-white tracking-tight">{myPlots.length} Plots</span>
          </div>
        </div>
      </div>

      {/* Seller Landholdings Grid */}
      {myPlots.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8" />
          </div>
          <p className="text-xs text-slate-400 mb-4 max-w-md mx-auto">
            Your current account ({activeRole?.name || activeRole?.address?.slice(0, 8)}) does not hold any titled plots in the KDA registry.
          </p>
          <div className="text-xs text-teal-300 bg-teal-950/40 border border-teal-500/30 p-3.5 rounded-2xl max-w-md mx-auto text-left space-y-1.5 font-sans">
            <p className="font-bold text-teal-400">💡 How to manage or list property:</p>
            <p>• Log in as verified seller <strong>aamir.khan@gmail.com</strong> (Password: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">password123</code>) to manage Scheme 33 & Clifton holdings.</p>
            <p>• Or acquire a plot from the <strong>Buyer Portal</strong>, which automatically transfers title to your wallet upon clearance.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myPlots.map((plot) => {
            const isListed = Number(plot.status) === 1;
            const isEscrow = Number(plot.status) === 2;

            return (
              <div
                key={plot.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 transition hover:border-emerald-500/50 flex flex-col justify-between shadow-xl"
              >
                <div>
                  
                  {/* Plot Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                        {plot.kdaPlotNumber}
                      </span>
                      <h3 className="text-lg font-bold text-slate-100 mt-2">{plot.schemeName}</h3>
                      <p className="text-xs text-slate-400">{plot.sector}, Plot #{plot.plotNumber}</p>
                    </div>

                    {plot.isDisputed ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Stay Order
                      </span>
                    ) : isListed ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        🏷️ Listed for Sale
                      </span>
                    ) : isEscrow ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        ⏳ Escrow Locked
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Private Holding
                      </span>
                    )}
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800 my-4 text-xs">
                    <div>
                      <span className="text-slate-500">Size:</span>
                      <p className="font-semibold text-slate-200">{plot.squareYards} Sq. Yards</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Category:</span>
                      <p className="font-semibold text-slate-200 uppercase">{plot.plotCategory}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Listed Price:</span>
                      <p className="font-bold text-amber-400">
                        {isListed ? `${ethers.formatEther(plot.price)} ETH` : 'Not Listed'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Legal Status:</span>
                      <p className="font-medium text-emerald-400">
                        {plot.isDisputed ? 'Frozen by Court' : 'Unencumbered'}
                      </p>
                    </div>
                  </div>

                  {/* Escrow Notification if buyer deposited funds */}
                  {isEscrow && (
                    <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 mb-4">
                      <strong>🤝 Escrow Active:</strong> A verified buyer has locked payment in the smart contract. Awaiting KDA Sub-Registrar to certify title deed.
                    </div>
                  )}

                </div>

                {/* Seller Controls */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {!plot.isDisputed && !isEscrow && (
                    <>
                      {isListed ? (
                        <button
                          onClick={() => onDelist(plot.id)}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-700 cursor-pointer"
                        >
                          Cancel Listing (Delist)
                        </button>
                      ) : (
                        <button
                          onClick={() => onListForSale(plot)}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer"
                        >
                          List Property for Sale
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => onSelectPlot(plot)}
                    className="w-full bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-800 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>View Official Title Sanad & History</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
