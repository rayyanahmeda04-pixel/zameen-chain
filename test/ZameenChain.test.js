import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("🏛️ ZameenChain: Karachi Land Registry & Anti-Fraud Escrow", function () {
  let zameenChain;
  let registrar, seller, buyer, subOfficer, unauthorizedUser;

  const samplePlotInput = {
    kdaPlotNumber: "SCH33-SEC14A-P204",
    schemeName: "Scheme 33 - Gulshan-e-Kaneez Fatima",
    sector: "Sector 14-A",
    plotNumber: 204,
    squareYards: 240,
    plotCategory: "Residential",
    latitude: "24.9654",
    longitude: "67.1234",
    owner: null,
    ipfsDeedHash: "QmZameenKarachiSampleDeedHash123456789"
  };

  beforeEach(async function () {
    [registrar, seller, buyer, subOfficer, unauthorizedUser] = await ethers.getSigners();
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
      const salePrice = ethers.parseEther("5.0");
      await zameenChain.connect(seller).listPlotForSale(1, salePrice);

      const plot = await zameenChain.plots(1);
      expect(plot.status).to.equal(1); // LISTED_FOR_SALE
      expect(plot.price).to.equal(salePrice);
    });

    it("Should allow buyer to lock funds in Escrow and query via getAllEscrowDeals", async function () {
      const salePrice = ethers.parseEther("5.0");
      await zameenChain.connect(seller).listPlotForSale(1, salePrice);
      await zameenChain.connect(buyer).depositEscrow(1, { value: salePrice });

      const plot = await zameenChain.plots(1);
      expect(plot.status).to.equal(2); // ESCROW_PENDING

      const deals = await zameenChain.getAllEscrowDeals();
      expect(deals.length).to.equal(1);
      expect(deals[0].buyer).to.equal(buyer.address);
      expect(deals[0].amount).to.equal(salePrice);
      expect(deals[0].isActive).to.be.true;
    });

    it("Should complete transfer only after dual signatures (KDA endorse + Board of Revenue countersign)", async function () {
      const salePrice = ethers.parseEther("5.0");
      await zameenChain.connect(seller).listPlotForSale(1, salePrice);
      await zameenChain.connect(buyer).depositEscrow(1, { value: salePrice });

      await zameenChain.connect(registrar).registerRegistrarOfficer(
        subOfficer.address, "Engr. Tariq Mansoor", "KDA-SR-001", "Civic Centre"
      );

      const sellerInitialBalance = await ethers.provider.getBalance(seller.address);

      const newDeedHash = "QmNewTransferredDeedHashBuyer2026";
      await zameenChain.connect(subOfficer).endorseTransfer(1, newDeedHash);

      // Signature 1 alone moves nothing
      let plot = await zameenChain.plots(1);
      expect(plot.currentOwner).to.equal(seller.address);
      expect(plot.status).to.equal(2);
      const approval = await zameenChain.transferApprovals(1);
      expect(approval.isEndorsed).to.be.true;
      expect(approval.endorsedBy).to.equal(subOfficer.address);

      // Signature 2 (Board of Revenue = superAdmin) executes atomic settlement
      await expect(zameenChain.connect(registrar).countersignTransfer(1))
        .to.emit(zameenChain, "TransferCountersigned")
        .withArgs(1, subOfficer.address, registrar.address);

      plot = await zameenChain.plots(1);
      expect(plot.currentOwner).to.equal(buyer.address);
      expect(plot.status).to.equal(0); // REGISTERED
      expect(plot.ipfsDeedHash).to.equal(newDeedHash);
      expect((await zameenChain.transferApprovals(1)).isEndorsed).to.be.false;

      const sellerFinalBalance = await ethers.provider.getBalance(seller.address);
      expect(sellerFinalBalance - sellerInitialBalance).to.equal(salePrice);

      const history = await zameenChain.getPlotHistory(1);
      expect(history.length).to.equal(2);
      expect(history[1].from).to.equal(seller.address);
      expect(history[1].to).to.equal(buyer.address);
      expect(history[1].price).to.equal(salePrice);
    });
  });

  describe("2b. Dual-Signature Controls (No Single Point of Trust)", function () {
    const salePrice = ethers.parseEther("3.0");

    beforeEach(async function () {
      await zameenChain.connect(registrar).registerPlot(samplePlotInput);
      await zameenChain.connect(seller).listPlotForSale(1, salePrice);
      await zameenChain.connect(buyer).depositEscrow(1, { value: salePrice });
      await zameenChain.connect(registrar).registerRegistrarOfficer(
        subOfficer.address, "Engr. Tariq Mansoor", "KDA-SR-001", "Civic Centre"
      );
    });

    it("Should reject countersign before a KDA endorsement exists", async function () {
      await expect(zameenChain.connect(registrar).countersignTransfer(1)).to.be.revertedWith(
        "ZameenChain: Awaiting KDA Sub-Registrar endorsement (signature 1 of 2)"
      );
    });

    it("Should block a Sub-Registrar from countersigning (only Board of Revenue can)", async function () {
      await zameenChain.connect(subOfficer).endorseTransfer(1, "QmDeed");
      await expect(zameenChain.connect(subOfficer).countersignTransfer(1)).to.be.revertedWith(
        "ZameenChain: Caller is not a Board of Revenue countersigning authority"
      );
    });

    it("Should block the Board of Revenue from also acting as endorser (separation of duties)", async function () {
      await expect(zameenChain.connect(registrar).endorseTransfer(1, "QmDeed")).to.be.revertedWith(
        "ZameenChain: Separation of duties - Board of Revenue cannot endorse as Sub-Registrar"
      );
    });

    it("Should block unauthorized wallets and duplicate endorsements", async function () {
      await expect(zameenChain.connect(unauthorizedUser).endorseTransfer(1, "QmDeed")).to.be.revertedWith(
        "ZameenChain: Caller is not the authorized KDA Registrar"
      );
      await zameenChain.connect(subOfficer).endorseTransfer(1, "QmDeed");
      await expect(zameenChain.connect(subOfficer).endorseTransfer(1, "QmDeed2")).to.be.revertedWith(
        "ZameenChain: Transfer already endorsed"
      );
    });

    it("Should block a party to the sale from signing (conflict of interest)", async function () {
      await zameenChain.connect(registrar).registerRegistrarOfficer(
        buyer.address, "Corrupt Insider", "KDA-SR-666", "Shadow Office"
      );
      await expect(zameenChain.connect(buyer).endorseTransfer(1, "QmDeed")).to.be.revertedWith(
        "ZameenChain: Conflict of interest - party to the sale cannot sign"
      );
    });

    it("Should invalidate a pending endorsement when escrow is cancelled or a stay order lands", async function () {
      await zameenChain.connect(subOfficer).endorseTransfer(1, "QmDeed");
      await expect(zameenChain.connect(buyer).cancelEscrow(1)).to.emit(zameenChain, "TransferEndorsementRevoked");
      expect((await zameenChain.transferApprovals(1)).isEndorsed).to.be.false;

      // Re-deposit, endorse, then court stay order hits
      await zameenChain.connect(unauthorizedUser).depositEscrow(1, { value: salePrice });
      await zameenChain.connect(subOfficer).endorseTransfer(1, "QmDeed");
      await zameenChain.connect(registrar).flagDispute(1, "SHC Stay Order #SHC-2026/777");
      expect((await zameenChain.transferApprovals(1)).isEndorsed).to.be.false;
    });

    it("Should enforce separation of duties when appointing revenue officers", async function () {
      await expect(zameenChain.connect(registrar).setRevenueOfficer(subOfficer.address, true)).to.be.revertedWith(
        "ZameenChain: Separation of duties - Sub-Registrar cannot be a revenue countersigner"
      );
      await zameenChain.connect(registrar).setRevenueOfficer(unauthorizedUser.address, true);
      expect(await zameenChain.isRevenueAuthority(unauthorizedUser.address)).to.be.true;

      await zameenChain.connect(subOfficer).endorseTransfer(1, "QmDeed");
      await zameenChain.connect(unauthorizedUser).countersignTransfer(1);
      expect((await zameenChain.plots(1)).currentOwner).to.equal(buyer.address);
    });
  });

  describe("3. Legal Dispute, Auto-Refund Protection & Emergency Freeze", function () {
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

      await expect(
        zameenChain.connect(seller).listPlotForSale(1, ethers.parseEther("10"))
      ).to.be.revertedWith("ZameenChain: Cannot list property with active dispute or stay order");
    });

    it("Should AUTOMATICALLY refund locked buyer escrow if High Court stay order hits during escrow", async function () {
      const salePrice = ethers.parseEther("5.0");
      await zameenChain.connect(seller).listPlotForSale(1, salePrice);
      await zameenChain.connect(buyer).depositEscrow(1, { value: salePrice });

      const buyerBefore = await ethers.provider.getBalance(buyer.address);

      await zameenChain.connect(registrar).flagDispute(1, "SHC Stay Order #SHC-2026/999");

      const buyerAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerAfter - buyerBefore).to.equal(salePrice);

      const deal = await zameenChain.escrowDeals(1);
      expect(deal.isActive).to.be.false;

      const plot = await zameenChain.plots(1);
      expect(plot.isDisputed).to.be.true;
      expect(plot.status).to.equal(3);
    });

    it("Should accredit, revoke, and re-accredit officers without duplicating roster", async function () {
      await zameenChain.connect(registrar).registerRegistrarOfficer(
        subOfficer.address,
        "Engr. Farhan",
        "KDA-SR-042",
        "Scheme 33 Division"
      );
      let roster = await zameenChain.getAllRegistrarOfficers();
      expect(roster.length).to.equal(2);
      expect(roster[1].isActive).to.be.true;

      await zameenChain.connect(registrar).revokeRegistrarOfficer(subOfficer.address);
      roster = await zameenChain.getAllRegistrarOfficers();
      expect(roster[1].isActive).to.be.false;

      await zameenChain.connect(registrar).registerRegistrarOfficer(
        subOfficer.address,
        "Engr. Farhan",
        "KDA-SR-042",
        "Scheme 33 Division"
      );
      roster = await zameenChain.getAllRegistrarOfficers();
      expect(roster.length).to.equal(2);
      expect(roster[1].isActive).to.be.true;
    });

    it("Should enforce city-wide emergency freeze while still permitting buyer refunds", async function () {
      const salePrice = ethers.parseEther("2.0");
      await zameenChain.connect(seller).listPlotForSale(1, salePrice);
      await zameenChain.connect(buyer).depositEscrow(1, { value: salePrice });

      await zameenChain.connect(registrar).setEmergencyFreeze(true);

      await expect(
        zameenChain.connect(registrar).countersignTransfer(1)
      ).to.be.revertedWith("ZameenChain: City-wide emergency market freeze is active");

      // Buyer can still safely withdraw escrow during freeze
      await zameenChain.connect(buyer).cancelEscrow(1);
      const deal = await zameenChain.escrowDeals(1);
      expect(deal.isActive).to.be.false;
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
