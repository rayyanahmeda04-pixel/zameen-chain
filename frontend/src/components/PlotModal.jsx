import React, { useEffect, useState, useMemo } from 'react';
import {
  X,
  History,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Award,
  Printer,
  Copy,
  Check
} from 'lucide-react';
import { ethers } from 'ethers';
import {
  formatEth,
  formatPkrFromWei,
  generateDeterministicQrMatrix,
  resolveWalletLabel,
  shortenAddress
} from '../utils/formatters';

export default function PlotModal({ plot, onClose, getAuditTrail }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!plot) return;
    let isMounted = true;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const trail = await getAuditTrail(plot.id);
        if (isMounted) setHistory(trail || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [plot, getAuditTrail]);

  const qrMatrix = useMemo(() => {
    if (!plot) return [];
    return generateDeterministicQrMatrix(`${plot.kdaPlotNumber}:${plot.ipfsDeedHash}:${plot.currentOwner}`);
  }, [plot]);

  if (!plot) return null;

  const copyToClipboard = (val, key) => {
    navigator.clipboard.writeText(val);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const ownerIdentity = resolveWalletLabel(plot.currentOwner);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0a1220] border border-white/10 w-full max-w-4xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92dvh] flex flex-col">
        {/* Top Bar */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-start sm:items-center justify-between gap-3 bg-[#060b14] shrink-0 print:hidden">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20 shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="inline-block text-[10px] sm:text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded-md border border-teal-800 whitespace-nowrap mb-1 sm:mb-0.5">
                {plot.kdaPlotNumber}
              </span>
              <h3 className="text-sm sm:text-lg font-black text-slate-100 leading-snug truncate">
                {plot.schemeName}
              </h3>
              <p className="hidden sm:block text-xs text-slate-400">
                Cryptographic Title Certificate • Board of Revenue, Government of Sindh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              title="Print or Save PDF Sanad"
              className="flex items-center gap-1.5 p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Print Sanad</span>
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate & Audit Trail */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-5 sm:space-y-6">
          {plot.isDisputed && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs shadow-lg">
              <div className="flex items-center gap-2 font-bold text-rose-300 mb-1 text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0" />
                <span>Active Judicial Stay Order Flagged</span>
              </div>
              <p className="font-mono text-rose-200 break-words">{plot.disputeReason}</p>
              <p className="text-[11px] text-rose-400/90 mt-1">
                Pursuant to Section 52 of the Transfer of Property Act, alienation or mutation of this parcel is legally barred pending judicial disposal.
              </p>
            </div>
          )}

          {/* OFFICIAL DIGITAL SANAD */}
          <div className="border-2 border-amber-500/35 bg-gradient-to-b from-[#0d182b] via-[#070e1b] to-[#050912] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl relative shadow-2xl overflow-hidden">
            <div className="absolute right-4 top-4 opacity-[0.04] pointer-events-none select-none text-amber-300">
              <Award className="w-48 h-48 sm:w-72 sm:h-72" />
            </div>

            {/* Sanad Crest Header */}
            <div className="text-center border-b border-amber-500/20 pb-4 sm:pb-5 mb-5 sm:mb-6">
              <span className="inline-block text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-950/60 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-amber-500/30">
                Government of Sindh • Board of Revenue & KDA
              </span>
              <h2 className="text-base sm:text-2xl font-black text-white mt-2.5 sm:mt-3 tracking-wide uppercase leading-snug">
                Sovereign Digital Sanad & Record of Rights
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-1 font-mono">
                Form-VII Cadastral Extract • Immutable Ethereum Smart Contract Ledger
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-xs">
              <div className="md:col-span-2 space-y-3.5 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-white/[0.08]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Allotment ID:
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm break-all">
                      {plot.kdaPlotNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Cadastral Token ID:
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      #KHI-{String(plot.id).padStart(4, '0')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Measured Area:
                    </span>
                    <span className="font-bold text-white text-sm">
                      {plot.squareYards} Square Yards
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Approved Land Use:
                    </span>
                    <span className="font-bold text-emerald-400 uppercase">
                      {plot.plotCategory}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-white/[0.08] space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 text-[10px] uppercase font-bold truncate">
                        Registered Owner {ownerIdentity ? `(${ownerIdentity})` : ''}:
                      </span>
                      <button
                        onClick={() => copyToClipboard(plot.currentOwner, 'owner')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer shrink-0 print:hidden"
                      >
                        {copiedField === 'owner' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                    <span className="font-mono text-emerald-300 text-[11px] sm:text-xs break-all font-bold block mt-0.5">
                      {plot.currentOwner}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/[0.06]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        WGS-84 Geo-Coordinates:
                      </span>
                      <span className="font-mono text-slate-300">
                        {plot.latitude}°N, {plot.longitude}°E
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Initial Registration Date:
                      </span>
                      <span className="font-mono text-slate-300">
                        {plot.registrationTimestamp
                          ? new Date(Number(plot.registrationTimestamp) * 1000).toLocaleDateString()
                          : 'Verified Genesis'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        IPFS Scanned Deed CID:
                      </span>
                      <button
                        onClick={() => copyToClipboard(plot.ipfsDeedHash, 'cid')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer shrink-0 print:hidden"
                      >
                        {copiedField === 'cid' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy CID</span>
                      </button>
                    </div>
                    <span className="font-mono text-slate-300 text-[11px] sm:text-xs break-all block mt-0.5">
                      {plot.ipfsDeedHash}
                    </span>
                  </div>
                </div>
              </div>

              {/* Procedural Deterministic QR Matrix & Treasury Seal */}
              <div className="bg-slate-950/85 p-4 sm:p-5 rounded-2xl border border-white/[0.08] flex sm:flex-col items-center justify-between sm:justify-between gap-4 text-left sm:text-center">
                <div className="flex flex-col items-center shrink-0">
                  <div className="bg-white p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-xl ring-4 ring-amber-500/20">
                    <svg width="92" height="92" viewBox="0 0 15 15" shapeRendering="crispEdges" className="sm:w-[105px] sm:h-[105px]">
                      {qrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx}
                              y={rIdx}
                              width="1"
                              height="1"
                              fill="#020617"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  </div>
                  <span className="hidden sm:block text-[10px] font-mono text-slate-400 mt-1.5">
                    Cryptographic QR Fingerprint
                  </span>
                </div>

                <div className="sm:mt-4 sm:pt-4 sm:border-t border-white/[0.08] w-full flex flex-col sm:items-center">
                  <span className="sm:hidden text-[10px] font-mono text-slate-400 mb-1">
                    Cryptographic QR Fingerprint
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs sm:text-[11px]">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>e-Stamp Certified</span>
                  </div>
                  <span className="text-[11px] sm:text-[10px] text-amber-400/90 font-medium mt-0.5">
                    Sindh Revenue Seal Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Ownership Chain */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-200 mb-3.5 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Immutable Chain of Title & Mutation History ({history.length})</span>
            </h4>

            {loadingHistory ? (
              <p className="text-xs text-slate-500">Querying cryptographic chain of title...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-500">Genesis allotment verified on-chain.</p>
            ) : (
              <div className="relative pl-5 sm:pl-6 space-y-3.5 sm:space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {history.map((record, idx) => {
                  const fromLabel = resolveWalletLabel(record.from);
                  const toLabel = resolveWalletLabel(record.to);
                  const hasConsideration = record.price && BigInt(record.price) > 0n;

                  return (
                    <div key={idx} className="relative text-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -left-[16px] sm:-left-[20px] top-2 shadow-sm shadow-emerald-400" />

                      <div className="bg-slate-950 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-bold text-emerald-300">
                            {record.reason ||
                              (idx === 0
                                ? 'Initial Government Allotment'
                                : 'Verified Atomic Escrow Transfer')}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(Number(record.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono text-[10px] sm:text-[11px] text-slate-300 break-words">
                          <p className="text-slate-500">
                            Grantor:{' '}
                            <span className="text-slate-300">
                              {record.from === ethers.ZeroAddress
                                ? 'Govt. of Sindh / KDA (Genesis)'
                                : `${shortenAddress(record.from, 8, 6)}${fromLabel ? ` (${fromLabel})` : ''}`}
                            </span>
                          </p>
                          <p className="text-slate-500">
                            Grantee:{' '}
                            <span className="text-emerald-400">
                              {shortenAddress(record.to, 8, 6)}
                              {toLabel ? ` (${toLabel})` : ''}
                            </span>
                          </p>
                          {hasConsideration && (
                            <p className="text-amber-400 font-sans font-semibold pt-0.5">
                              Settled Consideration: {formatEth(record.price)} (≈{' '}
                              {formatPkrFromWei(record.price)})
                            </p>
                          )}
                          {record.txHash && (
                            <p className="text-[10px] text-slate-500 pt-0.5">
                              Tx Hash: {shortenAddress(record.txHash, 10, 8)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#060b14] flex justify-between items-center gap-3 text-[11px] sm:text-xs text-slate-500 shrink-0 print:hidden">
          <span className="truncate">Keccak-256 Verified • Sovereign Sanad</span>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
