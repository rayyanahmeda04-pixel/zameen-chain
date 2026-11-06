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
  resolveOwnerDisplayName,
  shortenAddress
} from '../utils/formatters';

export default function PlotModal({ plot, onClose, getAuditTrail }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [showFullOwnerKey, setShowFullOwnerKey] = useState(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/45 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#E4E4E0] w-full max-w-4xl rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(16,24,40,0.18)] max-h-[92dvh] flex flex-col">
        {/* Top Modal Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-[#E4E4E0] flex items-start sm:items-center justify-between gap-3 bg-[#FBFBFA] shrink-0 print:hidden">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0B5D46] flex items-center justify-center text-white shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="inline-block text-[10px] sm:text-[11px] font-mono font-semibold text-[#111315] bg-white px-2 py-0.5 rounded border border-[#D4D4CE] whitespace-nowrap mb-0.5">
                {plot.kdaPlotNumber}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#111315] leading-snug truncate">
                {plot.schemeName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              title="Print or Save PDF Sanad"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-white hover:bg-[#F4F4F1] text-[#111315] border border-[#D4D4CE] text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-600" />
              <span className="hidden sm:inline">Print Sanad</span>
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-lg bg-white hover:bg-[#F4F4F1] text-zinc-500 hover:text-[#111315] border border-[#E4E4E0] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Certificate & Audit Trail */}
        <div className="p-4 sm:p-6 md:p-7 overflow-y-auto space-y-6">
          {plot.isDisputed && (
            <div className="p-3.5 sm:p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1 text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Active Judicial Stay Order Flagged</span>
              </div>
              <p className="font-mono text-red-800 break-words">{plot.disputeReason}</p>
              <p className="text-[11px] text-red-700 mt-1">
                Pursuant to Section 52 of the Transfer of Property Act, alienation or mutation of this parcel is legally barred pending judicial disposal.
              </p>
            </div>
          )}

          {/* OFFICIAL ARCHIVAL SECURITY-PAPER DIGITAL SANAD */}
          <div className="border-2 border-[#D5CFC2] bg-[#FCFBF7] p-4 sm:p-6 md:p-8 rounded-xl relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-[0.04] pointer-events-none select-none text-[#0B5D46]">
              <Award className="w-44 h-44 sm:w-64 sm:h-64" />
            </div>

            {/* Sanad Crest Header */}
            <div className="text-center border-b border-[#E5DFD2] pb-4 sm:pb-5 mb-5">
              <span className="inline-block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0B5D46] bg-[#EEF5F1] px-3 py-1 rounded-full border border-[#C6DDD1]">
                Government of Sindh • Board of Revenue & KDA
              </span>
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#111315] mt-2.5 tracking-tight uppercase leading-snug">
                Sovereign Digital Sanad & Record of Rights
              </h2>
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                Form-VII Cadastral Extract • Immutable Ethereum Smart Contract Ledger
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 text-xs">
              <div className="md:col-span-2 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 sm:p-4 rounded-lg border border-[#E5DFD2] tabular-nums">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-semibold tracking-wider">
                      Allotment ID
                    </span>
                    <span className="font-mono font-semibold text-[#111315] text-xs sm:text-sm break-all mt-0.5 block">
                      {plot.kdaPlotNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-semibold tracking-wider">
                      Cadastral Token ID
                    </span>
                    <span className="font-mono font-semibold text-[#0B5D46] text-xs sm:text-sm mt-0.5 block">
                      #KHI-{String(plot.id).padStart(4, '0')}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-semibold tracking-wider">
                      Measured Area
                    </span>
                    <span className="font-semibold text-[#111315] text-sm mt-0.5 block">
                      {plot.squareYards} Square Yards
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase font-semibold tracking-wider">
                      Approved Land Use
                    </span>
                    <span className="font-semibold text-[#0B5D46] uppercase text-sm mt-0.5 block">
                      {plot.plotCategory}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-lg border border-[#E5DFD2] space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider">
                        Registered Title Holder
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#065F46] border border-emerald-200 shrink-0">
                        Verified Citizen
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FBFBFA] p-2.5 rounded-md border border-[#E5DFD2]">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[#111315]">
                          {resolveOwnerDisplayName(plot.currentOwner)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-zinc-600 break-all">
                            {showFullOwnerKey ? plot.currentOwner : shortenAddress(plot.currentOwner, 8, 6)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowFullOwnerKey(!showFullOwnerKey)}
                            className="text-[10px] text-[#0B5D46] hover:underline font-semibold cursor-pointer shrink-0 print:hidden"
                          >
                            {showFullOwnerKey ? 'Collapse' : 'Show Full Key'}
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(plot.currentOwner, 'owner')}
                        className="text-zinc-600 hover:text-[#111315] flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-white hover:bg-zinc-50 border border-[#D4D4CE] cursor-pointer shrink-0 self-start sm:self-auto print:hidden"
                        title="Copy public address to clipboard"
                      >
                        {copiedField === 'owner' ? (
                          <Check className="w-3.5 h-3.5 text-[#059669]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedField === 'owner' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-[#F0ECE1] tabular-nums">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold tracking-wider">
                        WGS-84 Geo-Coordinates
                      </span>
                      <span className="font-mono text-zinc-800 mt-0.5 block">
                        {plot.latitude}°N, {plot.longitude}°E
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-semibold tracking-wider">
                        Registration Date
                      </span>
                      <span className="font-mono text-zinc-800 mt-0.5 block">
                        {plot.registrationTimestamp
                          ? new Date(Number(plot.registrationTimestamp) * 1000).toLocaleDateString()
                          : 'Verified Genesis'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-[#F0ECE1]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider">
                        IPFS Scanned Deed CID
                      </span>
                      <button
                        onClick={() => copyToClipboard(plot.ipfsDeedHash, 'cid')}
                        className="text-zinc-500 hover:text-[#111315] flex items-center gap-1 text-[10px] cursor-pointer shrink-0 print:hidden"
                      >
                        {copiedField === 'cid' ? (
                          <Check className="w-3 h-3 text-[#059669]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy CID</span>
                      </button>
                    </div>
                    <span className="font-mono text-zinc-700 text-[11px] break-all block mt-0.5">
                      {plot.ipfsDeedHash}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deterministic QR Fingerprint & Official Treasury Seal */}
              <div className="bg-white p-4 sm:p-5 rounded-lg border border-[#E5DFD2] flex sm:flex-col items-center justify-between gap-4 text-left sm:text-center">
                <div className="flex flex-col items-center shrink-0">
                  <div className="bg-white p-2 rounded-lg border border-[#E5DFD2]">
                    <svg width="88" height="88" viewBox="0 0 15 15" shapeRendering="crispEdges" className="sm:w-[104px] sm:h-[104px]">
                      {qrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx}
                              y={rIdx}
                              width="1"
                              height="1"
                              fill="#111315"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  </div>
                  <span className="hidden sm:block text-[10px] font-mono text-zinc-500 mt-1.5">
                    Cryptographic QR Seal
                  </span>
                </div>

                <div className="sm:mt-3 sm:pt-3 sm:border-t border-[#F0ECE1] w-full flex flex-col sm:items-center">
                  <span className="sm:hidden text-[10px] font-mono text-zinc-500 mb-1">
                    Cryptographic QR Seal
                  </span>
                  <div className="flex items-center gap-1.5 text-[#065F46] font-semibold text-xs sm:text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>e-Stamp Certified</span>
                  </div>
                  <span className="text-[11px] sm:text-[10px] text-zinc-500 font-medium mt-0.5">
                    Sindh Revenue Treasury Seal
                  </span>
                </div>
              </div>
            </div>

            {Number(plot.status) === 2 && (
              <div className="mt-3.5 p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="truncate">
                    <strong>Dual-Signature Escrow Active:</strong> Title mutation requires 2-of-2 signatures (KDA Endorsement + Board Countersign).
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-blue-200 shrink-0">
                  {plot.transferApproval?.endorsedBy ? '1/2 Endorsed' : '0/2 Endorsed'}
                </span>
              </div>
            )}
          </div>

          {/* Immutable Ownership Chain */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#111315] mb-3.5 flex items-center gap-2">
              <History className="w-4 h-4 text-[#0B5D46] shrink-0" />
              <span>Immutable Chain of Title & Mutation History ({history.length})</span>
            </h4>

            {loadingHistory ? (
              <p className="text-xs text-zinc-500">Querying cryptographic chain of title...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-zinc-500">Genesis allotment verified on-chain.</p>
            ) : (
              <div className="relative pl-5 sm:pl-6 space-y-3 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#E4E4E0]">
                {history.map((record, idx) => {
                  const fromLabel = resolveWalletLabel(record.from);
                  const toLabel = resolveWalletLabel(record.to);
                  const hasConsideration = record.price && BigInt(record.price) > 0n;

                  return (
                    <div key={idx} className="relative text-xs">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0B5D46] ring-4 ring-white absolute -left-[15px] sm:-left-[19px] top-3" />

                      <div className="bg-[#FBFBFA] p-3.5 rounded-lg border border-[#E4E4E0] space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-semibold text-[#111315]">
                            {record.reason ||
                              (idx === 0
                                ? 'Initial Government Allotment'
                                : 'Verified Atomic Escrow Transfer')}
                          </span>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono tabular-nums">
                            <Calendar className="w-3 h-3" />
                            {new Date(Number(record.timestamp) * 1000).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono text-[11px] text-zinc-600 break-words">
                          <p>
                            Grantor:{' '}
                            <span className="text-[#111315]">
                              {record.from === ethers.ZeroAddress
                                ? 'Govt. of Sindh / KDA (Genesis)'
                                : `${shortenAddress(record.from, 8, 6)}${fromLabel ? ` (${fromLabel})` : ''}`}
                            </span>
                          </p>
                          <p>
                            Grantee:{' '}
                            <span className="text-[#0B5D46] font-semibold">
                              {shortenAddress(record.to, 8, 6)}
                              {toLabel ? ` (${toLabel})` : ''}
                            </span>
                          </p>
                          {hasConsideration && (
                            <p className="text-[#111315] font-sans font-semibold pt-0.5 tabular-nums">
                              Settled Consideration: {formatEth(record.price)} (≈{' '}
                              {formatPkrFromWei(record.price)})
                            </p>
                          )}
                          {record.txHash && (
                            <p className="text-[10px] text-zinc-400 pt-0.5">
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
        <div className="px-4 py-3 sm:px-6 border-t border-[#E4E4E0] bg-[#FBFBFA] flex justify-between items-center gap-3 text-[11px] sm:text-xs text-zinc-500 shrink-0 print:hidden">
          <span className="truncate">Keccak-256 Verified • Sindh Sovereign Sanad</span>
          <button
            onClick={onClose}
            className="px-4 sm:px-5 py-2 rounded-lg bg-[#111315] hover:bg-[#27272A] text-white text-xs font-semibold cursor-pointer transition whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
