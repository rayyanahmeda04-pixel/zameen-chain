import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("🏛️ ZameenChain: Karachi Land Registry & Anti-Fraud Escrow", function () {
  let zameenChain;
  let registrar, seller, buyer, unauthorizedUser;

  const samplePlotInput = {
    kdaPlotNumber: "SCH33-SEC14A-P204",
    schemeName: "Scheme 33 - Gulshan-e-Kaneez Fatima",
    sector: "Sector 14-A",
    plotNumber: 204,
    squareYards: 240,
    plotCategory: "Residential",
    latitude: "24.9654",
    longitude: "67.1234",
    owner: null, // will assign in beforeEach
    ipfsDeedHash: "QmZameenKarachiSampleDeedHash123456789"
  };

  beforeEach(async function () {
    [registrar, seller, buyer, unauthorizedUser] = await ethers.getSigners();
    samplePlotInput.owner = seller.address;

    const ZameenChainFactory = await ethers.getContractFactory("ZameenChain");
    zameenChain = await ZameenChainFactory.deploy();
    await zameenChain.waitForDeployment();
  });

  describe("1. Plot Registration & Anti-Double Allotment", function () {
    it("Should allow KDA Registrar to register a verified plot", async function () {
      const tx = await zameenChain.connect(registrar).registerPlot(samplePlotInput);
      await tx.wait();

      const plot = await zameenChain.plots(1);
      expect(plot.kdaPlotNumber).to.equal("SCH33-SEC14A-P204");
      expect(plot.currentOwner).to.equal(seller.address);
      expect(plot.squareYards).to.equal(240);
      expect(plot.status).to.equal(0); // REGISTERED
    });

    it("Should REJECT duplicate registration with the same KDA Plot Number (Karachi fraud prevention)", async function () {
      await zameenChain.connect(registrar).registerPlot(samplePlotInput);

      // Attempt duplicate allotment
      await expect(
        zameenChain.connect(registrar).registerPlot(samplePlotInput)
      ).to.be.revertedWith("ZameenChain ERROR: Duplicate plot detected! KDA Number already registered.");
    });

    it("Should prevent non-registrar from registering plots", async function () {
      await expect(
        zameenChain.connect(unauthorizedUser).registerPlot(samplePlotInput)
      ).to.be.revertedWith("ZameenChain: Caller is not the authorized KDA Registrar");
    });
  });

  describe("2. Marketplace Listing & Escrow Purchase Flow", function () {
    beforeEach(async function () {
      await zameenChain.connect(registrar).registerPlot(samplePlotInput);
    });

    it("Should allow owner to list their plot for sale", async function () {
      const salePrice = ethers.parseEther("5.0"); // 5 ETH
      await zameenChain.connect(seller).listPlotForSale(1, salePrice);

      const plot = await zameenChain.plots(1);
      expect(plot.status).to.equal(1); // LISTED_FOR_SALE
      expect(plot.price).to.equal(salePrice);
    });

    it("Should allow buyer to lock funds in Escrow", async function () {
      const salePrice = ethers.parseEther("5.0");
      await zameenChain.connect(seller).listPlotForSale(1, salePrice);

      // Buyer deposits into escrow
      await zameenChain.connect(buyer).depositEscrow(1, { value: salePrice });

      const plot = await zameenChain.plots(1);
      expect(plot.status).to.equal(2); // ESCROW_PENDING

      const deal = await zameenChain.escrowDeals(1);
      expect(deal.buyer).to.equal(buyer.address);
      expect(deal.amount).to.equal(salePrice);
      expect(deal.isActive).to.be.true;
    });

    it("Should complete transfer upon KDA Registrar approval and release funds to seller", async function () {
      const salePrice = ethers.parseEther("5.0");
      await zameenChain.connect(seller).listPlotForSale(1, salePrice);
      await zameenChain.connect(buyer).depositEscrow(1, { value: salePrice });

      const sellerInitialBalance = await ethers.provider.getBalance(seller.address);

      // Registrar verifies and approves
      const newDeedHash = "QmNewTransferredDeedHashBuyer2026";
      const tx = await zameenChain.connect(registrar).approveAndCompleteTransfer(1, newDeedHash);
      await tx.wait();

      // Check new owner
      const plot = await zameenChain.plots(1);
      expect(plot.currentOwner).to.equal(buyer.address);
      expect(plot.status).to.equal(0); // REGISTERED
      expect(plot.ipfsDeedHash).to.equal(newDeedHash);

      // Check seller received funds
      const sellerFinalBalance = await ethers.provider.getBalance(seller.address);
      expect(sellerFinalBalance - sellerInitialBalance).to.equal(salePrice);

      // Check audit trail
      const history = await zameenChain.getPlotHistory(1);
      expect(history.length).to.equal(2); // Genesis + Sale
      expect(history[1].from).to.equal(seller.address);
      expect(history[1].to).to.equal(buyer.address);
      expect(history[1].price).to.equal(salePrice);
    });
  });

  describe("3. Legal Dispute & Stay-Order Freezing", function () {
    beforeEach(async function () {
      await zameenChain.connect(registrar).registerPlot(samplePlotInput);
    });

    it("Should allow Registrar to freeze property under court stay order", async function () {
      const stayOrderReason = "Sindh High Court Stay Order #SHC-2026/889";
      await zameenChain.connect(registrar).flagDispute(1, stayOrderReason);

      const plot = await zameenChain.plots(1);
      expect(plot.isDisputed).to.be.true;
      expect(plot.disputeReason).to.equal(stayOrderReason);
      expect(plot.status).to.equal(3); // DISPUTED

      // Owner cannot list disputed plot
      await expect(
        zameenChain.connect(seller).listPlotForSale(1, ethers.parseEther("10"))
      ).to.be.revertedWith("ZameenChain: Cannot list property with active dispute or stay order");
    });

    it("Should allow Registrar to unfreeze plot once court matter is resolved", async function () {
      await zameenChain.connect(registrar).flagDispute(1, "Dispute");
      await zameenChain.connect(registrar).resolveDispute(1);

      const plot = await zameenChain.plots(1);
      expect(plot.isDisputed).to.be.false;
      expect(plot.status).to.equal(0); // REGISTERED
    });
  });

  describe("4. Public Verification", function () {
    it("Should allow public query by KDA plot number", async function () {
      await zameenChain.connect(registrar).registerPlot(samplePlotInput);

      const [isFound, plot] = await zameenChain.verifyPlotByKdaNumber("SCH33-SEC14A-P204");
      expect(isFound).to.be.true;
      expect(plot.schemeName).to.equal("Scheme 33 - Gulshan-e-Kaneez Fatima");
      expect(plot.currentOwner).to.equal(seller.address);
    });

    it("Should return false for non-existent KDA numbers", async function () {
      const [isFound] = await zameenChain.verifyPlotByKdaNumber("FAKE-PLOT-999");
      expect(isFound).to.be.false;
    });
  });
});
