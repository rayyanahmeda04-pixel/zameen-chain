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

  // Project real Karachi Lat/Lon into [12%..88%] canvas space + apply collision offset
  const zonePins = useMemo(() => {
    if (!plots || plots.length === 0) return [];

    // Karachi bounding box: Lat 24.77 (South Sea) -> 25.07 (North Bahria/Surjani)
    // Lon 66.98 (West) -> 67.24 (East Malir/BTK)
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
        x = Math.min(88, Math.max(14, normX * 74 + 14));
        y = Math.min(84, Math.max(14, normY * 70 + 14));
      } else {
        const seed = (Number(p.id) * 19 + (Number(p.plotNumber) || 3) * 13) % 100;
        x = 22 + ((seed * 7) % 58);
        y = 20 + ((seed * 11) % 58);
      }

      return { plot: p, x, y };
    });

    // Collision avoidance: nudge pins that fall within 6% distance of an earlier pin
    for (let i = 0; i < rawPins.length; i++) {
      for (let j = 0; j < i; j++) {
        const dx = rawPins[i].x - rawPins[j].x;
        const dy = rawPins[i].y - rawPins[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 6.5) {
          const angle = (i * 2.1) % (Math.PI * 2);
          rawPins[i].x = Math.min(88, Math.max(14, rawPins[i].x + Math.cos(angle) * 6.5));
          rawPins[i].y = Math.min(84, Math.max(14, rawPins[i].y + Math.sin(angle) * 6.5));
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

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const lon = (66.98 + relX * 0.26).toFixed(4);
    const lat = (25.07 - relY * 0.30).toFixed(4);
    setHoverCoords({ lat, lon });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Layer Toggles */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border border-white/[0.08] bg-gradient-to-br from-[#0c1626]/90 via-[#070c14]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              Satellite Cadastral Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">WGS-84 Geo-Grid • Karachi</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white mt-2">
            Karachi Tactical GIS & Parcel Radar
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            True GPS-projected land titles across Karachi Metropolitan Corporation, KDA, DHA, and Malir corridors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { key: 'ALL', label: `All Parcels (${zonePins.length})` },
            { key: 'FOR_SALE', label: 'For Sale' },
            { key: 'COMMERCIAL', label: 'Commercial' },
            { key: 'DISPUTED', label: 'Stay Orders' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMapFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GIS Tactical Canvas */}
        <div
          onMouseMove={handleMouseMove}
          className="lg:col-span-2 relative h-[500px] bg-[#040811] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between select-none"
        >
          {/* Fine Cadastral Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b35_1px,transparent_1px),linear-gradient(to_bottom,#1e293b35_1px,transparent_1px)] bg-[size:36px_36px]" />

          {/* Vector Karachi Coastline, Arterial Corridors & Radar Rings */}
          <svg
            viewBox="0 0 800 500"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
            preserveAspectRatio="none"
          >
            {/* Radar concentric circles */}
            <circle cx="420" cy="240" r="95" fill="none" stroke="#10b981" strokeOpacity="0.14" strokeDasharray="4 4" />
            <circle cx="420" cy="240" r="190" fill="none" stroke="#10b981" strokeOpacity="0.12" strokeDasharray="4 4" />
            <circle cx="420" cy="240" r="285" fill="none" stroke="#14b8a6" strokeOpacity="0.08" />

            {/* M-9 Super Highway Corridor (North-East) */}
            <path
              d="M 420 260 Q 540 160 740 55"
              fill="none"
              stroke="#38bdf8"
              strokeOpacity="0.25"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            {/* Shahrah-e-Faisal Corridor */}
            <path
              d="M 280 380 Q 450 320 660 280"
              fill="none"
              stroke="#10b981"
              strokeOpacity="0.25"
              strokeWidth="2"
            />
            {/* Arabian Sea Coastline (Clifton / DHA South) */}
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

          {/* Subtle District Labels */}
          <span className="absolute top-16 right-10 text-[10px] font-mono uppercase tracking-widest text-slate-600 pointer-events-none">
            M-9 Corridor / Bahria & Scheme 33
          </span>
          <span className="absolute top-14 left-12 text-[10px] font-mono uppercase tracking-widest text-slate-600 pointer-events-none">
            Surjani / North Karachi
          </span>
          <span className="absolute bottom-5 left-6 text-[10px] font-mono tracking-widest text-cyan-400/60 uppercase font-bold pointer-events-none">
            Arabian Sea • Clifton & DHA Waterfront
          </span>

          {/* Top Telemetry HUD */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-slate-300">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '18s' }} />
              <span>
                CURSOR: {hoverCoords.lat}°N, {hoverCoords.lon}°E
              </span>
            </div>
            <div className="flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Titled
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Listed
              </span>
              <span className="flex items-center gap-1.5 text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Stay Order
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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all ${
                    isSelected ? 'z-30' : 'z-20'
                  }`}
                >
                  <span
                    className={`absolute -inset-2 rounded-full opacity-60 animate-ping ${
                      pin.isDisputed
                        ? 'bg-rose-500'
                        : pin.isListed
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />

                  <div
                    className={`relative p-2.5 rounded-2xl border transition-all duration-200 transform group-hover:scale-125 shadow-xl ${
                      isSelected
                        ? 'bg-emerald-400 text-slate-950 border-white scale-125 ring-4 ring-emerald-500/35'
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

                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-full mt-1.5 pointer-events-none whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shadow-lg transition-opacity ${
                      isSelected
                        ? 'bg-emerald-400 text-slate-950 opacity-100'
                        : 'bg-slate-950/90 text-slate-200 border border-slate-700 opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    {pin.code}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Bar */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scale 1:25,000 • Collision-Free Parcel Projection</span>
            </span>
            <span>Select any beacon to inspect Sanad</span>
          </div>
        </div>

        {/* Right Side Parcel Inspector + Quick List */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between shadow-2xl space-y-5">
          {activePin ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {activePin.code}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
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
                <h3 className="text-lg font-bold text-white leading-snug">{activePin.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activePin.subtitle} •{' '}
                  <span className="text-emerald-400 font-semibold uppercase">
                    {activePin.category}
                  </span>
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/[0.06] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Surveyed Area:</span>
                  <span className="font-bold text-white">{activePin.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valuation:</span>
                  <span className="font-bold text-amber-400 text-right">{activePin.priceLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GPS Coordinates:</span>
                  <span className="font-mono text-slate-300">
                    {activePin.rawPlot.latitude}°N, {activePin.rawPlot.longitude}°E
                  </span>
                </div>
                <div className="flex justify-between">
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
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {visiblePins.map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => setSelectedPlotId(pin.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
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
