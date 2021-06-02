// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./NftFractionsRepository.sol";

contract Dex is Initializable, PausableUpgradeable, OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    enum Side {BUY, SELL}

    struct Order {
        uint256 id;
        address trader;
        Side side;
        uint256 tokenId;
        uint256 amount;
        uint256 filled;
        uint256 price;
        uint256 date;
    }

    event NewTrade(
        uint256 orderId,
        uint256 indexed tokenId,
        address indexed trader1,
        address indexed trader2,
        uint256 amount,
        uint256 price,
        uint256 date
    );

    CountersUpgradeable.Counter private _orderIds;
    mapping(address => uint256) ethBalance;
    mapping(address => uint256) ethReservedBalance;
    mapping(uint256 => mapping(uint256 => Order[])) orderBook;
    mapping(address => mapping(uint256 => uint256)) sharesReserved;
    NftFractionsRepository nftFractionsRepository;

    function initialize() public initializer {
        __Context_init_unchained();
        __Pausable_init_unchained();
        __Ownable_init_unchained();
    }

    function setNftFractionsRepository(address nftFractionsRepositoryAddress)
        public
        onlyOwner()
    {
        nftFractionsRepository = NftFractionsRepository(
            nftFractionsRepositoryAddress
        );
    }

    /**
     * @dev deposit ETH for trading
     */
    function depositEth() public payable {
        require(!paused(), "Not allowed while paused");
        ethBalance[msg.sender] += msg.value;
    }

    /**
     * @dev Withdraw ETH
     *
     * Requirements:
     * - msg.sender has to have equal or more ETH than the amount to withdraw
     */
    function withdrawEth(uint256 amount) public {
        require(!paused(), "Not allowed while paused");
        require(
            ethBalance[msg.sender] - ethReservedBalance[msg.sender] >= amount,
            "ETH balance is not enough"
        );
        ethBalance[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev returns the ETH balance of the owner
     */
    function getEthBalance(address owner) public view returns (uint256) {
        return ethBalance[owner];
    }

    /**
     * @dev returns the ETH reserved balance of the owner
     */
    function getEthReserveBalance(address owner) public view returns (uint256) {
        return ethReservedBalance[owner];
    }

    /**
     * @dev returns the shares reserved in orders for a given owner and tokenId
     */
    function getSharesReserveBalance(address owner, uint256 tokenId)
        public
        view
        returns (uint256)
    {
        return sharesReserved[owner][tokenId];
    }

    function pause() public onlyOwner() {
        _pause();
    }

    function createLimitOrder(
        uint256 tokenId,
        uint256 amount,
        uint256 price,
        Side side
    ) external tokenExist(tokenId) {
        require(!paused(), "Not allowed while paused");
        if (side == Side.SELL) {
            uint256 sendersBalance =
                nftFractionsRepository.balanceOf(msg.sender, tokenId);
            require(
                sendersBalance >= amount,
                "message sender's token balance is too low"
            );
            sharesReserved[msg.sender][tokenId] += amount;
        } else {
            address erc721ContractAddress;
            uint256 erc721TokenId;
            uint256 totalFractionsAmount;
            (
                erc721ContractAddress,
                erc721TokenId,
                totalFractionsAmount
            ) = nftFractionsRepository.getTokenData(tokenId);
            require(
                totalFractionsAmount >= amount,
                "total amount of fractions is lower than the given amount"
            );
            require(
                ethBalance[msg.sender] - ethReservedBalance[msg.sender] >=
                    amount * price,
                "eth balance too low"
            );
            ethReservedBalance[msg.sender] += amount * price;
        }
        Order[] storage orders = orderBook[tokenId][uint256(side)];
        _orderIds.increment();
        uint256 newOrderId = _orderIds.current();
        orders.push(
            Order(
                newOrderId,
                msg.sender,
                side,
                tokenId,
                amount,
                0,
                price,
                block.timestamp
            )
        );

        uint256 i = orders.length > 0 ? orders.length - 1 : 0;
        while (i > 0) {
            if (side == Side.BUY && orders[i - 1].price > orders[i].price) {
                break;
            }
            if (side == Side.SELL && orders[i - 1].price < orders[i].price) {
                break;
            }
            Order memory order = orders[i - 1];
            orders[i - 1] = orders[i];
            orders[i] = order;
            i--;
        }
    }

    function createMarketOrder(
        uint256 tokenId,
        uint256 amount,
        Side side
    ) external tokenExist(tokenId) {
        require(!paused(), "Not allowed while paused");
        if (side == Side.SELL) {
            uint256 sendersBalance =
                nftFractionsRepository.balanceOf(msg.sender, tokenId);
            require(
                sendersBalance >= amount,
                "message sender's token balance is too low"
            );
        }
        Order[] storage orders =
            orderBook[tokenId][
                uint256(side == Side.BUY ? Side.SELL : Side.BUY)
            ];
        uint256 i;
        uint256 remaining = amount;

        while (i < orders.length && remaining > 0) {
            uint256 available = orders[i].amount - orders[i].filled;
            uint256 matched = (remaining > available) ? available : remaining;
            remaining = remaining - matched;
            orders[i].filled = orders[i].filled + matched;
            emit NewTrade(
                orders[i].id,
                tokenId,
                orders[i].trader,
                msg.sender,
                matched,
                orders[i].price,
                block.timestamp
            );
            if (side == Side.SELL) {
                nftFractionsRepository.transferFrom(
                    msg.sender,
                    orders[i].trader,
                    tokenId,
                    matched,
                    ""
                );
                ethBalance[msg.sender] += orders[i].price * matched;
                ethBalance[orders[i].trader] -= orders[i].price * matched;
            }
            if (side == Side.BUY) {
                require(
                    ethBalance[msg.sender] - ethReservedBalance[msg.sender] >=
                        orders[i].price * matched,
                    "eth balance too low"
                );
                nftFractionsRepository.transferFrom(
                    orders[i].trader,
                    msg.sender,
                    tokenId,
                    matched,
                    ""
                );
                ethBalance[msg.sender] -= orders[i].price * matched;
                ethBalance[orders[i].trader] += orders[i].price * matched;
            }
            i++;
        }

        i = 0;
        while (i < orders.length && orders[i].filled == orders[i].amount) {
            for (uint256 j = i; j < orders.length - 1; j++) {
                orders[j] = orders[j + 1];
            }
            orders.pop();
            i++;
        }
    }

    /**
     * @dev returns the orders of the token and side
     */
    function getOrders(uint256 tokenId, Side side)
        external
        view
        returns (Order[] memory)
    {
        return orderBook[tokenId][uint256(side)];
    }

    /**
     * @dev delete the order
     */
    function deleteOrder(
        uint256 tokenId,
        Side side,
        uint256 orderId
    ) public {
        Order[] storage orders = orderBook[tokenId][uint256(side)];
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].id == orderId) {
                require(
                    msg.sender == orders[i].trader,
                    "Only the trader can delete his order"
                );
                orders[i] = orders[orders.length - 1];
                orders.pop();
            }
        }
    }

    modifier tokenExist(uint256 tokenId) {
        address erc721ContractAddress;
        uint256 erc721TokenId;
        uint256 totalFractionsAmount;
        (
            erc721ContractAddress,
            erc721TokenId,
            totalFractionsAmount
        ) = nftFractionsRepository.getTokenData(tokenId);
        require(
            erc721ContractAddress != address(0),
            "this token does not exist"
        );
        _;
    }
}
