import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Lock, KeyRound, AlertTriangle, CheckCircle2, FileCheck, PlusCircle, UserPlus, Users, Building } from 'lucide-react';
import { ethers } from 'ethers';

export default function RegistrarPanel({
  plots,
  activeRole,
  onSwitchToRegistrar,
  onRegisterPlot,
  onRegisterOfficer,
  onApproveTransfer,
  onCancelEscrow,
  officers = []
}) {
  const isAuthorized = activeRole?.role === 'REGISTRAR' && (activeRole?.status === 'ACTIVE' || !activeRole?.status);
  const isPending = activeRole?.role === 'REGISTRAR' && activeRole?.status === 'PENDING_APPROVAL';

  const [panelSection, setPanelSection] = useState('officers'); // 'officers', 'mint', 'escrows'

  // Form for Plot Minting
  const [formData, setFormData] = useState({
    kdaPlotNumber: '',
    schemeName: 'Scheme 33 - Saadi Town',
    sector: 'Sector 5',
    plotNumber: '88',
    squareYards: '240',
    plotCategory: 'Residential',
    latitude: '24.9812',
    longitude: '67.1420',
    owner: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    ipfsDeedHash: 'QmKarachiNewAllotmentLetterVerifiedDeed2026'
  });

  // Form for Officer Registration
  const [officerForm, setOfficerForm] = useState({
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    name: 'Muhammad Farhan (Sub-Registrar)',
    badgeNumber: 'KDA-SR-042',
    districtBranch: 'KDA Scheme 33 Sub-Registry Division'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const escrowPlots = plots.filter((p) => Number(p.status) === 2);

  const handlePlotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const isDuplicate = plots.some(
      (p) => p.kdaPlotNumber.toUpperCase() === formData.kdaPlotNumber.trim().toUpperCase()
    );

    if (isDuplicate) {
      setErrorMsg(`🚨 FRAUD BLOCKED: KDA Plot ID "${formData.kdaPlotNumber}" is already registered on-chain! Duplicate allotment rejected.`);
      return;
    }

    try {
      await onRegisterPlot({
        ...formData,
        kdaPlotNumber: formData.kdaPlotNumber.trim().toUpperCase(),
        plotNumber: Number(formData.plotNumber),
        squareYards: Number(formData.squareYards)
      });
      setSuccessMsg(`✅ Success! Plot ${formData.kdaPlotNumber} has been minted as an immutable land title.`);
      setFormData((prev) => ({ ...prev, kdaPlotNumber: '', plotNumber: '' }));
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (onRegisterOfficer) {
        await onRegisterOfficer(officerForm);
        setSuccessMsg(`✅ Officer ${officerForm.name} (${officerForm.badgeNumber}) officially accredited on blockchain!`);
        setOfficerForm((prev) => ({ ...prev, badgeNumber: `KDA-SR-0${Math.floor(Math.random() * 80 + 10)}` }));
      }
    } catch (err) {
      setErrorMsg(err.message || 'Officer registration failed');
    }
  };

  // ⏳ PENDING CLEARANCE FOR UNAPPROVED REGISTRAR APPLICANTS
  if (isPending) {
    return (
      <div className="bg-slate-900/90 border border-amber-500/40 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl animate-fadeIn">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3.5 py-1 rounded-full">
          Accreditation Clearance Pending
        </span>

        <h3 className="text-2xl font-black text-slate-100 mt-4 mb-2">
          Officer Application Under Vetting
        </h3>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Aapka Sub-Registrar account create ho chuka hai, magar terminal access ke liye 
          <span className="text-amber-400 font-bold"> Chief Admin (Rayyan Ahmed)</span> ki approval zaroori hai.
        </p>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs mb-6 space-y-2 font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Officer Name:</span>
            <span className="text-slate-100 font-bold font-sans">{activeRole?.name}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Application Status:</span>
            <span className="text-amber-400 font-bold">PENDING_APPROVAL ⏳</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Vetting Authority:</span>
            <span className="text-slate-200">👑 Rayyan Ahmed (Chief Administrator)</span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Rayyan Ahmed apne Chief Admin portal ke Vetting Desk se aapke credentials verify karke <strong>Approve</strong> karenge, tab aapka terminal automatically unlock hoga.
        </p>
      </div>
    );
  }

  // 🔒 ACCESS DENIED FOR UNAUTHORIZED USERS
  if (!isAuthorized) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl animate-fadeIn">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
          <Lock className="w-10 h-10" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-rose-400 bg-rose-950/60 border border-rose-800/60 px-3.5 py-1 rounded-full">
          Restricted Government Intranet
        </span>

        <h3 className="text-2xl font-black text-slate-100 mt-4 mb-2">
          Access Denied: KDA Officer Only
        </h3>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          This portal is reserved exclusively for the <span className="text-slate-200 font-semibold">Government of Sindh / Karachi Development Authority</span> Sub-Registrar. 
          Your active wallet does not possess the cryptographic <code className="text-rose-300 font-mono text-xs bg-slate-950 px-2 py-0.5 rounded">REGISTRAR_ROLE</code>.
        </p>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs mb-8 space-y-2 font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Your Active Address:</span>
            <span className="text-slate-300 truncate max-w-[200px]">{activeRole?.address || 'Unknown'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Your Assigned Role:</span>
            <span className="text-amber-400 font-semibold">{activeRole?.name || 'Citizen / Public'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Access Clearance:</span>
            <span className="text-rose-400 font-bold">⛔ Unauthorized</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 text-left">
          <p className="text-xs text-teal-300 font-medium mb-3">
            💡 <strong>University Presentation Tip:</strong> Show the examiner how Role-Based Access Control (RBAC) works. Click below to authenticate with the government officer's cryptographic key:
          </p>
          <button
            onClick={onSwitchToRegistrar}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Authenticate as KDA Registrar (Officer Key)</span>
          </button>
        </div>
      </div>
    );
  }

  // ✅ AUTHORIZED REGISTRAR CONSOLE
  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Officer Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/30 to-slate-900 border border-teal-500/40 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-100 text-sm">Karachi Development Authority (KDA) Registrar Terminal</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                OFFICER AUTHENTICATED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Government of Sindh • Officer Accreditation, Allotment Minting & Deed Certification</p>
          </div>
        </div>

        <div className="text-right text-xs font-mono">
          <span className="text-slate-500 block text-[10px]">Active Officer Key:</span>
          <span className="text-teal-400 font-bold">{activeRole.address.slice(0, 8)}...{activeRole.address.slice(-6)}</span>
        </div>
      </div>

      {/* Internal Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setPanelSection('officers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            panelSection === 'officers'
              ? 'bg-teal-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Officer Registration & Badges</span>
        </button>

        <button
          onClick={() => setPanelSection('mint')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            panelSection === 'mint'
              ? 'bg-teal-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Primary Plot Allotment</span>
        </button>

        <button
          onClick={() => setPanelSection('escrows')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            panelSection === 'escrows'
              ? 'bg-teal-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Pending Escrow Stamping ({escrowPlots.length})</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SUB-SECTION 1: OFFICER REGISTRATION & ACCREDITATION */}
      {panelSection === 'officers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Register New Officer Form */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-3xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-400" />
              Onboard & Accredit KDA Sub-Registrar
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Grant cryptographic authorization to a government officer to mint deeds and certify title transfers on-chain.
            </p>

            <form onSubmit={handleOfficerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Officer Full Name & Designation *</label>
                <input
                  type="text"
                  required
                  value={officerForm.name}
                  onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Official Badge ID / Service Number *</label>
                <input
                  type="text"
                  required
                  value={officerForm.badgeNumber}
                  onChange={(e) => setOfficerForm({ ...officerForm, badgeNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Sub-Registry District Division / Branch *</label>
                <input
                  type="text"
                  required
                  value={officerForm.districtBranch}
                  onChange={(e) => setOfficerForm({ ...officerForm, districtBranch: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Officer Ethereum Public Wallet Key *</label>
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
                className="w-full mt-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                Register & Authorize Officer on Blockchain
              </button>
            </form>
          </div>

          {/* List of Accredited Officers */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-3xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Building className="w-5 h-5 text-teal-400" />
              Accredited KDA Officers Roster
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Active Sub-Registrars authorized to sign cadastral titles in Karachi.
            </p>

            <div className="space-y-4">
              {/* Primary Lead Officer */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-teal-500/40">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-100">Tariq Mansoor (Chief Sub-Registrar)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    Lead Authority
                  </span>
                </div>
                <p className="text-xs text-teal-300 font-mono">Badge: KDA-SR-001</p>
                <p className="text-xs text-slate-400 mt-1">KDA Civic Centre Main Secretariat, Karachi</p>
                <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">Key: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266</p>
              </div>

              {/* Dynamically Registered Officers */}
              {officers.map((off, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-100">{off.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Active Officer
                    </span>
                  </div>
                  <p className="text-xs text-teal-300 font-mono">Badge: {off.badgeNumber}</p>
                  <p className="text-xs text-slate-400 mt-1">{off.districtBranch}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-1 truncate">Key: {off.address}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SUB-SECTION 2: PRIMARY PLOT ALLOTMENT */}
      {panelSection === 'mint' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-teal-400" />
            Primary Allotment & Land Title Minting
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Record a freshly surveyed plot into the permanent blockchain ledger. Double allotment is cryptographically prohibited.
          </p>

          <form onSubmit={handlePlotSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">
                  KDA Allotment ID (Must Be Unique) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KDA-SCH33-SEC05-P88"
                  value={formData.kdaPlotNumber}
                  onChange={(e) => setFormData({ ...formData, kdaPlotNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">
                  Karachi Scheme / Project *
                </label>
                <input
                  type="text"
                  required
                  value={formData.schemeName}
                  onChange={(e) => setFormData({ ...formData, schemeName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">
                  Sector / Block *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">
                  Plot Number *
                </label>
                <input
                  type="number"
                  required
                  value={formData.plotNumber}
                  onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">
                  Area (Square Yards) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.squareYards}
                  onChange={(e) => setFormData({ ...formData, squareYards: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">
                  Category
                </label>
                <select
                  value={formData.plotCategory}
                  onChange={(e) => setFormData({ ...formData, plotCategory: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400">
                    Allottee / Owner Ethereum Address *
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-slate-500">Quick Fill:</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' })}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono"
                    >
                      Aamir Khan
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, owner: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' })}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono"
                    >
                      Bilal Siddiqui
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, owner: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' })}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono"
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
                  className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1.5">
                  IPFS Scanned Deed CID
                </label>
                <input
                  type="text"
                  value={formData.ipfsDeedHash}
                  onChange={(e) => setFormData({ ...formData, ipfsDeedHash: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>

            </div>

            <button
              type="submit"
              className="mt-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-teal-500/20 cursor-pointer"
            >
              Mint Verified Land Title to Blockchain
            </button>
          </form>
        </div>
      )}

      {/* SUB-SECTION 3: PENDING ESCROW APPROVALS */}
      {panelSection === 'escrows' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                Pending Escrows Awaiting Sub-Registrar Stamping
              </h3>
              <p className="text-xs text-slate-400">
                Buyer has locked ETH in smart contract. Review legal deed before releasing funds to seller and transferring title.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {escrowPlots.length} Pending Approval
            </span>
          </div>

          {escrowPlots.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              No pending escrow deals right now. Buyers can initiate escrow by clicking "Deposit Escrow" in the Buyer Portal.
            </div>
          ) : (
            <div className="space-y-4">
              {escrowPlots.map((plot) => (
                <div key={plot.id} className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-teal-400">{plot.kdaPlotNumber}</span>
                      <span className="text-xs font-semibold text-slate-200">{plot.schemeName} ({plot.squareYards} Sq. Yds)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Seller: <span className="font-mono text-slate-300">{plot.currentOwner.slice(0, 10)}...</span>
                    </p>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">
                      Locked Amount: {ethers.formatEther(plot.price)} ETH
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onApproveTransfer(plot.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Legal Transfer
                    </button>

                    <button
                      onClick={() => onCancelEscrow(plot.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-700 cursor-pointer"
                    >
                      Reject & Refund
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
