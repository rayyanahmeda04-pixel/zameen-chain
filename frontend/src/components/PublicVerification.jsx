import React, { useState } from 'react';
import {
  Search,
  ShieldAlert,
  CheckCircle,
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
  resolveWalletLabel
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
    { label: 'DHA Phase 8 (Comm.)', code: 'DHA-PH8-ZNB-C214' },
    { label: 'Surjani (Stay Order)', code: 'KDA-SURJ-SEC07D-P789' },
    { label: 'Forged File Test', code: 'KDA-FAKE-FILE-9999' }
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
    <div className="space-y-5 sm:space-y-6">
      {/* Search Console Card */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden p-5 sm:p-8 md:p-10 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl">
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="tracking-wide uppercase font-bold text-[9px] sm:text-[10px]">
              Instant Public Title & Encumbrance Search
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            Verify Any Karachi Plot File Before Paying Token Money
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 mb-5 sm:mb-6 leading-relaxed">
            Query the Government of Sindh cryptographic cadastre by KDA/DHA/MDA Allotment ID, Scheme Name, Sector, or Plot Number to confirm legal ownership and check for Sindh High Court stay orders.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter KDA Plot ID, Scheme, or Sector..."
                className="w-full bg-[#050912]/90 border border-white/10 focus:border-emerald-400 rounded-2xl pl-11 sm:pl-12 pr-10 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearched(false);
                    setMatchedPlot(null);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-500/25 cursor-pointer shrink-0"
            >
              Verify Title Now
            </button>
          </form>

          <div className="mt-4 space-y-1.5 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-2 text-xs">
            <span className="text-slate-400 font-medium block sm:inline text-[11px] sm:text-xs">
              Quick Test Lookups:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
              {sampleSearches.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickSearch(item.code)}
                  className="bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] hover:border-emerald-500/40 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition font-mono text-[11px] cursor-pointer whitespace-nowrap shrink-0"
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
        <div className="transition-all animate-fadeIn">
          {matchingPlots.length > 1 && (
            <div className="mb-4 p-3 bg-slate-900/80 border border-white/[0.08] rounded-2xl flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-slate-400 font-medium shrink-0">
                Matching ({matchingPlots.length}):
              </span>
              {matchingPlots.map((mp) => (
                <button
                  key={mp.id}
                  onClick={() => setMatchedPlot(mp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer shrink-0 whitespace-nowrap ${
                    livePlot?.id === mp.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {mp.kdaPlotNumber}
                </button>
              ))}
            </div>
          )}

          {livePlot ? (
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/[0.08] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              {/* Banner */}
              <div
                className={`p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b ${
                  livePlot.isDisputed
                    ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                    : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  {livePlot.isDisputed ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                      <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight leading-snug">
                      {livePlot.isDisputed
                        ? 'JUDICIAL STAY ORDER / ENCUMBRANCE ACTIVE'
                        : 'AUTHENTICATED SOVEREIGN LAND TITLE'}
                    </h3>
                    <p className="text-xs opacity-85 mt-0.5">
                      {livePlot.isDisputed
                        ? 'Restrained by court order. Sale or third-party mutation is blocked.'
                        : 'Cryptographic Sanad verified against Karachi Land Authority ledger.'}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-mono font-bold px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-white/10 bg-slate-950/70 text-slate-300 self-start sm:self-center whitespace-nowrap">
                  Cadastre ID #{livePlot.id}
                </span>
              </div>

              {livePlot.isDisputed && (
                <div className="m-4 sm:m-6 mb-0 p-3.5 sm:p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-sm">
                  <div className="font-bold flex items-center gap-2 mb-1 text-xs uppercase tracking-wider text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Judicial Restraining Notice:</span>
                  </div>
                  <p className="text-xs text-rose-200 font-mono break-words">
                    {livePlot.disputeReason || 'Litigation pending before competent court of law.'}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-medium mb-1">Official Allotment ID</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm sm:text-base font-bold text-emerald-400 font-mono break-all">
                      {livePlot.kdaPlotNumber}
                    </p>
                    <button
                      onClick={() => handleCopy(livePlot.kdaPlotNumber)}
                      className="text-slate-400 hover:text-white cursor-pointer p-1 shrink-0"
                      title="Copy Allotment ID"
                    >
                      {copiedId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-500">Anti-Duplicate File Guarded</span>
                </div>

                <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-medium mb-1">Scheme & Sector</p>
                  <p className="text-sm sm:text-base font-bold text-white">{livePlot.schemeName}</p>
                  <span className="text-[11px] text-slate-400">
                    {livePlot.sector}, Plot #{livePlot.plotNumber}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-medium mb-1">Measured Area & Zoning</p>
                  <p className="text-sm sm:text-base font-bold text-white">{livePlot.squareYards} Sq. Yards</p>
                  <span className="text-[11px] text-teal-400 font-semibold uppercase">
                    {livePlot.plotCategory}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-white/[0.06] md:col-span-2">
                  <p className="text-xs text-slate-400 font-medium mb-1">Registered Legal Owner</p>
                  <p className="text-xs sm:text-sm font-mono text-slate-200 break-all">
                    {livePlot.currentOwner}
                  </p>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    {resolveWalletLabel(livePlot.currentOwner) || 'Verified On-Chain Title Holder'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 sm:p-4 rounded-2xl border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-medium mb-1">Market & Escrow Status</p>
                  {Number(livePlot.status) === 1 && !livePlot.isDisputed ? (
                    <>
                      <p className="text-sm font-bold text-amber-400">
                        For Sale: {formatEth(livePlot.price)}
                      </p>
                      <span className="text-[11px] text-slate-300 font-semibold">
                        ≈ {formatPkrFromWei(livePlot.price)}
                      </span>
                    </>
                  ) : Number(livePlot.status) === 2 ? (
                    <>
                      <p className="text-sm font-bold text-cyan-400">Escrow Vault Locked</p>
                      <span className="text-[11px] text-slate-400">Awaiting Sub-Registrar Sign-off</span>
                    </>
                  ) : livePlot.isDisputed ? (
                    <>
                      <p className="text-sm font-bold text-rose-400">Frozen (Court Injunction)</p>
                      <span className="text-[11px] text-slate-500">Market Alienation Blocked</span>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-emerald-400">Private Holding</p>
                      <span className="text-[11px] text-slate-500">Not Currently Listed</span>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    IPFS CID:{' '}
                    <span className="font-mono text-slate-300">
                      {livePlot.ipfsDeedHash.slice(0, 20)}...
                    </span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                  {Number(livePlot.status) === 1 && !livePlot.isDisputed && !isOwner && onDepositEscrow && (
                    <button
                      onClick={() => onDepositEscrow(livePlot)}
                      className="bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-bold text-xs px-5 py-3 sm:py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20"
                    >
                      <span>Purchase via Smart Escrow</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}

                  <button
                    onClick={() => onSelectPlot(livePlot)}
                    className="bg-slate-800 hover:bg-slate-700 text-white border border-white/10 text-xs font-semibold px-5 py-3 sm:py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer hover:border-emerald-500/40"
                  >
                    <History className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Inspect Official Digital Sanad</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-950/20 backdrop-blur-2xl border border-rose-800/60 p-6 sm:p-10 rounded-2xl sm:rounded-3xl text-center shadow-2xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-rose-200 mb-2">
                UNREGISTERED OR FORGED PLOT FILE DETECTED
              </h3>
              <p className="text-xs sm:text-sm text-rose-300/85 max-w-xl mx-auto mb-5 break-words">
                Zero cryptographic records match{' '}
                <span className="font-mono font-bold text-white">"{searchQuery}"</span> in the Sindh Board of Revenue & KDA Blockchain Registry.
              </p>
              <div className="text-xs bg-slate-950/90 border border-rose-900/70 p-4 rounded-2xl max-w-lg mx-auto text-slate-300 text-left space-y-1.5">
                <p className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">
                  Anti-Fraud Advisory:
                </p>
                <p>• Unregistered paper files ("kachi files") are the primary vehicle for duplicate allotment fraud.</p>
                <p>• Never transfer advance token money outside ZameenChain Atomic Escrow.</p>
                <p>• Direct the seller to have the parcel surveyed and minted at the KDA Sub-Registrar Terminal.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
