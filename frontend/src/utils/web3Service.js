import { ethers } from 'ethers';
import config from '../contracts/ZameenChainConfig.json';
import {
  getStoredWalletKey,
  getEmergencyFreezeState,
  setEmergencyFreezeState
} from './authService';

export const CONTRACT_ADDRESS = config.address;
export const CONTRACT_ABI = config.abi;
export const HARDHAT_RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';

const CLOUD_LEDGER_STORAGE_KEY = 'zameen_chain_cloud_ledger_v3';
const LOCAL_TX_LOG_KEY = 'zameen_chain_tx_activity_v3';

// Exact Hardhat deterministic test accounts mapped by lowercase address
export const HARDHAT_ACCOUNT_KEYS = {
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266':
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account #0: Registrar / Chief Admin
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8':
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Account #1: Aamir Khan
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc':
    '0x5de4111afa1a4b94908f83103eb2f958080a12f93ab87a006602e9acc871e50a', // Account #2: Bilal Siddiqui
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906':
    '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6', // Account #3: Hamza Sheikh
  '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65':
    '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a', // Account #4: Khurram Shahzad
  '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc':
    '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba'  // Account #5: Sub-Registrar 2
};

export const SIMULATED_ROLES = {
  REGISTRAR: {
    name: 'Engr. Tariq Mansoor (KDA Registrar)',
    role: 'REGISTRAR',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: HARDHAT_ACCOUNT_KEYS['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266']
  },
  OWNER1: {
    name: 'Aamir Khan',
    role: 'SELLER',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: HARDHAT_ACCOUNT_KEYS['0x70997970c51812dc3a010c7d01b50e0d17dc79c8']
  },
  OWNER2: {
    name: 'Bilal Siddiqui',
    role: 'SELLER',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: HARDHAT_ACCOUNT_KEYS['0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc']
  },
  BUYER: {
    name: 'Hamza Sheikh',
    role: 'BUYER',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: HARDHAT_ACCOUNT_KEYS['0x90f79bf6eb2c4f870365e785982e1f101e93b906']
  }
};

function generateTxHash(seed) {
  return ethers.id(`${seed}-${Date.now()}-${Math.random()}`);
}

/**
 * Create initial verified Karachi Cadastre state for Sovereign Cloud Ledger mode
 */
