// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ZameenChain
 * @dev Sovereign Decentralized Land Title Registry & Anti-Fraud Atomic Escrow Protocol
 *      for Karachi Urban Real Estate (Government of Sindh / KDA Cadastre).
 *      Eliminates duplicate plot files, double allotments, advance-token fraud,
 *      and enforces Sindh High Court stay orders cryptographically.
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

        // Auto-register primary initial registrar officer
        registrarOfficers[msg.sender] = RegistrarOfficer({
            officerAddress: msg.sender,
            officerName: "Engr. Tariq Mansoor (Chief Sub-Registrar)",
            badgeNumber: "KDA-SR-001",
            districtBranch: "KDA Civic Centre Main Secretariat",
            isActive: true,
            registeredAt: block.timestamp
        });
        allRegistrarAddresses.push(msg.sender);
        isRegistrarTracked[msg.sender] = true;
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
     * @notice KDA Registrar reviews documents and confirms legal title transfer.
     * Releases locked escrow funds to the seller and updates ownership to the buyer.
     */
    function approveAndCompleteTransfer(uint256 _plotId, string memory _newDeedIpfsHash) external plotExists(_plotId) onlyRegistrar whenNotFrozen {
        LandPlot storage plot = plots[_plotId];
        require(plot.status == PlotStatus.ESCROW_PENDING, "ZameenChain: No pending escrow deal for this plot");
        require(!plot.isDisputed, "ZameenChain: Cannot transfer disputed property");

        EscrowDeal storage deal = escrowDeals[_plotId];
        require(deal.isActive, "ZameenChain: Escrow is not active");

        address payable previousOwner = plot.currentOwner;
        address payable newOwner = deal.buyer;
        uint256 salePrice = deal.amount;

        // Reset escrow status before external call (CEI pattern)
        deal.isActive = false;
        deal.amount = 0;
        deal.buyer = payable(address(0));

        // Update plot state before external call
        plot.currentOwner = newOwner;
        plot.price = 0;
        plot.status = PlotStatus.REGISTERED;
        if (bytes(_newDeedIpfsHash).length > 0) {
            plot.ipfsDeedHash = _newDeedIpfsHash;
        }

        // Record in permanent audit trail
        plotAuditTrail[_plotId].push(OwnershipRecord({
            from: previousOwner,
            to: newOwner,
            timestamp: block.timestamp,
            price: salePrice,
            reason: "Verified Blockchain Sale & Transfer"
        }));

        // Transfer funds safely to seller
        (bool sent, ) = previousOwner.call{value: salePrice}("");
        require(sent, "ZameenChain: Failed to release funds to seller");

        emit OwnershipTransferred(_plotId, previousOwner, newOwner, salePrice);
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
}
