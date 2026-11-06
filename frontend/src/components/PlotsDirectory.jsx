import React, { useState, useMemo } from 'react';
import {
  MapPin,
  ArrowRight,
  User,
  Search,
  ArrowUpDown
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
    <div className="space-y-5 animate-fadeIn">
      {/* Search + Sort + Filter Controls */}
      <div className="bg-white border border-[#E4E4E0] p-4 sm:p-5 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-3.5">
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Filter parcels by KDA ID, scheme, sector, or zoning..."
              className="w-full bg-white border border-[#D4D4CE] focus:border-[#0B5D46] focus:ring-2 focus:ring-[#0B5D46]/15 rounded-lg pl-10 pr-4 py-2 text-xs text-[#111315] placeholder-zinc-400 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 md:flex-none bg-white border border-[#D4D4CE] rounded-lg px-3 py-2 text-xs text-[#111315] font-medium focus:outline-none focus:border-[#0B5D46] cursor-pointer"
            >
              <option value="ID_ASC">Sort: Registry Order</option>
              <option value="PRICE_ASC">Sort: Lowest Asking Price</option>
              <option value="AREA_DESC">Sort: Largest Area (Sq. Yds)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-3 border-t border-[#F0F0EC]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap text-xs">
            <span className="text-zinc-500 font-medium mr-1 flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-[#0B5D46]" />
              <span>Zone:</span>
            </span>
            {regionOptions.map((area) => (
              <button
                key={area}
                onClick={() => setFilterScheme(area)}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                  filterScheme === area
                    ? 'bg-[#111315] text-white font-semibold'
                    : 'bg-[#F7F7F5] hover:bg-[#ECECE7] text-zinc-700 border border-[#E4E4E0]'
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
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                  filterStatus === st.key
                    ? 'bg-[#0B5D46] text-white font-semibold'
                    : 'bg-[#F7F7F5] hover:bg-[#ECECE7] text-zinc-700 border border-[#E4E4E0]'
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
        <div className="p-10 text-center border border-dashed border-[#D4D4CE] rounded-xl bg-white text-zinc-500 text-xs">
          No cadastral parcels match the selected filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
                className="bg-white border border-[#E4E4E0] hover:border-zinc-300 rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_6px_18px_rgba(16,24,40,0.06)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-mono font-semibold text-[#111315] bg-[#F4F4F1] border border-[#E4E4E0] px-2 py-0.5 rounded break-all">
                          {plot.kdaPlotNumber}
                        </span>
                        {isOwner && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-[#065F46] border border-emerald-200 whitespace-nowrap">
                            Your Title
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#111315] mt-2 leading-snug">
                        {plot.schemeName}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {plot.sector}, Plot No. {plot.plotNumber}
                      </p>
                    </div>

                    {plot.isDisputed ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 whitespace-nowrap shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        Stay Order
                      </span>
                    ) : isListed ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        For Sale
                      </span>
                    ) : isEscrow ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        In Escrow
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#065F46] border border-emerald-200 whitespace-nowrap shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                        Clean Title
                      </span>
                    )}
                  </div>

                  {plot.isDisputed && (
                    <div className="mb-3 p-3 rounded-lg bg-red-50/80 border border-red-200 text-xs text-red-900 break-words">
                      <span className="font-semibold block mb-0.5">
                        Judicial Restraining Order:
                      </span>
                      <span className="text-red-800">{plot.disputeReason}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#F0F0EC] my-3 text-xs tabular-nums">
                    <div>
                      <span className="text-zinc-500">Surveyed Area</span>
                      <p className="font-semibold text-[#111315] mt-0.5">{plot.squareYards} Sq. Yards</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Approved Land Use</span>
                      <p className="font-semibold text-[#0B5D46] uppercase mt-0.5">
                        {plot.plotCategory}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Valuation / Price</span>
                      {isListed || isEscrow ? (
                        <div>
                          <p className="font-semibold text-[#111315] mt-0.5">
                            {formatEth(plot.price)}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            ≈ {formatPkrFromWei(plot.price)}
                          </p>
                        </div>
                      ) : (
                        <p className="font-medium text-zinc-400 mt-0.5">Not Listed</p>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-500">GPS Coordinates</span>
                      <p className="font-mono text-zinc-700 text-[11px] mt-0.5 break-words">
                        {plot.latitude}°N, {plot.longitude}°E
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs mb-4 bg-[#FBFBFA] p-2.5 rounded-lg border border-[#E4E4E0]">
                    <div className="w-7 h-7 rounded-md bg-[#F4F4F1] border border-[#E4E4E0] text-zinc-600 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-zinc-500 block text-[10px] font-medium truncate">
                        Title Holder {ownerName ? `• ${ownerName}` : ''}
                      </span>
                      <span className="font-mono text-[#111315] text-xs truncate block">
                        {shortenAddress(plot.currentOwner, 12, 8)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role-Safe Action Controls */}
                <div className="space-y-2 pt-2 border-t border-[#F0F0EC]">
                  {isListed && !isOwner && !isAuthority && (
                    <button
                      disabled={isEmergencyFrozen}
                      onClick={() => onDepositEscrow(plot)}
                      className="w-full bg-[#0B5D46] hover:bg-[#094B38] disabled:opacity-40 text-white font-semibold text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Purchase via Escrow ({formatEth(plot.price)})</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}

                  {isOwner && !plot.isDisputed && !isEscrow && (
                    <div className="flex gap-2">
                      {isListed ? (
                        <button
                          onClick={() => onDelist(plot.id)}
                          className="flex-1 bg-[#F7F7F5] hover:bg-zinc-200/70 text-[#111315] text-xs font-semibold py-2 rounded-lg border border-[#D4D4CE] cursor-pointer"
                        >
                          Withdraw Listing
                        </button>
                      ) : (
                        <button
                          disabled={isEmergencyFrozen}
                          onClick={() => onListForSale(plot)}
                          className="flex-1 bg-[#0B5D46] hover:bg-[#094B38] disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg cursor-pointer"
                        >
                          List Property for Sale
                        </button>
                      )}
                    </div>
                  )}

                  {isAuthority && (
                    <div className="flex gap-2">
                      {plot.isDisputed ? (
                        <button
                          onClick={() => onResolveDispute(plot.id)}
                          className="flex-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#065F46] text-xs font-semibold py-2 rounded-lg cursor-pointer"
                        >
                          Lift Court Stay Order
                        </button>
                      ) : (
                        <button
                          onClick={() => onFlagDispute(plot)}
                          className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-xs font-semibold py-2 rounded-lg cursor-pointer"
                        >
                          Enforce Court Stay Order
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => onSelectPlot(plot)}
                    className="w-full bg-white hover:bg-[#F7F7F5] text-[#111315] text-xs font-semibold py-2 rounded-lg border border-[#D4D4CE] transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Inspect Digital Sanad & Chain of Title</span>
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
