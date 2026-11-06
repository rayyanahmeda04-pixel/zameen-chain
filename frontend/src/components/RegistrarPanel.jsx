import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  PlusCircle,
  UserPlus,
  Users,
  Building,
  MapPin
} from 'lucide-react';
import { formatEth, formatPkrFromWei, shortenAddress } from '../utils/formatters';

const KARACHI_SCHEME_PRESETS = [
  {
    label: 'Scheme 33',
    prefix: 'KDA-SCH33-SEC05-P',
    schemeName: 'Scheme 33 - Saadi Town',
    sector: 'Sector 5',
    lat: '24.9812',
    lon: '67.1420'
  },
  {
    label: 'DHA Phase 8',
    prefix: 'DHA-PH8-ZNC-P',
    schemeName: 'DHA Phase 8 - Creek Vista',
    sector: 'Zone C',
    lat: '24.7895',
    lon: '67.0680'
  },
  {
    label: 'Gulshan-e-Iqbal',
    prefix: 'KDA-GLSHN-BLK13D-P',
    schemeName: 'Gulshan-e-Iqbal',
    sector: 'Block 13-D',
    lat: '24.9215',
    lon: '67.0890'
  },
  {
    label: 'Bahria Town',
    prefix: 'MDA-BTK-PRC10-P',
    schemeName: 'Bahria Town Karachi',
    sector: 'Precinct 10-A',
    lat: '25.0350',
    lon: '67.1985'
  },
  {
    label: 'North Nazimabad',
    prefix: 'KDA-NNZ-BLKH-P',
    schemeName: 'North Nazimabad',
    sector: 'Block H',
    lat: '24.9380',
    lon: '67.0425'
  }
];

