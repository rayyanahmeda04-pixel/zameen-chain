// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ZameenChain
 * @dev Sovereign Decentralized Land Title Registry & Anti-Fraud Atomic Escrow Protocol
 *      for Karachi Urban Real Estate (Government of Sindh / KDA Cadastre).
 *      Eliminates duplicate plot files, double allotments, advance-token fraud,
 *      and enforces Sindh High Court stay orders cryptographically.
 *      Title transfers require dual-signature (2-of-2) approval: a KDA Sub-Registrar
 *      endorsement plus a separate Sindh Board of Revenue countersignature.
 */
contract ZameenChain {
    address public superAdmin; // Government of Sindh / Ministry of Revenue
    address public governmentRegistrar; // Initial Lead Sub-Registrar
    bool public emergencyFreeze; // City-wide emergency market freeze switch

    enum PlotStatus {
        REGISTERED,
        LISTED_FOR_SALE,
        ESCROW_PENDING,
        DISPUTED
    }

    struct RegistrarOfficer {
        address officerAddress;
        string officerName;
        string badgeNumber;      // e.g. "KDA-SR-001"
        string districtBranch;   // e.g. "KDA Civic Centre - Main Branch"
        bool isActive;
        uint256 registeredAt;
    }

    struct OwnershipRecord {
        address from;
        address to;
        uint256 timestamp;
        uint256 price;
        string reason; // e.g. "Initial Government Allotment", "Verified Blockchain Sale & Transfer"
    }

    struct EscrowDeal {
        address payable buyer;
        uint256 amount;
        bool isActive;
    }

    /**
     * @notice Dual-Signature (2-of-2 Maker-Checker) transfer approval.
     * Signature 1 (Maker):   KDA Sub-Registrar verifies documents & endorses the deed.
     * Signature 2 (Checker): Sindh Board of Revenue authority countersigns & releases escrow.
     * No single official can ever transfer a title or release buyer funds alone.
     */
    struct TransferApproval {
        address endorsedBy;        // KDA Sub-Registrar (Signature 1 of 2)
        uint256 endorsedAt;
        string newDeedIpfsHash;    // Deed hash proposed by the endorsing registrar
        bool isEndorsed;
    }

    struct LandPlot {
        uint256 id;
        string kdaPlotNumber;      // Unique Karachi KDA Allotment ID
        string schemeName;         // e.g. "Scheme 33" or "Gulshan-e-Iqbal"
        string sector;             // e.g. "Sector 14-A"
        uint256 plotNumber;        // e.g. 501
        uint256 squareYards;       // e.g. 120, 240, 500, 1000
        string plotCategory;       // "Residential", "Commercial", "Industrial", "Amenity"
        string latitude;           // GPS coordinate
        string longitude;          // GPS coordinate
        address payable currentOwner;
        string ipfsDeedHash;       // IPFS CID of scanned official allotment letter / sanad
        uint256 price;             // Price in wei (if listed)
        PlotStatus status;
        bool isDisputed;
        string disputeReason;      // Reason if flagged (e.g. "Sindh High Court Stay Order #104/2026")
        uint256 registrationTimestamp;
    }

    struct PlotRegistrationInput {
        string kdaPlotNumber;
        string schemeName;
        string sector;
        uint256 plotNumber;
        uint256 squareYards;
        string plotCategory;
        string latitude;
        string longitude;
        address payable owner;
        string ipfsDeedHash;
    }

    uint256 public nextPlotId = 1;

    // Registrar Registry
    mapping(address => RegistrarOfficer) public registrarOfficers;
    mapping(address => bool) private isRegistrarTracked;
    address[] public allRegistrarAddresses;

    // Plot ID => LandPlot
    mapping(uint256 => LandPlot) public plots;

    // Unique KDA number checking: Prevents duplicate plot allotment files
    mapping(string => bool) public isKdaNumberRegistered;
    mapping(string => uint256) public kdaNumberToPlotId;

    // Plot ID => EscrowDeal
    mapping(uint256 => EscrowDeal) public escrowDeals;

    // Plot ID => Pending dual-signature transfer approval
    mapping(uint256 => TransferApproval) public transferApprovals;

    // Sindh Board of Revenue countersigning authorities (Signature 2 of 2)
    mapping(address => bool) public revenueOfficers;

    // Plot ID => Ownership History
    mapping(uint256 => OwnershipRecord[]) private plotAuditTrail;

    // Events for frontend & block explorer tracking
    event RegistrarOfficerRegistered(address indexed officerAddress, string officerName, string badgeNumber);
    event RegistrarOfficerRevoked(address indexed officerAddress);
    event EmergencyFreezeToggled(bool isFrozen, address indexed triggeredBy);
    event PlotRegistered(uint256 indexed plotId, string kdaPlotNumber, address indexed owner, uint256 squareYards);
    event PlotListedForSale(uint256 indexed plotId, uint256 price, address indexed owner);
    event PlotDelisted(uint256 indexed plotId, address indexed owner);
    event EscrowInitiated(uint256 indexed plotId, address indexed buyer, uint256 amount);
    event EscrowCancelled(uint256 indexed plotId, address indexed buyer, uint256 refundAmount);
    event OwnershipTransferred(uint256 indexed plotId, address indexed from, address indexed to, uint256 price);
    event DisputeFlagged(uint256 indexed plotId, string reason);
    event DisputeResolved(uint256 indexed plotId);
    event RevenueOfficerUpdated(address indexed officer, bool isActive);
    event TransferEndorsed(uint256 indexed plotId, address indexed registrar, string newDeedIpfsHash);
    event TransferEndorsementRevoked(uint256 indexed plotId, string reason);
    event TransferCountersigned(uint256 indexed plotId, address indexed registrar, address indexed revenueOfficer);

    modifier onlyRegistrar() {
        require(
            msg.sender == superAdmin || msg.sender == governmentRegistrar || registrarOfficers[msg.sender].isActive,
            "ZameenChain: Caller is not the authorized KDA Registrar"
        );
        _;
    }

    modifier onlySuperAdmin() {
        require(
            msg.sender == superAdmin || msg.sender == governmentRegistrar,
            "ZameenChain: Caller is not Chief Administrator"
        );
        _;
    }

    modifier onlyRevenueAuthority() {
        require(isRevenueAuthority(msg.sender), "ZameenChain: Caller is not a Board of Revenue countersigning authority");
        _;
    }

    modifier whenNotFrozen() {
        require(!emergencyFreeze, "ZameenChain: City-wide emergency market freeze is active");
        _;
    }

    modifier onlyOwner(uint256 _plotId) {
        require(plots[_plotId].currentOwner == msg.sender, "ZameenChain: Caller is not the registered owner");
        _;
    }

    modifier plotExists(uint256 _plotId) {
        require(_plotId > 0 && _plotId < nextPlotId, "ZameenChain: Plot does not exist");
        _;
    }

    constructor() {
        superAdmin = msg.sender;
        governmentRegistrar = msg.sender;

        // Auto-register genesis authority (deployer). Operational KDA Sub-Registrars are
        // accredited separately so that Signature 1 (KDA) and Signature 2 (Board of Revenue)
        // are always held by different keys.
        registrarOfficers[msg.sender] = RegistrarOfficer({
            officerAddress: msg.sender,
            officerName: "Sindh Board of Revenue (Genesis Authority)",
            badgeNumber: "SBR-GENESIS-001",
            districtBranch: "Board of Revenue Sindh, Karachi Secretariat",
            isActive: true,
            registeredAt: block.timestamp
        });
        allRegistrarAddresses.push(msg.sender);
        isRegistrarTracked[msg.sender] = true;
    }

    /**
     * @notice Returns true if the address may provide Signature 2 (Board of Revenue countersign).
     */
    function isRevenueAuthority(address _account) public view returns (bool) {
        return _account == superAdmin || _account == governmentRegistrar || revenueOfficers[_account];
    }

    /**
     * @notice Appoint or remove a Sindh Board of Revenue countersigning officer.
     * @dev Separation of duties: an active KDA Sub-Registrar can never also be a revenue countersigner.
     */
    function setRevenueOfficer(address _officer, bool _isActive) external onlySuperAdmin {
        require(_officer != address(0), "ZameenChain: Invalid officer address");
        if (_isActive) {
            require(
                !registrarOfficers[_officer].isActive,
                "ZameenChain: Separation of duties - Sub-Registrar cannot be a revenue countersigner"
            );
        }
        revenueOfficers[_officer] = _isActive;
        emit RevenueOfficerUpdated(_officer, _isActive);
    }

    /**
     * @notice Toggle city-wide emergency market freeze (Executive Killswitch).
     */
    function setEmergencyFreeze(bool _frozen) external onlySuperAdmin {
        emergencyFreeze = _frozen;
        emit EmergencyFreezeToggled(_frozen, msg.sender);
    }

    /**
     * @notice Register and onboard a new authorized KDA Sub-Registrar Officer.
     */
    function registerRegistrarOfficer(
        address _officerAddress,
        string memory _officerName,
        string memory _badgeNumber,
        string memory _districtBranch
    ) external onlyRegistrar {
        require(_officerAddress != address(0), "ZameenChain: Invalid officer address");
        require(!registrarOfficers[_officerAddress].isActive, "ZameenChain: Officer already registered and active");
        require(
            !revenueOfficers[_officerAddress],
            "ZameenChain: Separation of duties - revenue countersigner cannot be a Sub-Registrar"
        );

        registrarOfficers[_officerAddress] = RegistrarOfficer({
            officerAddress: _officerAddress,
            officerName: _officerName,
            badgeNumber: _badgeNumber,
            districtBranch: _districtBranch,
            isActive: true,
            registeredAt: block.timestamp
        });

        if (!isRegistrarTracked[_officerAddress]) {
            allRegistrarAddresses.push(_officerAddress);
            isRegistrarTracked[_officerAddress] = true;
        }

        emit RegistrarOfficerRegistered(_officerAddress, _officerName, _badgeNumber);
    }

    /**
     * @notice Revoke an accredited KDA Sub-Registrar Officer.
     */
    function revokeRegistrarOfficer(address _officerAddress) external onlyRegistrar {
        require(
            _officerAddress != superAdmin && _officerAddress != governmentRegistrar,
            "ZameenChain: Cannot revoke primary sovereign authority"
        );
        require(registrarOfficers[_officerAddress].isActive, "ZameenChain: Officer is not currently active");

        registrarOfficers[_officerAddress].isActive = false;
        emit RegistrarOfficerRevoked(_officerAddress);
    }

    /**
     * @notice Retrieve all tracked KDA Sub-Registrar officers.
     */
    function getAllRegistrarOfficers() external view returns (RegistrarOfficer[] memory) {
        RegistrarOfficer[] memory officers = new RegistrarOfficer[](allRegistrarAddresses.length);
        for (uint256 i = 0; i < allRegistrarAddresses.length; i++) {
            officers[i] = registrarOfficers[allRegistrarAddresses[i]];
        }
        return officers;
    }

    /**
     * @notice Register a newly surveyed or authenticated plot into the blockchain.
     * @dev Checks for duplicate KDA allotment IDs to eliminate forged files.
     */
    function registerPlot(PlotRegistrationInput calldata input) external onlyRegistrar whenNotFrozen returns (uint256) {
        require(bytes(input.kdaPlotNumber).length > 0, "ZameenChain: KDA Plot ID cannot be empty");
        require(!isKdaNumberRegistered[input.kdaPlotNumber], "ZameenChain ERROR: Duplicate plot detected! KDA Number already registered.");
        require(input.owner != address(0), "ZameenChain: Invalid owner address");
        require(input.squareYards > 0, "ZameenChain: Size must be greater than zero");

        uint256 plotId = nextPlotId++;

        plots[plotId] = LandPlot({
            id: plotId,
            kdaPlotNumber: input.kdaPlotNumber,
            schemeName: input.schemeName,
            sector: input.sector,
            plotNumber: input.plotNumber,
            squareYards: input.squareYards,
            plotCategory: input.plotCategory,
            latitude: input.latitude,
            longitude: input.longitude,
            currentOwner: input.owner,
            ipfsDeedHash: input.ipfsDeedHash,
            price: 0,
            status: PlotStatus.REGISTERED,
            isDisputed: false,
            disputeReason: "",
            registrationTimestamp: block.timestamp
        });

        isKdaNumberRegistered[input.kdaPlotNumber] = true;
        kdaNumberToPlotId[input.kdaPlotNumber] = plotId;

        // Record initial genesis ownership in audit trail
        plotAuditTrail[plotId].push(OwnershipRecord({
            from: address(0),
            to: input.owner,
            timestamp: block.timestamp,
            price: 0,
            reason: "Initial Government Allotment"
        }));

        emit PlotRegistered(plotId, input.kdaPlotNumber, input.owner, input.squareYards);
        return plotId;
    }

    /**
     * @notice Current owner can list their property for sale at a specific price.
     */
    function listPlotForSale(uint256 _plotId, uint256 _priceInWei) external plotExists(_plotId) onlyOwner(_plotId) whenNotFrozen {
        LandPlot storage plot = plots[_plotId];
        require(!plot.isDisputed, "ZameenChain: Cannot list property with active dispute or stay order");
        require(plot.status != PlotStatus.ESCROW_PENDING, "ZameenChain: Property already has pending escrow deal");
        require(_priceInWei > 0, "ZameenChain: Price must be greater than zero");

        plot.price = _priceInWei;
        plot.status = PlotStatus.LISTED_FOR_SALE;

        emit PlotListedForSale(_plotId, _priceInWei, msg.sender);
    }

    /**
     * @notice Owner can cancel sale listing.
     */
    function delistPlot(uint256 _plotId) external plotExists(_plotId) onlyOwner(_plotId) {
        LandPlot storage plot = plots[_plotId];
        require(plot.status == PlotStatus.LISTED_FOR_SALE, "ZameenChain: Plot is not currently listed");

        plot.price = 0;
        plot.status = PlotStatus.REGISTERED;

        emit PlotDelisted(_plotId, msg.sender);
    }

    /**
     * @notice Prospective buyer deposits required funds into Smart Contract Escrow.
     */
    function depositEscrow(uint256 _plotId) external payable plotExists(_plotId) whenNotFrozen {
        LandPlot storage plot = plots[_plotId];
        require(plot.status == PlotStatus.LISTED_FOR_SALE, "ZameenChain: Plot is not available for purchase");
        require(!plot.isDisputed, "ZameenChain: Property is disputed");
        require(msg.sender != plot.currentOwner, "ZameenChain: Owner cannot purchase own property");
        require(msg.value == plot.price, "ZameenChain: Incorrect payment amount sent");
        require(!escrowDeals[_plotId].isActive, "ZameenChain: Escrow deal already in progress");

        escrowDeals[_plotId] = EscrowDeal({
            buyer: payable(msg.sender),
            amount: msg.value,
            isActive: true
        });

        plot.status = PlotStatus.ESCROW_PENDING;

        emit EscrowInitiated(_plotId, msg.sender, msg.value);
    }

    /**
     * @notice SIGNATURE 1 of 2 (Maker) — KDA Sub-Registrar verifies biometric clearance,
     * tax challans & non-encumbrance, then endorses the transfer. No funds move at this stage.
     */
    function endorseTransfer(uint256 _plotId, string memory _newDeedIpfsHash) external plotExists(_plotId) whenNotFrozen {
        require(registrarOfficers[msg.sender].isActive, "ZameenChain: Caller is not the authorized KDA Registrar");
        require(
            !isRevenueAuthority(msg.sender),
            "ZameenChain: Separation of duties - Board of Revenue cannot endorse as Sub-Registrar"
        );

        LandPlot storage plot = plots[_plotId];
        require(plot.status == PlotStatus.ESCROW_PENDING, "ZameenChain: No pending escrow deal for this plot");
        require(!plot.isDisputed, "ZameenChain: Cannot transfer disputed property");

        EscrowDeal storage deal = escrowDeals[_plotId];
        require(deal.isActive, "ZameenChain: Escrow is not active");
        require(
            msg.sender != plot.currentOwner && msg.sender != deal.buyer,
            "ZameenChain: Conflict of interest - party to the sale cannot sign"
        );
        require(!transferApprovals[_plotId].isEndorsed, "ZameenChain: Transfer already endorsed");

        transferApprovals[_plotId] = TransferApproval({
            endorsedBy: msg.sender,
            endorsedAt: block.timestamp,
            newDeedIpfsHash: _newDeedIpfsHash,
            isEndorsed: true
        });

        emit TransferEndorsed(_plotId, msg.sender, _newDeedIpfsHash);
    }

    /**
     * @notice SIGNATURE 2 of 2 (Checker) — Sindh Board of Revenue authority countersigns.
     * Only now is legal title transferred and escrow released to the seller (atomic settlement).
     */
    function countersignTransfer(uint256 _plotId) external plotExists(_plotId) onlyRevenueAuthority whenNotFrozen {
        LandPlot storage plot = plots[_plotId];
        require(plot.status == PlotStatus.ESCROW_PENDING, "ZameenChain: No pending escrow deal for this plot");
        require(!plot.isDisputed, "ZameenChain: Cannot transfer disputed property");

        EscrowDeal storage deal = escrowDeals[_plotId];
        require(deal.isActive, "ZameenChain: Escrow is not active");

        TransferApproval storage approval = transferApprovals[_plotId];
        require(approval.isEndorsed, "ZameenChain: Awaiting KDA Sub-Registrar endorsement (signature 1 of 2)");
        require(msg.sender != approval.endorsedBy, "ZameenChain: Dual control - endorser cannot countersign");
        require(
            msg.sender != plot.currentOwner && msg.sender != deal.buyer,
            "ZameenChain: Conflict of interest - party to the sale cannot sign"
        );

        address payable previousOwner = plot.currentOwner;
        address payable newOwner = deal.buyer;
        uint256 salePrice = deal.amount;
        address endorser = approval.endorsedBy;
        string memory newDeedHash = approval.newDeedIpfsHash;

        // Reset escrow & approval before external call (CEI pattern)
        deal.isActive = false;
        deal.amount = 0;
        deal.buyer = payable(address(0));
        delete transferApprovals[_plotId];

        // Update plot state before external call
        plot.currentOwner = newOwner;
        plot.price = 0;
        plot.status = PlotStatus.REGISTERED;
        if (bytes(newDeedHash).length > 0) {
            plot.ipfsDeedHash = newDeedHash;
        }

        // Record in permanent audit trail
        plotAuditTrail[_plotId].push(OwnershipRecord({
            from: previousOwner,
            to: newOwner,
            timestamp: block.timestamp,
            price: salePrice,
            reason: "Dual-Signature Transfer (KDA Endorsed + Board of Revenue Countersigned)"
        }));

        // Transfer funds safely to seller
        (bool sent, ) = previousOwner.call{value: salePrice}("");
        require(sent, "ZameenChain: Failed to release funds to seller");

        emit TransferCountersigned(_plotId, endorser, msg.sender);
        emit OwnershipTransferred(_plotId, previousOwner, newOwner, salePrice);
    }

    /**
     * @dev Clears any pending endorsement when the underlying deal is cancelled or frozen.
     */
    function _revokeEndorsement(uint256 _plotId, string memory _reason) private {
        if (transferApprovals[_plotId].isEndorsed) {
            delete transferApprovals[_plotId];
            emit TransferEndorsementRevoked(_plotId, _reason);
        }
    }

    /**
     * @notice Cancel escrow deal and refund buyer if terms are not met.
     * Can be called by buyer or Registrar even if city-wide freeze is active.
     */
    function cancelEscrow(uint256 _plotId) external plotExists(_plotId) {
        LandPlot storage plot = plots[_plotId];
        EscrowDeal storage deal = escrowDeals[_plotId];
        require(deal.isActive, "ZameenChain: No escrow in progress");
        require(
            msg.sender == deal.buyer ||
            msg.sender == superAdmin ||
            msg.sender == governmentRegistrar ||
            registrarOfficers[msg.sender].isActive,
            "ZameenChain: Only buyer or Registrar can cancel escrow"
        );

        address payable buyer = deal.buyer;
        uint256 refundAmount = deal.amount;

        // Clear escrow before external transfer (CEI pattern)
        deal.isActive = false;
        deal.amount = 0;
        deal.buyer = payable(address(0));
        _revokeEndorsement(_plotId, "Escrow cancelled");

        // Restore status cleanly depending on dispute flag
        plot.status = plot.isDisputed ? PlotStatus.DISPUTED : PlotStatus.LISTED_FOR_SALE;

        // Refund buyer
        (bool refunded, ) = buyer.call{value: refundAmount}("");
        require(refunded, "ZameenChain: Refund transfer failed");

        emit EscrowCancelled(_plotId, buyer, refundAmount);
    }

    /**
     * @notice Flag property under legal dispute / stay order (Court Order enforcement).
     * Automatically refunds any pending buyer escrow so innocent buyers never have funds locked in litigation.
     */
    function flagDispute(uint256 _plotId, string memory _reason) external plotExists(_plotId) onlyRegistrar {
        require(bytes(_reason).length > 0, "ZameenChain: Dispute reason required");
        LandPlot storage plot = plots[_plotId];

        // Protect innocent buyer if an escrow was active when the court stay order arrived
        EscrowDeal storage deal = escrowDeals[_plotId];
        _revokeEndorsement(_plotId, "Court stay order");
        if (deal.isActive) {
            address payable buyerToRefund = deal.buyer;
            uint256 refundAmount = deal.amount;
            deal.isActive = false;
            deal.amount = 0;
            deal.buyer = payable(address(0));

            (bool refunded, ) = buyerToRefund.call{value: refundAmount}("");
            require(refunded, "ZameenChain: Buyer refund failed during dispute freeze");
            emit EscrowCancelled(_plotId, buyerToRefund, refundAmount);
        }

        plot.price = 0;
        plot.isDisputed = true;
        plot.disputeReason = _reason;
        plot.status = PlotStatus.DISPUTED;

        emit DisputeFlagged(_plotId, _reason);
    }

    /**
     * @notice Resolve and clear legal dispute once court matters are settled.
     */
    function resolveDispute(uint256 _plotId) external plotExists(_plotId) onlyRegistrar {
        LandPlot storage plot = plots[_plotId];
        require(plot.isDisputed, "ZameenChain: Plot is not currently disputed");

        plot.isDisputed = false;
        plot.disputeReason = "";
        plot.status = PlotStatus.REGISTERED;

        emit DisputeResolved(_plotId);
    }

    /**
     * @notice Get complete ownership history of a plot.
     */
    function getPlotHistory(uint256 _plotId) external view plotExists(_plotId) returns (OwnershipRecord[] memory) {
        return plotAuditTrail[_plotId];
    }

    /**
     * @notice Public verification: Query plot by KDA Allotment Number.
     */
    function verifyPlotByKdaNumber(string memory _kdaPlotNumber) external view returns (bool isFound, LandPlot memory plot) {
        if (!isKdaNumberRegistered[_kdaPlotNumber]) {
            return (false, plots[0]);
        }
        uint256 plotId = kdaNumberToPlotId[_kdaPlotNumber];
        return (true, plots[plotId]);
    }

    /**
     * @notice Retrieve all registered plots for UI display.
     */
    function getAllPlots() external view returns (LandPlot[] memory) {
        uint256 total = nextPlotId - 1;
        LandPlot[] memory allPlots = new LandPlot[](total);
        for (uint256 i = 1; i <= total; i++) {
            allPlots[i - 1] = plots[i];
        }
        return allPlots;
    }

    /**
     * @notice Retrieve all escrow deals aligned by plot index (plotId = index + 1).
     */
    function getAllEscrowDeals() external view returns (EscrowDeal[] memory) {
        uint256 total = nextPlotId - 1;
        EscrowDeal[] memory deals = new EscrowDeal[](total);
        for (uint256 i = 1; i <= total; i++) {
            deals[i - 1] = escrowDeals[i];
        }
        return deals;
    }

    /**
     * @notice Retrieve all pending dual-signature approvals aligned by plot index (plotId = index + 1).
     */
    function getAllTransferApprovals() external view returns (TransferApproval[] memory) {
        uint256 total = nextPlotId - 1;
        TransferApproval[] memory approvals = new TransferApproval[](total);
        for (uint256 i = 1; i <= total; i++) {
            approvals[i - 1] = transferApprovals[i];
        }
        return approvals;
    }
}
