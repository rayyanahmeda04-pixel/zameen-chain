import React from 'react';
import {
  Home,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Coins,
  Clock
} from 'lucide-react';
import {
  formatEth,
  formatPkrFromWei,
  formatPkrFromEth,
  toEthNumber,
  shortenAddress
} from '../utils/formatters';

export default function SellerPortal({
  plots,
  activeRole,
  isEmergencyFrozen,
  onListForSale,
  onDelist,
  onSelectPlot
}) {
  const myPlots = plots.filter(
    (p) =>
      activeRole?.address &&
      p.currentOwner.toLowerCase() === activeRole.address.toLowerCase()
  );

  const totalListedEth = myPlots.reduce((acc, p) => acc + toEthNumber(p.price), 0);
  const incomingEscrows = myPlots.filter((p) => Number(p.status) === 2).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Portfolio Header */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 md:p-10 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide uppercase font-bold text-[10px]">
              Title Holder Portfolio & Marketplace Console
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Registered Karachi Landholdings
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Manage your sovereign digital titles, publish properties for sale with atomic escrow settlement, monitor incoming buyer deposits, and export official KDA Sanads.
          </p>
        </div>

        {/* Portfolio Summary Metrics */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-3.5 bg-slate-900/85 border border-white/[0.08] p-4 rounded-2xl">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">Titled Holdings</span>
              <span className="text-xl font-black text-white">{myPlots.length} Parcels</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-slate-900/85 border border-white/[0.08] p-4 rounded-2xl">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">Listed Valuation</span>
              <span className="text-xl font-black text-white font-mono">
                {totalListedEth.toFixed(1)} ETH
              </span>
              <span className="text-[10px] text-emerald-400 block font-semibold">
                ≈ {formatPkrFromEth(totalListedEth)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Escrow Alert if any */}
      {incomingEscrows > 0 && (
        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 flex items-center gap-3 text-xs text-cyan-200">
          <Clock className="w-5 h-5 text-cyan-400 shrink-0 animate-spin" style={{ animationDuration: '5s' }} />
          <span>
            <strong className="text-white">Escrow Settlement Pending:</strong> You have{' '}
            <strong>{incomingEscrows}</strong> property deal(s) with buyer funds locked in the smart contract vault. Once the KDA Sub-Registrar stamps the transfer, ETH will be released directly to your wallet.
          </span>
        </div>
      )}

      {/* Holdings Grid */}
      {myPlots.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Titled Parcels Found</h3>
          <p className="text-xs text-slate-400 mb-5 max-w-md mx-auto">
            Active wallet <span className="font-mono text-slate-200">{shortenAddress(activeRole?.address, 8, 6)}</span> ({activeRole?.name}) does not currently hold any registered parcels.
          </p>
          <div className="text-xs text-teal-200 bg-teal-950/35 border border-teal-500/30 p-4 rounded-2xl max-w-md mx-auto text-left space-y-1.5">
            <p className="font-bold text-teal-400">Verified Title Holder Demo Accounts:</p>
            <p>• <strong>Aamir Khan</strong> (<code className="text-amber-300">aamir.khan@gmail.com</code>) — Scheme 33, Clifton & DHA Phase 8</p>
            <p>• <strong>Bilal Siddiqui</strong> (<code className="text-amber-300">bilal.siddiqui@gmail.com</code>) — Gulshan-e-Iqbal, Bahria Town & Surjani</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myPlots.map((plot) => {
            const isListed = Number(plot.status) === 1 && !plot.isDisputed;
            const isEscrow = Number(plot.status) === 2;

            return (
              <div
                key={plot.id}
                className="bg-slate-900/85 border border-white/[0.08] rounded-3xl p-6 transition hover:border-emerald-500/45 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                        {plot.kdaPlotNumber}
                      </span>
                      <h3 className="text-lg font-bold text-slate-100 mt-2">{plot.schemeName}</h3>
                      <p className="text-xs text-slate-400">
                        {plot.sector}, Plot #{plot.plotNumber}
                      </p>
                    </div>

                    {plot.isDisputed ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Stay Order
                      </span>
                    ) : isListed ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Listed For Sale
                      </span>
                    ) : isEscrow ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Escrow Locked
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Clean Title
                      </span>
                    )}
                  </div>

                  {plot.isDisputed && (
                    <div className="p-3 rounded-xl bg-rose-950/35 border border-rose-800/60 text-xs text-rose-300 mb-3">
                      <strong>Court Injunction:</strong> {plot.disputeReason}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800 my-4 text-xs">
                    <div>
                      <span className="text-slate-500">Surveyed Area:</span>
                      <p className="font-semibold text-slate-200">{plot.squareYards} Sq. Yards</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Zoning:</span>
                      <p className="font-semibold text-emerald-400 uppercase">{plot.plotCategory}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Asking Price:</span>
                      {isListed || isEscrow ? (
                        <div>
                          <p className="font-bold text-amber-400">{formatEth(plot.price)}</p>
                          <p className="text-[11px] text-slate-400">≈ {formatPkrFromWei(plot.price)}</p>
                        </div>
                      ) : (
                        <p className="font-semibold text-slate-500">Not Listed</p>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Encumbrance Status:</span>
                      <p className={plot.isDisputed ? 'font-bold text-rose-400' : 'font-semibold text-emerald-400'}>
                        {plot.isDisputed ? 'Restrained by Court' : 'Clear & Marketable'}
                      </p>
                    </div>
                  </div>

                  {isEscrow && (
                    <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 mb-4 space-y-1">
                      <p className="font-bold text-cyan-300">
                        Buyer Funds Locked in Smart Contract Vault
                      </p>
                      {plot.escrowBuyer && (
                        <p className="font-mono text-[11px] text-slate-300">
                          Buyer: {shortenAddress(plot.escrowBuyer, 10, 6)}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-300">
                        Awaiting KDA Sub-Registrar certification to release {formatEth(plot.escrowAmount || plot.price)} to your wallet.
                      </p>
                    </div>
                  )}
                </div>

                {/* Owner Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  {!plot.isDisputed && !isEscrow && (
                    <>
                      {isListed ? (
                        <button
                          onClick={() => onDelist(plot.id)}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-700 cursor-pointer"
                        >
                          Cancel Marketplace Listing (Delist)
                        </button>
                      ) : (
                        <button
                          disabled={isEmergencyFrozen}
                          onClick={() => onListForSale(plot)}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
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
                    <span>Open Official Digital Sanad & History</span>
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