export default function RegistrarPanel({
  plots,
  activeRole,
  isEmergencyFrozen,
  onSwitchToRegistrar,
  onRegisterPlot,
  onRegisterOfficer,
  onApproveTransfer,
  onCancelEscrow,
  officers = []
}) {
  const isAuthorized =
    (activeRole?.role === 'REGISTRAR' &&
      (activeRole?.status === 'ACTIVE' || !activeRole?.status)) ||
    activeRole?.role === 'ADMIN';
  const isPending =
    activeRole?.role === 'REGISTRAR' && activeRole?.status === 'PENDING_APPROVAL';

  const [panelSection, setPanelSection] = useState('mint');
  const [presetSeq, setPresetSeq] = useState(188);

  const [formData, setFormData] = useState({
    kdaPlotNumber: 'KDA-SCH33-SEC05-P88',
    schemeName: 'Scheme 33 - Saadi Town',
    sector: 'Sector 5',
    plotNumber: '88',
    squareYards: '240',
    plotCategory: 'Residential',
    latitude: '24.9812',
    longitude: '67.1420',
    owner: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    ipfsDeedHash: 'QmKarachiVerifiedAllotmentSanad2026'
  });

  const [officerForm, setOfficerForm] = useState({
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    name: 'Engr. Muhammad Farhan (Sub-Registrar)',
    badgeNumber: 'KDA-SR-042',
    districtBranch: 'KDA Scheme 33 Sub-Registry Division'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const escrowPlots = plots.filter((p) => Number(p.status) === 2);

  const uniqueOfficers = useMemo(() => {
    const map = new Map();
    map.set('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      name: 'Engr. Tariq Mansoor (Chief Sub-Registrar)',
      badgeNumber: 'KDA-SR-001',
      districtBranch: 'KDA Civic Centre Main Secretariat, Karachi',
      isLead: true
    });
    officers.forEach((o) => {
      if (o?.address) {
        const key = o.address.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { ...o, isLead: false });
        }
      }
    });
    return Array.from(map.values());
  }, [officers]);

  const applySchemePreset = (preset) => {
    const nextNum = presetSeq + 7;
    setPresetSeq(nextNum);
    setFormData((prev) => ({
      ...prev,
      kdaPlotNumber: `${preset.prefix}${nextNum}`,
      schemeName: preset.schemeName,
      sector: preset.sector,
      plotNumber: String(nextNum),
      latitude: preset.lat,
      longitude: preset.lon
    }));
  };

  const handlePlotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const duplicate = plots.some(
      (p) => p.kdaPlotNumber.toUpperCase() === formData.kdaPlotNumber.trim().toUpperCase()
    );
    if (duplicate) {
      setErrorMsg(
        `ANTI-FRAUD REJECTION: Allotment ID "${formData.kdaPlotNumber}" already exists in the Karachi Cadastre. Duplicate minting blocked.`
      );
      return;
    }

    try {
      await onRegisterPlot(formData);
      setSuccessMsg(
        `Plot ${formData.kdaPlotNumber.trim().toUpperCase()} minted and anchored on-chain.`
      );
      const nextNum = Number(formData.plotNumber || 100) + 1;
      setFormData((prev) => ({
        ...prev,
        plotNumber: String(nextNum),
        kdaPlotNumber: prev.kdaPlotNumber.replace(/\d+$/, String(nextNum))
      }));
    } catch (err) {
      setErrorMsg(err.reason || err.message || 'Plot registration failed.');
    }
  };

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await onRegisterOfficer(officerForm);
      setSuccessMsg(`Sub-Registrar ${officerForm.name} accredited on ZameenChain.`);
    } catch (err) {
      setErrorMsg(err.reason || err.message || 'Officer accreditation failed.');
    }
  };

  const inputClass =
    'w-full bg-white border border-[#D4D4CE] focus:border-[#0B5D46] focus:ring-2 focus:ring-[#0B5D46]/15 rounded-lg px-3 py-2 text-xs text-[#111315] focus:outline-none transition';

  if (isPending) {
    return (
      <div className="bg-white border border-amber-200 rounded-xl p-6 sm:p-10 text-center max-w-xl mx-auto shadow-[0_1px_3px_rgba(16,24,40,0.04)] animate-fadeIn">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
          Security Vetting in Progress
        </span>
        <h3 className="text-lg sm:text-xl font-bold text-[#111315] mt-3 mb-1.5">
          Awaiting Chief Administrator Clearance
        </h3>
        <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed">
          Your Sub-Registrar application for <strong>{activeRole.name}</strong> has been logged. Primary plot minting and escrow certification activate once accredited by the Chief Administrator.
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-white border border-[#E4E4E0] rounded-xl p-6 sm:p-10 text-center max-w-xl mx-auto shadow-[0_1px_3px_rgba(16,24,40,0.04)] animate-fadeIn">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#F4F4F1] border border-[#E4E4E0] text-zinc-700 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>

        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 bg-[#F4F4F1] border border-[#E4E4E0] px-2.5 py-0.5 rounded-full">
          Restricted Authority Desk
        </span>

        <h3 className="text-lg sm:text-xl font-bold text-[#111315] mt-3 mb-1.5">
          KDA Sub-Registrar Authorization Required
        </h3>

        <p className="text-xs sm:text-[13px] text-zinc-600 mb-5 leading-relaxed">
          Primary land title minting, judicial stay-order enforcement, and atomic escrow deed stamping require cryptographic signing keys issued to accredited{' '}
          <strong className="text-[#111315]">Karachi Development Authority (KDA)</strong> officers.
        </p>

        <div className="bg-[#FBFBFA] p-3.5 rounded-lg border border-[#E4E4E0] text-left text-xs mb-5 space-y-1.5 font-mono">
          <div className="flex justify-between gap-2 text-zinc-500">
            <span>Active Session Wallet</span>
            <span className="text-[#111315]">{shortenAddress(activeRole?.address, 8, 6)}</span>
          </div>
          <div className="flex justify-between gap-2 text-zinc-500">
            <span>Current Clearance</span>
            <span className="text-amber-700 font-semibold">{activeRole?.role || 'PUBLIC_CITIZEN'}</span>
          </div>
        </div>

        <button
          onClick={onSwitchToRegistrar}
          className="w-full bg-[#111315] hover:bg-[#27272A] text-white font-semibold text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <KeyRound className="w-4 h-4" />
          <span>Sign In with KDA Sub-Registrar Credentials</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Registrar Header */}
      <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-[#0B5D46] border border-emerald-200 shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-[#111315] text-base sm:text-lg">
                KDA Sub-Registrar Terminal
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#065F46] border border-emerald-200 whitespace-nowrap">
                Signer Active
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Directorate of Land Management • Deed Minting, Escrow Stamping & Officer Roster
            </p>
          </div>
        </div>

        <div className="text-left md:text-right text-xs font-mono bg-[#FBFBFA] px-3.5 py-2 rounded-lg border border-[#E4E4E0] shrink-0">
          <span className="text-zinc-500 block text-[10px] font-sans font-medium">Authorized Signing Key</span>
          <span className="text-[#111315] font-semibold">
            {shortenAddress(activeRole.address, 8, 6)}
          </span>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#EDEDEA] border border-[#E4E4E0] overflow-x-auto no-scrollbar max-w-full">
        <button
          onClick={() => setPanelSection('mint')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
            panelSection === 'mint'
              ? 'bg-white text-[#111315] font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-[#111315]'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Primary Allotment</span>
        </button>

        <button
          onClick={() => setPanelSection('escrows')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
            panelSection === 'escrows'
              ? 'bg-white text-[#111315] font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-[#111315]'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Escrow Stamping ({escrowPlots.length})</span>
        </button>

        <button
          onClick={() => setPanelSection('officers')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
            panelSection === 'officers'
              ? 'bg-white text-[#111315] font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-[#111315]'
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span>Accredited Officers ({uniqueOfficers.length})</span>
        </button>
      </div>

      {/* Status Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[#065F46] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. PRIMARY PLOT ALLOTMENT */}
      {panelSection === 'mint' && (
        <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#F0F0EC] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#111315]">
                Mint Primary Cadastral Land Title
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Digitize a surveyed parcel into the immutable blockchain cadastre. Duplicate KDA Allotment IDs are automatically rejected.
              </p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
              <span className="text-zinc-500 font-medium flex items-center gap-1 mr-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#0B5D46]" />
                <span>Preset:</span>
              </span>
              {KARACHI_SCHEME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applySchemePreset(preset)}
                  className="px-2.5 py-1 rounded-md bg-[#F7F7F5] hover:bg-[#ECECE7] text-zinc-700 border border-[#E4E4E0] text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePlotSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">
                  Unique Allotment ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KDA-SCH33-SEC05-P88"
                  value={formData.kdaPlotNumber}
                  onChange={(e) => setFormData({ ...formData, kdaPlotNumber: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">
                  Karachi Housing Scheme *
                </label>
                <input
                  type="text"
                  required
                  value={formData.schemeName}
                  onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">
                  Sector / Block / Precinct *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:contents">
                <div>
                  <label className="text-xs font-medium text-zinc-700 block mb-1">
                    Plot Number *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    required
                    value={formData.plotNumber}
                    onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 block mb-1">
                    Area (Sq. Yds) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="40"
                    required
                    value={formData.squareYards}
                    onChange={(e) => setFormData({ ...formData, squareYards: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">
                  Zoning Category *
                </label>
                <select
                  value={formData.plotCategory}
                  onChange={(e) => setFormData({ ...formData, plotCategory: e.target.value })}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Amenity">Public Amenity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 md:contents">
                <div>
                  <label className="text-xs font-medium text-zinc-700 block mb-1">
                    Latitude (°N) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className={`${inputClass} font-mono`}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 block mb-1">
                    Longitude (°E) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">
                  IPFS Scanned Sanad CID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ipfsDeedHash}
                  onChange={(e) => setFormData({ ...formData, ipfsDeedHash: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <label className="text-xs font-medium text-zinc-700">
                    Allottee Citizen Wallet Address *
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-zinc-500">Quick Fill:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-[#F7F7F5] hover:bg-[#ECECE7] border border-[#E4E4E0] text-zinc-700 font-medium cursor-pointer"
                    >
                      Aamir Khan
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          owner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-[#F7F7F5] hover:bg-[#ECECE7] border border-[#E4E4E0] text-zinc-700 font-medium cursor-pointer"
                    >
                      Bilal Siddiqui
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          owner: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
                        })
                      }
                      className="px-2 py-0.5 rounded bg-[#F7F7F5] hover:bg-[#ECECE7] border border-[#E4E4E0] text-zinc-700 font-medium cursor-pointer"
                    >
                      Hamza Sheikh
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isEmergencyFrozen}
              className="w-full sm:w-auto bg-[#0B5D46] hover:bg-[#094B38] disabled:opacity-40 text-white font-semibold text-xs px-6 py-2.5 rounded-lg transition shadow-xs cursor-pointer"
            >
              Sign & Mint Sovereign Land Title
            </button>
          </form>
        </div>
      )}

      {/* 2. PENDING ESCROW STAMPING */}
      {panelSection === 'escrows' && (
        <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#111315]">
                Escrow Deeds Awaiting Certification
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Verify biometric clearance, tax challans, and non-encumbrance before releasing escrow funds.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0 tabular-nums">
              {escrowPlots.length} Awaiting
            </span>
          </div>

          {escrowPlots.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#D4D4CE] rounded-lg bg-[#FBFBFA] text-zinc-500 text-xs">
              All escrow settlements are clear. When a buyer deposits ETH into Smart Escrow, the transfer dossier appears here for certification.
            </div>
          ) : (
            <div className="space-y-3.5">
              {escrowPlots.map((plot) => (
                <div
                  key={plot.id}
                  className="p-4 rounded-xl bg-[#FBFBFA] border border-[#E4E4E0] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 tabular-nums">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-[#111315] bg-white px-2 py-0.5 rounded border border-[#E4E4E0]">
                        {plot.kdaPlotNumber}
                      </span>
                      <span className="text-sm font-bold text-[#111315]">
                        {plot.schemeName} ({plot.sector}, Plot #{plot.plotNumber})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500 font-mono">
                      <span>Seller: {shortenAddress(plot.currentOwner, 6, 4)}</span>
                      {plot.escrowBuyer && (
                        <span className="text-blue-700">
                          Buyer: {shortenAddress(plot.escrowBuyer, 6, 4)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#0B5D46] font-semibold">
                      Vault Locked: {formatEth(plot.escrowAmount || plot.price)} (≈{' '}
                      {formatPkrFromWei(plot.escrowAmount || plot.price)})
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button
                      disabled={isEmergencyFrozen}
                      onClick={() => onApproveTransfer(plot.id)}
                      className="bg-[#0B5D46] hover:bg-[#094B38] disabled:opacity-40 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Stamp Sanad & Release ETH</span>
                    </button>

                    <button
                      onClick={() => onCancelEscrow(plot)}
                      className="bg-white hover:bg-red-50 text-red-700 text-xs font-semibold px-4 py-2.5 rounded-lg border border-[#D4D4CE] hover:border-red-200 cursor-pointer text-center"
                    >
                      Reject & Refund Buyer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. OFFICER ACCREDITATION */}
      {panelSection === 'officers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
            <h3 className="text-base font-bold text-[#111315] mb-1 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#0B5D46] shrink-0" />
              <span>Accredit Sub-Registrar Wallet Key</span>
            </h3>
            <p className="text-xs text-zinc-500 mb-5">
              Grant on-chain signing authority to an approved KDA Sub-Registrar officer.
            </p>

            <form onSubmit={handleOfficerSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-700 block mb-1 font-medium">
                  Officer Name & Official Designation *
                </label>
                <input
                  type="text"
                  required
                  value={officerForm.name}
                  onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-zinc-700 block mb-1 font-medium">
                  Service Badge Number *
                </label>
                <input
                  type="text"
                  required
                  value={officerForm.badgeNumber}
                  onChange={(e) => setOfficerForm({ ...officerForm, badgeNumber: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <div>
                <label className="text-zinc-700 block mb-1 font-medium">
                  District Sub-Registry Branch *
                </label>
                <input
                  type="text"
                  required
                  value={officerForm.districtBranch}
                  onChange={(e) =>
                    setOfficerForm({ ...officerForm, districtBranch: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-zinc-700 block mb-1 font-medium">
                  Officer Ethereum Public Key *
                </label>
                <input
                  type="text"
                  required
                  value={officerForm.address}
                  onChange={(e) => setOfficerForm({ ...officerForm, address: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#111315] hover:bg-[#27272A] text-white font-semibold py-2.5 rounded-lg transition shadow-xs cursor-pointer"
              >
                Authorize Officer On-Chain
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
            <h3 className="text-base font-bold text-[#111315] mb-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0B5D46] shrink-0" />
              <span>Accredited Registrars ({uniqueOfficers.length})</span>
            </h3>
            <p className="text-xs text-zinc-500 mb-5">
              Cryptographically authorized signing officers on the ZameenChain smart contract.
            </p>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {uniqueOfficers.map((off) => (
                <div
                  key={off.address}
                  className="p-3.5 rounded-lg bg-[#FBFBFA] border border-[#E4E4E0]"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs sm:text-sm text-[#111315]">{off.name}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                        off.isLead
                          ? 'bg-[#111315] text-white border-[#111315]'
                          : 'bg-emerald-50 text-[#065F46] border-emerald-200'
                      }`}
                    >
                      {off.isLead ? 'Lead Authority' : 'Accredited'}
                    </span>
                  </div>
                  <p className="text-xs text-[#0B5D46] font-mono font-medium">Badge: {off.badgeNumber}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{off.districtBranch}</p>
                  <p className="text-[11px] font-mono text-zinc-400 mt-1 truncate">
                    Key: {off.address}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
