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

  const inputClass =
    'w-full bg-white border border-[#D4D4CE] focus:border-[#0B5D46] focus:ring-2 focus:ring-[#0B5D46]/15 rounded-lg px-3.5 py-2.5 text-[#111315] focus:outline-none transition';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/45 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#E4E4E0] w-full max-w-lg rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(16,24,40,0.18)] max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-[#E4E4E0] bg-[#FBFBFA] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {type === 'LIST_PLOT' && (
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-[#0B5D46] flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
            )}
            {type === 'DEPOSIT_ESCROW' && (
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
            )}
            {type === 'FLAG_DISPUTE' && (
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </div>
            )}
            {type === 'CANCEL_ESCROW' && (
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#111315] truncate">
                {type === 'LIST_PLOT' && 'List Property for Sale'}
                {type === 'DEPOSIT_ESCROW' && 'Atomic Escrow Vault'}
                {type === 'FLAG_DISPUTE' && 'Enforce Court Stay Order'}
                {type === 'CANCEL_ESCROW' && 'Cancel Escrow & Refund'}
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono truncate">
                {plot?.kdaPlotNumber} • {plot?.schemeName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white hover:bg-[#F4F4F1] text-zinc-500 hover:text-[#111315] border border-[#E4E4E0] transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleConfirm} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {localError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {/* 1. LIST PLOT FOR SALE */}
          {type === 'LIST_PLOT' && (
            <>
              <div className="p-3.5 rounded-lg bg-[#FBFBFA] border border-[#E4E4E0] grid grid-cols-2 gap-3 tabular-nums">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Cadastral Size</span>
                  <span className="text-[#111315] font-semibold text-sm">{plot.squareYards} Sq. Yds</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Approved Land Use</span>
                  <span className="text-[#0B5D46] font-semibold text-sm uppercase">{plot.plotCategory}</span>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="font-semibold text-[#111315]">Asking Price (ETH) *</label>
                  <div className="flex flex-wrap items-center gap-1">
                    {['1.5', '3.0', '5.0', '10.0'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPriceEth(preset)}
                        className={`px-2 py-0.5 rounded font-mono text-[10px] transition cursor-pointer border ${
                          priceEth === preset
                            ? 'bg-[#111315] text-white border-[#111315] font-semibold'
                            : 'bg-[#F7F7F5] text-zinc-700 border-[#E4E4E0] hover:bg-[#ECECE7]'
                        }`}
                      >
                        {preset} ETH
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Coins className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    required
                    value={priceEth}
                    onChange={(e) => setPriceEth(e.target.value)}
                    className={`${inputClass} pl-10 pr-16 text-base font-mono font-bold`}
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-zinc-500">
                    ETH
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#FBFBFA] border border-[#E4E4E0] space-y-1.5 tabular-nums">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600">Estimated PKR Valuation</span>
                  <span className="font-bold text-[#0B5D46] text-sm">
                    {formatPkrFromEth(parsedEthInput)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                  <span>Rate per Sq. Yard</span>
                  <span className="font-mono text-[#111315]">
                    PKR {perSqYdPkr.toLocaleString('en-PK')} / Sq. Yd
                  </span>
                </div>
              </div>
            </>
          )}

          {/* 2. DEPOSIT ATOMIC ESCROW */}
          {type === 'DEPOSIT_ESCROW' && plot && taxes && (
            <>
              <div className="p-3.5 sm:p-4 rounded-lg bg-[#FBFBFA] border border-[#E4E4E0] space-y-2.5 tabular-nums">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-600 font-medium">Escrow Lock Amount</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-[#111315] block">
                      {formatEth(plot.price)}
                    </span>
                    <span className="text-[11px] text-[#0B5D46] font-semibold">
                      ≈ {formatPkrFromWei(plot.price)}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[#E4E4E0] space-y-1.5 text-[11px]">
                  <div className="flex justify-between gap-2 text-zinc-500">
                    <span>Seller Wallet</span>
                    <span className="font-mono text-[#111315]">{shortenAddress(plot.currentOwner, 6, 4)}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-zinc-500">
                    <span>Sindh Stamp Duty (2%)</span>
                    <span className="font-mono text-zinc-700">{taxes.formatCurrency(taxes.stampDutyPkr)}</span>
                  </div>
                  <div className="flex justify-between gap-2 text-zinc-500">
                    <span>Capital Value Tax (1%)</span>
                    <span className="font-mono text-zinc-700">{taxes.formatCurrency(taxes.cvtPkr)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-start gap-2.5 text-[11px] text-blue-950 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Advance-Token Risk:</strong> Funds remain locked inside ZameenChain Vault until a KDA Sub-Registrar transfers the Sanad to your wallet. Cancel anytime prior to stamping for a 100% refund.
                </span>
              </div>
            </>
          )}

          {/* 3. FLAG COURT STAY ORDER */}
          {type === 'FLAG_DISPUTE' && plot && (
            <>
              {Number(plot.status) === 2 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                  <strong>Automatic Buyer Protection:</strong> Enforcing this Stay Order will automatically refund 100% of locked ETH back to the buyer before freezing the title.
                </div>
              )}

              <div>
                <label className="text-zinc-700 font-semibold block mb-1">Judicial Forum / Competent Court *</label>
                <select
                  value={courtBench}
                  onChange={(e) => setCourtBench(e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="Sindh High Court (Karachi Bench)">Sindh High Court (Karachi Bench)</option>
                  <option value="Supreme Court of Pakistan (Karachi Registry)">Supreme Court of Pakistan (Karachi Registry)</option>
                  <option value="Sindh Anti-Encroachment Tribunal">Sindh Anti-Encroachment Tribunal</option>
                  <option value="Senior Civil Judge & Rent Controller Karachi">Senior Civil Judge & Rent Controller Karachi</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-700 font-semibold block mb-1">Petition / Suit Order Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SHC-CP-D-814/2026"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="text-zinc-700 font-semibold block mb-1">Restraining Order Summary</label>
                <input
                  type="text"
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* 4. CANCEL ESCROW */}
          {type === 'CANCEL_ESCROW' && plot && (
            <div className="p-4 rounded-lg bg-[#FBFBFA] border border-[#E4E4E0] space-y-2 text-zinc-700 leading-relaxed">
              <p>
                Are you sure you want to cancel the active escrow deal for{' '}
                <strong className="text-[#111315] font-mono break-all">{plot.kdaPlotNumber}</strong>?
              </p>
              <p className="text-[#0B5D46] font-semibold">
                Full locked deposit ({formatEth(plot.escrowAmount || plot.price)}) will be immediately refunded to the buyer wallet.
              </p>
            </div>
          )}

          {/* Modal Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-[#F0F0EC]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-[#F7F7F5] border border-[#D4D4CE] text-[#111315] font-semibold transition cursor-pointer text-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer ${
                type === 'FLAG_DISPUTE'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : type === 'CANCEL_ESCROW'
                  ? 'bg-[#111315] hover:bg-[#27272A] text-white'
                  : 'bg-[#0B5D46] hover:bg-[#094B38] text-white'
              }`}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              <span>
                {type === 'LIST_PLOT' && 'Sign & List on Blockchain'}
                {type === 'DEPOSIT_ESCROW' && `Lock ${formatEth(plot?.price)} in Escrow`}
                {type === 'FLAG_DISPUTE' && 'Freeze Title On-Chain'}
                {type === 'CANCEL_ESCROW' && 'Confirm & Refund ETH'}
              </span>
              {!submitting && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
