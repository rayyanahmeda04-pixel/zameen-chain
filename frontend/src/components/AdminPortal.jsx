import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Users, Database, Lock, Unlock, Building2, UserCheck, Search, Award, Trash2, UserX, Filter } from 'lucide-react';
import {
  fetchAllUsersFromDb,
  approveRegistrarInDb,
  rejectRegistrarInDb,
  deleteUserFromDb,
  getEmergencyFreezeState,
  setEmergencyFreezeState
} from '../utils/authService';

export default function AdminPortal({
  currentUser,
  plots,
  onResolveDispute,
  onRegisterOfficerOnChain,
  onRemoveOfficer,
  showToast
}) {
  const [adminSection, setAdminSection] = useState('approvals'); // 'approvals', 'users', 'disputes', 'security'
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isEmergencyFrozen, setIsEmergencyFrozen] = useState(getEmergencyFreezeState());
  const [userRoleFilter, setUserRoleFilter] = useState('ALL'); // 'ALL', 'REGISTRAR', 'BUYER', 'SELLER'
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const isChiefAdmin = currentUser?.role === 'ADMIN' || currentUser?.email === 'rayyan.ahmed@sindh.gov.pk';

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchAllUsersFromDb();
      setAllUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const pendingRegistrars = allUsers.filter(
    (u) => u.role === 'REGISTRAR' && u.status === 'PENDING_APPROVAL'
  );

  const activeRegistrars = allUsers.filter(
    (u) => u.role === 'REGISTRAR' && u.status === 'ACTIVE'
  );

  const disputedPlots = plots.filter((p) => p.isDisputed);

  const handleApprove = async (user) => {
    try {
      await approveRegistrarInDb(user.id);
      
      // Also register on Smart Contract if callback provided
      if (onRegisterOfficerOnChain) {
        try {
          await onRegisterOfficerOnChain({
            address: user.walletAddress,
            name: user.name,
            badgeNumber: user.badgeNumber || 'KDA-SR-NEW',
            districtBranch: user.department || 'KDA District Secretariat'
          });
        } catch (chainErr) {
          console.warn("Smart contract officer registration notice:", chainErr);
        }
      }

      showToast(`✅ Registrar ${user.name} approved & accredited!`, 'success');
      loadUsers();
    } catch (err) {
      const cleanError = err.reason || err.shortMessage || err.message || "Approval failed";
      showToast(cleanError.length > 80 ? cleanError.slice(0, 80) + '...' : cleanError, 'error');
    }
  };

  const handleReject = async (user) => {
    const confirm = window.confirm(`Reject registrar accreditation application for ${user.name}?`);
    if (!confirm) return;

    try {
      await rejectRegistrarInDb(user.id);
      showToast(`⛔ Registrar application for ${user.name} rejected.`);
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'ADMIN' || user.email === 'rayyan.ahmed@sindh.gov.pk') {
      window.alert("⚠️ Chief Administrator (Rayyan Ahmed) account is protected and cannot be deleted.");
      return;
    }

    const roleLabel =
      user.role === 'REGISTRAR' ? 'KDA Officer / Registrar' :
      user.role === 'SELLER' ? 'Property Seller' :
      user.role === 'BUYER' ? 'Registered Buyer' : 'User';

    const confirm = window.confirm(
      `🚨 CONFIRM ACCOUNT REMOVAL:\n\nAre you sure you want to remove ${roleLabel}:\n"${user.name}" (${user.email})?\n\nThis will permanently delete this account from the central database and immediately revoke their system credentials.`
    );
    if (!confirm) return;

    try {
      await deleteUserFromDb(user.id, user.email);
      if (user.role === 'REGISTRAR' && onRemoveOfficer) {
        onRemoveOfficer(user.walletAddress || user.email);
      }
      showToast(`🗑️ ${roleLabel} "${user.name}" has been permanently removed from database.`, 'success');
      loadUsers();
    } catch (err) {
      showToast(`Failed to remove user: ${err.message}`, 'error');
    }
  };

  const handleToggleEmergencyFreeze = () => {
    const newState = !isEmergencyFrozen;
    setIsEmergencyFrozen(newState);
    setEmergencyFreezeState(newState);
    if (newState) {
      showToast("🚨 EMERGENCY ACTIVATED: All Karachi land market transactions temporarily frozen by Chief Admin.", "error");
    } else {
      showToast("✅ Emergency freeze lifted. Market transactions resumed.", "success");
    }
  };

  // 🔒 RESTRICTED IF NOT LOGGED IN AS RAYYAN AHMED
  if (!isChiefAdmin) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl animate-fadeIn">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Lock className="w-10 h-10" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3.5 py-1 rounded-full">
          Government of Sindh Executive Terminal
        </span>

        <h3 className="text-2xl font-black text-slate-100 mt-4 mb-2">
          Restricted Access: Chief Administrator Only
        </h3>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          This portal is reserved for <strong className="text-slate-100">Rayyan Ahmed</strong> (Chief Administrator & Secretary, Revenue Department, Government of Sindh).
        </p>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs mb-6 space-y-2 font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Your Current User:</span>
            <span className="text-slate-300 font-semibold">{currentUser?.name || 'Guest / Citizen'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Your Current Role:</span>
            <span className="text-amber-400 font-semibold">{currentUser?.role || 'PUBLIC'}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Please log out and sign in with the Chief Admin credentials (<code className="text-teal-400">rayyan.ahmed@sindh.gov.pk</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Rayyan Ahmed Executive Header */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 md:p-10 border border-amber-500/30 bg-gradient-to-br from-[#1c1505]/90 via-[#0d121c]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Subtle radial amber glow */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/30 shrink-0">
            <Award className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Rayyan Ahmed
              </h2>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono shadow-sm">
                CHIEF ADMINISTRATOR
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Ministry of Revenue & Land Reforms • Government of Sindh • Apex Cadastral Authority
            </p>
          </div>
        </div>

        {/* Quick Emergency Killswitch Button */}
        <div className="relative z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur-xl border border-white/[0.08] p-3 rounded-2xl shadow-lg shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Cadastre Status:</span>
            <span className={`text-xs font-bold font-mono ${isEmergencyFrozen ? 'text-rose-400' : 'text-emerald-400'}`}>
              {isEmergencyFrozen ? 'EMERGENCY FROZEN' : 'ACTIVE & UNLOCKED'}
            </span>
          </div>
          <button
            onClick={handleToggleEmergencyFreeze}
            className={`p-2.5 px-3.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              isEmergencyFrozen
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/25'
                : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-700 shadow-lg shadow-rose-950/50'
            }`}
          >
            {isEmergencyFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{isEmergencyFrozen ? 'Lift Emergency' : 'City-Wide Freeze'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] overflow-x-auto text-xs shadow-md">
        
        {/* Tab 1: Registrar Approvals */}
        <button
          onClick={() => setAdminSection('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer ${
            adminSection === 'approvals'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Registrar Vetting Queue ({pendingRegistrars.length})</span>
        </button>

        {/* Tab 2: User Master Database */}
        <button
          onClick={() => setAdminSection('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer ${
            adminSection === 'users'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Master Database ({allUsers.length})</span>
        </button>

        {/* Tab 3: Supreme Court Stay Orders */}
        <button
          onClick={() => setAdminSection('disputes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition cursor-pointer ${
            adminSection === 'disputes'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>High Court Stay Orders ({disputedPlots.length})</span>
        </button>

      </div>

      {/* SUB-SECTION 1: REGISTRAR VETTING & APPROVAL QUEUE (CORE FEATURE REQUESTED) */}
      {adminSection === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-3xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                Sub-Registrar Accreditation & Background Clearance
              </h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pendingRegistrars.length} Pending Rayyan Ahmed Review
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Review government officer registration requests. Approved officers receive cryptographic authorization to certify deeds and mint plots on the blockchain.
            </p>

            {pendingRegistrars.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                <span>All Sub-Registrar applications have been processed. No pending requests.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRegistrars.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-amber-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{applicant.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                          STATUS: PENDING CLEARANCE
                        </span>
                      </div>
                      <p className="text-xs text-teal-300 font-mono">
                        Badge ID: <strong>{applicant.badgeNumber || 'N/A'}</strong> • Email: {applicant.email}
                      </p>
                      <p className="text-xs text-slate-400">
                        Assigned Branch: {applicant.department || 'KDA District Branch'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        Ethereum Key: {applicant.walletAddress}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(applicant)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Accredit Officer</span>
                      </button>

                      <button
                        onClick={() => handleReject(applicant)}
                        className="bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List of Already Approved Officers */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-3xl">
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active Accredited Registrars in Karachi ({activeRegistrars.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRegistrars.map((off) => (
                <div key={off.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-sm text-slate-100">{off.name}</span>
                    <p className="text-xs text-teal-300 font-mono mt-0.5">Badge: {off.badgeNumber || 'KDA-SR-001'}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{off.department}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Active
                    </span>
                    <button
                      onClick={() => handleDeleteUser(off)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-700/60 transition flex items-center gap-1 cursor-pointer"
                      title="Revoke accreditation and remove officer from database"
                    >
                      <UserX className="w-3 h-3" />
                      <span>Remove Officer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: NEON MASTER DATABASE ROSTER */}
      {adminSection === 'users' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-400" />
                Master User Directory & Database
              </h3>
              <p className="text-xs text-slate-400">
                Live query & user management for registered platform accounts.
              </p>
            </div>
            <button
              onClick={loadUsers}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 cursor-pointer self-start sm:self-auto"
            >
              Refresh Table
            </button>
          </div>

          {/* Search & Role Filter Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 pb-1 border-t border-slate-800/80">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, email, CNIC, or badge..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { key: 'ALL', label: 'All Accounts' },
                { key: 'REGISTRAR', label: '🏛️ KDA Officers' },
                { key: 'SELLER', label: '👤 Sellers' },
                { key: 'BUYER', label: '🤝 Buyers' }
              ].map(({ key, label }) => {
                const count = key === 'ALL'
                  ? allUsers.length
                  : allUsers.filter((u) => u.role === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setUserRoleFilter(key)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer shrink-0 ${
                      userRoleFilter === key
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Badge / CNIC</th>
                  <th className="p-3">Wallet Address</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {allUsers
                  .filter((u) => {
                    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                    const q = userSearchQuery.trim().toLowerCase();
                    if (!q) return matchesRole;
                    return (
                      matchesRole &&
                      ((u.name && u.name.toLowerCase().includes(q)) ||
                        (u.email && u.email.toLowerCase().includes(q)) ||
                        (u.badgeNumber && u.badgeNumber.toLowerCase().includes(q)) ||
                        (u.cnic && u.cnic.toLowerCase().includes(q)) ||
                        (u.walletAddress && u.walletAddress.toLowerCase().includes(q)))
                    );
                  })
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-950/40 transition">
                      <td className="p-3 font-sans font-bold text-slate-100">{u.name}</td>
                      <td className="p-3 text-slate-300">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300' :
                          u.role === 'REGISTRAR' ? 'bg-teal-500/20 text-teal-300' :
                          u.role === 'SELLER' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          u.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                          u.status === 'PENDING_APPROVAL' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{u.badgeNumber || u.cnic || '—'}</td>
                      <td className="p-3 text-slate-500 truncate max-w-[150px]">{u.walletAddress}</td>
                      <td className="p-3 text-right">
                        {u.role === 'ADMIN' || u.email === 'rayyan.ahmed@sindh.gov.pk' ? (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 font-sans">
                            Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold font-sans transition inline-flex items-center gap-1 cursor-pointer"
                            title={`Remove ${u.name} (${u.role}) from Database`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: SUPREME COURT STAY ORDER & LITIGATION DESK */}
      {adminSection === 'disputes' && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              Sindh High Court Litigation & Stay Order Desk
            </h3>
            <p className="text-xs text-slate-400">
              City-wide overview of frozen plots. Chief Admin has legal authority to lift disputes upon production of court clearance decrees.
            </p>
          </div>

          {disputedPlots.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              No plots are currently under court stay order in Karachi.
            </div>
          ) : (
            <div className="space-y-4">
              {disputedPlots.map((plot) => (
                <div key={plot.id} className="p-5 rounded-2xl bg-rose-950/20 border border-rose-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-teal-400">{plot.kdaPlotNumber}</span>
                      <span className="text-sm font-bold text-slate-100">{plot.schemeName}</span>
                    </div>
                    <p className="text-xs text-rose-300 font-mono mt-1">
                      Reason: {plot.disputeReason || 'Sindh High Court Stay Order'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Current Title Holder: <span className="font-mono text-slate-300">{plot.currentOwner}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onResolveDispute(plot.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 shrink-0 cursor-pointer"
                  >
                    Resolve & Lift Court Stay Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
