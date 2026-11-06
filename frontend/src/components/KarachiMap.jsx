import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  AlertTriangle,
  Compass,
  Building2,
  Tag,
  Crosshair
} from 'lucide-react';
import { formatEth, formatPkrFromWei, shortenAddress } from '../utils/formatters';

export default function KarachiMap({ plots, onSelectPlot }) {
  const [selectedPlotId, setSelectedPlotId] = useState(null);
  const [mapFilter, setMapFilter] = useState('ALL');
  const [hoverCoords, setHoverCoords] = useState({ lat: '24.8607', lon: '67.0011' });

  // Project real Karachi Lat/Lon into safe canvas space [18%..82%] x [24%..78%] + collision offset
  const zonePins = useMemo(() => {
    if (!plots || plots.length === 0) return [];

    const minLat = 24.77;
    const maxLat = 25.07;
    const minLon = 66.98;
    const maxLon = 67.24;

    const rawPins = plots.map((p) => {
      const latNum = parseFloat(p.latitude);
      const lonNum = parseFloat(p.longitude);

      let x = 50;
      let y = 50;

      if (!isNaN(latNum) && !isNaN(lonNum) && latNum > 20 && lonNum > 60) {
        const normX = (lonNum - minLon) / (maxLon - minLon);
        const normY = 1 - (latNum - minLat) / (maxLat - minLat);
        x = Math.min(82, Math.max(18, normX * 64 + 18));
        y = Math.min(76, Math.max(25, normY * 51 + 25));
      } else {
        const seed = (Number(p.id) * 19 + (Number(p.plotNumber) || 3) * 13) % 100;
        x = 24 + ((seed * 7) % 52);
        y = 26 + ((seed * 11) % 48);
      }

      return { plot: p, x, y };
    });

    // Collision avoidance: nudge pins that fall within 8% distance of an earlier pin
    for (let i = 0; i < rawPins.length; i++) {
      for (let j = 0; j < i; j++) {
        const dx = rawPins[i].x - rawPins[j].x;
        const dy = rawPins[i].y - rawPins[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) {
          const angle = (i * 2.1) % (Math.PI * 2);
          rawPins[i].x = Math.min(82, Math.max(18, rawPins[i].x + Math.cos(angle) * 8));
          rawPins[i].y = Math.min(76, Math.max(25, rawPins[i].y + Math.sin(angle) * 8));
        }
      }
    }

    return rawPins.map(({ plot: p, x, y }) => {
      let statusLabel = 'Registered Title';
      let priceLabel = 'Private Holding';
      if (p.isDisputed) {
        statusLabel = 'High Court Stay Order';
        priceLabel = 'Frozen by Court';
      } else if (Number(p.status) === 1) {
        statusLabel = 'Listed For Sale';
        priceLabel = `${formatEth(p.price)} (${formatPkrFromWei(p.price)})`;
      } else if (Number(p.status) === 2) {
        statusLabel = 'Escrow Vault Locked';
        priceLabel = `Locked: ${formatEth(p.price)}`;
      }

      return {
        id: p.id,
        code: p.kdaPlotNumber,
        title: p.schemeName,
        subtitle: `${p.sector}, Plot #${p.plotNumber}`,
        x,
        y,
        isDisputed: p.isDisputed,
        isListed: Number(p.status) === 1 && !p.isDisputed,
        isCommercial: p.plotCategory === 'Commercial',
        statusLabel,
        priceLabel,
        size: `${p.squareYards} Sq. Yds`,
        category: p.plotCategory,
        rawPlot: p
      };
    });
  }, [plots]);

  const visiblePins = zonePins.filter((pin) => {
    if (mapFilter === 'FOR_SALE') return pin.isListed;
    if (mapFilter === 'DISPUTED') return pin.isDisputed;
    if (mapFilter === 'COMMERCIAL') return pin.isCommercial;
    return true;
  });

  const activePin =
    zonePins.find((z) => z.id === selectedPlotId) || visiblePins[0] || null;

  const updatePointerCoords = (clientX, clientY, currentTarget) => {
    const rect = currentTarget.getBoundingClientRect();
    const relX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const relY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    const lon = (66.98 + relX * 0.26).toFixed(4);
    const lat = (25.07 - relY * 0.30).toFixed(4);
    setHoverCoords({ lat, lon });
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* Header & Layer Toggles */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden p-5 sm:p-8 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30 whitespace-nowrap">
              Satellite Cadastral Telemetry
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-mono whitespace-nowrap">
              WGS-84 Geo-Grid • Karachi
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white mt-2">
            Karachi Tactical GIS & Parcel Radar
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            True GPS-projected land titles across KDA, DHA, Clifton, and Malir corridors.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 text-xs">
          {[
            { key: 'ALL', label: `All (${zonePins.length})` },
            { key: 'FOR_SALE', label: 'For Sale' },
            { key: 'COMMERCIAL', label: 'Commercial' },
            { key: 'DISPUTED', label: 'Stay Orders' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMapFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                mapFilter === tab.key
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/[0.08]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Radar Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* GIS Tactical Canvas */}
        <div
          onMouseMove={(e) => updatePointerCoords(e.clientX, e.clientY, e.currentTarget)}
          onTouchMove={(e) => {
            if (e.touches && e.touches[0]) {
              updatePointerCoords(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
            }
          }}
          className="lg:col-span-2 relative h-[380px] sm:h-[500px] bg-[#040811] border border-white/[0.08] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl p-3 sm:p-4 flex flex-col justify-between select-none touch-pan-y"
        >
          {/* Fine Cadastral Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b35_1px,transparent_1px),linear-gradient(to_bottom,#1e293b35_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:36px_36px]" />

          {/* Vector Karachi Coastline, Arterial Corridors & Radar Rings */}
          <svg
            viewBox="0 0 800 500"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
            preserveAspectRatio="none"
          >
            <circle cx="420" cy="240" r="95" fill="none" stroke="#10b981" strokeOpacity="0.14" strokeDasharray="4 4" />
            <circle cx="420" cy="240" r="190" fill="none" stroke="#10b981" strokeOpacity="0.12" strokeDasharray="4 4" />
            <circle cx="420" cy="240" r="285" fill="none" stroke="#14b8a6" strokeOpacity="0.08" />

            <path
              d="M 420 260 Q 540 160 740 55"
              fill="none"
              stroke="#38bdf8"
              strokeOpacity="0.25"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <path
              d="M 280 380 Q 450 320 660 280"
              fill="none"
              stroke="#10b981"
              strokeOpacity="0.25"
              strokeWidth="2"
            />
            <path
              d="M 0 410 Q 180 390 320 430 T 620 465 L 800 485 L 800 500 L 0 500 Z"
              fill="url(#seaGrad)"
              stroke="#06b6d4"
              strokeOpacity="0.35"
              strokeWidth="1.5"
            />
            <defs>
              <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#022c22" stopOpacity="0.45" />
              </linearGradient>
            </defs>
          </svg>

          {/* Subtle District Labels (Desktop/Tablet only so mobile stays crisp) */}
          <span className="hidden sm:block absolute top-16 right-10 text-[10px] font-mono uppercase tracking-widest text-slate-600 pointer-events-none">
            M-9 Corridor / Bahria & Scheme 33
          </span>
          <span className="hidden sm:block absolute top-14 left-12 text-[10px] font-mono uppercase tracking-widest text-slate-600 pointer-events-none">
            Surjani / North Karachi
          </span>
          <span className="hidden sm:block absolute bottom-10 left-6 text-[10px] font-mono tracking-widest text-cyan-400/60 uppercase font-bold pointer-events-none">
            Arabian Sea • Clifton & DHA Waterfront
          </span>

          {/* Top Telemetry HUD */}
          <div className="relative z-10 flex items-center justify-between gap-1.5 text-[10px] sm:text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-slate-300 shrink-0">
              <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" style={{ animationDuration: '18s' }} />
              <span>
                {hoverCoords.lat}°N, {hoverCoords.lon}°E
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-[10px] sm:text-[11px]">
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400" />
                <span className="hidden xs:inline sm:inline">Titled</span>
              </span>
              <span className="flex items-center gap-1 text-amber-300">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400" />
                <span>Sale</span>
              </span>
              <span className="flex items-center gap-1 text-rose-300">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Court</span>
              </span>
            </div>
          </div>

          {/* Interactive Parcel Pins */}
          <div className="absolute inset-0">
            {visiblePins.map((pin) => {
              const isSelected = activePin?.id === pin.id;
              return (
                <button
                  type="button"
                  key={pin.id}
                  onClick={() => setSelectedPlotId(pin.id)}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all p-1 ${
                    isSelected ? 'z-30' : 'z-20'
                  }`}
                >
                  <span
                    className={`absolute inset-0 rounded-full opacity-55 animate-ping ${
                      pin.isDisputed
                        ? 'bg-rose-500'
                        : pin.isListed
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />

                  <div
                    className={`relative p-2 sm:p-2.5 rounded-2xl border transition-all duration-200 transform group-hover:scale-125 shadow-xl ${
                      isSelected
                        ? 'bg-emerald-400 text-slate-950 border-white scale-115 sm:scale-125 ring-4 ring-emerald-500/35'
                        : pin.isDisputed
                        ? 'bg-rose-950 text-rose-300 border-rose-500'
                        : pin.isListed
                        ? 'bg-amber-950 text-amber-300 border-amber-400/80'
                        : 'bg-slate-900 text-emerald-300 border-emerald-500/60'
                    }`}
                  >
                    {pin.isDisputed ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : pin.isListed ? (
                      <Tag className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </div>

                  {/* On mobile, display label only on the selected beacon to avoid clutter */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 pointer-events-none whitespace-nowrap px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold shadow-lg transition-opacity ${
                      isSelected
                        ? 'block bg-emerald-400 text-slate-950 opacity-100'
                        : 'hidden sm:block bg-slate-950/90 text-slate-200 border border-slate-700 opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    {pin.code}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Bar */}
          <div className="relative z-10 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 bg-slate-950/60 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">1:25,000 • Karachi Grid</span>
            </span>
            <span className="shrink-0">Tap beacon to inspect</span>
          </div>
        </div>

        {/* Right Side Parcel Inspector + Quick List */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/[0.08] rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-2xl space-y-5">
          {activePin ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {activePin.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                    activePin.isDisputed
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : activePin.isListed
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {activePin.statusLabel}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">{activePin.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activePin.subtitle} •{' '}
                  <span className="text-emerald-400 font-semibold uppercase">
                    {activePin.category}
                  </span>
                </p>
              </div>

              <div className="bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-white/[0.06] space-y-2 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Surveyed Area:</span>
                  <span className="font-bold text-white">{activePin.size}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Valuation:</span>
                  <span className="font-bold text-amber-400 text-right">{activePin.priceLabel}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">GPS Coordinates:</span>
                  <span className="font-mono text-slate-300">
                    {activePin.rawPlot.latitude}°N, {activePin.rawPlot.longitude}°E
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Title Holder:</span>
                  <span className="font-mono text-emerald-300">
                    {shortenAddress(activePin.rawPlot.currentOwner, 6, 4)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectPlot(activePin.rawPlot)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Open Official Digital Sanad</span>
              </button>
            </div>
          ) : (
            <div className="my-auto text-center p-6 text-slate-400">
              <Navigation className="w-10 h-10 text-emerald-400/30 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No Parcels in Selected Layer</p>
            </div>
          )}

          {/* Quick Parcel Index */}
          <div className="pt-4 border-t border-white/[0.08]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Geo-Indexed Parcels ({visiblePins.length})
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {visiblePins.map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => setSelectedPlotId(pin.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                    activePin?.id === pin.id
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-white'
                      : 'bg-slate-950/50 hover:bg-slate-800/70 text-slate-300 border border-transparent'
                  }`}
                >
                  <span className="font-mono text-[11px] truncate">{pin.code}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">{pin.size}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