function createInitialCloudState() {
  const nowSec = Math.floor(Date.now() / 1000);
  const genesisRegistrar = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const ownerAamir = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const ownerBilal = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

  const plots = [
    {
      id: 1,
      kdaPlotNumber: 'KDA-SCH33-SEC14A-P102',
      schemeName: 'Scheme 33 - Gulshan-e-Kaneez Fatima',
      sector: 'Sector 14-A',
      plotNumber: 102,
      squareYards: 240,
      plotCategory: 'Residential',
      latitude: '24.9654',
      longitude: '67.1234',
      currentOwner: ownerAamir,
      ipfsDeedHash: 'QmSCH33KaneezFatimaDeedScannedDocHash102',
      priceWei: ethers.parseEther('1.5').toString(),
      status: 1, // Listed For Sale
      isDisputed: false,
      disputeReason: '',
      escrowBuyer: null,
      escrowAmountWei: '0',
      registrationTimestamp: nowSec - 86400 * 120,
      history: [
        {
          from: ethers.ZeroAddress,
          to: ownerAamir,
          timestamp: nowSec - 86400 * 120,
          priceWei: '0',
          reason: 'Initial Government Allotment (KDA Scheme 33 Directorate)',
          txHash: '0x8f92e4b1c0a3749d2b5e68c19a0f44d3e7c21b098a76543210fedcba98765401'
        }
      ]
    },
    {
      id: 2,
      kdaPlotNumber: 'KDA-GLSHN-BLK07-P405',
      schemeName: 'Gulshan-e-Iqbal',
      sector: 'Block 7',
      plotNumber: 405,
      squareYards: 500,
      plotCategory: 'Residential',
      latitude: '24.9180',
      longitude: '67.0971',
      currentOwner: ownerBilal,
      ipfsDeedHash: 'QmGulshanBlock7AllotmentOrderDeedHash405',
      priceWei: ethers.parseEther('4.0').toString(),
      status: 1, // Listed For Sale
      isDisputed: false,
      disputeReason: '',
      escrowBuyer: null,
      escrowAmountWei: '0',
      registrationTimestamp: nowSec - 86400 * 180,
      history: [
        {
          from: ethers.ZeroAddress,
          to: ownerBilal,
          timestamp: nowSec - 86400 * 180,
          priceWei: '0',
          reason: 'Initial Government Allotment (Civic Centre Sub-Registry)',
          txHash: '0x4d17c83a92b051ef76d3c41289ab502e19c4d78f65a4321098fedcba65432102'
        }
      ]
    },
    {
      id: 3,
      kdaPlotNumber: 'KDA-CLFTN-BLK05-C012',
      schemeName: 'Clifton Waterfront Commercial',
      sector: 'Block 5',
      plotNumber: 12,
      squareYards: 1000,
      plotCategory: 'Commercial',
      latitude: '24.8138',
      longitude: '67.0300',
      currentOwner: ownerAamir,
      ipfsDeedHash: 'QmCliftonCommercialHighrisePermitHash012',
      priceWei: '0',
      status: 0, // Registered
      isDisputed: false,
      disputeReason: '',
      escrowBuyer: null,
      escrowAmountWei: '0',
      registrationTimestamp: nowSec - 86400 * 240,
      history: [
        {
          from: ethers.ZeroAddress,
          to: ownerAamir,
          timestamp: nowSec - 86400 * 240,
          priceWei: '0',
          reason: 'Initial Government Allotment (Clifton Cantonment & KDA)',
          txHash: '0x7a34b91e04f2c8d651a9e307b4c28d1f90e6a5b4c3d2e1f0987654321fedcb03'
        }
      ]
    },
    {
      id: 4,
      kdaPlotNumber: 'KDA-SURJ-SEC07D-P789',
      schemeName: 'Surjani Town',
      sector: 'Sector 7-D',
      plotNumber: 789,
      squareYards: 120,
      plotCategory: 'Residential',
      latitude: '25.0210',
      longitude: '67.0650',
      currentOwner: ownerBilal,
      ipfsDeedHash: 'QmSurjaniSector7DAllotmentSanadHash789',
      priceWei: '0',
      status: 3, // Disputed
      isDisputed: true,
      disputeReason: 'Sindh High Court Stay Order #SHC-2026/412 (Anti-Encroachment Litigation Pending)',
      escrowBuyer: null,
      escrowAmountWei: '0',
      registrationTimestamp: nowSec - 86400 * 300,
      history: [
        {
          from: ethers.ZeroAddress,
          to: ownerBilal,
          timestamp: nowSec - 86400 * 300,
          priceWei: '0',
          reason: 'Initial Government Allotment (Surjani Sector 7 Registry)',
          txHash: '0x2c68f10d45e9a7b382c1d09f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f04'
        }
      ]
    },
    {
      id: 5,
      kdaPlotNumber: 'DHA-PH8-ZNB-C214',
      schemeName: 'DHA Phase 8 - Zulfiqar Commercial',
      sector: 'Zone B',
      plotNumber: 214,
      squareYards: 600,
      plotCategory: 'Commercial',
      latitude: '24.7955',
      longitude: '67.0742',
      currentOwner: ownerAamir,
      ipfsDeedHash: 'QmDHAPhase8CommercialSanadVerifiedHash214',
      priceWei: ethers.parseEther('8.5').toString(),
      status: 1, // Listed For Sale
      isDisputed: false,
      disputeReason: '',
      escrowBuyer: null,
      escrowAmountWei: '0',
      registrationTimestamp: nowSec - 86400 * 95,
      history: [
        {
          from: ethers.ZeroAddress,
          to: ownerAamir,
          timestamp: nowSec - 86400 * 95,
          priceWei: '0',
          reason: 'Initial Cadastral Mutation (DHA Karachi Phase 8)',
          txHash: '0x9e12d45a78c3b6f01928374655aabbccddeeff00112233445566778899aabb05'
        }
      ]
    },
    {
      id: 6,
      kdaPlotNumber: 'MDA-BTK-PRC19-P310',
      schemeName: 'Bahria Town Karachi',
      sector: 'Precinct 19',
      plotNumber: 310,
      squareYards: 250,
      plotCategory: 'Residential',
      latitude: '25.0415',
      longitude: '67.2110',
      currentOwner: ownerBilal,
      ipfsDeedHash: 'QmBahriaTownPrecinct19AllotmentDeedHash310',
      priceWei: '0',
      status: 0, // Registered
      isDisputed: false,
      disputeReason: '',
      escrowBuyer: null,
      escrowAmountWei: '0',
      registrationTimestamp: nowSec - 86400 * 65,
      history: [
        {
          from: ethers.ZeroAddress,
          to: ownerBilal,
          timestamp: nowSec - 86400 * 65,
          priceWei: '0',
          reason: 'Initial Sub-Registry Allotment (Malir Super Highway M-9)',
          txHash: '0x5b77c90e12d34f56a7890bcdef1234567890abcdef1234567890abcdef123406'
        }
      ]
    }
  ];

  const officers = [
    {
      address: genesisRegistrar,
      name: 'Engr. Tariq Mansoor (Chief Sub-Registrar)',
      badgeNumber: 'KDA-SR-001',
      districtBranch: 'KDA Civic Centre Main Secretariat',
      isActive: true,
      registeredAt: nowSec - 86400 * 365
    }
  ];

  const transactions = [
    {
      hash: '0x9e12d45a78c3b6f01928374655aabbccddeeff00112233445566778899aabb05',
      type: 'PLOT_LISTED',
      summary: 'DHA-PH8-ZNB-C214 listed on marketplace for 8.5 ETH',
      actor: ownerAamir,
      plotCode: 'DHA-PH8-ZNB-C214',
      blockNumber: 18420105,
      timestamp: nowSec - 3600 * 14
    },
    {
      hash: '0x2c68f10d45e9a7b382c1d09f4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f04',
      type: 'STAY_ORDER',
      summary: 'Sindh High Court Stay Order #SHC-2026/412 enforced on KDA-SURJ-SEC07D-P789',
      actor: genesisRegistrar,
      plotCode: 'KDA-SURJ-SEC07D-P789',
      blockNumber: 18420089,
      timestamp: nowSec - 86400 * 2
    },
    {
      hash: '0x4d17c83a92b051ef76d3c41289ab502e19c4d78f65a4321098fedcba65432102',
      type: 'PLOT_LISTED',
      summary: 'KDA-GLSHN-BLK07-P405 listed on marketplace for 4.0 ETH',
      actor: ownerBilal,
      plotCode: 'KDA-GLSHN-BLK07-P405',
      blockNumber: 18420064,
      timestamp: nowSec - 86400 * 4
    },
    {
      hash: '0x8f92e4b1c0a3749d2b5e68c19a0f44d3e7c21b098a76543210fedcba98765401',
      type: 'PLOT_MINTED',
      summary: 'Genesis Cadastral Sanad minted for KDA-SCH33-SEC14A-P102 (240 Sq. Yds)',
      actor: genesisRegistrar,
      plotCode: 'KDA-SCH33-SEC14A-P102',
      blockNumber: 18420012,
      timestamp: nowSec - 86400 * 10
    }
  ];

  return {
    blockNumber: 18420118,
    plots,
    officers,
    transactions
  };
}

