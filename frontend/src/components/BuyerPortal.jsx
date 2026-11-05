import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  Clock,
  FileText,
  Tag,
  RotateCcw,
  Award
} from 'lucide-react';
import {
  formatEth,
  formatPkrFromWei,
  shortenAddress,
  resolveWalletLabel
} from '../utils/formatters';

export default function BuyerPortal({
  plots,
  activeRole,
  isEmergencyFrozen,
  onDepositEscrow,
  onCancelEscrow,
  onSelectPlot
}) {
  const [filterScheme, setFilterScheme] = useState('ALL');
  const myAddr = (activeRole?.address || '').toLowerCase();

  // Plots listed for sale (excluding buyer's own plots)
  const availablePlots = plots.filter(
    (p) =>
      Number(p.status) === 1 &&
      !p.isDisputed &&
      p.currentOwner.toLowerCase() !== myAddr
  );

  // Escrows specifically initiated by THIS buyer (or if escrowBuyer wasn't recorded on legacy contract, show with indicator)
  const myEscrows = plots.filter((p) => {
    if (Number(p.status) !== 2) return false;
    if (p.escrowBuyer) {
      return p.escrowBuyer.toLowerCase() === myAddr;
    }
    return true;
  });

  // Plots already owned / acquired by this buyer
  const myAcquiredPlots = plots.filter(
    (p) => myAddr && p.currentOwner.toLowerCase() === myAddr
  );

  const areaOptions = useMemo(() => {
    const base = ['ALL', 'Scheme 33', 'Gulshan', 'DHA', 'Clifton', 'Bahria', 'Surjani'];
    return base;
  }, []);

  const filteredPlots = availablePlots.filter((p) => {
    if (
      filterScheme !== 'ALL' &&
      !p.schemeName.toLowerCase().includes(filterScheme.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 md:p-10 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="tracking-wide uppercase font-bold text-[10px]">
              Verified Buyer Marketplace & Atomic Escrow
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Acquire Verified Karachi Land Without Token Fraud
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Every property below has passed cryptographic duplicate-file checks and court stay-order screening. Your purchase funds remain locked in the ZameenChain Escrow Vault until the KDA Sub-Registrar transfers legal title to your wallet.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] p-4 rounded-2xl shadow-lg shrink-0">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Verified Listings</span>
            <span className="text-2xl font-black text-white tracking-tight">
              {availablePlots.length} Parcels
            </span>
          </div>
        </div>
      </div>

      {/* Escrow Protection Banner */}
      <div className="p-4 rounded-2xl bg-cyan-950/20 backdrop-blur-md border border-cyan-500/30 flex items-center gap-3 text-xs text-cyan-200">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
        <span className="leading-relaxed">
          <strong className="text-white font-bold">100% Atomic Settlement Guarantee:</strong> Sellers receive 0 ETH until KDA officially certifies the deed mutation. You retain unilateral authority to cancel any pending escrow for an immediate 100% refund prior to registrar stamping.
        </span>
      </div>

      {/* Active Escrows Section */}
      <div className="bg-slate-900/75 border border-cyan-500/30 p-6 md:p-8 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-slate-100">
              My Locked Escrow Vault Deals
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
            {myEscrows.length} Active
          </span>
        </div>

        {myEscrows.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
            You have no pending escrow deposits. Select any listed parcel below to lock an atomic purchase deal.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEscrows.map((plot) => (
              <div
                key={plot.id}
                className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/40 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded border border-teal-800">
                      {plot.kdaPlotNumber}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                      Awaiting KDA Stamping
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-100 mt-2">{plot.schemeName}</h4>
                  <p className="text-xs text-slate-400">
                    {plot.sector}, Plot #{plot.plotNumber} • {plot.squareYards} Sq. Yds
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vault Locked Deposit:</span>
                      <span className="font-bold text-amber-400">
                        {formatEth(plot.escrowAmount || plot.price)} ({formatPkrFromWei(plot.escrowAmount || plot.price)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Seller Wallet:</span>
                      <span className="font-mono text-slate-300">
                        {shortenAddress(plot.currentOwner, 8, 6)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCancelEscrow(plot)}
                    className="flex-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancel & Refund ETH</span>
                  </button>

                  <button
                    onClick={() => onSelectPlot(plot)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>View Sanad</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Marketplace Listings */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            Verified Parcels Available for Immediate Purchase
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {areaOptions.map((area) => (
              <button
                key={area}
                onClick={() => setFilterScheme(area)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  filterScheme === area
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {area === 'ALL' ? 'All Karachi' : area}
              </button>
            ))}
          </div>
        </div>

        {filteredPlots.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
            No third-party properties currently listed in this zone.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPlots.map((plot) => {
              const sellerName = resolveWalletLabel(plot.currentOwner);
              return (
                <div
                  key={plot.id}
                  className="bg-slate-900/85 border border-white/[0.08] rounded-3xl p-6 transition hover:border-cyan-500/50 flex flex-col justify-between shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                          {plot.kdaPlotNumber}
                        </span>
                        <h4 className="text-lg font-bold text-slate-100 mt-2">{plot.schemeName}</h4>
                        <p className="text-xs text-slate-400">
                          {plot.sector}, Plot #{plot.plotNumber}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 block">
                          {formatEth(plot.price)}
                        </span>
                        <span className="text-[11px] text-amber-400 font-semibold block mt-1">
                          ≈ {formatPkrFromWei(plot.price)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800 my-4 text-xs">
                      <div>
                        <span className="text-slate-500">Surveyed Area:</span>
                        <p className="font-semibold text-slate-200">{plot.squareYards} Sq. Yards</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Zoning:</span>
                        <p className="font-semibold text-emerald-400 uppercase">
                          {plot.plotCategory}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">
                          Current Seller {sellerName ? `(${sellerName})` : ''}:
                        </span>
                        <p className="font-mono text-slate-300 text-[11px] truncate">
                          {plot.currentOwner}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <button
                      disabled={isEmergencyFrozen}
                      onClick={() => onDepositEscrow(plot)}
                      className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-black text-xs py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Lock {formatEth(plot.price)} in Smart Escrow</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onSelectPlot(plot)}
                      className="w-full bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-800 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span>Inspect Clean Digital Sanad</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Buyer's Owned / Acquired Titles */}
      {myAcquiredPlots.length > 0 && (
        <div className="bg-slate-900/60 border border-emerald-500/30 p-6 md:p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              My Titled Landholdings ({myAcquiredPlots.length})
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">
              Manage listings in Owner Console
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAcquiredPlots.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/25 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {p.kdaPlotNumber}
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5">{p.schemeName}</p>
                  <p className="text-xs text-slate-400">
                    {p.sector}, Plot #{p.plotNumber} • {p.squareYards} Sq. Yds
                  </p>
                </div>
                <button
                  onClick={() => onSelectPlot(p)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer shrink-0"
                >
                  View Sanad
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
