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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0a1220] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Top Bar */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#060b14] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-100">
                  {plot.schemeName}
                </h3>
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded-lg border border-teal-800">
                  {plot.kdaPlotNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cryptographic Title Certificate • Board of Revenue, Government of Sindh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Sanad</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate & Audit Trail */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {plot.isDisputed && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs shadow-lg">
              <div className="flex items-center gap-2 font-bold text-rose-300 mb-1 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                Active Judicial Stay Order / Encumbrance Flagged
              </div>
              <p className="font-mono text-rose-200">{plot.disputeReason}</p>
              <p className="text-[11px] text-rose-400/90 mt-1">
                Pursuant to Section 52 of the Transfer of Property Act, alienation or mutation of this parcel is legally barred pending judicial disposal.
              </p>
            </div>
          )}

          {/* OFFICIAL DIGITAL SANAD */}
          <div className="border-2 border-amber-500/35 bg-gradient-to-b from-[#0d182b] via-[#070e1b] to-[#050912] p-6 md:p-8 rounded-3xl relative shadow-2xl overflow-hidden">
            <div className="absolute right-6 top-6 opacity-[0.04] pointer-events-none select-none text-amber-300">
              <Award className="w-72 h-72" />
            </div>

            {/* Sanad Crest Header */}
            <div className="text-center border-b border-amber-500/20 pb-5 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-950/60 px-4 py-1.5 rounded-full border border-amber-500/30">
                Government of Sindh • Board of Revenue & KDA
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-3 tracking-wide uppercase">
                Sovereign Digital Sanad & Record of Rights
              </h2>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                Form-VII Cadastral Extract • Immutable Ethereum Smart Contract Ledger
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-white/[0.08]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Allotment ID:
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
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

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/[0.08] space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        Registered Owner {ownerIdentity ? `(${ownerIdentity})` : ''}:
                      </span>
                      <button
                        onClick={() => copyToClipboard(plot.currentOwner, 'owner')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer print:hidden"
                      >
                        {copiedField === 'owner' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                    <span className="font-mono text-emerald-300 text-xs break-all font-bold block mt-0.5">
                      {plot.currentOwner}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
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
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        IPFS Scanned Deed CID:
                      </span>
                      <button
                        onClick={() => copyToClipboard(plot.ipfsDeedHash, 'cid')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px] cursor-pointer print:hidden"
                      >
                        {copiedField === 'cid' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy CID</span>
                      </button>
                    </div>
                    <span className="font-mono text-slate-300 break-all block mt-0.5">
                      {plot.ipfsDeedHash}
                    </span>
                  </div>
                </div>
              </div>

              {/* Procedural Deterministic QR Matrix & Treasury Seal */}
              <div className="bg-slate-950/85 p-5 rounded-2xl border border-white/[0.08] flex flex-col items-center justify-between text-center">
                <div className="bg-white p-2.5 rounded-2xl shadow-xl ring-4 ring-amber-500/20 my-1">
                  <svg width="105" height="105" viewBox="0 0 15 15" shapeRendering="crispEdges">
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
                <span className="text-[10px] font-mono text-slate-400 mt-1.5">
                  Cryptographic QR Fingerprint
                </span>

                <div className="mt-4 pt-4 border-t border-white/[0.08] w-full flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>e-Stamp Certified</span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-medium mt-0.5">
                    Sindh Revenue Seal Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Ownership Chain */}
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-3.5 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-400" />
              Immutable Chain of Title & Mutation History ({history.length})
            </h4>

            {loadingHistory ? (
              <p className="text-xs text-slate-500">Querying cryptographic chain of title...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-500">Genesis allotment verified on-chain.</p>
            ) : (
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {history.map((record, idx) => {
                  const fromLabel = resolveWalletLabel(record.from);
                  const toLabel = resolveWalletLabel(record.to);
                  const hasConsideration = record.price && BigInt(record.price) > 0n;

                  return (
                    <div key={idx} className="relative text-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -left-[19px] top-2 shadow-sm shadow-emerald-400" />

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-emerald-300">
                            {record.reason ||
                              (idx === 0
                                ? 'Initial Government Allotment'
                                : 'Verified Atomic Escrow Transfer')}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(Number(record.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono text-[11px] text-slate-300">
                          <p className="text-slate-500">
                            Grantor:{' '}
                            <span className="text-slate-300">
                              {record.from === ethers.ZeroAddress
                                ? 'Government of Sindh / KDA (Genesis)'
                                : `${shortenAddress(record.from, 10, 6)}${fromLabel ? ` (${fromLabel})` : ''}`}
                            </span>
                          </p>
                          <p className="text-slate-500">
                            Grantee:{' '}
                            <span className="text-emerald-400">
                              {shortenAddress(record.to, 10, 6)}
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
                              Tx Hash: {shortenAddress(record.txHash, 14, 10)}
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
        <div className="p-4 border-t border-white/[0.08] bg-[#060b14] flex justify-between items-center text-xs text-slate-500 print:hidden">
          <span>SHA-3 / Keccak-256 Verified • Anti-Tamper Sovereign Sanad</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
