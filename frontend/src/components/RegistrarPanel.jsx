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
        `Plot ${formData.kdaPlotNumber.trim().toUpperCase()} minted and anchored on-chain!`
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
      setSuccessMsg(`Sub-Registrar ${officerForm.name} accredited on ZameenChain!`);
    } catch (err) {
      setErrorMsg(err.reason || err.message || 'Officer accreditation failed.');
    }
  };

  if (isPending) {
    return (
      <div className="bg-slate-900/90 border border-amber-800/70 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl animate-fadeIn">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6 rounded-2xl sm:rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
        </div>
        <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3.5 py-1 rounded-full">
          Security Vetting in Progress
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-slate-100 mt-4 mb-2">
          Awaiting Chief Administrator Clearance
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          Your Sub-Registrar application for <strong>{activeRole.name}</strong> has been logged. Primary plot minting and escrow certification activate once accredited by the Chief Administrator.
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl animate-fadeIn">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6 rounded-2xl sm:rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3.5 py-1 rounded-full">
          Restricted Sovereign Terminal
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-slate-100 mt-4 mb-2">
          KDA Sub-Registrar Authorization Required
        </h3>

        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          Primary land title minting, judicial stay order enforcement, and atomic escrow deed stamping require cryptographic signing keys issued to accredited{' '}
          <span className="text-slate-200 font-semibold">Karachi Development Authority (KDA)</span> officers.
        </p>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs mb-6 space-y-2 font-mono">
          <div className="flex justify-between gap-2 text-slate-400">
            <span>Active Session Wallet:</span>
            <span className="text-slate-300">{shortenAddress(activeRole?.address, 8, 6)}</span>
          </div>
          <div className="flex justify-between gap-2 text-slate-400">
            <span>Current Clearance Tier:</span>
            <span className="text-amber-400 font-semibold">{activeRole?.role || 'PUBLIC_CITIZEN'}</span>
          </div>
        </div>

        <button
          onClick={onSwitchToRegistrar}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          <span>Sign In with KDA Sub-Registrar Credentials</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Registrar Header */}
      <div className="bg-gradient-to-r from-[#0b1626] via-teal-950/35 to-[#08101c] border border-teal-500/40 p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="p-3 sm:p-3.5 rounded-2xl bg-teal-500/15 text-teal-300 border border-teal-500/30 shrink-0">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-white text-base sm:text-lg">
                KDA Sub-Registrar Terminal
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                SIGNER ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Directorate of Land Management • Minting, Deed Stamping & Officer Roster
            </p>
          </div>
        </div>

        <div className="text-left md:text-right text-xs font-mono bg-slate-950/70 px-3.5 py-2.5 rounded-2xl border border-white/[0.08] shrink-0">
          <span className="text-slate-400 block text-[10px] uppercase">Authorized Signing Key:</span>
          <span className="text-teal-300 font-bold">
            {shortenAddress(activeRole.address, 8, 6)}
          </span>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-white/[0.08] overflow-x-auto no-scrollbar">
        <button
          onClick={() => setPanelSection('mint')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
            panelSection === 'mint'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>Primary Allotment</span>
        </button>

        <button
          onClick={() => setPanelSection('escrows')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
            panelSection === 'escrows'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <FileCheck className="w-4 h-4 shrink-0" />
          <span>Escrow Stamping ({escrowPlots.length})</span>
        </button>

        <button
          onClick={() => setPanelSection('officers')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
            panelSection === 'officers'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Accredited Officers ({uniqueOfficers.length})</span>
        </button>
      </div>

      {/* Status Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-600 text-rose-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. PRIMARY PLOT ALLOTMENT */}
      {panelSection === 'mint' && (
        <div className="bg-slate-900/85 border border-white/[0.08] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Mint Primary Cadastral Land Title</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Digitize a surveyed parcel into the immutable blockchain cadastre. Duplicate KDA Allotment IDs are automatically rejected.
              </p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>Preset:</span>
              </span>
              {KARACHI_SCHEME_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applySchemePreset(preset)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-white/[0.06] text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePlotSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Unique Allotment ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KDA-SCH33-SEC05-P88"
                  value={formData.kdaPlotNumber}
                  onChange={(e) => setFormData({ ...formData, kdaPlotNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Karachi Housing Scheme *
                </label>
                <input
                  type="text"
                  required
                  value={formData.schemeName}
                  onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Sector / Block / Precinct *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:contents">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Plot Number *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    required
                    value={formData.plotNumber}
                    onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Area (Sq. Yds) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="40"
                    required
                    value={formData.squareYards}
                    onChange={(e) => setFormData({ ...formData, squareYards: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Zoning Category *
                </label>
                <select
                  value={formData.plotCategory}
                  onChange={(e) => setFormData({ ...formData, plotCategory: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Amenity">Public Amenity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 md:contents">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Latitude (°N) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Longitude (°E) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  IPFS Scanned Sanad CID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ipfsDeedHash}
                  onChange={(e) => setFormData({ ...formData, ipfsDeedHash: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Allottee Citizen Wallet Address *
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">Citizens:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
                        })
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono cursor-pointer"
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
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono cursor-pointer"
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
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono cursor-pointer"
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
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isEmergencyFrozen}
              className="w-full sm:w-auto mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 text-slate-950 font-bold text-xs px-7 py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Sign & Mint Sovereign Land Title
            </button>
          </form>
        </div>
      )}

      {/* 2. PENDING ESCROW STAMPING */}
      {panelSection === 'escrows' && (
        <div className="bg-slate-900/85 border border-white/[0.08] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Escrow Deeds Awaiting Certification</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify biometric clearance, tax challans, and non-encumbrance before releasing escrow funds.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              {escrowPlots.length} Awaiting
            </span>
          </div>

          {escrowPlots.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
              All escrow settlements are clear. When a buyer deposits ETH into Smart Escrow, the transfer dossier appears here for official certification.
            </div>
          ) : (
            <div className="space-y-4">
              {escrowPlots.map((plot) => (
                <div
                  key={plot.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/35 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 px-2.5 py-0.5 rounded border border-teal-800">
                        {plot.kdaPlotNumber}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {plot.schemeName} ({plot.sector}, Plot #{plot.plotNumber})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 font-mono">
                      <span>Seller: {shortenAddress(plot.currentOwner, 6, 4)}</span>
                      {plot.escrowBuyer && (
                        <span className="text-cyan-300">
                          Buyer: {shortenAddress(plot.escrowBuyer, 6, 4)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-amber-400 font-bold">
                      Locked: {formatEth(plot.escrowAmount || plot.price)} (≈{' '}
                      {formatPkrFromWei(plot.escrowAmount || plot.price)})
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <button
                      disabled={isEmergencyFrozen}
                      onClick={() => onApproveTransfer(plot.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs px-5 py-3 sm:py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Stamp Sanad & Release ETH</span>
                    </button>

                    <button
                      onClick={() => onCancelEscrow(plot)}
                      className="bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 cursor-pointer text-center"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-slate-900/85 border border-white/[0.08] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-400 shrink-0" />
              <span>Accredit Sub-Registrar Wallet Key</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Grant on-chain signing authority to an approved KDA Sub-Registrar officer.
            </p>

            <form onSubmit={handleOfficerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Officer Name & Official Designation *
                </label>
                <input
                  type="text"
                  required
                  value={officerForm.name}
                  onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Service Badge Number *
                </label>
                <input
                  type="text"
                  required
                  value={officerForm.badgeNumber}
                  onChange={(e) => setOfficerForm({ ...officerForm, badgeNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  District Sub-Registry Branch *
                </label>
                <input
                  type="text"
                  required
                  value={officerForm.districtBranch}
                  onChange={(e) =>
                    setOfficerForm({ ...officerForm, districtBranch: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Officer Ethereum Public Key *
                </label>
                <input
                  type="text"
                  required
                  value={officerForm.address}
                  onChange={(e) => setOfficerForm({ ...officerForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Authorize Officer On-Chain
              </button>
            </form>
          </div>

          <div className="bg-slate-900/85 border border-white/[0.08] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Building className="w-5 h-5 text-teal-400 shrink-0" />
              <span>Accredited Registrars ({uniqueOfficers.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Cryptographically authorized signing officers on the ZameenChain smart contract.
            </p>

            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {uniqueOfficers.map((off) => (
                <div
                  key={off.address}
                  className={`p-4 rounded-2xl bg-slate-950 border ${
                    off.isLead ? 'border-teal-500/40' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-100">{off.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                        off.isLead
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {off.isLead ? 'Lead Authority' : 'Accredited'}
                    </span>
                  </div>
                  <p className="text-xs text-teal-300 font-mono">Badge: {off.badgeNumber}</p>
                  <p className="text-xs text-slate-400 mt-1">{off.districtBranch}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">
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
