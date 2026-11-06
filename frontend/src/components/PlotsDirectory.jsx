import React, { useState, useMemo } from 'react';
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Tag,
  ArrowRight,
  User,
  Search,
  ArrowUpDown,
  Lock
} from 'lucide-react';
import {
  formatEth,
  formatPkrFromWei,
  toEthNumber,
  resolveWalletLabel,
  shortenAddress
} from '../utils/formatters';

export default function PlotsDirectory({
  plots,
  activeRole,
  isEmergencyFrozen,
  onSelectPlot,
  onDepositEscrow,
  onListForSale,
  onDelist,
  onFlagDispute,
  onResolveDispute
}) {
  const [filterScheme, setFilterScheme] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('ID_ASC');

  // Dynamically extract distinct region keywords from plots so newly minted schemes appear automatically
  const regionOptions = useMemo(() => {
    const base = ['ALL', 'Scheme 33', 'Gulshan', 'Clifton', 'DHA', 'Bahria', 'Surjani'];
    plots.forEach((p) => {
      const firstWord = (p.schemeName || '').split(' - ')[0].trim();
      if (
        firstWord &&
        !base.some((b) => b !== 'ALL' && firstWord.toLowerCase().includes(b.toLowerCase()))
      ) {
        base.push(firstWord);
      }
    });
    return base;
  }, [plots]);

  const filteredPlots = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = plots.filter((plot) => {
      if (
        filterScheme !== 'ALL' &&
        !plot.schemeName.toLowerCase().includes(filterScheme.toLowerCase())
      ) {
        return false;
      }
      if (filterStatus === 'FOR_SALE' && (Number(plot.status) !== 1 || plot.isDisputed)) return false;
      if (filterStatus === 'DISPUTED' && !plot.isDisputed) return false;
      if (filterStatus === 'ESCROW' && Number(plot.status) !== 2) return false;

      if (q) {
        const matchText =
          plot.kdaPlotNumber.toLowerCase().includes(q) ||
          plot.schemeName.toLowerCase().includes(q) ||
          plot.sector.toLowerCase().includes(q) ||
          plot.plotCategory.toLowerCase().includes(q);
        if (!matchText) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'AREA_DESC') return Number(b.squareYards) - Number(a.squareYards);
      if (sortBy === 'PRICE_ASC') {
        const pa = toEthNumber(a.price) || 999999;
        const pb = toEthNumber(b.price) || 999999;
        return pa - pb;
      }
      return Number(a.id) - Number(b.id);
    });
  }, [plots, filterScheme, filterStatus, searchText, sortBy]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Search + Sort + Filter Controls */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] p-3.5 sm:p-4 rounded-2xl shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Filter parcels by KDA ID, scheme, sector, or zoning..."
              className="w-full bg-slate-950/90 border border-white/[0.08] focus:border-emerald-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 md:flex-none bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ID_ASC">Sort: Registry Order</option>
              <option value="PRICE_ASC">Sort: Lowest Asking Price</option>
              <option value="AREA_DESC">Sort: Largest Area (Sq. Yds)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 pt-2.5 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap text-xs">
            <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zone:</span>
            </span>
            {regionOptions.map((area) => (
              <button
                key={area}
                onClick={() => setFilterScheme(area)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                  filterScheme === area
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.06]'
                }`}
              >
                {area === 'ALL' ? 'All Karachi' : area}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap text-xs">
            {[
              { key: 'ALL', label: 'All Status' },
              { key: 'FOR_SALE', label: 'For Sale' },
              { key: 'ESCROW', label: 'In Escrow' },
              { key: 'DISPUTED', label: 'Stay Orders' }
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setFilterStatus(st.key)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                  filterStatus === st.key
                    ? 'bg-white text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.06]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parcels Grid */}
      {filteredPlots.length === 0 ? (
        <div className="p-8 sm:p-12 text-center border border-dashed border-slate-800 rounded-2xl sm:rounded-3xl bg-slate-900/30 text-slate-400 text-xs">
          No cadastral parcels match the selected filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredPlots.map((plot) => {
            const isOwner =
              activeRole?.address &&
              activeRole.address.toLowerCase() === plot.currentOwner.toLowerCase();
            const isAuthority =
              activeRole?.role === 'REGISTRAR' || activeRole?.role === 'ADMIN';
            const isListed = Number(plot.status) === 1 && !plot.isDisputed;
            const isEscrow = Number(plot.status) === 2;
            const ownerName = resolveWalletLabel(plot.currentOwner);

            return (
              <div
                key={plot.id}
                className={`group bg-slate-900/55 backdrop-blur-2xl border rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl flex flex-col justify-between ${
                  plot.isDisputed
                    ? 'border-rose-500/35 hover:border-rose-500/60'
                    : isListed
                    ? 'border-amber-500/30 hover:border-amber-500/60'
                    : isEscrow
                    ? 'border-cyan-500/35 hover:border-cyan-500/60'
                    : 'border-white/[0.08] hover:border-emerald-500/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3.5 sm:mb-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg break-all">
                          {plot.kdaPlotNumber}
                        </span>
                        {isOwner && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 whitespace-nowrap">
                            Your Title
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-xl font-bold text-white mt-2 group-hover:text-emerald-300 transition-colors leading-snug">
                        {plot.schemeName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {plot.sector}, Plot No. {plot.plotNumber}
                      </p>
                    </div>

                    {plot.isDisputed ? (
                      <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 whitespace-nowrap shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Stay Order
                      </span>
                    ) : isListed ? (
                      <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap shrink-0">
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        For Sale
                      </span>
                    ) : isEscrow ? (
                      <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 whitespace-nowrap shrink-0">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        In Escrow
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        Titled
                      </span>
                    )}
                  </div>

                  {plot.isDisputed && (
                    <div className="mb-3.5 p-3 rounded-xl sm:rounded-2xl bg-rose-950/30 border border-rose-900/60 text-xs text-rose-300 break-words">
                      <span className="font-bold block mb-0.5 text-rose-200">
                        Judicial Restraining Order:
                      </span>
                      {plot.disputeReason}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/[0.08] my-3.5 sm:my-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Surveyed Area:</span>
                      <p className="font-bold text-white text-xs sm:text-sm">{plot.squareYards} Sq. Yards</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Zoning Category:</span>
                      <p className="font-bold text-emerald-400 uppercase text-xs sm:text-sm">
                        {plot.plotCategory}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Valuation / Price:</span>
                      {isListed || isEscrow ? (
                        <div>
                          <p className="font-extrabold text-amber-400 text-xs sm:text-sm">
                            {formatEth(plot.price)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            ≈ {formatPkrFromWei(plot.price)}
                          </p>
                        </div>
                      ) : (
                        <p className="font-semibold text-slate-500 text-xs sm:text-sm">Not Listed</p>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">GPS Grid:</span>
                      <p className="font-mono text-slate-300 text-[11px] mt-0.5 break-words">
                        {plot.latitude}°N, {plot.longitude}°E
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-slate-300 mb-4 sm:mb-5 bg-slate-950/55 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold truncate">
                        Registered Title Holder {ownerName ? `• ${ownerName}` : ''}
                      </span>
                      <span className="font-mono text-slate-200 text-xs truncate block">
                        {shortenAddress(plot.currentOwner, 12, 8)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role-Safe Action Controls */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  {/* Non-owners can buy listed plots via Smart Escrow */}
                  {isListed && !isOwner && !isAuthority && (
                    <button
                      disabled={isEmergencyFrozen}
                      onClick={() => onDepositEscrow(plot)}
                      className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 disabled:opacity-40 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Purchase via Escrow ({formatEth(plot.price)})</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  )}

                  {/* Owner controls */}
                  {isOwner && !plot.isDisputed && !isEscrow && (
                    <div className="flex gap-2">
                      {isListed ? (
                        <button
                          onClick={() => onDelist(plot.id)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-2.5 rounded-xl border border-slate-700 cursor-pointer"
                        >
                          Withdraw Listing
                        </button>
                      ) : (
                        <button
                          disabled={isEmergencyFrozen}
                          onClick={() => onListForSale(plot)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
                        >
                          List Property for Sale
                        </button>
                      )}
                    </div>
                  )}

                  {/* KDA Registrar / Admin Judicial Controls */}
                  {isAuthority && (
                    <div className="flex gap-2">
                      {plot.isDisputed ? (
                        <button
                          onClick={() => onResolveDispute(plot.id)}
                          className="flex-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
                        >
                          Lift Court Stay Order
                        </button>
                      ) : (
                        <button
                          onClick={() => onFlagDispute(plot)}
                          className="flex-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-semibold py-2.5 rounded-xl cursor-pointer"
                        >
                          Enforce Court Stay Order
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => onSelectPlot(plot)}
                    className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl border border-slate-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Inspect Digital Sanad & Audit Trail</span>
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
