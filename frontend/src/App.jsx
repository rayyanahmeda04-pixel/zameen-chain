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
  ledgerApproveTransfer,
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
  Building2,
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

  // Auto-scroll active pill into center view inside the horizontal nav dock
  useEffect(() => {
    if (!navScrollRef.current) return;
    const activeBtn = navScrollRef.current.querySelector('[data-active="true"]');
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
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
    if (user.role === 'BUYER') setActiveTab('buyer');
    else if (user.role === 'SELLER') setActiveTab('seller');
    else if (user.role === 'REGISTRAR') setActiveTab('registrar');
    else if (user.role === 'ADMIN') setActiveTab('admin');
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
    showToast(`Session verified: Signed in as ${user.name} (${user.role}).`, 'success');

    if (user.role === 'BUYER') selectTab('buyer');
    else if (user.role === 'SELLER') selectTab('seller');
    else if (user.role === 'REGISTRAR') selectTab('registrar');
    else if (user.role === 'ADMIN') selectTab('admin');
  };

  const handleLogout = () => {
    logoutUser();
    setAppUser(null);
    setIsMetaMaskConnected(false);
    setAccount(ZERO_ADDRESS);
    if (['buyer', 'seller', 'registrar', 'admin'].includes(activeTab)) {
      selectTab('verify');
    }
    showToast('Signed out of sovereign session.', 'info');
  };

  // Optional browser Web3 wallet bridge
  const connectMetaMask = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsMetaMaskConnected(true);
          showToast(
            `Browser Web3 Wallet Connected: ${shortenAddress(accounts[0], 6, 4)}`,
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
        showToast(`Sub-Registrar ${officerData.name} accredited on ZameenChain!`, 'success');
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

  const handleApproveTransfer = async (plotId) => {
    try {
      const res = await ledgerApproveTransfer(currentUser, isMetaMaskConnected, plotId);
      showToast(
        `Transfer certified! Legal Sanad mutated & escrow released (${shortenAddress(res.txHash, 8, 6)}).`,
        'success'
      );
      await loadLedger(false);
    } catch (err) {
      showToast(err.reason || err.message || 'Transfer certification failed.', 'error');
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
        `Funds locked in Atomic Escrow for ${plot.kdaPlotNumber}! Awaiting KDA Registrar stamp (${shortenAddress(res.txHash, 8, 6)}).`,
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
          ? `Stay Order enforced on ${plot.kdaPlotNumber}. Active buyer escrow automatically refunded!`
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
    showToast('Karachi Cadastral Cloud Ledger restored to initial verified seed records.', 'success');
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

  // Determine the 5th thumb-slot on the Mobile Bottom Navigation Bar based on user's role
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
    if (currentUser.role === 'SELLER') {
      return {
        key: 'seller',
        label: 'My Plots',
        icon: Home,
        isActive: activeTab === 'seller',
        onClick: () => selectTab('seller')
      };
    }
    return {
      key: 'buyer',
      label: 'Market',
      icon: ShoppingBag,
      isActive: activeTab === 'buyer',
      onClick: () => selectTab('buyer')
    };
  };

  const mobileRoleItem = getMobileRolePortalItem();
  const MobileRoleIcon = mobileRoleItem.icon;

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle Ambient Sovereign Radial Backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[36rem] h-[36rem] bg-emerald-500/[0.04] rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/5 w-[30rem] h-[30rem] bg-cyan-500/[0.04] rounded-full blur-3xl" />
      </div>

      {/* Mobile-Safe Toast Notification */}
      {toast && (
        <div
          className={`fixed left-3.5 right-3.5 bottom-20 md:left-auto md:right-6 md:bottom-6 z-50 md:max-w-md p-3.5 sm:p-4 rounded-2xl shadow-2xl border text-xs font-medium flex items-center gap-3 backdrop-blur-xl animate-slideUp ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/60 text-rose-100'
              : toast.type === 'info'
              ? 'bg-cyan-950/95 border-cyan-500/60 text-cyan-100'
              : 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                toast.type === 'info' ? 'text-cyan-400' : 'text-emerald-400'
              }`}
            />
          )}
          <span className="leading-relaxed break-words">{toast.message}</span>
        </div>
      )}

      {/* Top Executive Navbar */}
      <Navbar
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

      {/* Global City-Wide Emergency Circuit Breaker Banner */}
      {isEmergencyFrozen && (
        <div className="relative z-20 bg-rose-950/90 border-b border-rose-500/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start sm:items-center gap-2.5 text-rose-200">
              <span className="p-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0 mt-0.5 sm:mt-0">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <span className="leading-relaxed">
                <strong className="text-white uppercase tracking-wider font-bold">
                  Circuit Breaker Engaged:
                </strong>{' '}
                Karachi land listings, plot minting, and new escrow locks are suspended. Existing buyer escrows remain eligible for 100% refunds.
              </span>
            </div>

            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={handleToggleEmergencyFreeze}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-[11px] shrink-0 transition cursor-pointer"
              >
                Lift Freeze Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 pb-24 md:py-8">
        {/* Karachi Cadastral Telemetry Banner (Full on Verify or Desktop; Compacted on other mobile tabs) */}
        <StatsBanner plots={plots} compactMobile={activeTab !== 'verify'} />

        {/* Executive Segmented Navigation Dock */}
        <div className="flex items-center justify-between gap-2 mb-6 sm:mb-8">
          <div
            ref={navScrollRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-white/[0.08] shadow-xl flex-1 min-w-0"
          >
            {/* Section 1: Public Cadastre, GIS & Explorer */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                data-active={activeTab === 'verify'}
                onClick={() => selectTab('verify')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === 'verify'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Search className="w-3.5 h-3.5 shrink-0" />
                <span>Verify Title</span>
              </button>

              <button
                data-active={activeTab === 'map'}
                onClick={() => selectTab('map')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5 shrink-0" />
                <span>GIS Radar</span>
              </button>

              <button
                data-active={activeTab === 'directory'}
                onClick={() => selectTab('directory')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === 'directory'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Cadastre</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono leading-none ${
                    activeTab === 'directory'
                      ? 'bg-slate-950 text-emerald-400 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {plots.length}
                </span>
              </button>

              <button
                data-active={activeTab === 'explorer'}
                onClick={() => selectTab('explorer')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === 'explorer'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span>Block Explorer</span>
              </button>
            </div>

            <div className="h-5 w-[1px] bg-white/[0.1] mx-1 shrink-0" />

            {/* Section 2: Citizen Marketplace & Owner Console */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                data-active={activeTab === 'buyer'}
                onClick={() => {
                  if (!currentUser) {
                    showToast('Select a Citizen Role or Sign In to open the Buyer Portal.', 'info');
                    setIsAuthModalOpen(true);
                  } else {
                    selectTab('buyer');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === 'buyer'
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>Buyer Portal</span>
              </button>

              <button
                data-active={activeTab === 'seller'}
                onClick={() => {
                  if (!currentUser) {
                    showToast('Select a Seller Role or Sign In to manage owned land titles.', 'info');
                    setIsAuthModalOpen(true);
                  } else {
                    selectTab('seller');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === 'seller'
                    ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>Owner Console</span>
              </button>
            </div>

            <div className="h-5 w-[1px] bg-white/[0.1] mx-1 shrink-0" />

            {/* Section 3: Sovereign Governance */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                data-active={activeTab === 'registrar'}
                onClick={() => {
                  if (!currentUser) {
                    setIsAuthModalOpen(true);
                  } else {
                    selectTab('registrar');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === 'registrar'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <ShieldAlert
                  className={`w-3.5 h-3.5 shrink-0 ${
                    activeTab === 'registrar' ? 'text-slate-950' : 'text-amber-400'
                  }`}
                />
                <span>KDA Terminal</span>
              </button>

              <button
                data-active={activeTab === 'admin'}
                onClick={() => {
                  if (!currentUser) {
                    setIsAuthModalOpen(true);
                  } else {
                    selectTab('admin');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Crown
                  className={`w-3.5 h-3.5 shrink-0 ${
                    activeTab === 'admin' ? 'text-slate-950' : 'text-amber-400'
                  }`}
                />
                <span>Ministry Admin</span>
              </button>
            </div>
          </div>

          {/* Compact Sync Button (Icon-only on mobile, labeled on sm+) */}
          <button
            onClick={() => loadLedger(false)}
            disabled={syncing}
            title="Synchronize Cadastral State"
            className="flex items-center justify-center gap-2 p-3 sm:px-4 sm:py-2.5 rounded-2xl sm:rounded-xl bg-slate-900/75 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] transition shadow-md hover:border-emerald-500/30 text-xs font-semibold cursor-pointer shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-400 ${syncing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync Ledger'}</span>
          </button>
        </div>

        {/* Active Module Viewport */}
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">
              Synchronizing Karachi Cadastral Ledger & Cryptographic Deeds...
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
                onApproveTransfer={handleApproveTransfer}
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
                onOpenAuth={() => setIsAuthModalOpen(true)}
                showToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Native-App Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Quick Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#050a12]/95 backdrop-blur-2xl border-t border-white/[0.1] pb-safe print:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.65)]"
      >
        <div className="grid grid-cols-5 px-1.5 pt-1.5">
          <button
            type="button"
            onClick={() => selectTab('verify')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'verify' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-semibold">Verify</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('map')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'map' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapIcon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-semibold">GIS Map</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('directory')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'directory' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-semibold">Cadastre</span>
          </button>

          <button
            type="button"
            onClick={() => selectTab('explorer')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'explorer' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-semibold">Explorer</span>
          </button>

          <button
            type="button"
            onClick={mobileRoleItem.onClick}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
              mobileRoleItem.isActive
                ? 'text-amber-400'
                : currentUser
                ? 'text-teal-300 hover:text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MobileRoleIcon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] font-semibold truncate max-w-[60px]">
              {mobileRoleItem.label}
            </span>
          </button>
        </div>
      </nav>

      {/* Digital Sanad Certificate & Immutable Chain-of-Title Modal */}
      <PlotModal
        plot={selectedPlot}
        onClose={() => setSelectedPlot(null)}
        getAuditTrail={getAuditTrail}
      />

      {/* Interactive Transaction & Judicial Order Modal */}
      <ActionModal
        modalState={actionModalState}
        onClose={() => setActionModalState(null)}
        onConfirm={handleActionModalConfirm}
      />

      {/* Sovereign Identity & Role Access Gateway */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Sovereign GovTech Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#04080f]/90 backdrop-blur-xl pt-6 pb-24 md:py-6 px-4 text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <div className="hidden sm:flex w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-200">
                ZameenChain Sovereign Cadastral Protocol
              </p>
              <p className="text-[11px] text-slate-500">
                Karachi Development Authority (KDA) & Board of Revenue Sindh
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
              Contract: <span className="text-emerald-400">{shortenAddress(CONTRACT_ADDRESS, 6, 4)}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
              Engine:{' '}
              <span className={networkMode === 'LIVE_EVM' ? 'text-emerald-400' : 'text-cyan-400'}>
                {networkMode === 'LIVE_EVM' ? 'EVM (31337)' : 'Cloud Ledger'}
              </span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
              Block #{blockNumber.toLocaleString()}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
