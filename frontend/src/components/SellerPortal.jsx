import React from 'react';
import {
  Home,
  FileText,
  Coins,
  Clock
} from 'lucide-react';
import {
  formatEth,
  formatPkrFromWei,
  formatPkrFromEth,
  toEthNumber,
  shortenAddress
} from '../utils/formatters';

export default function SellerPortal({
  plots,
  activeRole,
  isEmergencyFrozen,
  onListForSale,
  onDelist,
  onSelectPlot
}) {
  const myPlots = plots.filter(
    (p) =>
      activeRole?.address &&
      p.currentOwner.toLowerCase() === activeRole.address.toLowerCase()
  );

  const totalListedEth = myPlots.reduce((acc, p) => acc + toEthNumber(p.price), 0);
  const incomingEscrows = myPlots.filter((p) => Number(p.status) === 2).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Portfolio Header */}
      <div className="bg-white rounded-xl p-5 sm:p-7 border border-[#E4E4E0] shadow-[0_1px_3px_rgba(16,24,40,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#0B5D46] mb-1">
            Title Holder Portfolio & Listing Console
          </p>
          <h2 className="text-lg sm:text-2xl font-bold text-[#111315] tracking-[-0.02em]">
            My Registered Karachi Landholdings
          </h2>
          <p className="text-xs sm:text-[13px] text-zinc-600 mt-1.5 leading-relaxed">
            Manage your sovereign digital titles, publish properties for sale with atomic escrow settlement, monitor incoming buyer deposits, and export official Form-VII Sanads.
          </p>
        </div>

        {/* Portfolio Summary Metrics */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 tabular-nums">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 bg-[#FBFBFA] border border-[#E4E4E0] p-3.5 rounded-lg">
            <div className="p-2 rounded-lg bg-emerald-50 text-[#0B5D46] border border-emerald-200 shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 font-medium block">Titled Holdings</span>
              <span className="text-lg font-bold text-[#111315]">{myPlots.length} Parcels</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 bg-[#FBFBFA] border border-[#E4E4E0] p-3.5 rounded-lg">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 font-medium block">Listed Valuation</span>
              <span className="text-lg font-bold text-[#111315] font-mono">
                {totalListedEth.toFixed(1)} ETH
              </span>
              <span className="text-[10px] text-[#0B5D46] block font-medium">
                ≈ {formatPkrFromEth(totalListedEth)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Escrow Alert */}
      {incomingEscrows > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start sm:items-center gap-3 text-xs text-blue-950">
          <Clock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong className="font-semibold">Escrow Settlement Pending:</strong> You have{' '}
            <strong>{incomingEscrows}</strong> property deal(s) with buyer funds locked in the smart contract vault. Once the KDA Sub-Registrar stamps the transfer, ETH is released directly to your wallet.
          </span>
        </div>
      )}

      {/* Holdings Grid */}
      {myPlots.length === 0 ? (
        <div className="p-6 sm:p-10 text-center border border-dashed border-[#D4D4CE] rounded-xl bg-white max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-[#F4F4F1] text-zinc-500 flex items-center justify-center mx-auto mb-3.5 border border-[#E4E4E0]">
            <Home className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111315] mb-1">No Titled Parcels Found</h3>
          <p className="text-xs text-zinc-500 mb-5 max-w-md mx-auto">
            Active wallet <span className="font-mono text-[#111315]">{shortenAddress(activeRole?.address, 8, 6)}</span> ({activeRole?.name}) does not currently hold any registered parcels.
          </p>
          <div className="text-xs text-zinc-700 bg-[#FBFBFA] border border-[#E4E4E0] p-4 rounded-lg max-w-md mx-auto text-left space-y-1.5">
            <p className="font-semibold text-[#111315]">Sample Title Holder Accounts:</p>
            <p className="break-words">• <strong>Aamir Khan</strong> (<code className="text-[#0B5D46]">aamir.khan@gmail.com</code>) — Scheme 33, Clifton & DHA Phase 8</p>
            <p className="break-words">• <strong>Bilal Siddiqui</strong> (<code className="text-[#0B5D46]">bilal.siddiqui@gmail.com</code>) — Gulshan-e-Iqbal, Bahria Town & Surjani</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {myPlots.map((plot) => {
            const isListed = Number(plot.status) === 1 && !plot.isDisputed;
            const isEscrow = Number(plot.status) === 2;

            return (
              <div
                key={plot.id}
                className="bg-white border border-[#E4E4E0] hover:border-zinc-300 rounded-xl p-4 sm:p-5 transition flex flex-col justify-between shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <span className="inline-block text-[11px] font-mono font-semibold text-[#111315] bg-[#F4F4F1] border border-[#E4E4E0] px-2 py-0.5 rounded break-all">
                        {plot.kdaPlotNumber}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-[#111315] mt-2 leading-snug">
                        {plot.schemeName}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {plot.sector}, Plot #{plot.plotNumber}
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
                        Listed For Sale
                      </span>
                    ) : isEscrow ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        Escrow Locked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#065F46] border border-emerald-200 whitespace-nowrap shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                        Clean Title
                      </span>
                    )}
                  </div>

                  {plot.isDisputed && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 mb-3 break-words">
                      <strong>Court Injunction:</strong> {plot.disputeReason}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#F0F0EC] my-3 text-xs tabular-nums">
                    <div>
                      <span className="text-zinc-500">Surveyed Area</span>
                      <p className="font-semibold text-[#111315] mt-0.5">{plot.squareYards} Sq. Yards</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Zoning</span>
                      <p className="font-semibold text-[#0B5D46] uppercase mt-0.5">{plot.plotCategory}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Asking Price</span>
                      {isListed || isEscrow ? (
                        <div>
                          <p className="font-semibold text-[#111315] mt-0.5">{formatEth(plot.price)}</p>
                          <p className="text-[11px] text-zinc-500">≈ {formatPkrFromWei(plot.price)}</p>
                        </div>
                      ) : (
                        <p className="font-medium text-zinc-400 mt-0.5">Not Listed</p>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-500">Encumbrance</span>
                      <p className={`mt-0.5 font-semibold ${plot.isDisputed ? 'text-red-700' : 'text-[#065F46]'}`}>
                        {plot.isDisputed ? 'Restrained by Court' : 'Clear & Marketable'}
                      </p>
                    </div>
                  </div>

                  {isEscrow && (
                    <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-950 mb-4 space-y-1">
                      <p className="font-semibold">
                        Buyer Funds Locked in Smart Contract Vault
                      </p>
                      {plot.escrowBuyer && (
                        <p className="font-mono text-[11px] text-blue-800">
                          Buyer: {shortenAddress(plot.escrowBuyer, 10, 6)}
                        </p>
                      )}
                      <p className="text-[11px] text-blue-900/80">
                        Awaiting KDA Sub-Registrar certification to release {formatEth(plot.escrowAmount || plot.price)} to your wallet.
                      </p>
                    </div>
                  )}
                </div>

                {/* Owner Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-[#F0F0EC]">
                  {!plot.isDisputed && !isEscrow && (
                    <>
                      {isListed ? (
                        <button
                          onClick={() => onDelist(plot.id)}
                          className="w-full bg-[#F7F7F5] hover:bg-zinc-200/70 text-[#111315] text-xs font-semibold py-2 rounded-lg border border-[#D4D4CE] cursor-pointer"
                        >
                          Withdraw Marketplace Listing
                        </button>
                      ) : (
                        <button
                          disabled={isEmergencyFrozen}
                          onClick={() => onListForSale(plot)}
                          className="w-full bg-[#0B5D46] hover:bg-[#094B38] disabled:opacity-40 text-white text-xs font-semibold py-2.5 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          List Property for Sale
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => onSelectPlot(plot)}
                    className="w-full bg-white hover:bg-[#F7F7F5] text-[#111315] text-xs font-semibold py-2 rounded-lg border border-[#D4D4CE] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>Open Official Digital Sanad & History</span>
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
