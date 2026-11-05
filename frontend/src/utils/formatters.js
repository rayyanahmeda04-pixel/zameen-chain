import { ethers } from 'ethers';

// Reference sovereign valuation rate: 1 ETH = PKR 850,000
export const ETH_TO_PKR_RATE = 850000;

/**
 * Safely convert wei / BigInt / string to ETH float
 */
export function toEthNumber(weiOrEth) {
  if (weiOrEth === null || weiOrEth === undefined) return 0;
  try {
    if (typeof weiOrEth === 'bigint') {
      return parseFloat(ethers.formatEther(weiOrEth));
    }
    const str = String(weiOrEth);
    // If large integer string (wei), formatEther; if decimal string, parseFloat
    if (/^\d+$/.test(str) && str.length > 9) {
      return parseFloat(ethers.formatEther(str));
    }
    return parseFloat(str) || 0;
  } catch {
    return 0;
  }
}

/**
 * Format ETH cleanly (e.g. "1.50 ETH" or "4 ETH")
 */
export function formatEth(weiValue) {
  const eth = toEthNumber(weiValue);
  if (eth <= 0) return '0 ETH';
  const formatted = eth % 1 === 0 ? eth.toFixed(1) : parseFloat(eth.toFixed(4)).toString();
  return `${formatted} ETH`;
}

/**
 * Convert ETH or Wei into Pakistani Rupee Crore / Lakh notation
 * e.g. 1.5 ETH * 850,000 = PKR 12,75,000 -> "PKR 12.75 Lakh"
 * e.g. 15 ETH * 850,000 = PKR 1,27,50,000 -> "PKR 1.28 Crore"
 */
export function formatPkrFromWei(weiValue) {
  const eth = toEthNumber(weiValue);
  return formatPkrFromEth(eth);
}

export function formatPkrFromEth(ethAmount) {
  const num = Number(ethAmount) || 0;
  if (num <= 0) return 'PKR 0';
  const pkr = num * ETH_TO_PKR_RATE;

  if (pkr >= 10000000) {
    return `PKR ${(pkr / 10000000).toFixed(2)} Crore`;
  }
  if (pkr >= 100000) {
    return `PKR ${(pkr / 100000).toFixed(2)} Lakh`;
  }
  return `PKR ${Math.round(pkr).toLocaleString('en-PK')}`;
}

/**
 * Calculate Government of Sindh statutory land transfer duties:
 * - Stamp Duty: 2% of consideration value
 * - Capital Value Tax (CVT): 1% of consideration value
 * - KDA Registration & Mutation Fee: 0.5%
 */
export function calculateSindhTransferTaxes(weiValue) {
  const eth = toEthNumber(weiValue);
  const pkrTotal = eth * ETH_TO_PKR_RATE;
  return {
    baseEth: eth,
    basePkr: pkrTotal,
    stampDutyPkr: pkrTotal * 0.02,
    cvtPkr: pkrTotal * 0.01,
    kdaFeePkr: pkrTotal * 0.005,
    formatCurrency: (val) => {
      if (val >= 10000000) return `PKR ${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `PKR ${(val / 100000).toFixed(2)} Lac`;
      return `PKR ${Math.round(val).toLocaleString('en-PK')}`;
    }
  };
}

/**
 * Shorten Ethereum address or transaction hash
 */
export function shortenAddress(addr, start = 6, end = 4) {
  if (!addr || typeof addr !== 'string') return '0x0000...0000';
  if (addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

/**
 * Known identity resolver for cleaner display alongside raw wallet addresses
 */
export const KNOWN_WALLET_IDENTITIES = {
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': 'KDA Chief Secretariat / Admin',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': 'Aamir Khan (Verified Citizen)',
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': 'Bilal Siddiqui (Verified Citizen)',
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906': 'Hamza Sheikh (Verified Citizen)',
  '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65': 'Khurram Shahzad (Sub-Registrar)',
  '0x0000000000000000000000000000000000000000': 'Government of Sindh (Genesis)'
};

export function resolveWalletLabel(addr) {
  if (!addr) return null;
  return KNOWN_WALLET_IDENTITIES[addr.toLowerCase()] || null;
}

/**
 * Generate a deterministic 13x13 QR-style boolean matrix from any string (KDA Plot ID + IPFS Hash)
 * Includes authentic 3-corner finder patterns for high-tech scannable aesthetics.
 */
export function generateDeterministicQrMatrix(seedText) {
  const size = 15;
  const grid = Array.from({ length: size }, () => Array(size).fill(false));
  const hash = ethers.id(seedText || 'ZAMEENCHAIN-KARACHI');
  const bytes = ethers.getBytes(hash);

  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 5);
  drawFinder(size - 5, 0);

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const byteVal = bytes[Math.floor(bitIdx / 8) % bytes.length];
      const bitVal = (byteVal >> (bitIdx % 8)) & 1;
      grid[r][c] = bitVal === 1;
      bitIdx++;
    }
  }

  return grid;
}
