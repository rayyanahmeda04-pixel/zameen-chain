import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, History, FileText, MapPin, AlertTriangle, ExternalLink, Calendar, Hash, QrCode, CheckCircle2, Award } from 'lucide-react';
import { ethers } from 'ethers';

export default function PlotModal({ plot, onClose, getAuditTrail }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!plot) return;
    let isMounted = true;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const trail = await getAuditTrail(plot.id);
        if (isMounted) {
          setHistory(trail || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };
    fetchHistory();
    return () => { isMounted = false; };
  }, [plot]);

  if (!plot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-100">{plot.schemeName}</h3>
                <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded-lg border border-teal-800">
                  {plot.kdaPlotNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">Official Cadastral Sanad • Government of Sindh Land Record</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          
          {/* Dispute Notice if applicable */}
          {plot.isDisputed && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs shadow-lg">
              <div className="flex items-center gap-2 font-bold text-rose-300 mb-1 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                Active Court Stay Order Flagged!
              </div>
              <p className="font-mono text-rose-300">{plot.disputeReason}</p>
              <p className="text-[11px] text-rose-400/80 mt-1">Under Section 52 of Transfer of Property Act, property cannot be transferred during lis pendens.</p>
            </div>
          )}

          {/* 📜 AUTHENTIC DIGITAL SANAD / CERTIFICATE OF TITLE */}
          <div className="border-2 border-amber-500/30 bg-gradient-to-b from-[#0c1626] via-[#070d18] to-[#050912] p-6 md:p-8 rounded-3xl relative shadow-2xl overflow-hidden">
            
            {/* Watermark Crest */}
            <div className="absolute right-6 top-6 opacity-5 pointer-events-none select-none text-amber-300">
              <Award className="w-80 h-80" />
            </div>

            {/* Sanad Header */}
            <div className="text-center border-b border-amber-500/20 pb-5 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-950/60 px-4 py-1.5 rounded-full border border-amber-500/30 shadow-sm">
                Government of Sindh • Revenue Department
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-3 tracking-wide uppercase">
                Digital Sanad of Allotment & Title Deed
              </h2>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                Karachi Development Authority (KDA) • Immutable Cadastre Verification
              </p>
            </div>

            {/* Sanad Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-white/[0.08]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">KDA Allotment ID:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{plot.kdaPlotNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Token ID:</span>
                    <span className="font-mono font-bold text-amber-400">#00{plot.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cadastral Area:</span>
                    <span className="font-bold text-white text-sm">{plot.squareYards} Square Yards</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Land Use Category:</span>
                    <span className="font-bold text-emerald-400 uppercase">{plot.plotCategory}</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/[0.08] space-y-2.5">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Owner (Title Holder):</span>
                    <span className="font-mono text-emerald-300 text-xs break-all font-bold">{plot.currentOwner}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Karachi Cadastre GPS:</span>
                    <span className="font-mono text-slate-300">{plot.latitude}, {plot.longitude} (Karachi Urban Grid)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">IPFS Deed Document CID:</span>
                    <span className="font-mono text-slate-300 break-all">{plot.ipfsDeedHash}</span>
                  </div>
                </div>
              </div>

              {/* Scannable Verification QR Code & Official Seal */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/[0.08] flex flex-col items-center justify-between text-center">
                
                {/* Visual QR Code box */}
                <div className="w-28 h-28 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center my-1 ring-4 ring-amber-500/20">
                  <div className="w-full h-full border-2 border-slate-950 flex flex-col items-center justify-center relative p-1">
                    <QrCode className="w-20 h-20 text-slate-950" />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1">Scan for Public Title Verification</span>

                {/* Stamp Duty Seal Badge */}
                <div className="mt-4 pt-4 border-t border-white/[0.08] w-full flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Stamp Duty Certified</span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-medium mt-0.5">Sindh Treasury Ledger Verified</span>
                </div>

              </div>

            </div>

          </div>

          {/* Blockchain Audit Trail / Ownership Chain */}
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-400" />
              Immutable Blockchain Audit Trail & Transfers
            </h4>

            {loadingHistory ? (
              <p className="text-xs text-slate-500">Loading blockchain history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-500">No transfer history recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {history.map((record, idx) => (
                  <div key={idx} className="relative text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400 absolute -left-[19px] top-1.5 shadow-sm shadow-teal-400" />
                    
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-teal-300">
                          {record.reason || (idx === 0 ? "Primary Government Allotment" : "Verified Blockchain Sale")}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(Number(record.timestamp) * 1000).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-1 font-mono text-[11px] text-slate-300">
                        <p className="text-slate-500">
                          From: <span className="text-slate-300">{record.from === ethers.ZeroAddress ? 'Karachi Land Authority (Genesis)' : `${record.from.slice(0, 16)}...`}</span>
                        </p>
                        <p className="text-slate-500">
                          To: <span className="text-emerald-400">{record.to}</span>
                        </p>
                        {Number(record.price) > 0 && (
                          <p className="text-amber-400 font-sans font-semibold">
                            Consideration: {ethers.formatEther(record.price)} ETH
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center text-xs text-slate-500">
          <span>KDA Blockchain Hash Verification • Tamper-Proof</span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition"
          >
            Close Sanad
          </button>
        </div>

      </div>
    </div>
  );
}
