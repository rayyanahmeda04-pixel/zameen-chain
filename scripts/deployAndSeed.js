import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [registrar, owner1, owner2, buyer] = await hre.ethers.getSigners();

  console.log("--------------------------------------------------");
  console.log("🏛️ Deploying ZameenChain Sovereign Smart Contract...");
  console.log("KDA Registrar Address:", registrar.address);

  const ZameenChain = await hre.ethers.getContractFactory("ZameenChain");
  const contract = await ZameenChain.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ ZameenChain Deployed at:", contractAddress);
  console.log("--------------------------------------------------");
  console.log("🌱 Seeding realistic Karachi Land Registry records...");

  const plotsToSeed = [
    {
      kdaPlotNumber: "KDA-SCH33-SEC14A-P102",
      schemeName: "Scheme 33 - Gulshan-e-Kaneez Fatima",
      sector: "Sector 14-A",
      plotNumber: 102,
      squareYards: 240,
      plotCategory: "Residential",
      latitude: "24.9654",
      longitude: "67.1234",
      owner: owner1.address,
      ipfsDeedHash: "QmSCH33KaneezFatimaDeedScannedDocHash102"
    },
    {
      kdaPlotNumber: "KDA-GLSHN-BLK07-P405",
      schemeName: "Gulshan-e-Iqbal",
      sector: "Block 7",
      plotNumber: 405,
      squareYards: 500,
      plotCategory: "Residential",
      latitude: "24.9180",
      longitude: "67.0971",
      owner: owner2.address,
      ipfsDeedHash: "QmGulshanBlock7AllotmentOrderDeedHash405"
    },
    {
      kdaPlotNumber: "KDA-CLFTN-BLK05-C012",
      schemeName: "Clifton Waterfront Commercial",
      sector: "Block 5",
      plotNumber: 12,
      squareYards: 1000,
      plotCategory: "Commercial",
      latitude: "24.8138",
      longitude: "67.0300",
      owner: owner1.address,
      ipfsDeedHash: "QmCliftonCommercialHighrisePermitHash012"
    },
    {
      kdaPlotNumber: "KDA-SURJ-SEC07D-P789",
      schemeName: "Surjani Town",
      sector: "Sector 7-D",
      plotNumber: 789,
      squareYards: 120,
      plotCategory: "Residential",
      latitude: "25.0210",
      longitude: "67.0650",
      owner: owner2.address,
      ipfsDeedHash: "QmSurjaniSector7DAllotmentSanadHash789"
    },
    {
      kdaPlotNumber: "DHA-PH8-ZNB-C214",
      schemeName: "DHA Phase 8 - Zulfiqar Commercial",
      sector: "Zone B",
      plotNumber: 214,
      squareYards: 600,
      plotCategory: "Commercial",
      latitude: "24.7955",
      longitude: "67.0742",
      owner: owner1.address,
      ipfsDeedHash: "QmDHAPhase8CommercialSanadVerifiedHash214"
    },
    {
      kdaPlotNumber: "MDA-BTK-PRC19-P310",
      schemeName: "Bahria Town Karachi",
      sector: "Precinct 19",
      plotNumber: 310,
      squareYards: 250,
      plotCategory: "Residential",
      latitude: "25.0415",
      longitude: "67.2110",
      owner: owner2.address,
      ipfsDeedHash: "QmBahriaTownPrecinct19AllotmentDeedHash310"
    }
  ];

  for (const plot of plotsToSeed) {
    const tx = await contract.connect(registrar).registerPlot(plot);
    await tx.wait();
    console.log(`  + Registered: ${plot.kdaPlotNumber} (${plot.schemeName})`);
  }

  // List Plot #1, Plot #2, and Plot #5 for sale
  await (await contract.connect(owner1).listPlotForSale(1, hre.ethers.parseEther("1.5"))).wait();
  console.log("  * Plot #1 listed for sale at 1.5 ETH by Aamir Khan");

  await (await contract.connect(owner2).listPlotForSale(2, hre.ethers.parseEther("4.0"))).wait();
  console.log("  * Plot #2 listed for sale at 4.0 ETH by Bilal Siddiqui");

  await (await contract.connect(owner1).listPlotForSale(5, hre.ethers.parseEther("8.5"))).wait();
  console.log("  * Plot #5 listed for sale at 8.5 ETH by Aamir Khan");

  // Flag Plot #4 as DISPUTED (Sindh High Court Stay Order demonstration)
  await (
    await contract
      .connect(registrar)
      .flagDispute(4, "Sindh High Court Stay Order #SHC-2026/412 (Anti-Encroachment Litigation Pending)")
  ).wait();
  console.log("  ! Plot #4 flagged as DISPUTED (Court Stay Order demonstration)");

  // Export deployment info for Frontend
  const clientConfigDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(clientConfigDir)) {
    fs.mkdirSync(clientConfigDir, { recursive: true });
  }

  const contractArtifact = await hre.artifacts.readArtifact("ZameenChain");
  const deploymentData = {
    address: contractAddress,
    abi: contractArtifact.abi,
    network: "hardhat",
    accounts: {
      registrar: registrar.address,
      owner1: owner1.address,
      owner2: owner2.address,
      buyer: buyer.address
    }
  };

  fs.writeFileSync(
    path.join(clientConfigDir, "ZameenChainConfig.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log("💾 Contract ABI and Address exported to frontend/src/contracts/ZameenChainConfig.json");
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
