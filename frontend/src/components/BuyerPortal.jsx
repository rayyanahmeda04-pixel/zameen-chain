import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  Clock,
  FileText,
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

  const availablePlots = plots.filter(
    (p) =>
      Number(p.status) === 1 &&
      !p.isDisputed &&
      p.currentOwner.toLowerCase() !== myAddr
  );

  const myEscrows = plots.filter((p) => {
    if (Number(p.status) !== 2) return false;
    if (p.escrowBuyer) {
      return p.escrowBuyer.toLowerCase() === myAddr;
    }
    return true;
  });

  const myAcquiredPlots = plots.filter(
    (p) => myAddr && p.currentOwner.toLowerCase() === myAddr
  );

  const areaOptions = useMemo(() => {
    return ['ALL', 'Scheme 33', 'Gulshan', 'DHA', 'Clifton', 'Bahria', 'Surjani'];
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
    <div className="space-y-6 animate-fadeIn">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-7 border border-[#E4E4E0] shadow-[0_1px_3px_rgba(16,24,40,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#0B5D46] mb-1">
            Verified Buyer Marketplace & Atomic Escrow
          </p>
          <h2 className="text-lg sm:text-2xl font-bold text-[#111315] tracking-[-0.02em]">
            Acquire Verified Karachi Land Without Token Fraud
          </h2>
          <p className="text-xs sm:text-[13px] text-zinc-600 mt-1.5 leading-relaxed">
            Every property below has passed cryptographic duplicate-file checks and court stay-order screening. Funds remain locked in the ZameenChain Escrow Vault until the KDA Sub-Registrar mutates legal title to your wallet.
          </p>
        </div>

        <div className="flex items-center gap-3.5 bg-[#FBFBFA] border border-[#E4E4E0] p-3.5 sm:p-4 rounded-lg w-full md:w-auto shrink-0 tabular-nums">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-[#0B5D46] border border-emerald-200 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 font-medium block">Verified Listings</span>
            <span className="text-xl font-bold text-[#111315]">
              {availablePlots.length} Parcels
            </span>
          </div>
        </div>
      </div>

      {/* Escrow Protection Guarantee */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start sm:items-center gap-3 text-xs text-blue-950">
        <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
        <span className="leading-relaxed">
          <strong className="font-semibold">100% Atomic Settlement Guarantee:</strong> Sellers receive 0 ETH until KDA certifies the deed mutation. You retain unilateral authority to cancel any pending escrow for an immediate 100% refund prior to registrar stamping.
        </span>
      </div>

      {/* Active Escrows Section */}
      <div className="bg-white border border-[#E4E4E0] p-4 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-[#111315] truncate">
              My Locked Escrow Vault Deals
            </h3>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap shrink-0 tabular-nums">
            {myEscrows.length} Active
          </span>
        </div>

        {myEscrows.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#D4D4CE] rounded-lg bg-[#FBFBFA] text-zinc-500 text-xs">
            No pending escrow deposits. Select any listed parcel below to lock an atomic purchase deal.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEscrows.map((plot) => (
              <div
                key={plot.id}
                className="bg-[#FBFBFA] p-4 sm:p-5 rounded-xl border border-blue-200 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-semibold text-[#111315] bg-white px-2 py-0.5 rounded border border-[#E4E4E0] break-all">
                      {plot.kdaPlotNumber}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Awaiting KDA Stamping
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#111315] mt-2">{plot.schemeName}</h4>
                  <p className="text-xs text-zinc-500">
                    {plot.sector}, Plot #{plot.plotNumber} • {plot.squareYards} Sq. Yds
                  </p>

                  <div className="mt-3 p-3 rounded-lg bg-white border border-[#E4E4E0] text-xs space-y-1.5 tabular-nums">
                    <div className="flex flex-wrap justify-between gap-1">
                      <span className="text-zinc-500">Vault Deposit</span>
                      <span className="font-semibold text-[#111315]">
                        {formatEth(plot.escrowAmount || plot.price)} ({formatPkrFromWei(plot.escrowAmount || plot.price)})
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-zinc-500">Seller Wallet</span>
                      <span className="font-mono text-zinc-700">
                        {shortenAddress(plot.currentOwner, 8, 6)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={() => onCancelEscrow(plot)}
                    className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Cancel & Refund ETH</span>
                  </button>

                  <button
                    onClick={() => onSelectPlot(plot)}
                    className="flex-1 bg-white hover:bg-[#F4F4F1] text-[#111315] text-xs font-semibold py-2 rounded-lg border border-[#D4D4CE] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
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
          <h3 className="text-base font-bold text-[#111315]">
            Verified Parcels Available for Purchase
          </h3>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap text-xs">
            {areaOptions.map((area) => (
              <button
                key={area}
                onClick={() => setFilterScheme(area)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                  filterScheme === area
                    ? 'bg-[#111315] text-white font-semibold'
                    : 'bg-white hover:bg-[#F4F4F1] text-zinc-700 border border-[#E4E4E0]'
                }`}
              >
                {area === 'ALL' ? 'All Karachi' : area}
              </button>
            ))}
          </div>
        </div>

        {filteredPlots.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#D4D4CE] rounded-xl bg-white text-zinc-500 text-xs">
            No third-party properties currently listed in this zone.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredPlots.map((plot) => {
              const sellerName = resolveWalletLabel(plot.currentOwner);
              return (
                <div
                  key={plot.id}
                  className="bg-white border border-[#E4E4E0] hover:border-zinc-300 rounded-xl p-4 sm:p-5 transition flex flex-col justify-between shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <span className="inline-block text-[11px] font-mono font-semibold text-[#111315] bg-[#F4F4F1] border border-[#E4E4E0] px-2 py-0.5 rounded break-all">
                          {plot.kdaPlotNumber}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-[#111315] mt-2 leading-snug">
                          {plot.schemeName}
                        </h4>
                        <p className="text-xs text-zinc-500">
                          {plot.sector}, Plot #{plot.plotNumber}
                        </p>
                      </div>

                      <div className="text-right shrink-0 tabular-nums">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#065F46] border border-emerald-200 block whitespace-nowrap">
                          {formatEth(plot.price)}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-medium block mt-1 whitespace-nowrap">
                          ≈ {formatPkrFromWei(plot.price)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#F0F0EC] my-3 text-xs tabular-nums">
                      <div>
                        <span className="text-zinc-500">Surveyed Area</span>
                        <p className="font-semibold text-[#111315] mt-0.5">{plot.squareYards} Sq. Yards</p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Zoning</span>
                        <p className="font-semibold text-[#0B5D46] uppercase mt-0.5">
                          {plot.plotCategory}
                        </p>
                      </div>
                      <div className="col-span-2 min-w-0">
                        <span className="text-zinc-500">
                          Current Seller {sellerName ? `(${sellerName})` : ''}
                        </span>
                        <p className="font-mono text-zinc-700 text-[11px] truncate mt-0.5">
                          {plot.currentOwner}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#F0F0EC]">
                    <button
                      disabled={isEmergencyFrozen}
                      onClick={() => onDepositEscrow(plot)}
                      className="w-full bg-[#0B5D46] hover:bg-[#094B38] disabled:opacity-40 text-white font-semibold text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Lock {formatEth(plot.price)} in Smart Escrow</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>

                    <button
                      onClick={() => onSelectPlot(plot)}
                      className="w-full bg-white hover:bg-[#F7F7F5] text-[#111315] text-xs font-semibold py-2 rounded-lg border border-[#D4D4CE] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
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
        <div className="bg-white border border-[#E4E4E0] p-4 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-4">
            <h3 className="text-base font-bold text-[#111315] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0B5D46] shrink-0" />
              <span>My Titled Landholdings ({myAcquiredPlots.length})</span>
            </h3>
            <span className="text-xs text-zinc-500 font-medium">
              Manage listings in Owner Portfolio
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {myAcquiredPlots.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-lg bg-[#FBFBFA] border border-[#E4E4E0] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-mono font-semibold text-[#0B5D46] break-all">
                    {p.kdaPlotNumber}
                  </span>
                  <p className="text-sm font-bold text-[#111315] mt-0.5 truncate">{p.schemeName}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {p.sector}, Plot #{p.plotNumber} • {p.squareYards} Sq. Yds
                  </p>
                </div>
                <button
                  onClick={() => onSelectPlot(p)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#F4F4F1] border border-[#D4D4CE] text-xs font-semibold text-[#111315] cursor-pointer whitespace-nowrap shrink-0"
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
