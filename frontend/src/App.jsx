import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import StatsBanner from './components/StatsBanner';
import PublicVerification from './components/PublicVerification';
import PlotsDirectory from './components/PlotsDirectory';
import RegistrarPanel from './components/RegistrarPanel';
import SellerPortal from './components/SellerPortal';
import BuyerPortal from './components/BuyerPortal';
import KarachiMap from './components/KarachiMap';
import LedgerExplorer from './components/LedgerExplorer';
import PlotModal from './components/PlotModal';
import AuthModal from './components/AuthModal';
import ActionModal from './components/ActionModal';
import AdminPortal from './components/AdminPortal';
import {
  getCurrentUser,
  logoutUser
} from './utils/authService';
import {
  CONTRACT_ADDRESS,
  fetchLedgerSnapshot,
  ledgerRegisterPlot,
  ledgerListPlot,
  ledgerDelistPlot,
  ledgerDepositEscrow,
  ledgerEndorseTransfer,
  ledgerCountersignTransfer,
  ledgerCancelEscrow,
  ledgerFlagDispute,
  ledgerResolveDispute,
  ledgerRegisterOfficer,
  ledgerRevokeOfficer,
  ledgerSetEmergencyFreeze,
  ledgerGetPlotHistory,
  resetCloudLedgerToDefaults
} from './utils/web3Service';
import { shortenAddress } from './utils/formatters';
import { ethers } from 'ethers';
import {
  Search,
  Map as MapIcon,
  ShieldAlert,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Home,
  Crown,
  Activity,
  Lock,
  Shield,
  UserCheck
} from 'lucide-react';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export default function App() {
  const [currentUser, setAppUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('verify');
  const [account, setAccount] = useState(ZERO_ADDRESS);
  const [isMetaMaskConnected, setIsMetaMaskConnected] = useState(false);

  const [networkMode, setNetworkMode] = useState('CLOUD_LEDGER');
  const [blockNumber, setBlockNumber] = useState(18420118);
  const [isEmergencyFrozen, setIsEmergencyFrozen] = useState(false);

  const [plots, setPlots] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [selectedPlot, setSelectedPlot] = useState(null);
  const [actionModalState, setActionModalState] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const navScrollRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Auto-scroll active pill into center view inside the mobile/tablet horizontal nav strip
  useEffect(() => {
    if (!navScrollRef.current) return;
    const activeBtn = navScrollRef.current.querySelector('[data-active="true"]');
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Restore authenticated session on startup without blocking public visitors
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    if (
      user.role === 'REGISTRAR' &&
      (user.status === 'PENDING_APPROVAL' || user.status === 'REJECTED')
    ) {
      logoutUser();
      setAppUser(null);
      setAccount(ZERO_ADDRESS);
      setActiveTab('verify');
      return;
    }

    setAppUser(user);
    setAccount(user.walletAddress || ZERO_ADDRESS);
    if (user.role === 'REGISTRAR') setActiveTab('registrar');
    else if (user.role === 'ADMIN') setActiveTab('admin');
    else setActiveTab('buyer');
  }, []);

  // Load synchronized blockchain / sovereign cloud ledger snapshot
  const loadLedger = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setSyncing(true);
    try {
      const snapshot = await fetchLedgerSnapshot();
      setNetworkMode(snapshot.mode);
      setBlockNumber(snapshot.blockNumber || 0);
      setIsEmergencyFrozen(Boolean(snapshot.emergencyFreeze));
      setPlots(snapshot.plots || []);
      setOfficers(snapshot.officers || []);
      setTransactions(snapshot.transactions || []);

      setSelectedPlot((prev) => {
        if (!prev) return null;
        return (snapshot.plots || []).find((p) => Number(p.id) === Number(prev.id)) || null;
      });
    } catch (err) {
      console.error('Ledger synchronization error:', err);
      showToast('Failed to synchronize cadastre state.', 'error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLedger(true);
  }, [loadLedger]);

  const handleAuthSuccess = (user) => {
    if (
      user.role === 'REGISTRAR' &&
      (user.status === 'PENDING_APPROVAL' || user.status === 'REJECTED')
    ) {
      showToast(
        'Clearance Pending: Sub-Registrar credentials require Chief Administrator approval.',
        'info'
      );
      return;
    }

    setAppUser(user);
    if (!isMetaMaskConnected) {
      setAccount(user.walletAddress || ZERO_ADDRESS);
    }
    showToast(`Signed in as ${user.name} (${user.role}).`, 'success');

    if (user.role === 'REGISTRAR') selectTab('registrar');
    else if (user.role === 'ADMIN') selectTab('admin');
    else selectTab('buyer');
  };

  const handleLogout = () => {
    logoutUser();
    setAppUser(null);
    setIsMetaMaskConnected(false);
    setAccount(ZERO_ADDRESS);
    if (['buyer', 'seller', 'registrar', 'admin'].includes(activeTab)) {
      selectTab('verify');
    }
    showToast('Signed out of session.', 'info');
  };

  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsMetaMaskConnected(true);
          showToast(
            `Web3 Wallet Connected: ${shortenAddress(accounts[0], 6, 4)}`,
            'success'
          );
        }
      } catch (err) {
        showToast('Wallet connection declined: ' + (err.reason || err.message), 'error');
      }
    } else {
      showToast(
        'No browser wallet extension detected. Built-in ZameenChain cryptographic key signer is active.',
        'info'
      );
    }
  };

  const resolvePlotTarget = (plotOrId) => {
    if (!plotOrId) return null;
    if (typeof plotOrId === 'object') return plotOrId;
    return plots.find((p) => Number(p.id) === Number(plotOrId)) || null;
  };

  const handleRegisterOfficer = async (officerData) => {
    try {
      const res = await ledgerRegisterOfficer(currentUser, isMetaMaskConnected, officerData);
      await loadLedger(false);
      if (res?.alreadyActive) {
        showToast(`Officer ${officerData.name} is already accredited on-chain.`, 'info');
      } else {
        showToast(`Sub-Registrar ${officerData.name} accredited on ZameenChain.`, 'success');
      }
    } catch (err) {
      showToast(err.reason || err.message || 'Officer accreditation failed.', 'error');
      throw err;
    }
  };

  const handleRemoveOfficer = async (officerAddress) => {
    try {
      await ledgerRevokeOfficer(currentUser, isMetaMaskConnected, officerAddress);
      await loadLedger(false);
    } catch (err) {
      console.warn('Revoke officer warning:', err);
    }
  };

  const handleRegisterPlot = async (formData) => {
    try {
      const res = await ledgerRegisterPlot(currentUser, isMetaMaskConnected, formData);
      showToast(
        `Digital Sanad minted for ${formData.kdaPlotNumber.trim().toUpperCase()} (${shortenAddress(res.txHash, 8, 6)})`,
        'success'
      );
      await loadLedger(false);
    } catch (err) {
      showToast(err.reason || err.message || 'Plot registration failed.', 'error');
      throw err;
    }
  };

  const openListForSaleModal = (plotOrId) => {
    if (!currentUser) {
      showToast('Please sign in as the registered property owner to list a parcel.', 'info');
      setIsAuthModalOpen(true);
      return;
    }
    const targetPlot = resolvePlotTarget(plotOrId);
    if (!targetPlot) return;
    setActionModalState({ type: 'LIST_PLOT', plot: targetPlot });
  };

  const handleDelist = async (plotId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await ledgerDelistPlot(currentUser, isMetaMaskConnected, plotId);
      showToast('Property withdrawn from marketplace.', 'success');
      await loadLedger(false);
    } catch (err) {
      showToast(err.reason || err.message || 'Failed to delist property.', 'error');
    }
  };

  const openDepositEscrowModal = (plotOrId) => {
    if (!currentUser) {
      showToast('Sign in or select a Verified Citizen Role to initiate an Atomic Escrow purchase.', 'info');
      setIsAuthModalOpen(true);
      return;
    }
    const targetPlot = resolvePlotTarget(plotOrId);
    if (!targetPlot) return;
    setActionModalState({ type: 'DEPOSIT_ESCROW', plot: targetPlot });
  };

  const handleEndorseTransfer = async (plotId) => {
    try {
      const res = await ledgerEndorseTransfer(currentUser, isMetaMaskConnected, plotId);
      showToast(
        `Signature 1 of 2 recorded! KDA Sub-Registrar endorsed the deed (${shortenAddress(res.txHash, 8, 6)}). Awaiting Board of Revenue countersignature.`,
        'success'
      );
      await loadLedger(false);
    } catch (err) {
      showToast(err.reason || err.message || 'KDA Endorsement failed.', 'error');
    }
  };

  const handleCountersignTransfer = async (plotId) => {
    try {
      const res = await ledgerCountersignTransfer(currentUser, isMetaMaskConnected, plotId);
      showToast(
        `Signature 2 of 2 recorded! Board of Revenue countersigned (${shortenAddress(res.txHash, 8, 6)}). Legal Sanad mutated & escrow funds released.`,
        'success'
      );
      await loadLedger(false);
    } catch (err) {
      showToast(err.reason || err.message || 'Board of Revenue countersignature failed.', 'error');
    }
  };

  const openCancelEscrowModal = (plotOrId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const targetPlot = resolvePlotTarget(plotOrId);
    if (!targetPlot) return;
    setActionModalState({ type: 'CANCEL_ESCROW', plot: targetPlot });
  };

  const openFlagDisputeModal = (plotOrId) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const targetPlot = resolvePlotTarget(plotOrId);
    if (!targetPlot) return;
    setActionModalState({ type: 'FLAG_DISPUTE', plot: targetPlot });
  };

  const handleResolveDispute = async (plotId) => {
    try {
      await ledgerResolveDispute(currentUser, isMetaMaskConnected, plotId);
      showToast('Judicial Stay Order lifted! Property restored to clean title.', 'success');
      await loadLedger(false);
    } catch (err) {
      showToast(err.reason || err.message || 'Failed to lift stay order.', 'error');
    }
  };

  const handleActionModalConfirm = async (payload) => {
    if (!actionModalState) return;
    const { type, plot } = actionModalState;

    if (type === 'LIST_PLOT') {
      const res = await ledgerListPlot(
        currentUser,
        isMetaMaskConnected,
        plot.id,
        payload.priceEth
      );
      showToast(
        `${plot.kdaPlotNumber} listed for ${payload.priceEth} ETH (${shortenAddress(res.txHash, 8, 6)})`,
        'success'
      );
    } else if (type === 'DEPOSIT_ESCROW') {
      const res = await ledgerDepositEscrow(currentUser, isMetaMaskConnected, plot);
      showToast(
        `Funds locked in Atomic Escrow for ${plot.kdaPlotNumber}. Awaiting KDA Registrar stamp (${shortenAddress(res.txHash, 8, 6)}).`,
        'success'
      );
    } else if (type === 'FLAG_DISPUTE') {
      const res = await ledgerFlagDispute(
        currentUser,
        isMetaMaskConnected,
        plot.id,
        payload.reason
      );
      showToast(
        res?.autoRefundedBuyer
          ? `Stay Order enforced on ${plot.kdaPlotNumber}. Active buyer escrow automatically refunded.`
          : `Judicial Stay Order enforced on ${plot.kdaPlotNumber}.`,
        'info'
      );
    } else if (type === 'CANCEL_ESCROW') {
      await ledgerCancelEscrow(currentUser, isMetaMaskConnected, plot.id);
      showToast(`Escrow cancelled for ${plot.kdaPlotNumber} — 100% ETH refunded to buyer.`, 'info');
    }

    await loadLedger(false);
  };

  const handleToggleEmergencyFreeze = async () => {
    const nextState = !isEmergencyFrozen;
    try {
      await ledgerSetEmergencyFreeze(currentUser, isMetaMaskConnected, nextState);
      setIsEmergencyFrozen(nextState);
      await loadLedger(false);
      showToast(
        nextState
          ? 'EMERGENCY CIRCUIT BREAKER ENGAGED: Karachi Land Market Frozen.'
          : 'Circuit Breaker Lifted: Karachi Land Market Resumed.',
        nextState ? 'error' : 'success'
      );
    } catch (err) {
      showToast(err.reason || err.message || 'Failed to update freeze state.', 'error');
    }
  };

  const handleResetDemoLedger = async () => {
    resetCloudLedgerToDefaults();
    await ledgerSetEmergencyFreeze(currentUser, isMetaMaskConnected, false);
    await loadLedger(false);
    showToast('Karachi Cadastral Ledger restored to initial verified seed records.', 'success');
  };

  const getAuditTrail = useCallback(async (plotId) => {
    return await ledgerGetPlotHistory(plotId);
  }, []);

  const activeRoleObj = currentUser
    ? {
        name: currentUser.name,
        role: currentUser.role,
        status: currentUser.status || 'ACTIVE',
        address: isMetaMaskConnected ? account : currentUser.walletAddress || account
      }
    : {
        name: 'Public Citizen',
        role: 'PUBLIC',
        status: 'ACTIVE',
        address: isMetaMaskConnected ? account : ZERO_ADDRESS
      };

  const handleProtectedNav = (tab, msg) => {
    if (!currentUser) {
      if (msg) showToast(msg, 'info');
      setIsAuthModalOpen(true);
    } else {
      selectTab(tab);
    }
  };

  // Mobile Bottom Nav 5th Dynamic Role Slot
  const getMobileRolePortalItem = () => {
    if (!currentUser) {
      return {
        key: 'auth',
        label: 'Portal',
        icon: UserCheck,
        isActive: isAuthModalOpen,
        onClick: () => setIsAuthModalOpen(true)
      };
    }
    if (currentUser.role === 'ADMIN') {
      return {
        key: 'admin',
        label: 'Admin',
        icon: Crown,
        isActive: activeTab === 'admin',
        onClick: () => selectTab('admin')
      };
    }
    if (currentUser.role === 'REGISTRAR') {
      return {
        key: 'registrar',
        label: 'KDA Desk',
        icon: ShieldAlert,
        isActive: activeTab === 'registrar',
        onClick: () => selectTab('registrar')
      };
    }
    const isPortfolio = activeTab === 'seller';
    return {
      key: isPortfolio ? 'seller' : 'buyer',
      label: isPortfolio ? 'My Plots' : 'Market',
      icon: isPortfolio ? Home : ShoppingBag,
      isActive: activeTab === 'seller' || activeTab === 'buyer',
      onClick: () => selectTab(isPortfolio ? 'buyer' : 'seller')
    };
  };

  const mobileRoleItem = getMobileRolePortalItem();
  const MobileRoleIcon = mobileRoleItem.icon;

  const escrowCount = plots.filter((p) => Number(p.status) === 2).length;

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#111315] flex flex-col lg:flex-row font-sans selection:bg-[#0B5D46]/15 selection:text-[#0B5D46]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed left-3.5 right-3.5 bottom-20 md:left-auto md:right-6 md:bottom-6 z-50 md:max-w-md p-3.5 rounded-xl shadow-[0_12px_32px_rgba(16,24,40,0.12)] border text-xs font-medium flex items-center gap-3 animate-slideUp ${
            toast.type === 'error'
              ? 'bg-white border-red-200 text-red-900'
              : toast.type === 'info'
              ? 'bg-white border-blue-200 text-zinc-800'
              : 'bg-white border-emerald-200 text-zinc-900'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                toast.type === 'info' ? 'text-blue-600' : 'text-[#059669]'
              }`}
            />
          )}
          <span className="leading-relaxed break-words">{toast.message}</span>
        </div>
      )}

      {/* DESKTOP COMMAND SIDEBAR (lg+) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 bg-white border-r border-[#E4E4E0] print:hidden">
        {/* Brand Masthead */}
        <div
          onClick={() => selectTab('verify')}
          className="h-16 px-5 border-b border-[#E4E4E0] flex items-center gap-3 cursor-pointer select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0B5D46] flex items-center justify-center text-white shadow-xs shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold tracking-tight text-[#111315]">
                ZameenChain
              </span>
              <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[#F4F4F1] text-zinc-600 border border-[#E4E4E0]">
                v2.4
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate">
              Sindh Board of Revenue & KDA
            </p>
          </div>
        </div>

        {/* Grouped Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          {/* Group 1: Public Registry */}
          <div>
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Public Cadastre
            </p>
            <div className="space-y-0.5">
              {[
                { key: 'verify', label: 'Title Verification', icon: Search },
                { key: 'map', label: 'Karachi GIS Map', icon: MapIcon },
                { key: 'directory', label: 'Parcel Directory', icon: Layers, count: plots.length },
                { key: 'explorer', label: 'Audit Ledger', icon: Activity, count: transactions.length }
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => selectTab(item.key)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                      active
                        ? 'bg-[#F4F4F1] text-[#111315] font-semibold border border-[#E4E4E0]'
                        : 'text-zinc-600 hover:text-[#111315] hover:bg-zinc-50 font-medium border border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-[#0B5D46]' : 'text-zinc-400'}`} />
                      <span>{item.label}</span>
                    </span>
                    {typeof item.count === 'number' && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded tabular-nums ${
                          active
                            ? 'bg-white text-[#111315] border border-[#E4E4E0]'
                            : 'text-zinc-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Citizen Workspace */}
          <div>
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Citizen & Escrow
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() =>
                  handleProtectedNav(
                    'buyer',
                    'Sign in or select a Verified Citizen Role to access the Buyer Marketplace.'
                  )
                }
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                  activeTab === 'buyer'
                    ? 'bg-[#F4F4F1] text-[#111315] font-semibold border border-[#E4E4E0]'
                    : 'text-zinc-600 hover:text-[#111315] hover:bg-zinc-50 font-medium border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ShoppingBag
                    className={`w-4 h-4 ${
                      activeTab === 'buyer' ? 'text-[#0B5D46]' : 'text-zinc-400'
                    }`}
                  />
                  <span>Buyer Marketplace</span>
                </span>
              </button>

              <button
                onClick={() =>
                  handleProtectedNav(
                    'seller',
                    'Sign in as a Title Holder to manage owned landholdings.'
                  )
                }
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                  activeTab === 'seller'
                    ? 'bg-[#F4F4F1] text-[#111315] font-semibold border border-[#E4E4E0]'
                    : 'text-zinc-600 hover:text-[#111315] hover:bg-zinc-50 font-medium border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Home
                    className={`w-4 h-4 ${
                      activeTab === 'seller' ? 'text-[#0B5D46]' : 'text-zinc-400'
                    }`}
                  />
                  <span>Owner Portfolio</span>
                </span>
              </button>
            </div>
          </div>

          {/* Group 3: Sovereign Authority */}
          <div>
            <p className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Authority Desk
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => handleProtectedNav('registrar')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                  activeTab === 'registrar'
                    ? 'bg-[#F4F4F1] text-[#111315] font-semibold border border-[#E4E4E0]'
                    : 'text-zinc-600 hover:text-[#111315] hover:bg-zinc-50 font-medium border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <ShieldAlert
                    className={`w-4 h-4 ${
                      activeTab === 'registrar' ? 'text-[#0B5D46]' : 'text-zinc-400'
                    }`}
                  />
                  <span>KDA Sub-Registrar</span>
                </span>
                {escrowCount > 0 && (
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {escrowCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleProtectedNav('admin')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#F4F4F1] text-[#111315] font-semibold border border-[#E4E4E0]'
                    : 'text-zinc-600 hover:text-[#111315] hover:bg-zinc-50 font-medium border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Crown
                    className={`w-4 h-4 ${
                      activeTab === 'admin' ? 'text-[#0B5D46]' : 'text-zinc-400'
                    }`}
                  />
                  <span>Ministry Governance</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Telemetry & Sync Footer */}
        <div className="p-3.5 border-t border-[#E4E4E0] bg-[#FBFBFA] space-y-2.5">
          <div className="px-1 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Protocol State</span>
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  isEmergencyFrozen ? 'text-red-700' : 'text-[#059669]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isEmergencyFrozen ? 'bg-red-600' : 'bg-[#059669]'
                  }`}
                />
                {isEmergencyFrozen ? 'Frozen' : 'Operational'}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
              <span>Contract</span>
              <span>{shortenAddress(CONTRACT_ADDRESS, 6, 4)}</span>
            </div>
          </div>

          <button
            onClick={() => loadLedger(false)}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-[#F4F4F1] text-[#111315] border border-[#D4D4CE] text-xs font-medium transition cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Synchronizing...' : 'Sync Ledger State'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Command Bar */}
        <Navbar
          activeTab={activeTab}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          account={activeRoleObj.address}
          isMetaMaskConnected={isMetaMaskConnected}
          connectMetaMask={connectMetaMask}
          networkMode={networkMode}
          blockNumber={blockNumber}
          isEmergencyFrozen={isEmergencyFrozen}
          onSelectHome={() => selectTab('verify')}
        />

        {/* Emergency Freeze Banner */}
        {isEmergencyFrozen && (
          <div className="bg-red-50 border-b border-red-200 px-3.5 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start sm:items-center gap-2 text-red-900">
              <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
              <span className="leading-relaxed">
                <strong className="font-semibold">Market Circuit Breaker Engaged:</strong>{' '}
                Karachi land listings, plot minting, and new escrow locks are temporarily suspended. Existing buyer escrows remain eligible for 100% refunds.
              </span>
            </div>

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={handleToggleEmergencyFreeze}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-[11px] shrink-0 transition cursor-pointer"
              >
                Lift Freeze Now
              </button>
            )}
          </div>
        )}

        {/* Mobile / Tablet Horizontal Sub-Navigation (< lg) */}
        <div className="lg:hidden bg-white border-b border-[#E4E4E0] px-3.5 sm:px-6 py-2 flex items-center justify-between gap-2 print:hidden">
          <div
            ref={navScrollRef}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0"
          >
            {[
              { key: 'verify', label: 'Verify Title', icon: Search },
              { key: 'map', label: 'GIS Map', icon: MapIcon },
              { key: 'directory', label: `Cadastre (${plots.length})`, icon: Layers },
              { key: 'explorer', label: 'Audit Ledger', icon: Activity },
              { key: 'buyer', label: 'Buyer Market', icon: ShoppingBag, protected: true },
              { key: 'seller', label: 'Owner Console', icon: Home, protected: true },
              { key: 'registrar', label: 'KDA Desk', icon: ShieldAlert, protected: true },
              { key: 'admin', label: 'Ministry Admin', icon: Crown, protected: true }
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  data-active={active}
                  onClick={() =>
                    item.protected ? handleProtectedNav(item.key) : selectTab(item.key)
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap shrink-0 transition cursor-pointer ${
                    active
                      ? 'bg-[#111315] text-white font-semibold'
                      : 'text-zinc-600 hover:text-[#111315] hover:bg-zinc-100 font-medium'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => loadLedger(false)}
            disabled={syncing}
            title="Sync Ledger"
            className="p-2 rounded-lg bg-[#F7F7F5] hover:bg-zinc-200/70 border border-[#E4E4E0] text-zinc-700 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 pb-24 md:py-7">
          {/* Executive Cadastre Overview Strip (Shown on Verify / Home screen) */}
          {activeTab === 'verify' && <StatsBanner plots={plots} />}

          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-6 h-6 text-[#0B5D46] animate-spin mx-auto mb-2.5" />
              <p className="text-xs text-zinc-500 font-medium">
                Synchronizing Karachi Cadastral Ledger...
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'verify' && (
                <PublicVerification
                  plots={plots}
                  activeRole={activeRoleObj}
                  onSelectPlot={setSelectedPlot}
                  onDepositEscrow={openDepositEscrowModal}
                />
              )}

              {activeTab === 'map' && (
                <KarachiMap plots={plots} onSelectPlot={setSelectedPlot} />
              )}

              {activeTab === 'directory' && (
                <PlotsDirectory
                  plots={plots}
                  activeRole={activeRoleObj}
                  isEmergencyFrozen={isEmergencyFrozen}
                  onSelectPlot={setSelectedPlot}
                  onDepositEscrow={openDepositEscrowModal}
                  onListForSale={openListForSaleModal}
                  onDelist={handleDelist}
                  onFlagDispute={openFlagDisputeModal}
                  onResolveDispute={handleResolveDispute}
                />
              )}

              {activeTab === 'explorer' && (
                <LedgerExplorer
                  transactions={transactions}
                  networkMode={networkMode}
                  blockNumber={blockNumber}
                  plotsCount={plots.length}
                />
              )}

              {activeTab === 'buyer' && (
                <BuyerPortal
                  plots={plots}
                  activeRole={activeRoleObj}
                  isEmergencyFrozen={isEmergencyFrozen}
                  onDepositEscrow={openDepositEscrowModal}
                  onCancelEscrow={openCancelEscrowModal}
                  onSelectPlot={setSelectedPlot}
                />
              )}

              {activeTab === 'seller' && (
                <SellerPortal
                  plots={plots}
                  activeRole={activeRoleObj}
                  isEmergencyFrozen={isEmergencyFrozen}
                  onListForSale={openListForSaleModal}
                  onDelist={handleDelist}
                  onSelectPlot={setSelectedPlot}
                />
              )}

              {activeTab === 'registrar' && (
                <RegistrarPanel
                  plots={plots}
                  activeRole={activeRoleObj}
                  isEmergencyFrozen={isEmergencyFrozen}
                  onSwitchToRegistrar={() => setIsAuthModalOpen(true)}
                  onRegisterPlot={handleRegisterPlot}
                  onRegisterOfficer={handleRegisterOfficer}
                  onEndorseTransfer={handleEndorseTransfer}
                  onCountersignTransfer={handleCountersignTransfer}
                  onCancelEscrow={openCancelEscrowModal}
                  officers={officers}
                />
              )}

              {activeTab === 'admin' && (
                <AdminPortal
                  currentUser={currentUser}
                  plots={plots}
                  isEmergencyFrozen={isEmergencyFrozen}
                  onToggleEmergencyFreeze={handleToggleEmergencyFreeze}
                  onResetDemoLedger={handleResetDemoLedger}
                  onResolveDispute={handleResolveDispute}
                  onRegisterOfficerOnChain={handleRegisterOfficer}
                  onRemoveOfficer={handleRemoveOfficer}
                  onCountersignTransfer={handleCountersignTransfer}
                  onCancelEscrow={openCancelEscrowModal}
                  onOpenAuth={() => setIsAuthModalOpen(true)}
                  showToast={showToast}
                />
              )}
            </>
          )}
        </main>

        {/* Institutional Footer */}
        <footer className="border-t border-[#E4E4E0] bg-white pt-5 pb-24 md:py-4 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500 print:hidden">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-center sm:text-left text-[11px]">
              <strong className="font-semibold text-[#111315]">ZameenChain Protocol</strong> • Karachi Development Authority (KDA) & Board of Revenue Sindh
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-zinc-500 tabular-nums">
              <span>Contract {shortenAddress(CONTRACT_ADDRESS, 6, 4)}</span>
              <span className="text-zinc-300">•</span>
              <span>Block #{blockNumber.toLocaleString()}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (< md) */}
      <nav
        aria-label="Mobile Quick Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E4E4E0] pb-safe print:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      >
        <div className="grid grid-cols-5 px-1.5 pt-1.5">
          {[
            { key: 'verify', label: 'Verify', icon: Search },
            { key: 'map', label: 'GIS Map', icon: MapIcon },
            { key: 'directory', label: 'Cadastre', icon: Layers },
            { key: 'explorer', label: 'Ledger', icon: Activity }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => selectTab(item.key)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition cursor-pointer ${
                  active ? 'text-[#0B5D46] font-semibold' : 'text-zinc-500 hover:text-[#111315]'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={mobileRoleItem.onClick}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg transition cursor-pointer ${
              mobileRoleItem.isActive
                ? 'text-[#0B5D46] font-semibold'
                : currentUser
                ? 'text-[#111315] font-medium'
                : 'text-zinc-500 hover:text-[#111315]'
            }`}
          >
            <MobileRoleIcon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] truncate max-w-[60px]">
              {mobileRoleItem.label}
            </span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <PlotModal
        plot={selectedPlot}
        onClose={() => setSelectedPlot(null)}
        getAuditTrail={getAuditTrail}
      />

      <ActionModal
        modalState={actionModalState}
        onClose={() => setActionModalState(null)}
        onConfirm={handleActionModalConfirm}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
