import { ethers } from "ethers";
import config from "../contracts/ZameenChainConfig.json";

const CONTRACT_ADDRESS = config.address;
const CONTRACT_ABI = config.abi;
const HARDHAT_RPC_URL = "http://127.0.0.1:8545";

// Default test private keys from Hardhat local node for easy 1-click simulation
export const SIMULATED_ROLES = {
  REGISTRAR: {
    name: "KDA Registrar (Govt Admin)",
    role: "REGISTRAR",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    badge: "🏛️ Govt Registrar"
  },
  OWNER1: {
    name: "Aamir Khan (Owner - Scheme 33 & Clifton)",
    role: "SELLER",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    badge: "👤 Property Owner"
  },
  OWNER2: {
    name: "Bilal Siddiqui (Owner - Gulshan & Surjani)",
    role: "SELLER",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb2f958080a12f93ab87a006602e9acc871e50a",
    badge: "👤 Property Owner"
  },
  BUYER: {
    name: "Hamza Sheikh (Prospective Buyer)",
    role: "BUYER",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    badge: "🤝 Verified Buyer"
  },
  PUBLIC: {
    name: "Aam Shehri / Public Citizen",
    role: "PUBLIC",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    privateKey: null,
    badge: "🔍 Public Inspector"
  }
};

/**
 * Get read-only provider (Direct JSON-RPC to avoid MetaMask network mismatch on reads)
 */
export function getReadProvider() {
  return new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
}

/**
 * Get provider (browser if available, fallback to local node)
 */
export function getProvider() {
  return getReadProvider();
}

/**
 * Get contract instance
 */
export async function getContract(signerOrProvider) {
  const provider = signerOrProvider || getReadProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Get simulated signer using Hardhat local private key
 */
export function getSimulatedSigner(roleKey) {
  const role = SIMULATED_ROLES[roleKey];
  if (!role || !role.privateKey) return null;
  const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
  return new ethers.Wallet(role.privateKey, provider);
}