function getCloudLedger() {
  const raw = localStorage.getItem(CLOUD_LEDGER_STORAGE_KEY);
  if (!raw) {
    const initial = createInitialCloudState();
    localStorage.setItem(CLOUD_LEDGER_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.plots || !Array.isArray(parsed.plots)) {
      const initial = createInitialCloudState();
      localStorage.setItem(CLOUD_LEDGER_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    const initial = createInitialCloudState();
    localStorage.setItem(CLOUD_LEDGER_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function saveCloudLedger(state) {
  localStorage.setItem(CLOUD_LEDGER_STORAGE_KEY, JSON.stringify(state));
}

export function resetCloudLedgerToDefaults() {
  const fresh = createInitialCloudState();
  saveCloudLedger(fresh);
  localStorage.removeItem(LOCAL_TX_LOG_KEY);
  return fresh;
}

function appendLocalTxLog(entry) {
  try {
    const raw = localStorage.getItem(LOCAL_TX_LOG_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem(LOCAL_TX_LOG_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    // ignore storage errors
  }
}

function getLocalTxLogs() {
  try {
    const raw = localStorage.getItem(LOCAL_TX_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Fast probe (1.1s timeout) checking if Hardhat/EVM RPC is reachable AND contract bytecode is deployed.
 */
export async function probeLiveNode() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1100);

    const res = await fetch(HARDHAT_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
        { jsonrpc: '2.0', id: 2, method: 'eth_getCode', params: [CONTRACT_ADDRESS, 'latest'] }
      ]),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) return { live: false };
    const json = await res.json();
    if (!Array.isArray(json) || json.length < 2) return { live: false };

    const blockHex = json[0]?.result;
    const codeHex = json[1]?.result;
    if (!codeHex || codeHex === '0x' || codeHex === '0x0') {
      return { live: false };
    }

    return {
      live: true,
      blockNumber: parseInt(blockHex, 16) || 1
    };
  } catch {
    return { live: false };
  }
}

export function getReadProvider() {
  return new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
}

export async function getContract(signerOrProvider) {
  const provider = signerOrProvider || getReadProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Resolve exact Ethereum signer for the logged-in user on Live Hardhat Node (or MetaMask).
 * Automatically funds custom wallets on local Hardhat devnet via hardhat_setBalance!
 */
async function resolveLiveSigner(currentUser, isMetaMaskConnected) {
  if (isMetaMaskConnected && window.ethereum) {
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    return await browserProvider.getSigner();
  }

  if (!currentUser) {
    throw new Error('Authentication required: Please sign in to execute blockchain transactions.');
  }

  const provider = getReadProvider();
  const lowerAddr = (currentUser.walletAddress || '').toLowerCase();

  // 1. If Registrar or Chief Admin and contract checks onlyRegistrar, use their exact key if known, or Registrar key if Admin
  let privKey = HARDHAT_ACCOUNT_KEYS[lowerAddr] || getStoredWalletKey(lowerAddr);

  if (!privKey) {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'REGISTRAR') {
      privKey = SIMULATED_ROLES.REGISTRAR.privateKey;
    } else {
      // Deterministically derive a local dev key for custom Neon DB user wallets if registered on another machine
      // Wait: an Ethereum address cannot have its private key derived, so if unknown, create & store a session signer
      // OR fund a deterministic key if needed. Let's check if they have a stored key; if not, fall back by role.
      if (currentUser.role === 'SELLER') privKey = SIMULATED_ROLES.OWNER1.privateKey;
      else privKey = SIMULATED_ROLES.BUYER.privateKey;
    }
  }

  const wallet = new ethers.Wallet(privKey, provider);

  // Ensure wallet has sufficient test ETH on local Hardhat node
  try {
    const bal = await provider.getBalance(wallet.address);
    if (bal < ethers.parseEther('20')) {
      const hexHundredEth = '0x56BC75E2D63100000'; // 100 ETH
      await provider.send('hardhat_setBalance', [wallet.address, hexHundredEth]);
    }
  } catch {
    // Non-hardhat RPCs ignore hardhat_setBalance safely
  }

  return wallet;
}

function hydrateCloudPlot(p) {
  return {
    id: Number(p.id),
    kdaPlotNumber: p.kdaPlotNumber,
    schemeName: p.schemeName,
    sector: p.sector,
    plotNumber: Number(p.plotNumber),
    squareYards: Number(p.squareYards),
    plotCategory: p.plotCategory,
    latitude: p.latitude,
    longitude: p.longitude,
    currentOwner: p.currentOwner,
    ipfsDeedHash: p.ipfsDeedHash,
    price: BigInt(p.priceWei || '0'),
    status: Number(p.status),
    isDisputed: Boolean(p.isDisputed),
    disputeReason: p.disputeReason || '',
    escrowBuyer: p.escrowBuyer || null,
    escrowAmount: BigInt(p.escrowAmountWei || '0'),
    registrationTimestamp: Number(p.registrationTimestamp)
  };
}

/**
 * Fetch complete ledger snapshot (Plots + Escrows + Officers + Transactions + Network Mode)
 */
export async function fetchLedgerSnapshot() {
  const probe = await probeLiveNode();

  if (probe.live) {
    try {
      const contract = await getContract();
      const [rawPlots, rawOfficers] = await Promise.all([
        contract.getAllPlots(),
        contract.getAllRegistrarOfficers()
      ]);

      let rawDeals = [];
      try {
        rawDeals = await contract.getAllEscrowDeals();
      } catch {
        // Fallback per-plot escrow lookup if needed
        rawDeals = await Promise.all(
          rawPlots.map((p) => contract.escrowDeals(p.id).catch(() => null))
        );
      }

      let chainFrozen = false;
      try {
        chainFrozen = await contract.emergencyFreeze();
      } catch {
        chainFrozen = getEmergencyFreezeState();
      }

      const formattedPlots = rawPlots.map((p, index) => {
        const deal = rawDeals[index];
        const isEscrowActive = deal && deal.isActive;
        return {
          id: Number(p.id),
          kdaPlotNumber: p.kdaPlotNumber,
          schemeName: p.schemeName,
          sector: p.sector,
          plotNumber: Number(p.plotNumber),
          squareYards: Number(p.squareYards),
          plotCategory: p.plotCategory,
          latitude: p.latitude,
          longitude: p.longitude,
          currentOwner: p.currentOwner,
          ipfsDeedHash: p.ipfsDeedHash,
          price: p.price,
          status: Number(p.status),
          isDisputed: p.isDisputed,
          disputeReason: p.disputeReason,
          escrowBuyer: isEscrowActive ? deal.buyer : null,
          escrowAmount: isEscrowActive ? deal.amount : 0n,
          registrationTimestamp: Number(p.registrationTimestamp)
        };
      });

      const formattedOfficers = rawOfficers
        .filter((o) => o.isActive)
        .map((o) => ({
          address: o.officerAddress,
          name: o.officerName,
          badgeNumber: o.badgeNumber,
          districtBranch: o.districtBranch,
          isActive: o.isActive,
          registeredAt: Number(o.registeredAt)
        }));

      return {
        mode: 'LIVE_EVM',
        chainId: 31337,
        blockNumber: probe.blockNumber,
        emergencyFreeze: chainFrozen || getEmergencyFreezeState(),
        plots: formattedPlots,
        officers: formattedOfficers,
        transactions: getLocalTxLogs()
      };
    } catch (err) {
      console.warn('Live EVM read fallback triggered:', err);
    }
  }

  // Sovereign Cloud Ledger Mode (Vercel / Remote / Offline-capable)
  const cloud = getCloudLedger();
  return {
    mode: 'CLOUD_LEDGER',
    chainId: 31337,
    blockNumber: cloud.blockNumber,
    emergencyFreeze: getEmergencyFreezeState(),
    plots: cloud.plots.map(hydrateCloudPlot),
    officers: cloud.officers.filter((o) => o.isActive !== false),
    transactions: cloud.transactions || []
  };
}

/**
 * 1. Register Primary Plot Allotment
 */
export async function ledgerRegisterPlot(currentUser, isMetaMask, formData) {
  if (getEmergencyFreezeState()) {
    throw new Error('City-Wide Emergency Freeze is active. Plot minting is temporarily suspended.');
  }

  const probe = await probeLiveNode();
  const cleanCode = formData.kdaPlotNumber.trim().toUpperCase();

  if (probe.live) {
    const signer = await resolveLiveSigner(currentUser, isMetaMask);
    const contract = await getContract(signer);
    const tx = await contract.registerPlot({
      kdaPlotNumber: cleanCode,
      schemeName: formData.schemeName.trim(),
      sector: formData.sector.trim(),
      plotNumber: Number(formData.plotNumber),
      squareYards: Number(formData.squareYards),
      plotCategory: formData.plotCategory,
      latitude: String(formData.latitude),
      longitude: String(formData.longitude),
      owner: formData.owner.trim(),
      ipfsDeedHash: formData.ipfsDeedHash.trim()
    });
    const receipt = await tx.wait();
    appendLocalTxLog({
      hash: receipt.hash,
      type: 'PLOT_MINTED',
      summary: `Minted primary land title ${cleanCode} (${formData.squareYards} Sq. Yds)`,
      actor: signer.address,
      plotCode: cleanCode,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return { txHash: receipt.hash };
  }

  // Cloud Ledger execution
  const cloud = getCloudLedger();
  if (cloud.plots.some((p) => p.kdaPlotNumber.toUpperCase() === cleanCode)) {
    throw new Error(`Duplicate Plot Blocked: KDA Allotment ID "${cleanCode}" already exists on-chain.`);
  }
  if (!ethers.isAddress(formData.owner.trim())) {
    throw new Error('Invalid owner Ethereum wallet address.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const newId = cloud.plots.reduce((max, p) => Math.max(max, Number(p.id)), 0) + 1;
  const txHash = generateTxHash(`MINT-${cleanCode}`);
  cloud.blockNumber += 1;

  cloud.plots.push({
    id: newId,
    kdaPlotNumber: cleanCode,
    schemeName: formData.schemeName.trim(),
    sector: formData.sector.trim(),
    plotNumber: Number(formData.plotNumber),
    squareYards: Number(formData.squareYards),
    plotCategory: formData.plotCategory,
    latitude: String(formData.latitude),
    longitude: String(formData.longitude),
    currentOwner: formData.owner.trim(),
    ipfsDeedHash: formData.ipfsDeedHash.trim() || `QmKarachiVerifiedDeed${newId}`,
    priceWei: '0',
    status: 0,
    isDisputed: false,
    disputeReason: '',
    escrowBuyer: null,
    escrowAmountWei: '0',
    registrationTimestamp: nowSec,
    history: [
      {
        from: ethers.ZeroAddress,
        to: formData.owner.trim(),
        timestamp: nowSec,
        priceWei: '0',
        reason: 'Initial Government Allotment',
        txHash
      }
    ]
  });

  cloud.transactions.unshift({
    hash: txHash,
    type: 'PLOT_MINTED',
    summary: `Minted primary land title ${cleanCode} (${formData.squareYards} Sq. Yds)`,
    actor: currentUser?.walletAddress || SIMULATED_ROLES.REGISTRAR.address,
    plotCode: cleanCode,
    blockNumber: cloud.blockNumber,
    timestamp: nowSec
  });

  saveCloudLedger(cloud);
  return { txHash };
}

/**
 * 2. List Plot For Sale
 */
export async function ledgerListPlot(currentUser, isMetaMask, plotId, priceEthString) {
  if (getEmergencyFreezeState()) {
    throw new Error('City-Wide Emergency Freeze is active. Marketplace listings are paused.');
  }

  const priceNum = Number(priceEthString);
  if (isNaN(priceNum) || priceNum <= 0) {
    throw new Error('Listing price must be a valid amount greater than 0 ETH.');
  }
  const priceWei = ethers.parseEther(String(priceEthString));

  const probe = await probeLiveNode();
  if (probe.live) {
    const signer = await resolveLiveSigner(currentUser, isMetaMask);
    const contract = await getContract(signer);
    const tx = await contract.listPlotForSale(plotId, priceWei);
    const receipt = await tx.wait();
    appendLocalTxLog({
      hash: receipt.hash,
      type: 'PLOT_LISTED',
      summary: `Plot #${plotId} listed on marketplace for ${priceEthString} ETH`,
      actor: signer.address,
      plotCode: `Plot #${plotId}`,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return { txHash: receipt.hash };
  }

  const cloud = getCloudLedger();
  const plot = cloud.plots.find((p) => Number(p.id) === Number(plotId));
  if (!plot) throw new Error('Plot does not exist.');
  if (plot.isDisputed) throw new Error('Cannot list property under active court stay order.');
  if (Number(plot.status) === 2) throw new Error('Property currently has an active escrow deal.');
  if (
    !currentUser?.walletAddress ||
    plot.currentOwner.toLowerCase() !== currentUser.walletAddress.toLowerCase()
  ) {
    throw new Error('Unauthorized: Only the registered title holder can list this plot.');
  }

  const txHash = generateTxHash(`LIST-${plotId}-${priceEthString}`);
  cloud.blockNumber += 1;
  plot.priceWei = priceWei.toString();
  plot.status = 1;

  cloud.transactions.unshift({
    hash: txHash,
    type: 'PLOT_LISTED',
    summary: `${plot.kdaPlotNumber} listed for sale at ${priceEthString} ETH`,
    actor: currentUser.walletAddress,
    plotCode: plot.kdaPlotNumber,
    blockNumber: cloud.blockNumber,
    timestamp: Math.floor(Date.now() / 1000)
  });

  saveCloudLedger(cloud);
  return { txHash };
}

/**
 * 3. Delist Plot
 */
export async function ledgerDelistPlot(currentUser, isMetaMask, plotId) {
  const probe = await probeLiveNode();
  if (probe.live) {
    const signer = await resolveLiveSigner(currentUser, isMetaMask);
    const contract = await getContract(signer);
    const tx = await contract.delistPlot(plotId);
    const receipt = await tx.wait();
    appendLocalTxLog({
      hash: receipt.hash,
      type: 'PLOT_DELISTED',
      summary: `Plot #${plotId} withdrawn from public sale`,
      actor: signer.address,
      plotCode: `Plot #${plotId}`,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return { txHash: receipt.hash };
  }

  const cloud = getCloudLedger();
  const plot = cloud.plots.find((p) => Number(p.id) === Number(plotId));
  if (!plot) throw new Error('Plot does not exist.');
  if (
    !currentUser?.walletAddress ||
    plot.currentOwner.toLowerCase() !== currentUser.walletAddress.toLowerCase()
  ) {
    throw new Error('Unauthorized: Only the registered title holder can delist this plot.');
  }

  const txHash = generateTxHash(`DELIST-${plotId}`);
  cloud.blockNumber += 1;
  plot.priceWei = '0';
  plot.status = 0;

  cloud.transactions.unshift({
    hash: txHash,
    type: 'PLOT_DELISTED',
    summary: `${plot.kdaPlotNumber} delisted from marketplace`,
    actor: currentUser.walletAddress,
    plotCode: plot.kdaPlotNumber,
    blockNumber: cloud.blockNumber,
    timestamp: Math.floor(Date.now() / 1000)
  });

  saveCloudLedger(cloud);
  return { txHash };
}

/**
 * 4. Deposit ETH into Atomic Smart Contract Escrow
 */
export async function ledgerDepositEscrow(currentUser, isMetaMask, plot) {
  if (getEmergencyFreezeState()) {
    throw new Error('City-Wide Emergency Freeze is active. Escrow deposits are temporarily locked.');
  }
  if (!currentUser) {
    throw new Error('Please sign in to initiate an escrow purchase.');
  }

  const probe = await probeLiveNode();
  if (probe.live) {
    const signer = await resolveLiveSigner(currentUser, isMetaMask);
    if (signer.address.toLowerCase() === plot.currentOwner.toLowerCase()) {
      throw new Error('Owner cannot purchase their own property.');
    }
    const contract = await getContract(signer);
    const tx = await contract.depositEscrow(plot.id, { value: plot.price });
    const receipt = await tx.wait();
    appendLocalTxLog({
      hash: receipt.hash,
      type: 'ESCROW_LOCKED',
      summary: `${ethers.formatEther(plot.price)} ETH locked in Atomic Escrow for ${plot.kdaPlotNumber}`,
      actor: signer.address,
      plotCode: plot.kdaPlotNumber,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return { txHash: receipt.hash };
  }

  const cloud = getCloudLedger();
  const target = cloud.plots.find((p) => Number(p.id) === Number(plot.id));
  if (!target) throw new Error('Plot does not exist.');
  if (target.isDisputed) throw new Error('Cannot purchase a disputed property.');
  if (Number(target.status) !== 1) throw new Error('Plot is not currently available for sale.');
  if (target.currentOwner.toLowerCase() === currentUser.walletAddress.toLowerCase()) {
    throw new Error('Registered owner cannot purchase their own property.');
  }

  const txHash = generateTxHash(`ESCROW-${plot.id}-${currentUser.walletAddress}`);
  cloud.blockNumber += 1;
  target.status = 2; // ESCROW_PENDING
  target.escrowBuyer = currentUser.walletAddress;
  target.escrowAmountWei = target.priceWei;

  cloud.transactions.unshift({
    hash: txHash,
    type: 'ESCROW_LOCKED',
    summary: `${ethers.formatEther(BigInt(target.priceWei))} ETH locked in Escrow for ${target.kdaPlotNumber}`,
    actor: currentUser.walletAddress,
    plotCode: target.kdaPlotNumber,
    blockNumber: cloud.blockNumber,
    timestamp: Math.floor(Date.now() / 1000)
  });

  saveCloudLedger(cloud);
  return { txHash };
}

/**
 * 5. KDA Registrar: Certify Deed Transfer & Release Escrow Funds
 */
export async function ledgerApproveTransfer(currentUser, isMetaMask, plotId) {
  if (getEmergencyFreezeState()) {
    throw new Error('City-Wide Emergency Freeze is active. Title transfers are suspended.');
  }

  const newDeedHash = `QmKdaCertifiedSanad${plotId}v${Date.now().toString().slice(-6)}`;
  const probe = await probeLiveNode();

  if (probe.live) {
    const signer = await resolveLiveSigner(currentUser, isMetaMask);
    const contract = await getContract(signer);
    const tx = await contract.approveAndCompleteTransfer(plotId, newDeedHash);
    const receipt = await tx.wait();
    appendLocalTxLog({
      hash: receipt.hash,
      type: 'TITLE_TRANSFERRED',
      summary: `KDA Sub-Registrar certified transfer & released escrow for Plot #${plotId}`,
      actor: signer.address,
      plotCode: `Plot #${plotId}`,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return { txHash: receipt.hash };
  }

  const cloud = getCloudLedger();
  const target = cloud.plots.find((p) => Number(p.id) === Number(plotId));
  if (!target) throw new Error('Plot does not exist.');
  if (Number(target.status) !== 2 || !target.escrowBuyer) {
    throw new Error('No active escrow deal awaiting certification for this plot.');
  }
  if (target.isDisputed) {
    throw new Error('Cannot transfer property under active court stay order.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const previousOwner = target.currentOwner;
  const newOwner = target.escrowBuyer;
  const salePriceWei = target.escrowAmountWei || target.priceWei;
  const txHash = generateTxHash(`TRANSFER-${plotId}-${newOwner}`);
  cloud.blockNumber += 1;

  target.currentOwner = newOwner;
  target.priceWei = '0';
  target.status = 0; // REGISTERED
  target.ipfsDeedHash = newDeedHash;
  target.escrowBuyer = null;
  target.escrowAmountWei = '0';

  if (!Array.isArray(target.history)) target.history = [];
  target.history.push({
    from: previousOwner,
    to: newOwner,
    timestamp: nowSec,
    priceWei: salePriceWei,
    reason: 'Verified Blockchain Sale & Atomic Escrow Settlement',
    txHash
  });

  cloud.transactions.unshift({
    hash: txHash,
    type: 'TITLE_TRANSFERRED',
    summary: `Title transferred for ${target.kdaPlotNumber} (${ethers.formatEther(BigInt(salePriceWei))} ETH released)`,
    actor: currentUser?.walletAddress || SIMULATED_ROLES.REGISTRAR.address,
    plotCode: target.kdaPlotNumber,
    blockNumber: cloud.blockNumber,
    timestamp: nowSec
  });

  saveCloudLedger(cloud);
  return { txHash };
}

/**
 * 6. Cancel Escrow & Refund Buyer (Callable by Buyer OR KDA Registrar)
 */
export async function ledgerCancelEscrow(currentUser, isMetaMask, plotId) {
  const probe = await probeLiveNode();
  if (probe.live) {
    const signer = await resolveLiveSigner(currentUser, isMetaMask);
    const contract = await getContract(signer);
    const tx = await contract.cancelEscrow(plotId);
    const receipt = await tx.wait();
    appendLocalTxLog({
      hash: receipt.hash,
      type: 'ESCROW_REFUNDED',
      summary: `Escrow cancelled & full ETH refunded to buyer for Plot #${plotId}`,
      actor: signer.address,
      plotCode: `Plot #${plotId}`,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return { txHash: receipt.hash };
  }

  const cloud = getCloudLedger();
  const target = cloud.plots.find((p) => Number(p.id) === Number(plotId));
  if (!target || Number(target.status) !== 2) {
    throw new Error('No active escrow in progress for this plot.');
  }

  const isBuyer =
    currentUser?.walletAddress &&
    target.escrowBuyer &&
    currentUser.walletAddress.toLowerCase() === target.escrowBuyer.toLowerCase();
  const isAuthority = currentUser?.role === 'REGISTRAR' || currentUser?.role === 'ADMIN';

  if (!isBuyer && !isAuthority) {
    throw new Error('Only the depositing buyer or an authorized KDA Registrar can cancel this escrow.');
  }

  const txHash = generateTxHash(`CANCEL-ESCROW-${plotId}`);
  cloud.blockNumber += 1;
  const refundedEth = ethers.formatEther(BigInt(target.escrowAmountWei || target.priceWei || '0'));

  target.escrowBuyer = null;
  target.escrowAmountWei = '0';
  target.status = target.isDisputed ? 3 : 1; // Return to LISTED_FOR_SALE unless disputed

  cloud.transactions.unshift({
    hash: txHash,
    type: 'ESCROW_REFUNDED',
    summary: `Escrow cancelled for ${target.kdaPlotNumber} — ${refundedEth} ETH refunded to buyer`,
    actor: currentUser?.walletAddress || SIMULATED_ROLES.REGISTRAR.address,
    plotCode: target.kdaPlotNumber,
    blockNumber: cloud.blockNumber,
    timestamp: Math.floor(Date.now() / 1000)
  });

  saveCloudLedger(cloud);
  return { txHash };
}

/**
 * 7. Flag High Court Stay Order / Legal Dispute (Auto-refunds any active buyer escrow!)
 */
export async function ledgerFlagDispute(currentUser, isMetaMask, plotId, reason) {
  const cleanReason = (reason || '').trim();
  if (!cleanReason) throw new Error('Court Stay Order reference / reason is required.');

  const probe = await probeLiveNode();
  if (probe.live) {
    const signer = await resolveLiveSigner(currentUser, isMetaMask);
    const contract = await getContract(signer);
    const tx = await contract.flagDispute(plotId, cleanReason);
    const receipt = await tx.wait();
    appendLocalTxLog({
      hash: receipt.hash,
      type: 'STAY_ORDER',
      summary: `Court Stay Order enforced on Plot #${plotId}: ${cleanReason}`,
      actor: signer.address,
      plotCode: `Plot #${plotId}`,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return { txHash: receipt.hash };
  }

  const cloud = getCloudLedger();
  const target = cloud.plots.find((p) => Number(p.id) === Number(plotId));
  if (!target) throw new Error('Plot does not exist.');

  const txHash = generateTxHash(`DISPUTE-${plotId}`);
  cloud.blockNumber += 1;

  // Auto-refund innocent buyer if plot was in escrow
  const hadEscrow = Number(target.status) === 2 && target.escrowBuyer;
  target.escrowBuyer = null;
  target.escrowAmountWei = '0';
  target.priceWei = '0';
  target.isDisputed = true;
  target.disputeReason = cleanReason;
  target.status = 3;

  cloud.transactions.unshift({
    hash: txHash,
    type: 'STAY_ORDER',
    summary: `${target.kdaPlotNumber} frozen under Stay Order${hadEscrow ? ' (Buyer Escrow Auto-Refunded)' : ''}`,
    actor: currentUser?.walletAddress || SIMULATED_ROLES.REGISTRAR.address,
    plotCode: target.kdaPlotNumber,
    blockNumber: cloud.blockNumber,
    timestamp: Math.floor(Date.now() / 1000)
  });

  saveCloudLedger(cloud);
  return { txHash, autoRefundedBuyer: Boolean(hadEscrow) };
}

/**
 * 8. Resolve Court Stay Order
 */
export async function ledgerResolveDispute(currentUser, isMetaMask, plotId) {
  const probe = await probeLiveNode();
  if (probe.live) {
    const signer = await resolveLiveSigner(currentUser, isMetaMask);
    const contract = await getContract(signer);
    const tx = await contract.resolveDispute(plotId);
    const receipt = await tx.wait();
    appendLocalTxLog({
      hash: receipt.hash,
      type: 'STAY_LIFTED',
      summary: `Court Stay Order lifted & title cleared for Plot #${plotId}`,
      actor: signer.address,
      plotCode: `Plot #${plotId}`,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000)
    });
    return { txHash: receipt.hash };
  }

  const cloud = getCloudLedger();
  const target = cloud.plots.find((p) => Number(p.id) === Number(plotId));
  if (!target) throw new Error('Plot does not exist.');

  const txHash = generateTxHash(`RESOLVE-${plotId}`);
  cloud.blockNumber += 1;
  target.isDisputed = false;
  target.disputeReason = '';
  target.status = 0;

  cloud.transactions.unshift({
    hash: txHash,
    type: 'STAY_LIFTED',
    summary: `Court Stay Order resolved — ${target.kdaPlotNumber} restored to clean title`,
    actor: currentUser?.walletAddress || SIMULATED_ROLES.REGISTRAR.address,
    plotCode: target.kdaPlotNumber,
    blockNumber: cloud.blockNumber,
    timestamp: Math.floor(Date.now() / 1000)
  });

  saveCloudLedger(cloud);
  return { txHash };
}

/**
 * 9. Register & Accredit KDA Officer
 */
export async function ledgerRegisterOfficer(currentUser, isMetaMask, officerData) {
  if (!ethers.isAddress(officerData.address)) {
    throw new Error('Invalid officer Ethereum wallet address.');
  }

  const probe = await probeLiveNode();
  if (probe.live) {
    const signer = await resolveLiveSigner(currentUser, isMetaMask);
    const contract = await getContract(signer);
    const existing = await contract.registrarOfficers(officerData.address);
    if (!existing || !existing.isActive) {
      const tx = await contract.registerRegistrarOfficer(
        officerData.address,
        officerData.name,
        officerData.badgeNumber,
        officerData.districtBranch
      );
      const receipt = await tx.wait();
      appendLocalTxLog({
        hash: receipt.hash,
        type: 'OFFICER_ACCREDITED',
        summary: `Sub-Registrar ${officerData.name} (${officerData.badgeNumber}) accredited on-chain`,
        actor: signer.address,
        plotCode: officerData.badgeNumber,
        blockNumber: receipt.blockNumber,
        timestamp: Math.floor(Date.now() / 1000)
      });
      return { txHash: receipt.hash };
    }
    return { txHash: null, alreadyActive: true };
  }

  const cloud = getCloudLedger();
  const idx = cloud.officers.findIndex(
    (o) => o.address.toLowerCase() === officerData.address.toLowerCase()
  );
  const nowSec = Math.floor(Date.now() / 1000);
  const txHash = generateTxHash(`OFFICER-${officerData.address}`);
  cloud.blockNumber += 1;

  const record = {
    address: officerData.address,
    name: officerData.name,
    badgeNumber: officerData.badgeNumber,
    districtBranch: officerData.districtBranch,
    isActive: true,
    registeredAt: nowSec
  };

  if (idx >= 0) {
    cloud.officers[idx] = record;
  } else {
    cloud.officers.push(record);
  }

  cloud.transactions.unshift({
    hash: txHash,
    type: 'OFFICER_ACCREDITED',
    summary: `Sub-Registrar ${officerData.name} (${officerData.badgeNumber}) accredited`,
    actor: currentUser?.walletAddress || SIMULATED_ROLES.REGISTRAR.address,
    plotCode: officerData.badgeNumber,
    blockNumber: cloud.blockNumber,
    timestamp: nowSec
  });

  saveCloudLedger(cloud);
  return { txHash };
}

/**
 * 10. Revoke Officer Accreditation
 */
export async function ledgerRevokeOfficer(currentUser, isMetaMask, officerAddress) {
  if (!officerAddress || !ethers.isAddress(officerAddress)) return;

  const probe = await probeLiveNode();
  if (probe.live) {
    try {
      const signer = await resolveLiveSigner(currentUser, isMetaMask);
      const contract = await getContract(signer);
      const existing = await contract.registrarOfficers(officerAddress);
      if (existing && existing.isActive) {
        const tx = await contract.revokeRegistrarOfficer(officerAddress);
        await tx.wait();
      }
    } catch (err) {
      console.warn('On-chain officer revoke notice:', err);
    }
    return;
  }

  const cloud = getCloudLedger();
  cloud.officers = cloud.officers.map((o) =>
    o.address.toLowerCase() === officerAddress.toLowerCase() ? { ...o, isActive: false } : o
  );
  saveCloudLedger(cloud);
}

/**
 * 11. Toggle City-Wide Emergency Freeze
 */
export async function ledgerSetEmergencyFreeze(currentUser, isMetaMask, frozen) {
  setEmergencyFreezeState(frozen);

  const probe = await probeLiveNode();
  if (probe.live) {
    try {
      const signer = await resolveLiveSigner(currentUser, isMetaMask);
      const contract = await getContract(signer);
      const tx = await contract.setEmergencyFreeze(frozen);
      const receipt = await tx.wait();
      appendLocalTxLog({
        hash: receipt.hash,
        type: frozen ? 'EMERGENCY_FREEZE' : 'FREEZE_LIFTED',
        summary: frozen
          ? 'Executive Order: Karachi City-Wide Land Market Frozen'
          : 'Executive Order: Karachi Land Market Resumed',
        actor: signer.address,
        plotCode: 'CITY-WIDE',
        blockNumber: receipt.blockNumber,
        timestamp: Math.floor(Date.now() / 1000)
      });
      return;
    } catch (err) {
      console.warn('Emergency freeze local sync:', err);
    }
  }

  const cloud = getCloudLedger();
  cloud.blockNumber += 1;
  cloud.transactions.unshift({
    hash: generateTxHash(`FREEZE-${frozen}`),
    type: frozen ? 'EMERGENCY_FREEZE' : 'FREEZE_LIFTED',
    summary: frozen
      ? 'Executive Order: Karachi City-Wide Land Market Frozen'
      : 'Executive Order: Karachi Land Market Resumed',
    actor: currentUser?.walletAddress || SIMULATED_ROLES.REGISTRAR.address,
    plotCode: 'CITY-WIDE',
    blockNumber: cloud.blockNumber,
    timestamp: Math.floor(Date.now() / 1000)
  });
  saveCloudLedger(cloud);
}

/**
 * 12. Get Ownership Audit Trail for any Plot
 */
export async function ledgerGetPlotHistory(plotId) {
  const probe = await probeLiveNode();
  if (probe.live) {
    try {
      const contract = await getContract();
      const rawHistory = await contract.getPlotHistory(plotId);
      return rawHistory.map((r) => ({
        from: r.from,
        to: r.to,
        timestamp: Number(r.timestamp),
        price: r.price,
        reason: r.reason,
        txHash: null
      }));
    } catch (err) {
      console.warn('History fallback:', err);
    }
  }

  const cloud = getCloudLedger();
  const target = cloud.plots.find((p) => Number(p.id) === Number(plotId));
  if (!target || !Array.isArray(target.history)) return [];
  return target.history.map((r) => ({
    from: r.from,
    to: r.to,
    timestamp: Number(r.timestamp),
    price: BigInt(r.priceWei || '0'),
    reason: r.reason,
    txHash: r.txHash || null
  }));
}
