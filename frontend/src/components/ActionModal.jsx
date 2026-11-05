import React, { useState, useEffect } from 'react';
import {
  X,
  Tag,
  ShieldCheck,
  ShieldAlert,
  Lock,
  ArrowRight,
  RotateCcw,
  Loader2,
  Scale,
  Coins,
  CheckCircle2
} from 'lucide-react';
import {
  formatEth,
  formatPkrFromEth,
  formatPkrFromWei,
  calculateSindhTransferTaxes,
  shortenAddress
} from '../utils/formatters';

export default function ActionModal({ modalState, onClose, onConfirm }) {
  const [priceEth, setPriceEth] = useState('2.5');
  const [courtBench, setCourtBench] = useState('Sindh High Court (Karachi Bench)');
  const [caseNumber, setCaseNumber] = useState('CP-D-814/2026');
  const [disputeDetails, setDisputeDetails] = useState('Interim injunction restraining alienation / third-party interest');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!modalState) return;
    setLocalError('');
    setSubmitting(false);
    if (modalState.type === 'LIST_PLOT') {
      const suggested =
        modalState.plot?.plotCategory === 'Commercial'
          ? '7.5'
          : Number(modalState.plot?.squareYards) >= 400
          ? '4.2'
          : '2.0';
      setPriceEth(suggested);
    }
  }, [modalState]);

  if (!modalState) return null;

  const { type, plot } = modalState;

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);

    try {
      if (type === 'LIST_PLOT') {
        const val = parseFloat(priceEth);
        if (isNaN(val) || val <= 0) {
          throw new Error('Please enter a valid positive price in ETH.');
        }
        await onConfirm({ priceEth: String(val) });
      } else if (type === 'FLAG_DISPUTE') {
        if (!caseNumber.trim()) {
          throw new Error('Judicial Case / Suit Number is required.');
        }
        const formattedReason = `${courtBench} — Order #${caseNumber.trim()} (${disputeDetails.trim() || 'Litigation Pending'})`;
        await onConfirm({ reason: formattedReason });
      } else {
        await onConfirm({});
      }
      onClose();
    } catch (err) {
      setLocalError(err.reason || err.message || 'Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const taxes = plot?.price ? calculateSindhTransferTaxes(plot.price) : null;
  const parsedEthInput = parseFloat(priceEth) || 0;
  const perSqYdPkr =
    plot?.squareYards && parsedEthInput > 0
      ? Math.round((parsedEthInput * 850000) / Number(plot.squareYards))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030711]/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0b1322] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#070c16] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {type === 'LIST_PLOT' && (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
            )}
            {type === 'DEPOSIT_ESCROW' && (
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
            )}
            {type === 'FLAG_DISPUTE' && (
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
            )}
            {type === 'CANCEL_ESCROW' && (
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
            )}

            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {type === 'LIST_PLOT' && 'List Property on Cadastral Marketplace'}
                {type === 'DEPOSIT_ESCROW' && 'Atomic Smart Contract Escrow Vault'}
                {type === 'FLAG_DISPUTE' && 'Enforce Judicial Stay Order'}
                {type === 'CANCEL_ESCROW' && 'Cancel Escrow & Claim Instant Refund'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {plot?.kdaPlotNumber} • {plot?.schemeName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-5 text-xs">
          {localError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {/* 1. LIST PLOT FOR SALE */}
          {type === 'LIST_PLOT' && (
            <>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.06] grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cadastral Size</span>
                  <span className="text-white font-bold text-sm">{plot.squareYards} Sq. Yards</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Zoning Category</span>
                  <span className="text-emerald-400 font-bold text-sm uppercase">{plot.plotCategory}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-200">Asking Price (ETH) *</label>
                  <div className="flex items-center gap-1">
                    {['1.5', '3.0', '5.0', '10.0'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPriceEth(preset)}
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] transition cursor-pointer ${
                          priceEth === preset
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {preset} ETH
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Coins className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus
                    value={priceEth}
                    onChange={(e) => setPriceEth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl pl-10 pr-16 py-3 text-base font-mono font-bold text-white focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-bold text-emerald-400">
                    ETH
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Estimated PKR Valuation:</span>
                  <span className="font-bold text-emerald-300 text-sm">
                    {formatPkrFromEth(parsedEthInput)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Implied Rate per Sq. Yard:</span>
                  <span className="font-mono text-slate-200">
                    PKR {perSqYdPkr.toLocaleString('en-PK')} / Sq. Yd
                  </span>
                </div>
              </div>
            </>
          )}

          {/* 2. DEPOSIT ATOMIC ESCROW */}
          {type === 'DEPOSIT_ESCROW' && plot && taxes && (
            <>
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Escrow Lock Amount:</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-base text-cyan-300 block">
                      {formatEth(plot.price)}
                    </span>
                    <span className="text-[11px] text-amber-400 font-semibold">
                      ≈ {formatPkrFromWei(plot.price)}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Seller (Current Title Holder):</span>
                    <span className="font-mono text-slate-200">{shortenAddress(plot.currentOwner, 8, 6)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Sindh Stamp Duty (2% Statutory Ref):</span>
                    <span className="font-mono text-slate-300">{taxes.formatCurrency(taxes.stampDutyPkr)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Capital Value Tax (1% CVT Ref):</span>
                    <span className="font-mono text-slate-300">{taxes.formatCurrency(taxes.cvtPkr)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-2.5 text-[11px] text-cyan-100 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Advance-Token Risk:</strong> Funds remain cryptographically locked inside the ZameenChain Vault. Seller receives 0 ETH until a KDA Sub-Registrar verifies clearance and transfers the Sanad to your wallet. You may cancel for a 100% refund anytime prior to stamping.
                </span>
              </div>
            </>
          )}

          {/* 3. FLAG COURT STAY ORDER */}
          {type === 'FLAG_DISPUTE' && plot && (
            <>
              {Number(plot.status) === 2 && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px]">
                  <strong>Automatic Buyer Protection:</strong> This parcel currently has an active buyer escrow. Enforcing this Stay Order will automatically refund 100% of locked ETH back to the buyer before freezing the title.
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Judicial Forum / Competent Court *</label>
                <select
                  value={courtBench}
                  onChange={(e) => setCourtBench(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Sindh High Court (Karachi Bench)">Sindh High Court (Karachi Bench)</option>
                  <option value="Supreme Court of Pakistan (Karachi Registry)">Supreme Court of Pakistan (Karachi Registry)</option>
                  <option value="Sindh Anti-Encroachment Tribunal">Sindh Anti-Encroachment Tribunal</option>
                  <option value="Senior Civil Judge & Rent Controller Karachi">Senior Civil Judge & Rent Controller Karachi</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Petition / Suit Order Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SHC-CP-D-814/2026"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Restraining Order Summary</label>
                <input
                  type="text"
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* 4. CANCEL ESCROW */}
          {type === 'CANCEL_ESCROW' && plot && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2 text-slate-300 leading-relaxed">
              <p>
                Are you sure you want to cancel the active escrow deal for{' '}
                <strong className="text-white font-mono">{plot.kdaPlotNumber}</strong>?
              </p>
              <p className="text-amber-300 font-semibold">
                Full locked deposit ({formatEth(plot.escrowAmount || plot.price)}) will be immediately refunded to the buyer wallet.
              </p>
            </div>
          )}

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg cursor-pointer ${
                type === 'FLAG_DISPUTE'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                  : type === 'DEPOSIT_ESCROW'
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-cyan-500/25'
                  : type === 'CANCEL_ESCROW'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {type === 'LIST_PLOT' && 'Sign & List on Blockchain'}
                {type === 'DEPOSIT_ESCROW' && `Lock ${formatEth(plot?.price)} in Escrow`}
                {type === 'FLAG_DISPUTE' && 'Freeze Title On-Chain'}
                {type === 'CANCEL_ESCROW' && 'Confirm & Refund ETH'}
              </span>
              {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
