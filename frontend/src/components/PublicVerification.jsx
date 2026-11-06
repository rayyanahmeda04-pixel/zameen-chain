import React, { useState } from 'react';
import {
  Search,
  ShieldAlert,
  CheckCircle2,
  FileText,
  AlertTriangle,
  History,
  Copy,
  Check,
  ArrowRight,
  X
} from 'lucide-react';
import {
  formatEth,
  formatPkrFromWei,
  resolveOwnerDisplayName,
  shortenAddress
} from '../utils/formatters';

export default function PublicVerification({
  plots,
  activeRole,
  onSelectPlot,
  onDepositEscrow
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedPlot, setMatchedPlot] = useState(null);
  const [matchingPlots, setMatchingPlots] = useState([]);
  const [copiedId, setCopiedId] = useState(false);

  const sampleSearches = [
    { label: 'Scheme 33 (For Sale)', code: 'KDA-SCH33-SEC14A-P102' },
    { label: 'DHA Phase 8 (Commercial)', code: 'DHA-PH8-ZNB-C214' },
    { label: 'Surjani (Stay Order)', code: 'KDA-SURJ-SEC07D-P789' },
    { label: 'Forged File Check', code: 'KDA-FAKE-FILE-9999' }
  ];

  const performSearch = (query) => {
    const cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery) {
      setMatchedPlot(null);
      setMatchingPlots([]);
      setSearched(false);
      return;
    }

    setSearched(true);
    const exact = plots.find((p) => p.kdaPlotNumber.toUpperCase() === cleanQuery);
    if (exact) {
      setMatchedPlot(exact);
      setMatchingPlots([exact]);
      return;
    }

    const matches = plots.filter((p) => {
      const plotNumStr = String(p.plotNumber);
      return (
        p.kdaPlotNumber.toUpperCase().includes(cleanQuery) ||
        p.schemeName.toUpperCase().includes(cleanQuery) ||
        p.sector.toUpperCase().includes(cleanQuery) ||
        plotNumStr === cleanQuery
      );
    });

    if (matches.length > 0) {
      setMatchedPlot(matches[0]);
      setMatchingPlots(matches);
    } else {
      setMatchedPlot(null);
      setMatchingPlots([]);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    performSearch(searchQuery);
  };

  const handleQuickSearch = (code) => {
    setSearchQuery(code);
    performSearch(code);
  };

  const handleCopy = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const livePlot = matchedPlot
    ? plots.find((p) => p.id === matchedPlot.id) || matchedPlot
    : null;

  const isOwner =
    livePlot &&
    activeRole?.address &&
    activeRole.address.toLowerCase() === livePlot.currentOwner.toLowerCase();

  return (
    <div className="space-y-5">
      {/* Search Console Card */}
      <div className="bg-white border border-[#E4E4E0] rounded-xl p-5 sm:p-7 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#0B5D46] mb-1.5">
            Instant Title & Encumbrance Verification
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-[#111315] tracking-[-0.02em]">
            Verify Any Karachi Plot File Before Paying Token Money
          </h2>
          <p className="text-xs sm:text-[13px] text-zinc-600 mt-1 mb-5 leading-relaxed">
            Enter a KDA, DHA, or MDA Allotment ID, Scheme Name, Sector, or Plot Number to confirm registered ownership and screen against Sindh High Court stay orders.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. KDA-SCH33-SEC14A-P102 or DHA Phase 8..."
                className="w-full bg-white border border-[#D4D4CE] focus:border-[#0B5D46] focus:ring-2 focus:ring-[#0B5D46]/15 rounded-lg pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[#111315] placeholder-zinc-400 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearched(false);
                    setMatchedPlot(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#111315] cursor-pointer p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-[#111315] hover:bg-[#27272A] text-white font-semibold text-xs sm:text-[13px] px-6 py-2.5 rounded-lg transition cursor-pointer shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
            >
              Verify Record
            </button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-[#F0F0EC] flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium text-[11px] shrink-0">
              Sample Queries:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0 sm:flex-wrap">
              {sampleSearches.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickSearch(item.code)}
                  className="bg-[#F7F7F5] hover:bg-[#ECECE7] border border-[#E4E4E0] text-zinc-700 hover:text-[#111315] px-2.5 py-1 rounded-md transition text-[11px] font-medium cursor-pointer whitespace-nowrap shrink-0"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Output */}
      {searched && (
        <div className="animate-fadeIn">
          {matchingPlots.length > 1 && (
            <div className="mb-3 p-2.5 bg-white border border-[#E4E4E0] rounded-lg flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-zinc-500 font-medium shrink-0">
                Matches ({matchingPlots.length}):
              </span>
              {matchingPlots.map((mp) => (
                <button
                  key={mp.id}
                  onClick={() => setMatchedPlot(mp)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition cursor-pointer shrink-0 whitespace-nowrap ${
                    livePlot?.id === mp.id
                      ? 'bg-[#111315] text-white font-semibold'
                      : 'bg-[#F7F7F5] text-zinc-700 hover:bg-zinc-200/70'
                  }`}
                >
                  {mp.kdaPlotNumber}
                </button>
              ))}
            </div>
          )}

          {livePlot ? (
            <div className="bg-white border border-[#E4E4E0] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
              {/* Result Status Header */}
              <div
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${
                  livePlot.isDisputed
                    ? 'bg-red-50/70 border-red-200'
                    : 'bg-emerald-50/60 border-emerald-200/80'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  {livePlot.isDisputed ? (
                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#065F46] flex items-center justify-center shrink-0 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h3
                      className={`font-bold text-sm sm:text-base tracking-tight ${
                        livePlot.isDisputed ? 'text-red-900' : 'text-[#065F46]'
                      }`}
                    >
                      {livePlot.isDisputed
                        ? 'Judicial Stay Order / Litigation Encumbrance Active'
                        : 'Authenticated Sovereign Land Title'}
                    </h3>
                    <p
                      className={`text-xs mt-0.5 ${
                        livePlot.isDisputed ? 'text-red-700' : 'text-emerald-800/80'
                      }`}
                    >
                      {livePlot.isDisputed
                        ? 'Sale, transfer, and escrow settlement are legally blocked under court order.'
                        : 'Cryptographic Form-VII Sanad verified on the Sindh Board of Revenue ledger.'}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-md border border-[#E4E4E0] bg-white text-zinc-700 self-start sm:self-center whitespace-nowrap tabular-nums">
                  Parcel #{String(livePlot.id).padStart(4, '0')}
                </span>
              </div>

              {livePlot.isDisputed && (
                <div className="m-4 sm:m-6 mb-0 p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs">
                  <div className="font-semibold flex items-center gap-1.5 mb-1 text-red-900">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Judicial Restraining Notice</span>
                  </div>
                  <p className="text-red-800 font-mono break-words">
                    {livePlot.disputeReason || 'Litigation pending before competent court of law.'}
                  </p>
                </div>
              )}

              {/* Tabular Details Grid */}
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="bg-[#FBFBFA] p-3.5 rounded-lg border border-[#E4E4E0]">
                  <p className="text-[11px] text-zinc-500 font-medium mb-1">Official Allotment ID</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#111315] font-mono break-all">
                      {livePlot.kdaPlotNumber}
                    </p>
                    <button
                      onClick={() => handleCopy(livePlot.kdaPlotNumber)}
                      className="text-zinc-400 hover:text-[#111315] cursor-pointer p-1 shrink-0"
                      title="Copy Allotment ID"
                    >
                      {copiedId ? (
                        <Check className="w-3.5 h-3.5 text-[#059669]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500">Duplicate-File Guarded</span>
                </div>

                <div className="bg-[#FBFBFA] p-3.5 rounded-lg border border-[#E4E4E0]">
                  <p className="text-[11px] text-zinc-500 font-medium mb-1">Scheme & Sector</p>
                  <p className="text-sm font-semibold text-[#111315]">{livePlot.schemeName}</p>
                  <span className="text-[11px] text-zinc-500">
                    {livePlot.sector}, Plot #{livePlot.plotNumber}
                  </span>
                </div>

                <div className="bg-[#FBFBFA] p-3.5 rounded-lg border border-[#E4E4E0]">
                  <p className="text-[11px] text-zinc-500 font-medium mb-1">Surveyed Area & Land Use</p>
                  <p className="text-sm font-semibold text-[#111315] tabular-nums">
                    {livePlot.squareYards} Sq. Yards
                  </p>
                  <span className="text-[11px] text-[#0B5D46] font-semibold uppercase">
                    {livePlot.plotCategory}
                  </span>
                </div>

                <div className="bg-[#FBFBFA] p-3.5 rounded-lg border border-[#E4E4E0] md:col-span-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[11px] text-zinc-500 font-medium">Registered Title Holder</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#065F46] border border-emerald-200">
                      Verified Citizen
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#111315]">
                    {resolveOwnerDisplayName(livePlot.currentOwner)}
                  </p>
                  <p className="text-xs font-mono text-zinc-600 mt-0.5">
                    {shortenAddress(livePlot.currentOwner, 10, 6)}
                  </p>
                </div>

                <div className="bg-[#FBFBFA] p-3.5 rounded-lg border border-[#E4E4E0] tabular-nums">
                  <p className="text-[11px] text-zinc-500 font-medium mb-1">Market & Escrow Status</p>
                  {Number(livePlot.status) === 1 && !livePlot.isDisputed ? (
                    <>
                      <p className="text-sm font-semibold text-amber-700">
                        For Sale • {formatEth(livePlot.price)}
                      </p>
                      <span className="text-[11px] text-zinc-600 font-medium">
                        ≈ {formatPkrFromWei(livePlot.price)}
                      </span>
                    </>
                  ) : Number(livePlot.status) === 2 ? (
                    <>
                      <p className="text-sm font-semibold text-blue-700">Escrow Vault Locked</p>
                      <span className="text-[11px] text-zinc-500">Awaiting KDA Stamping</span>
                    </>
                  ) : livePlot.isDisputed ? (
                    <>
                      <p className="text-sm font-semibold text-red-700">Frozen (Court Order)</p>
                      <span className="text-[11px] text-zinc-500">Alienation Blocked</span>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#065F46]">Private Holding</p>
                      <span className="text-[11px] text-zinc-500">Not Listed for Sale</span>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-4 sm:px-6 py-4 bg-[#FBFBFA] border-t border-[#E4E4E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-500 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">
                    IPFS Deed CID:{' '}
                    <span className="font-mono text-zinc-700">
                      {livePlot.ipfsDeedHash.slice(0, 22)}...
                    </span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {Number(livePlot.status) === 1 && !livePlot.isDisputed && !isOwner && onDepositEscrow && (
                    <button
                      onClick={() => onDepositEscrow(livePlot)}
                      className="bg-[#0B5D46] hover:bg-[#094B38] text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Purchase via Atomic Escrow</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}

                  <button
                    onClick={() => onSelectPlot(livePlot)}
                    className="bg-white hover:bg-[#F4F4F1] text-[#111315] border border-[#D4D4CE] text-xs font-semibold px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  >
                    <History className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <span>Open Official Digital Sanad</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-red-200 p-6 sm:p-8 rounded-xl text-center shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
              <div className="w-12 h-12 mx-auto mb-3.5 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-red-900 mb-1.5">
                Unregistered or Forged Plot File Detected
              </h3>
              <p className="text-xs sm:text-[13px] text-zinc-600 max-w-xl mx-auto mb-5 break-words">
                No verified cadastral record matches{' '}
                <span className="font-mono font-semibold text-[#111315]">"{searchQuery}"</span> in the Sindh Board of Revenue & KDA Blockchain Registry.
              </p>
              <div className="text-xs bg-red-50/60 border border-red-200/80 p-4 rounded-lg max-w-lg mx-auto text-zinc-700 text-left space-y-1.5">
                <p className="font-semibold text-red-900 text-xs">
                  Buyer Protection Advisory
                </p>
                <p>• Unregistered paper files ("kachi files") are the primary source of duplicate allotment fraud in Karachi.</p>
                <p>• Do not pay cash or advance token money outside ZameenChain Atomic Escrow.</p>
                <p>• Ask the seller to have the parcel surveyed and minted at the KDA Sub-Registrar Desk.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
