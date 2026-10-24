import React, { useState } from 'react';
import { MapPin, Navigation, ShieldCheck, AlertTriangle, ExternalLink, Compass, Layers, Building2 } from 'lucide-react';
import { ethers } from 'ethers';

export default function KarachiMap({ plots, onSelectPlot }) {
  const [selectedZone, setSelectedZone] = useState(null);

  // Helper to determine coordinates for any plot in Karachi
  const getCoordinates = (plot, index) => {
    const scheme = (plot.schemeName || '').toLowerCase();
    const code = (plot.kdaPlotNumber || '').toLowerCase();

    if (code.includes('sch33') || scheme.includes('scheme 33') || scheme.includes('saadi')) return { x: 65, y: 35 };
    if (code.includes('glshn') || scheme.includes('gulshan')) return { x: 55, y: 50 };
    if (code.includes('clftn') || scheme.includes('clifton')) return { x: 42, y: 82 };
    if (code.includes('surj') || scheme.includes('surjani')) return { x: 48, y: 18 };
    if (scheme.includes('north') || scheme.includes('nazimabad')) return { x: 46, y: 38 };
    if (scheme.includes('malir')) return { x: 74, y: 48 };
    if (scheme.includes('korangi')) return { x: 68, y: 68 };
    if (scheme.includes('dha') || scheme.includes('defence')) return { x: 48, y: 85 };

    // Fallback: derive pseudo-coordinates stably using plot id
    const pseudoSeed = (plot.id * 17 + (Number(plot.plotNumber) || 1) * 23) % 100;
    const x = 30 + ((pseudoSeed * 7) % 45); // between 30% and 75%
    const y = 25 + ((pseudoSeed * 11) % 50); // between 25% and 75%
    return { x, y };
  };

  const zonePins = plots && plots.length > 0 ? plots.map((p, idx) => {
    const coords = getCoordinates(p, idx);
    let statusText = "Registered Title";
    let priceText = "Not Listed";

    if (p.isDisputed) {
      statusText = "High Court Stay Order";
      priceText = "Frozen by Court";
    } else if (Number(p.status) === 1) {
      statusText = "Available for Sale";
      priceText = p.price ? `${ethers.formatEther(p.price)} ETH` : "Listed";
    } else if (Number(p.status) === 2) {
      statusText = "Escrow In Progress";
      priceText = p.price ? `In Escrow (${ethers.formatEther(p.price)} ETH)` : "In Escrow";
    }

    return {
      id: p.id,
      name: `${p.schemeName} (${p.sector}, Plot #${p.plotNumber})`,
      code: p.kdaPlotNumber,
      x: coords.x,
      y: coords.y,
      status: statusText,
      isDisputed: p.isDisputed,
      price: priceText,
      size: `${p.squareYards} Sq. Yds`,
      type: p.plotCategory,
      rawPlot: p
    };
  }) : [];

  const activePlot = selectedZone ? (selectedZone.rawPlot || plots.find((p) => p.kdaPlotNumber === selectedZone?.code)) : null;

  return (
    <div className="space-y-6">
      
      {/* Map Control Header */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              GIS Satellite Cadastre
            </span>
            <span className="text-xs text-slate-400 font-mono">Karachi Division • Survey 2026</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-2">
            Karachi Urban GIS & Land Parcel Navigator
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Interactive geo-referenced survey map. Click on any sector ping to inspect on-chain title deeds and legal clearance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
            <span className="font-medium">Clean Title</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500"></span>
            <span className="font-medium">Stay Order (Court)</span>
          </div>
        </div>
      </div>

      {/* Visual Karachi GIS Radar / Map Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Radar Map Canvas */}
        <div className="lg:col-span-2 relative h-[480px] bg-[#050912] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between">
          
          {/* Background Grid & Radar Sweep Aesthetics */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
          
          {/* Subtle coastline contour representation for Arabian Sea / Karachi */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-emerald-950/20 via-cyan-950/15 to-transparent pointer-events-none"></div>
          <span className="absolute bottom-4 left-6 text-[10px] font-mono tracking-widest text-emerald-400/50 uppercase font-bold">
            Arabian Sea Coastline • Karachi South Coast
          </span>

          {/* Top Info overlay */}
          <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '16s' }} />
              <span>LAT: 24.8607° N | LON: 67.0011° E (Karachi Division)</span>
            </div>
            <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-emerald-300 font-semibold shadow-sm">
              ZOOM: 1:25,000 Cadastral
            </div>
          </div>

          {/* Interactive Geographic Pins on Karachi Grid */}
          <div className="absolute inset-0">
            {zonePins.map((pin) => {
              const isSelected = selectedZone?.id === pin.id;
              return (
                <div
                  key={pin.id}
                  onClick={() => setSelectedZone(pin)}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  {/* Ping Animation Wave */}
                  <span className={`absolute -inset-2 rounded-full opacity-75 animate-ping ${
                    pin.isDisputed ? 'bg-rose-500' : 'bg-teal-400'
                  }`}></span>

                  {/* Marker Pin */}
                  <div className={`relative p-2.5 rounded-2xl border transition-all duration-200 transform group-hover:scale-125 shadow-xl ${
                    isSelected
                      ? 'bg-teal-400 text-slate-950 border-white scale-125 ring-4 ring-teal-500/40'
                      : pin.isDisputed
                      ? 'bg-rose-950 text-rose-300 border-rose-500'
                      : 'bg-slate-900 text-teal-300 border-teal-500/60 hover:border-teal-400'
                  }`}>
                    {pin.isDisputed ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </div>

                  {/* Pin Tooltip Tag */}
                  <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-opacity shadow-lg ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 opacity-100'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-700 opacity-80 group-hover:opacity-100'
                  }`}>
                    {pin.name.split(' (')[0]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Cadastral Legends */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400">
            <span>KDA Master Plan 2026 Cadastre</span>
            <span>Click any marker to inspect blockchain parcel</span>
          </div>

        </div>

        {/* Selected Parcel Inspector Side Panel */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
          {selectedZone ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {selectedZone.code}
                </span>
                {selectedZone.isDisputed ? (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Stay Order
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Verified Title
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {selectedZone.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category: <span className="text-emerald-400 font-semibold uppercase">{selectedZone.type}</span>
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/[0.06] space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Cadastral Area:</span>
                  <span className="font-bold text-white">{selectedZone.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Market Price:</span>
                  <span className="font-extrabold text-amber-400">{selectedZone.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Legal Status:</span>
                  <span className={selectedZone.isDisputed ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {selectedZone.isDisputed ? 'Frozen by Sindh High Court' : 'Clear & Unencumbered'}
                  </span>
                </div>
              </div>

              {activePlot && (
                <button
                  onClick={() => onSelectPlot(activePlot)}
                  className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Inspect Official Digital Sanad</span>
                </button>
              )}
            </div>
          ) : (
            <div className="my-auto text-center p-6 text-slate-400">
              <Navigation className="w-12 h-12 text-emerald-400/30 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-bold text-white mb-1">Select a Karachi Plot on Map</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">Click on any sector marker on the GIS Radar to inspect its on-chain title deed and survey record.</p>
            </div>
          )}

          <div className="pt-4 border-t border-white/[0.06] text-[11px] text-slate-400 flex justify-between font-medium">
            <span>Karachi GIS Sub-Registry</span>
            <span className="text-emerald-400 font-semibold">{zonePins.length} Geo-Tagged Parcels</span>
          </div>
        </div>

      </div>

    </div>
  );
}
