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

    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < rawPins.length; i++) {
        for (let j = 0; j < i; j++) {
          const dx = rawPins[i].x - rawPins[j].x;
          const dy = rawPins[i].y - rawPins[j].y;
          if (Math.abs(dx) < 16 && Math.abs(dy) < 15) {
            const angle = (i * 1.9 + 0.4) % (Math.PI * 2);
            rawPins[i].x = Math.min(82, Math.max(18, rawPins[i].x + Math.cos(angle) * 10));
            rawPins[i].y = Math.min(76, Math.max(24, rawPins[i].y + Math.sin(angle) * 10));
          }
        }
      }
    }

    return rawPins.map(({ plot: p, x, y }) => {
      let statusLabel = 'Clean Title';
      let priceLabel = 'Private Holding';
      if (p.isDisputed) {
        statusLabel = 'SHC Stay Order';
        priceLabel = 'Frozen by Court';
      } else if (Number(p.status) === 1) {
        statusLabel = 'Listed For Sale';
        priceLabel = `${formatEth(p.price)} (${formatPkrFromWei(p.price)})`;
      } else if (Number(p.status) === 2) {
        statusLabel = 'Escrow Locked';
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
    <div className="space-y-5 animate-fadeIn">
      {/* Header & Layer Toggles */}
      <div className="bg-white border border-[#E4E4E0] rounded-xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(16,24,40,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-zinc-500 mb-1">
            <span className="text-[#0B5D46] font-semibold uppercase tracking-[0.06em]">
              Cadastral GIS Survey
            </span>
            <span>•</span>
            <span className="font-mono">WGS-84 Projection</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#111315] tracking-[-0.02em]">
            Karachi Metropolitan Parcel Map
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            Geo-referenced land titles across KDA, DHA, Clifton, Gulshan, Surjani, and Bahria corridors.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
          {[
            { key: 'ALL', label: `All Parcels (${zonePins.length})` },
            { key: 'FOR_SALE', label: 'For Sale' },
            { key: 'COMMERCIAL', label: 'Commercial' },
            { key: 'DISPUTED', label: 'Stay Orders' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMapFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                mapFilter === tab.key
                  ? 'bg-[#111315] text-white font-semibold'
                  : 'bg-[#F7F7F5] hover:bg-[#ECECE7] text-zinc-700 border border-[#E4E4E0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cartographic Map + Parcel Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Realistic Cartographic Light Cadastral Canvas */}
        <div
          onMouseMove={(e) => updatePointerCoords(e.clientX, e.clientY, e.currentTarget)}
          onTouchMove={(e) => {
            if (e.touches && e.touches[0]) {
              updatePointerCoords(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
            }
          }}
          className="lg:col-span-2 relative h-[380px] sm:h-[490px] bg-[#F1EFE7] border border-[#DFDDD4] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(16,24,40,0.04)] p-3 sm:p-4 flex flex-col justify-between select-none touch-pan-y"
        >
          {/* Survey Gridlines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2DFD5_1px,transparent_1px),linear-gradient(to_bottom,#E2DFD5_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Cartographic Terrain, Parks, Highways, Rivers & Arabian Sea */}
          <svg
            viewBox="0 0 800 500"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            {/* Subtle Green Belts / Parks */}
            <polygon points="440,120 560,95 590,175 470,195" fill="#E3ECE1" opacity="0.7" />
            <polygon points="150,90 250,75 270,150 165,165" fill="#E3ECE1" opacity="0.6" />

            {/* Malir & Lyari River Channels */}
            <path
              d="M 650 0 Q 560 190 430 435"
              fill="none"
              stroke="#C9E0F2"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 290 0 Q 270 180 195 395"
              fill="none"
              stroke="#C9E0F2"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Major Arterial Highways (Double-cased Mapbox style) */}
            {/* M-9 Super Highway */}
            <path d="M 380 260 Q 545 155 770 35" fill="none" stroke="#D5D0C3" strokeWidth="6" />
            <path d="M 380 260 Q 545 155 770 35" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />

            {/* Shahrah-e-Faisal */}
            <path d="M 220 390 Q 430 315 720 265" fill="none" stroke="#D5D0C3" strokeWidth="6" />
            <path d="M 220 390 Q 430 315 720 265" fill="none" stroke="#FEF9C3" strokeWidth="3.5" />

            {/* Northern Bypass / Surjani Link */}
            <path d="M 110 140 Q 280 160 460 215" fill="none" stroke="#D5D0C3" strokeWidth="4.5" />
            <path d="M 110 140 Q 280 160 460 215" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />

            {/* Arabian Sea Coastline & DHA / Clifton Waterfront */}
            <path
              d="M 0 395 Q 165 378 305 422 T 610 462 L 800 482 L 800 500 L 0 500 Z"
              fill="#D5E7F5"
              stroke="#93C5FD"
              strokeWidth="2"
            />
          </svg>

          {/* Cartographic District Labels */}
          <span className="hidden sm:block absolute top-16 right-10 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 pointer-events-none">
            M-9 Corridor • Scheme 33 & Bahria
          </span>
          <span className="hidden sm:block absolute top-16 left-10 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 pointer-events-none">
            Surjani & North Nazimabad
          </span>
          <span className="hidden sm:block absolute bottom-8 left-6 text-[10px] font-semibold tracking-[0.14em] text-sky-800/70 uppercase pointer-events-none">
            Arabian Sea • Clifton & DHA
          </span>

          {/* Top Map Telemetry Bar */}
          <div className="relative z-10 flex items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-[#D4D4CE] text-[#111315] shadow-xs shrink-0 tabular-nums">
              <Compass className="w-3.5 h-3.5 text-[#0B5D46] shrink-0" />
              <span>
                {hoverCoords.lat}°N, {hoverCoords.lon}°E
              </span>
            </div>

            <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-[#D4D4CE] text-[10px] sm:text-[11px] font-sans font-medium text-zinc-700 shadow-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0B5D46]" />
                <span className="hidden sm:inline">Titled</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Sale</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>Stay</span>
              </span>
            </div>
          </div>

          {/* Interactive Parcel Markers */}
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
                  <div
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white flex items-center justify-center transition-transform duration-200 shadow-[0_3px_10px_rgba(0,0,0,0.22)] group-hover:scale-110 ${
                      isSelected
                        ? 'scale-115 ring-4 ring-[#111315]/15 bg-[#111315] text-white'
                        : pin.isDisputed
                        ? 'bg-red-600 text-white'
                        : pin.isListed
                        ? 'bg-amber-500 text-white'
                        : 'bg-[#0B5D46] text-white'
                    }`}
                  >
                    {pin.isDisputed ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : pin.isListed ? (
                      <Tag className="w-3.5 h-3.5" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Callout Label */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 pointer-events-none whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold shadow-sm border transition-opacity ${
                      isSelected
                        ? 'block bg-[#111315] text-white border-[#111315]'
                        : 'hidden sm:block bg-white/95 text-[#111315] border-[#D4D4CE] opacity-90 group-hover:opacity-100'
                    }`}
                  >
                    {pin.code}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Scale Bar */}
          <div className="relative z-10 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-700 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-[#DFDDD4]">
            <span className="flex items-center gap-1.5 font-medium">
              <Crosshair className="w-3 h-3 text-[#0B5D46] shrink-0" />
              <span>Scale 1:25,000 • KDA Survey Grid</span>
            </span>
            <span className="text-zinc-500">Select marker to inspect</span>
          </div>
        </div>

        {/* Right Side Parcel Inspector */}
        <div className="bg-white border border-[#E4E4E0] rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-5">
          {activePin ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-semibold text-[#111315] bg-[#F4F4F1] px-2 py-0.5 rounded border border-[#E4E4E0]">
                  {activePin.code}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                    activePin.isDisputed
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : activePin.isListed
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-[#065F46] border-emerald-200'
                  }`}
                >
                  {activePin.statusLabel}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#111315] leading-snug">{activePin.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {activePin.subtitle} •{' '}
                  <span className="text-[#0B5D46] font-semibold uppercase">
                    {activePin.category}
                  </span>
                </p>
              </div>

              <div className="bg-[#FBFBFA] p-3.5 rounded-lg border border-[#E4E4E0] space-y-2 text-xs tabular-nums">
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500">Surveyed Area</span>
                  <span className="font-semibold text-[#111315]">{activePin.size}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500">Valuation</span>
                  <span className="font-semibold text-[#111315] text-right">{activePin.priceLabel}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500">Coordinates</span>
                  <span className="font-mono text-zinc-700">
                    {activePin.rawPlot.latitude}°N, {activePin.rawPlot.longitude}°E
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-500">Owner Wallet</span>
                  <span className="font-mono text-[#0B5D46] font-medium">
                    {shortenAddress(activePin.rawPlot.currentOwner, 6, 4)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectPlot(activePin.rawPlot)}
                className="w-full bg-[#111315] hover:bg-[#27272A] text-white font-semibold text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Open Official Digital Sanad</span>
              </button>
            </div>
          ) : (
            <div className="my-auto text-center p-6 text-zinc-500">
              <Navigation className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#111315]">No Parcels in Layer</p>
            </div>
          )}

          {/* Quick Parcel Index */}
          <div className="pt-4 border-t border-[#E4E4E0]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400 mb-2">
              Indexed Parcels ({visiblePins.length})
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              {visiblePins.map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => setSelectedPlotId(pin.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                    activePin?.id === pin.id
                      ? 'bg-[#F4F4F1] border border-[#D4D4CE] text-[#111315] font-semibold'
                      : 'hover:bg-zinc-50 text-zinc-600 border border-transparent'
                  }`}
                >
                  <span className="font-mono text-[11px] truncate">{pin.code}</span>
                  <span className="text-[10px] text-zinc-400 shrink-0 ml-2 tabular-nums">{pin.size}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
