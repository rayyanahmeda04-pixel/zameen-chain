import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Database,
  Lock,
  Unlock,
  UserCheck,
  Search,
  Award,
  Trash2,
  UserX,
  RotateCcw,
  KeyRound
} from 'lucide-react';
import {
  fetchAllUsersFromDb,
  approveRegistrarInDb,
  rejectRegistrarInDb,
  deleteUserFromDb
} from '../utils/authService';
import { shortenAddress } from '../utils/formatters';

export default function AdminPortal({
  currentUser,
  plots,
  isEmergencyFrozen,
  onToggleEmergencyFreeze,
  onResetDemoLedger,
  onResolveDispute,
  onRegisterOfficerOnChain,
  onRemoveOfficer,
  onOpenAuth,
  showToast
}) {
  const [adminSection, setAdminSection] = useState('approvals');
  const [allUsers, setAllUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const isChiefAdmin =
    currentUser?.role === 'ADMIN' || currentUser?.email === 'rayyan.ahmed@sindh.gov.pk';

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsersFromDb();
      setAllUsers(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isChiefAdmin) {
      loadUsers();
    }
  }, [isChiefAdmin]);

  const pendingRegistrars = allUsers.filter(
    (u) => u.role === 'REGISTRAR' && u.status === 'PENDING_APPROVAL'
  );
  const activeRegistrars = allUsers.filter(
    (u) => u.role === 'REGISTRAR' && u.status === 'ACTIVE'
  );
  const disputedPlots = plots.filter((p) => p.isDisputed);

  const filteredUsers = allUsers.filter((u) => {
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
  });

  const handleApprove = async (user) => {
    try {
      await approveRegistrarInDb(user.id);
      if (onRegisterOfficerOnChain) {
        try {
          await onRegisterOfficerOnChain({
            address: user.walletAddress,
            name: user.name,
            badgeNumber: user.badgeNumber || 'KDA-SR-NEW',
            districtBranch: user.department || 'KDA District Secretariat'
          });
        } catch (chainErr) {
          console.warn('On-chain sync notice:', chainErr);
        }
      }
      showToast(`Sub-Registrar ${user.name} approved & accredited on-chain!`, 'success');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmTarget) return;
    const { mode, user } = confirmTarget;
    setConfirmTarget(null);

    try {
      if (mode === 'REJECT' && user) {
        await rejectRegistrarInDb(user.id);
        showToast(`Application for ${user.name} declined.`, 'info');
        loadUsers();
      } else if (mode === 'DELETE' && user) {
        await deleteUserFromDb(user.id, user.email);
        if (user.role === 'REGISTRAR' && onRemoveOfficer) {
          await onRemoveOfficer(user.walletAddress);
        }
        showToast(`Account "${user.name}" revoked and removed from directory.`, 'success');
        loadUsers();
      } else if (mode === 'RESET') {
        if (onResetDemoLedger) onResetDemoLedger();
      }
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  if (!isChiefAdmin) {
    return (
      <div className="bg-slate-900/90 border border-white/[0.08] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl animate-fadeIn">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6 rounded-2xl sm:rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
          <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3.5 py-1 rounded-full">
          Ministry of Revenue Executive Desk
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-slate-100 mt-4 mb-2">
          Chief Administrator Clearance Required
        </h3>

        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          Sub-Registrar vetting, master citizen registry governance, and the Karachi city-wide market freeze switch are restricted to the{' '}
          <strong className="text-slate-100">Chief Administrator, Board of Revenue (Sindh)</strong>.
        </p>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs mb-6 space-y-2 font-mono">
          <div className="flex justify-between gap-2 text-slate-400">
            <span>Current Session:</span>
            <span className="text-slate-200 font-semibold truncate">{currentUser?.name || 'Guest'}</span>
          </div>
          <div className="flex justify-between gap-2 text-slate-400">
            <span>Assigned Role:</span>
            <span className="text-amber-400 font-semibold">{currentUser?.role || 'PUBLIC'}</span>
          </div>
        </div>

        <button
          onClick={onOpenAuth}
          className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs py-3.5 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          <span>Sign In as Chief Administrator</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Inline Confirmation Dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0b1322] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">
              {confirmTarget.mode === 'DELETE' && 'Confirm Credential Revocation'}
              {confirmTarget.mode === 'REJECT' && 'Decline Registrar Accreditation'}
              {confirmTarget.mode === 'RESET' && 'Reset Cloud Cadastre Demo State'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed break-words">
              {confirmTarget.mode === 'DELETE' &&
                `Are you sure you want to permanently remove "${confirmTarget.user?.name}" (${confirmTarget.user?.email}) and revoke their access?`}
              {confirmTarget.mode === 'REJECT' &&
                `Decline Sub-Registrar accreditation request from "${confirmTarget.user?.name}"?`}
              {confirmTarget.mode === 'RESET' &&
                'Restore the local Cloud Ledger parcels, listings, and transaction feed back to clean initial Karachi seed records?'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive Header */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden p-5 sm:p-8 md:p-10 border border-amber-500/30 bg-gradient-to-br from-[#1c1505]/90 via-[#0d121c]/95 to-[#060b13] shadow-2xl backdrop-blur-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/25 shrink-0">
            <Award className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight truncate">
                {currentUser?.name || 'Rayyan Ahmed'}
              </h2>
              <span className="text-[9px] sm:text-[10px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono whitespace-nowrap">
                CHIEF ADMINISTRATOR
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Ministry of Revenue & Land Reforms • Government of Sindh
            </p>
          </div>
        </div>

        {/* Executive Controls */}
        <div className="relative z-10 flex items-center gap-2 w-full lg:w-auto shrink-0">
          <div className="flex-1 lg:flex-initial flex items-center justify-between gap-3 bg-slate-900/85 border border-white/[0.08] p-2 pl-3.5 rounded-2xl">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] text-slate-400 block font-semibold uppercase">
                Circuit Breaker:
              </span>
              <span
                className={`text-xs font-bold font-mono ${
                  isEmergencyFrozen ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {isEmergencyFrozen ? 'FROZEN' : 'OPERATIONAL'}
              </span>
            </div>
            <button
              onClick={onToggleEmergencyFreeze}
              className={`px-3 sm:px-3.5 py-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold whitespace-nowrap shrink-0 ${
                isEmergencyFrozen
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                  : 'bg-rose-950/90 hover:bg-rose-900 text-rose-200 border-rose-700'
              }`}
            >
              {isEmergencyFrozen ? <Unlock className="w-4 h-4 shrink-0" /> : <Lock className="w-4 h-4 shrink-0" />}
              <span>{isEmergencyFrozen ? 'Lift Freeze' : 'Freeze Market'}</span>
            </button>
          </div>

          <button
            onClick={() => setConfirmTarget({ mode: 'RESET' })}
            title="Reset Cloud Demo Ledger to Clean Seed State"
            className="p-3.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] transition cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-white/[0.08] overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setAdminSection('approvals')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
            adminSection === 'approvals'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>Vetting Queue ({pendingRegistrars.length})</span>
        </button>

        <button
          onClick={() => setAdminSection('users')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
            adminSection === 'users'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Database className="w-4 h-4 shrink-0" />
          <span>Citizen & Officer Directory ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setAdminSection('disputes')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
            adminSection === 'disputes'
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Stay Orders ({disputedPlots.length})</span>
        </button>
      </div>

      {/* 1. REGISTRAR VETTING */}
      {adminSection === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-slate-900/85 border border-white/[0.08] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Sub-Registrar Vetting Desk</span>
              </h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                {pendingRegistrars.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Approve verified government officers to grant on-chain deed minting and escrow certification privileges.
            </p>

            {pendingRegistrars.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/60 text-slate-400 text-xs">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2 opacity-70" />
                <span>All Sub-Registrar applications have been reviewed.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRegistrars.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{applicant.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                          PENDING CLEARANCE
                        </span>
                      </div>
                      <p className="text-xs text-teal-300 font-mono break-all">
                        Badge: <strong>{applicant.badgeNumber || 'N/A'}</strong> • {applicant.email}
                      </p>
                      <p className="text-xs text-slate-400">
                        Division: {applicant.department || 'KDA Sub-Registry'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 break-all">
                        Wallet: {applicant.walletAddress}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(applicant)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Accredit</span>
                      </button>

                      <button
                        onClick={() => setConfirmTarget({ mode: 'REJECT', user: applicant })}
                        className="bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900/85 border border-white/[0.08] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl">
            <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Active Accredited KDA Registrars ({activeRegistrars.length})</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRegistrars.map((off) => (
                <div
                  key={off.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-sm text-slate-100 block truncate">{off.name}</span>
                    <p className="text-xs text-teal-300 font-mono mt-0.5">
                      Badge: {off.badgeNumber || 'KDA-SR-001'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">{off.department}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Active
                    </span>
                    <button
                      onClick={() => setConfirmTarget({ mode: 'DELETE', user: off })}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-700/60 transition flex items-center gap-1 cursor-pointer"
                    >
                      <UserX className="w-3 h-3" />
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. USER REGISTRY (Mobile Cards + Desktop Table) */}
      {adminSection === 'users' && (
        <div className="bg-slate-900/85 border border-white/[0.08] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-400 shrink-0" />
                <span>Master Identity & Wallet Directory</span>
              </h3>
              <p className="text-xs text-slate-400">
                Registered citizens, property owners, buyers, and KDA officers.
              </p>
            </div>
            <button
              onClick={loadUsers}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl border border-slate-700 cursor-pointer self-start"
            >
              Sync Records
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, CNIC, badge..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'REGISTRAR', label: 'Registrars' },
                { key: 'SELLER', label: 'Owners' },
                { key: 'BUYER', label: 'Buyers' }
              ].map(({ key, label }) => {
                const count =
                  key === 'ALL'
                    ? allUsers.length
                    : allUsers.filter((u) => u.role === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setUserRoleFilter(key)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      userRoleFilter === key
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile User Cards (< md) */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-100 text-sm truncate">{u.name}</p>
                    <p className="font-mono text-[11px] text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300'
                          : u.role === 'REGISTRAR'
                          ? 'bg-teal-500/20 text-teal-300'
                          : u.role === 'SELLER'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : u.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {u.status === 'PENDING_APPROVAL' ? 'PENDING' : u.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                  <span>{u.badgeNumber || u.cnic || shortenAddress(u.walletAddress, 6, 4)}</span>
                  {u.role === 'ADMIN' || u.email === 'rayyan.ahmed@sindh.gov.pk' ? (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 font-sans">
                      Protected
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmTarget({ mode: 'DELETE', user: u })}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold font-sans transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3">Identity</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Badge / CNIC</th>
                  <th className="p-3">Wallet</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-950/50 transition">
                    <td className="p-3 font-sans font-bold text-slate-100">{u.name}</td>
                    <td className="p-3 text-slate-300">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/20 text-amber-300'
                            : u.role === 'REGISTRAR'
                            ? 'bg-teal-500/20 text-teal-300'
                            : u.role === 'SELLER'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : u.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{u.badgeNumber || u.cnic || '—'}</td>
                    <td className="p-3 text-slate-400">
                      {shortenAddress(u.walletAddress, 6, 4)}
                    </td>
                    <td className="p-3 text-right">
                      {u.role === 'ADMIN' || u.email === 'rayyan.ahmed@sindh.gov.pk' ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 font-sans">
                          Protected
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmTarget({ mode: 'DELETE', user: u })}
                          className="p-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold font-sans transition inline-flex items-center gap-1 cursor-pointer"
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

      {/* 3. STAY ORDERS DESK */}
      {adminSection === 'disputes' && (
        <div className="bg-slate-900/85 border border-white/[0.08] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl space-y-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Sindh High Court Stay Order Registry</span>
            </h3>
            <p className="text-xs text-slate-400">
              Parcels frozen under court stay orders. Lift injunctions upon receipt of certified judicial disposal orders.
            </p>
          </div>

          {disputedPlots.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
              Zero parcels currently under judicial stay order across Karachi.
            </div>
          ) : (
            <div className="space-y-4">
              {disputedPlots.map((plot) => (
                <div
                  key={plot.id}
                  className="p-4 sm:p-5 rounded-2xl bg-rose-950/20 border border-rose-800/70 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-teal-400">
                        {plot.kdaPlotNumber}
                      </span>
                      <span className="text-sm font-bold text-white">{plot.schemeName}</span>
                    </div>
                    <p className="text-xs text-rose-300 font-mono mt-1 break-words">
                      {plot.disputeReason || 'Sindh High Court Stay Order'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Title Holder:{' '}
                      <span className="font-mono text-slate-300">
                        {shortenAddress(plot.currentOwner, 10, 6)}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => onResolveDispute(plot.id)}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 md:py-2.5 rounded-xl transition shadow-lg shadow-emerald-600/20 shrink-0 cursor-pointer"
                  >
                    Lift Judicial Stay Order
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
