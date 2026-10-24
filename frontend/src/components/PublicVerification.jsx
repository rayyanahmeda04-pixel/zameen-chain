import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle, FileText, AlertTriangle, ExternalLink, History, Clock } from 'lucide-react';
import { ethers } from 'ethers';

export default function PublicVerification({ plots, onSelectPlot }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedPlot, setMatchedPlot] = useState(null);

  const [matchingPlots, setMatchingPlots] = useState([]);

  const sampleSearches = [
    { label: "Scheme 33 (Clean & For Sale)", code: "KDA-SCH33-SEC14A-P102" },
    { label: "Surjani Town (Stay Order Flagged)", code: "KDA-SURJ-SEC07D-P789" },
    { label: "Gulshan-e-Iqbal (500 Sq. Yds)", code: "KDA-GLSHN-BLK07-P405" },
    { label: "Fake Plot File (Fraud Test)", code: "KDA-FAKE-FILE-9999" }
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
    // 1. Exact match on KDA Plot ID
    const exact = plots.find((p) => p.kdaPlotNumber.toUpperCase() === cleanQuery);
    if (exact) {
      setMatchedPlot(exact);
      setMatchingPlots([exact]);
      return;
    }

    // 2. Partial match on Scheme Name, Sector, or Plot Number
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

  return (
    <div className="space-y-6">
      
      {/* Search Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 md:p-10 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl">
        {/* Subtle radial glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide uppercase font-bold text-[10px]">Public Anti-Fraud Title Verification</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Karachi Land Title & Allotment Verification
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 mb-6 leading-relaxed">
            Verify any plot file in Karachi before paying a single rupee. Check genuine KDA records, cryptographic title deeds, and Sindh High Court stay orders in real-time.
          </p>

          {/* Search Input Box */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Plot ID, Scheme (e.g. Scheme 33, 102, Gulshan)..."
                className="w-full bg-[#050912]/80 border border-white/10 focus:border-emerald-400 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-sans"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Verify Title
            </button>
          </form>

          {/* Preset Quick Clicks */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
            <span className="text-slate-400 font-medium">Quick Verify Sample Plots:</span>
            {sampleSearches.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickSearch(item.code)}
                className="bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] hover:border-emerald-500/40 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition font-mono text-[11px] cursor-pointer shadow-sm"
              >
                {item.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Verification Result Section */}
      {searched && (
        <div className="transition-all animate-fadeIn">
          {matchingPlots.length > 1 && (
            <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-slate-400 font-medium shrink-0">Matching Plots ({matchingPlots.length}):</span>
              {matchingPlots.map((mp) => (
                <button
                  key={mp.id}
                  onClick={() => setMatchedPlot(mp)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition cursor-pointer ${
                    matchedPlot?.id === mp.id
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {mp.kdaPlotNumber} ({mp.schemeName.split(' ')[0]})
                </button>
              ))}
            </div>
          )}

          {matchedPlot ? (
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
              
              {/* Result Status Banner */}
              <div className={`p-6 flex items-center justify-between border-b ${
                matchedPlot.isDisputed 
                  ? 'bg-rose-950/30 border-rose-800/40 text-rose-200' 
                  : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
              }`}>
                <div className="flex items-center gap-3.5">
                  {matchedPlot.isDisputed ? (
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-base md:text-lg tracking-tight">
                      {matchedPlot.isDisputed
                        ? '🚨 ACTIVE COURT STAY ORDER / DISPUTE FLAGGED'
                        : '✅ VERIFIED GENUINE & IMMUTABLE LAND TITLE'}
                    </h3>
                    <p className="text-xs opacity-80 mt-0.5 font-normal">
                      {matchedPlot.isDisputed
                        ? 'Property is legally frozen under Sindh High Court. Transfer is strictly illegal.'
                        : 'Authentic cryptographic deed verified by Karachi Land Authority.'}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border border-white/10 bg-slate-950/70 text-slate-300">
                  Plot #{matchedPlot.id}
                </span>
              </div>

              {/* Dispute Warning Box if any */}
              {matchedPlot.isDisputed && (
                <div className="m-6 p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-sm shadow-inner">
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Sindh High Court Legal Notice:
                  </div>
                  <p className="text-xs text-rose-300 font-mono">
                    {matchedPlot.disputeReason || "Litigation pending in competent court of law."}
                  </p>
                </div>
              )}

              {/* Property Details Grid */}
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-medium mb-1">KDA Allotment ID</p>
                  <p className="text-base font-bold text-emerald-400 font-mono">{matchedPlot.kdaPlotNumber}</p>
                  <span className="text-[11px] text-slate-500">Cryptographic Identity Hash</span>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-medium mb-1">Location & Scheme</p>
                  <p className="text-base font-bold text-white">{matchedPlot.schemeName}</p>
                  <span className="text-[11px] text-slate-400">{matchedPlot.sector}, Plot #{matchedPlot.plotNumber}</span>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-medium mb-1">Size & Category</p>
                  <p className="text-base font-bold text-white">{matchedPlot.squareYards} Sq. Yards</p>
                  <span className="text-[11px] text-teal-400 font-semibold uppercase">{matchedPlot.plotCategory}</span>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/[0.06] md:col-span-2">
                  <p className="text-xs text-slate-400 font-medium mb-1">Current Registered Owner</p>
                  <p className="text-xs md:text-sm font-mono text-slate-200 truncate">{matchedPlot.currentOwner}</p>
                  <span className="text-[11px] text-emerald-400 font-medium">Verified On-Chain Title Holder</span>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/[0.06]">
                  <p className="text-xs text-slate-400 font-medium mb-1">Market Status</p>
                  <p className="text-sm font-bold">
                    {Number(matchedPlot.status) === 1 ? (
                      <span className="text-amber-400">Available For Sale ({ethers.formatEther(matchedPlot.price)} ETH)</span>
                    ) : Number(matchedPlot.status) === 2 ? (
                      <span className="text-cyan-400">Escrow In Progress</span>
                    ) : matchedPlot.isDisputed ? (
                      <span className="text-rose-400">Frozen (Litigation)</span>
                    ) : (
                      <span className="text-emerald-400">Registered (Private Holding)</span>
                    )}
                  </p>
                  <span className="text-[11px] text-slate-500">Atomic Escrow Guarded</span>
                </div>

              </div>

              {/* Action Button & Details */}
              <div className="px-6 pb-6 pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>IPFS Deed CID: <span className="font-mono text-slate-300">{matchedPlot.ipfsDeedHash.slice(0, 20)}...</span></span>
                </div>

                <button
                  onClick={() => onSelectPlot(matchedPlot)}
                  className="bg-slate-800 hover:bg-slate-700 text-white border border-white/10 text-xs font-semibold px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:border-emerald-500/40"
                >
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Inspect Official Digital Sanad</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-rose-950/20 backdrop-blur-2xl border border-rose-800/60 p-8 sm:p-10 rounded-3xl text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-lg shadow-rose-500/10">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-rose-200 mb-2">
                🚨 WARNING: FAKE OR UNREGISTERED PLOT FILE DETECTED!
              </h3>
              <p className="text-sm text-rose-300/80 max-w-xl mx-auto mb-4">
                No matching cryptographic record exists for <span className="font-mono font-bold text-white">"{searchQuery}"</span> in the Karachi Land Authority database.
              </p>
              <div className="text-xs bg-slate-900/80 border border-rose-900 p-4 rounded-xl max-w-lg mx-auto text-slate-300 text-left space-y-1">
                <p className="font-semibold text-rose-400">Why this matters in Karachi:</p>
                <p>• This file may be a forged paper created by illegal land grabbers.</p>
                <p>• Do not make advance token payments without on-chain verification.</p>
                <p>• Contact KDA / Sub-Registrar office for genuine verification.</p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
