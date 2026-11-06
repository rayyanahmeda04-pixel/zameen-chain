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
  KeyRound,
  FileCheck
} from 'lucide-react';
import {
  fetchAllUsersFromDb,
  approveRegistrarInDb,
  rejectRegistrarInDb,
  deleteUserFromDb
} from '../utils/authService';
import { formatEth, formatPkrFromWei, shortenAddress } from '../utils/formatters';

export default function AdminPortal({
  currentUser,
  plots,
  isEmergencyFrozen,
  onToggleEmergencyFreeze,
  onResetDemoLedger,
  onResolveDispute,
  onRegisterOfficerOnChain,
  onRemoveOfficer,
  onCountersignTransfer,
  onCancelEscrow,
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

  const escrowPlots = plots.filter((p) => Number(p.status) === 2);
  const pendingCountersign = escrowPlots.filter((p) => p.transferApproval?.endorsedBy);

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
    const userRole = u.role === 'BUYER' || u.role === 'SELLER' ? 'CITIZEN' : u.role;
    const matchesRole =
      userRoleFilter === 'ALL' || userRole === userRoleFilter || u.role === userRoleFilter;
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return matchesRole;
    return (
      matchesRole &&
      ((u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.badgeNumber && u.badgeNumber.toLowerCase().includes(q)) ||
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
      showToast(`Sub-Registrar ${user.name} approved & accredited on-chain.`, 'success');
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
      <div className="bg-white border border-[#E4E4E0] rounded-xl p-6 sm:p-10 text-center max-w-xl mx-auto shadow-[0_1px_3px_rgba(16,24,40,0.04)] animate-fadeIn">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#F4F4F1] border border-[#E4E4E0] text-zinc-700 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>

        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 bg-[#F4F4F1] border border-[#E4E4E0] px-2.5 py-0.5 rounded-full">
          Ministry of Revenue Executive Desk
        </span>

        <h3 className="text-lg sm:text-xl font-bold text-[#111315] mt-3 mb-1.5">
          Chief Administrator Clearance Required
        </h3>

        <p className="text-xs sm:text-[13px] text-zinc-600 mb-5 leading-relaxed">
          Sub-Registrar vetting, master citizen registry governance, and the Karachi city-wide market freeze switch are restricted to the{' '}
          <strong className="text-[#111315]">Chief Administrator, Board of Revenue (Sindh)</strong>.
        </p>

        <div className="bg-[#FBFBFA] p-3.5 rounded-lg border border-[#E4E4E0] text-left text-xs mb-5 space-y-1.5 font-mono">
          <div className="flex justify-between gap-2 text-zinc-500">
            <span>Current Session</span>
            <span className="text-[#111315] font-semibold truncate">{currentUser?.name || 'Guest'}</span>
          </div>
          <div className="flex justify-between gap-2 text-zinc-500">
            <span>Assigned Role</span>
            <span className="text-amber-700 font-semibold">{currentUser?.role || 'PUBLIC'}</span>
          </div>
        </div>

        <button
          onClick={onOpenAuth}
          className="w-full bg-[#111315] hover:bg-[#27272A] text-white font-semibold text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <KeyRound className="w-4 h-4" />
          <span>Sign In as Chief Administrator</span>
        </button>
      </div>
    );
  }

  const getRolePill = (role) => {
    if (role === 'ADMIN') return 'bg-[#111315] text-white border-[#111315]';
    if (role === 'REGISTRAR') return 'bg-emerald-50 text-[#065F46] border-emerald-200';
    return 'bg-blue-50 text-blue-800 border-blue-200';
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Inline Confirmation Dialog */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E4E4E0] rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-[#111315]">
              {confirmTarget.mode === 'DELETE' && 'Confirm Credential Revocation'}
              {confirmTarget.mode === 'REJECT' && 'Decline Registrar Accreditation'}
              {confirmTarget.mode === 'RESET' && 'Reset Cadastre Demo State'}
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed break-words">
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
                className="px-4 py-2 rounded-lg bg-white hover:bg-[#F7F7F5] border border-[#D4D4CE] text-xs font-semibold text-[#111315] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#E4E4E0] shadow-[0_1px_3px_rgba(16,24,40,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#111315] flex items-center justify-center text-white shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#111315] tracking-tight truncate">
                {currentUser?.name || 'Rayyan Ahmed'}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F4F1] text-[#111315] border border-[#D4D4CE] whitespace-nowrap">
                Chief Administrator
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Ministry of Revenue & Land Reforms • Government of Sindh
            </p>
          </div>
        </div>

        {/* Circuit Breaker + Seed Reset */}
        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
          <div className="flex-1 lg:flex-initial flex items-center justify-between gap-3 bg-[#FBFBFA] border border-[#E4E4E0] p-2 pl-3.5 rounded-lg">
            <div className="min-w-0">
              <span className="text-[10px] text-zinc-500 block font-medium">
                Market State
              </span>
              <span
                className={`text-xs font-semibold ${
                  isEmergencyFrozen ? 'text-red-700' : 'text-[#059669]'
                }`}
              >
                {isEmergencyFrozen ? 'Frozen' : 'Operational'}
              </span>
            </div>
            <button
              onClick={onToggleEmergencyFreeze}
              className={`px-3 py-2 rounded-md border transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 ${
                isEmergencyFrozen
                  ? 'bg-[#0B5D46] hover:bg-[#094B38] text-white border-[#0B5D46]'
                  : 'bg-red-50 hover:bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {isEmergencyFrozen ? <Unlock className="w-3.5 h-3.5 shrink-0" /> : <Lock className="w-3.5 h-3.5 shrink-0" />}
              <span>{isEmergencyFrozen ? 'Lift Freeze' : 'Freeze Market'}</span>
            </button>
          </div>

          <button
            onClick={() => setConfirmTarget({ mode: 'RESET' })}
            title="Reset Cloud Demo Ledger to Clean Seed State"
            className="p-3 rounded-lg bg-white hover:bg-[#F7F7F5] text-zinc-600 hover:text-[#111315] border border-[#D4D4CE] transition cursor-pointer shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#EDEDEA] border border-[#E4E4E0] overflow-x-auto no-scrollbar max-w-full text-xs">
        <button
          onClick={() => setAdminSection('approvals')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
            adminSection === 'approvals'
              ? 'bg-white text-[#111315] font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-[#111315]'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Vetting Queue ({pendingRegistrars.length})</span>
        </button>

        <button
          onClick={() => setAdminSection('users')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
            adminSection === 'users'
              ? 'bg-white text-[#111315] font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-[#111315]'
          }`}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span>Identity Directory ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setAdminSection('disputes')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
            adminSection === 'disputes'
              ? 'bg-white text-[#111315] font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-[#111315]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Stay Orders ({disputedPlots.length})</span>
        </button>

        <button
          onClick={() => setAdminSection('multisig')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
            adminSection === 'multisig'
              ? 'bg-white text-[#111315] font-semibold shadow-xs'
              : 'text-zinc-600 hover:text-[#111315]'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Dual-Sig Countersign ({pendingCountersign.length})</span>
        </button>
      </div>

      {/* 1. REGISTRAR VETTING */}
      {adminSection === 'approvals' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <h3 className="text-base font-bold text-[#111315]">
                Sub-Registrar Vetting Desk
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap tabular-nums">
                {pendingRegistrars.length} Pending
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">
              Approve verified government officers to grant on-chain deed minting and escrow certification privileges.
            </p>

            {pendingRegistrars.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#D4D4CE] rounded-lg bg-[#FBFBFA] text-zinc-500 text-xs">
                <CheckCircle2 className="w-6 h-6 text-[#059669] mx-auto mb-2" />
                <span>All Sub-Registrar applications have been reviewed.</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {pendingRegistrars.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="p-4 rounded-xl bg-[#FBFBFA] border border-amber-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#111315]">{applicant.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Clearance
                        </span>
                      </div>
                      <p className="text-xs text-[#0B5D46] font-mono break-all">
                        Badge: <strong>{applicant.badgeNumber || 'N/A'}</strong> • {applicant.email}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Division: {applicant.department || 'KDA Sub-Registry'}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 break-all">
                        Wallet: {applicant.walletAddress}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(applicant)}
                        className="bg-[#0B5D46] hover:bg-[#094B38] text-white font-semibold text-xs px-4 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve & Accredit</span>
                      </button>

                      <button
                        onClick={() => setConfirmTarget({ mode: 'REJECT', user: applicant })}
                        className="bg-white hover:bg-red-50 text-zinc-700 hover:text-red-700 font-semibold text-xs px-4 py-2 rounded-lg border border-[#D4D4CE] hover:border-red-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
            <h4 className="text-sm font-bold text-[#111315] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0B5D46] shrink-0" />
              <span>Active Accredited KDA Registrars ({activeRegistrars.length})</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeRegistrars.map((off) => (
                <div
                  key={off.id}
                  className="p-3.5 rounded-lg bg-[#FBFBFA] border border-[#E4E4E0] flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-sm text-[#111315] block truncate">{off.name}</span>
                    <p className="text-xs text-[#0B5D46] font-mono mt-0.5">
                      Badge: {off.badgeNumber || 'KDA-SR-001'}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{off.department}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#065F46] border border-emerald-200">
                      Active
                    </span>
                    <button
                      onClick={() => setConfirmTarget({ mode: 'DELETE', user: off })}
                      className="text-[10px] font-semibold px-2 py-1 rounded bg-white hover:bg-red-50 text-red-700 border border-[#D4D4CE] hover:border-red-200 transition flex items-center gap-1 cursor-pointer"
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
        <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#111315]">
                Master Identity & Wallet Directory
              </h3>
              <p className="text-xs text-zinc-500">
                Registered citizens, property owners, buyers, and KDA officers.
              </p>
            </div>
            <button
              onClick={loadUsers}
              className="text-xs bg-white hover:bg-[#F7F7F5] text-[#111315] font-medium px-3 py-1.5 rounded-lg border border-[#D4D4CE] cursor-pointer self-start"
            >
              Sync Records
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-[#F0F0EC]">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, CNIC, badge..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#D4D4CE] rounded-lg pl-9 pr-3 py-2 text-xs text-[#111315] placeholder-zinc-400 focus:outline-none focus:border-[#0B5D46]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'REGISTRAR', label: 'Registrars' },
                { key: 'CITIZEN', label: 'Citizens' }
              ].map(({ key, label }) => {
                const count =
                  key === 'ALL'
                    ? allUsers.length
                    : allUsers.filter(
                        (u) =>
                          u.role === key ||
                          (key === 'CITIZEN' && (u.role === 'BUYER' || u.role === 'SELLER'))
                      ).length;
                return (
                  <button
                    key={key}
                    onClick={() => setUserRoleFilter(key)}
                    className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                      userRoleFilter === key
                        ? 'bg-[#111315] text-white font-semibold'
                        : 'bg-[#F7F7F5] hover:bg-[#ECECE7] text-zinc-700 border border-[#E4E4E0]'
                    }`}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile User Cards (< md) */}
          <div className="md:hidden space-y-2.5">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-lg bg-[#FBFBFA] border border-[#E4E4E0] space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111315] text-sm truncate">{u.name}</p>
                    <p className="font-mono text-[11px] text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded border font-mono font-semibold text-[10px] ${getRolePill(u.role)}`}>
                      {u.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border font-mono font-semibold text-[10px] ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-[#065F46] border-emerald-200'
                          : u.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {u.status === 'PENDING_APPROVAL' ? 'PENDING' : u.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E4E4E0] text-[11px] font-mono text-zinc-500">
                  <span>{u.badgeNumber || u.cnic || shortenAddress(u.walletAddress, 6, 4)}</span>
                  {u.role === 'ADMIN' || u.email === 'rayyan.ahmed@sindh.gov.pk' ? (
                    <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 font-sans">
                      Protected
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmTarget({ mode: 'DELETE', user: u })}
                      className="px-2.5 py-1 rounded bg-white hover:bg-red-50 text-red-700 border border-[#D4D4CE] hover:border-red-200 text-xs font-semibold font-sans transition inline-flex items-center gap-1 cursor-pointer"
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
          <div className="hidden md:block overflow-x-auto border border-[#E4E4E0] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBFBFA] text-zinc-500 font-medium border-b border-[#E4E4E0]">
                <tr>
                  <th className="py-2.5 px-3.5">Identity</th>
                  <th className="py-2.5 px-3.5">Email</th>
                  <th className="py-2.5 px-3.5">Role</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5">Badge / CNIC</th>
                  <th className="py-2.5 px-3.5">Wallet</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E0]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FBFBFA] transition">
                    <td className="py-2.5 px-3.5 font-semibold text-[#111315]">{u.name}</td>
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-zinc-600">{u.email}</td>
                    <td className="py-2.5 px-3.5">
                      <span className={`px-2 py-0.5 rounded border font-mono font-semibold text-[10px] ${getRolePill(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded border font-mono font-semibold text-[10px] ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-[#065F46] border-emerald-200'
                            : u.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-zinc-600">{u.badgeNumber || u.cnic || '—'}</td>
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-zinc-500">
                      {shortenAddress(u.walletAddress, 6, 4)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      {u.role === 'ADMIN' || u.email === 'rayyan.ahmed@sindh.gov.pk' ? (
                        <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                          Protected
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmTarget({ mode: 'DELETE', user: u })}
                          className="px-2.5 py-1 rounded bg-white hover:bg-red-50 text-red-700 border border-[#D4D4CE] hover:border-red-200 text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
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
        <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)] space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#111315]">
              Sindh High Court Stay Order Registry
            </h3>
            <p className="text-xs text-zinc-500">
              Parcels frozen under court stay orders. Lift injunctions upon receipt of certified judicial disposal orders.
            </p>
          </div>

          {disputedPlots.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#D4D4CE] rounded-lg bg-[#FBFBFA] text-zinc-500 text-xs">
              Zero parcels currently under judicial stay order across Karachi.
            </div>
          ) : (
            <div className="space-y-3.5">
              {disputedPlots.map((plot) => (
                <div
                  key={plot.id}
                  className="p-4 rounded-xl bg-red-50/50 border border-red-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-[#111315] bg-white px-2 py-0.5 rounded border border-red-200">
                        {plot.kdaPlotNumber}
                      </span>
                      <span className="text-sm font-bold text-[#111315]">{plot.schemeName}</span>
                    </div>
                    <p className="text-xs text-red-800 font-mono mt-1 break-words">
                      {plot.disputeReason || 'Sindh High Court Stay Order'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Title Holder:{' '}
                      <span className="font-mono text-zinc-700">
                        {shortenAddress(plot.currentOwner, 10, 6)}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => onResolveDispute(plot.id)}
                    className="w-full md:w-auto bg-[#0B5D46] hover:bg-[#094B38] text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition shadow-xs shrink-0 cursor-pointer"
                  >
                    Lift Judicial Stay Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DUAL-SIGNATURE COUNTERSIGNING DESK */}
      {adminSection === 'multisig' && (
        <div className="bg-white border border-[#E4E4E0] p-5 sm:p-6 rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111315]">
                  Sindh Board of Revenue Countersigning Desk (Signature 2 of 2)
                </h3>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#0B5D46] border border-emerald-200">
                  Checker Authority
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
                Dual-control settlement: An accredited KDA Sub-Registrar provides the Maker endorsement. As the Board of Revenue authority, you countersign here to execute the atomic mutation and release escrow funds to the seller.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 shrink-0 tabular-nums">
              {pendingCountersign.length} Endorsed by KDA
            </span>
          </div>

          {escrowPlots.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#D4D4CE] rounded-lg bg-[#FBFBFA] text-zinc-500 text-xs">
              No active escrow deals in progress. When a citizen deposits ETH into Smart Escrow, the dual-signature pipeline will appear here.
            </div>
          ) : (
            <div className="space-y-4">
              {escrowPlots.map((plot) => {
                const approval = plot.transferApproval;
                const isEndorsed = Boolean(approval?.endorsedBy);

                return (
                  <div
                    key={plot.id}
                    className="p-4 sm:p-5 rounded-xl bg-[#FBFBFA] border border-[#E4E4E0] space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold text-[#111315] bg-white px-2 py-0.5 rounded border border-[#E4E4E0]">
                          {plot.kdaPlotNumber}
                        </span>
                        <span className="text-sm font-bold text-[#111315]">
                          {plot.schemeName} ({plot.sector}, Plot #{plot.plotNumber})
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border self-start sm:self-auto shrink-0 ${
                          isEndorsed
                            ? 'bg-emerald-50 text-[#0B5D46] border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isEndorsed ? '● Ready for Board Countersignature' : '○ Awaiting KDA Sub-Registrar (Sig 1)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500 font-mono">
                      <span>Seller: {shortenAddress(plot.currentOwner, 6, 4)}</span>
                      {plot.escrowBuyer && (
                        <span className="text-blue-700">
                          Buyer: {shortenAddress(plot.escrowBuyer, 6, 4)}
                        </span>
                      )}
                      <span className="text-[#0B5D46] font-semibold font-sans">
                        Locked Amount: {formatEth(plot.escrowAmount || plot.price)} (≈{' '}
                        {formatPkrFromWei(plot.escrowAmount || plot.price)})
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="p-3 rounded-lg bg-white border border-[#E4E4E0] text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-zinc-600">
                        <span className="font-semibold text-[#111315]">Dual-Control Audit Trail</span>
                        <span className="font-mono text-[11px] text-zinc-500">
                          {isEndorsed ? 'Status: 1 of 2 Signatures Validated' : 'Status: 0 of 2 Signatures Validated'}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isEndorsed ? 'text-[#0B5D46]' : 'text-zinc-300'
                            }`}
                          />
                          <span>
                            {isEndorsed
                              ? `Signature 1 (Maker): Endorsed by KDA Sub-Registrar (${shortenAddress(
                                  approval.endorsedBy,
                                  6,
                                  4
                                )})`
                              : 'Signature 1 (Maker): Awaiting KDA Sub-Registrar biometric verification & endorsement'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-zinc-300" />
                          <span>
                            Signature 2 (Checker): Sindh Board of Revenue countersignature (Executive release)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[#E4E4E0]">
                      <p className="text-[11px] text-zinc-600">
                        {isEndorsed
                          ? 'KDA clearance confirmed on-chain. Countersign to mutate Sanad Form-VII & release funds.'
                          : 'Separation of duties: Board of Revenue cannot endorse as Sub-Registrar. Awaiting KDA.'}
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                        <button
                          disabled={isEmergencyFrozen || !isEndorsed}
                          onClick={() => onCountersignTransfer(plot.id)}
                          className="bg-[#111315] hover:bg-black disabled:opacity-40 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          <span>Countersign & Mutate Title (2/2)</span>
                        </button>

                        <button
                          onClick={() => onCancelEscrow(plot)}
                          className="bg-white hover:bg-red-50 text-red-700 text-xs font-semibold px-4 py-2.5 rounded-lg border border-[#D4D4CE] hover:border-red-200 cursor-pointer text-center whitespace-nowrap"
                        >
                          Reject Deal & Refund
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
