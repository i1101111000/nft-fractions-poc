// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract NftFractionsRepository is
    Initializable,
    ERC1155Upgradeable,
    PausableUpgradeable,
    OwnableUpgradeable
{
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct Token {
        address erc721ContractAddress;
        uint256 erc721TokenId;
        uint256 totalFractionsAmount;
    }

    CountersUpgradeable.Counter private _ids;
    mapping(uint256 => Token) tokens;
    // data structures to keep track of:
    // tokenIds by owner:
    mapping(address => uint256[]) tokenIdsByShareOwner;
    // owners by tokenId:
    mapping(uint256 => address[]) ownersByTokenId;
    // all tokenIds:
    uint256[] tokenIds;

    function initialize(string memory uri_) public initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __Pausable_init_unchained();
        __ERC1155_init_unchained(uri_);
        __Ownable_init_unchained();
    }

    /**
     * @dev Deposit an ERC721 token and mints an ERC1155 token with the given fractions amount
     * the original ERC721 token is transferred to the address of this smart contract.
     * Before calling this function the user has to call the apporve function on the original NFT contract and
     * approve this smart contract to transfer his NFT.
     *
     * Requirements:
     * - msg.sender has to own the token that is deposited
     * - the contract is not paused
     */
    function depositNft(
        address erc721ContractAddress,
        uint256 erc721TokenId,
        uint256 fractionsAmountToMint
    ) external {
        require(!paused(), "Not allowed while paused");
        IERC721 erc721Contract = IERC721(erc721ContractAddress);
        require(
            erc721Contract.ownerOf(erc721TokenId) == msg.sender,
            "msg sender has to own the token to deposit"
        );
        erc721Contract.transferFrom(msg.sender, address(this), erc721TokenId);
        _ids.increment();
        uint256 newItemId = _ids.current();
        _mint(msg.sender, newItemId, fractionsAmountToMint, "");
        Token memory token;
        token.erc721ContractAddress = erc721ContractAddress;
        token.erc721TokenId = erc721TokenId;
        token.totalFractionsAmount = fractionsAmountToMint;
        tokens[newItemId] = token;
        tokenIdsByShareOwner[msg.sender].push(newItemId);
        ownersByTokenId[newItemId].push(msg.sender);
        tokenIds.push(newItemId);
    }

    /**
     * @dev Withdraw an ERC721 token from this contract. The message sender has to own all of the shares in
     * the correspondign ERC1155 token.
     * Successfull withdraw means:
     * - burning the ERC1155 token
     * - transfering the ERC721 token to the owner (msg.sender) = owner of all shares in the ERC1155 token
     *
     * Requirements:
     * - msg.sender has to own all shares in the corresponding ERC1155 token
     * - the contract is not paused
     */
    function withdrawNft(uint256 tokenId) external {
        require(!paused(), "Not allowed while paused");
        uint256 totalFractionsAmount = tokens[tokenId].totalFractionsAmount;
        uint256 sendersAmount = balanceOf(msg.sender, tokenId);
        require(
            totalFractionsAmount == sendersAmount,
            "message sender has to own all of the shares"
        );
        //sends the original token in the ERC721 contract
        address erc721ContractAddress = tokens[tokenId].erc721ContractAddress;
        uint256 erc721TokenId = tokens[tokenId].erc721TokenId;
        IERC721 erc721Contract = IERC721(erc721ContractAddress);
        erc721Contract.transferFrom(address(this), msg.sender, erc721TokenId);
        //burns the ERC1155 token
        _burn(msg.sender, tokenId, totalFractionsAmount);
        //deletes the ERC1155 token from the tokenIdsByShareOwner array
        deleteIdFromTokenIdsByShareOwner(msg.sender, tokenId);
        //deletes the ERC1155 token from the tokenIds array
        uint256 nrOfTokens = tokenIds.length;
        uint256 tokenIdPosition;
        for (uint256 i; i < nrOfTokens; i++) {
            if (tokenId == tokenIds[i]) {
                tokenIdPosition = i;
                break;
            }
        }
        tokenIds[tokenIdPosition] = tokenIds[nrOfTokens - 1];
        tokenIds.pop();
        //deletes the token from the owners mapping
        delete ownersByTokenId[tokenId];
        //deletes the token struct
        delete tokens[tokenId];
    }

    /**
     * @dev same as safeTransferFrom in ERC1155 with updating the internal data structures:
     * - updates the ownersByTokenId data structure
     * - updates the tokenIdsByShareOwner data structure
     */
    function transferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        require(!paused(), "Not allowed while paused");
        uint256 fromBalanceBefore = balanceOf(from, id);
        uint256 toBalanceBefore = balanceOf(to, id);
        safeTransferFrom(from, to, id, amount, data);
        if (amount >= fromBalanceBefore) {
            // remove the tokenId from ownersByTokenId[tokenId][from]
            uint256 nrOfOwners = ownersByTokenId[id].length;
            uint256 ownerPosition;
            for (uint256 i; i < nrOfOwners; i++) {
                if (from == ownersByTokenId[id][i]) {
                    ownerPosition = i;
                    break;
                }
            }
            ownersByTokenId[id][ownerPosition] = ownersByTokenId[id][
                nrOfOwners - 1
            ];
            ownersByTokenId[id].pop();
            // delete the tokenId from the tokenIdsByShareOwner array
            deleteIdFromTokenIdsByShareOwner(from, id);
        }
        if (toBalanceBefore == 0) {
            ownersByTokenId[id].push(to);
            tokenIdsByShareOwner[to].push(id);
        }
    }

    /**
     * @dev returns relevant token data:
     * - original ERC721 contract address
     * - original ERC721 token id
     * - amount of fractions minted
     */
    function getTokenData(uint256 _tokenId)
        public
        view
        returns (
            address erc721ContractAddress,
            uint256 erc721TokenId,
            uint256 totalFractionsAmount
        )
    {
        return (
            tokens[_tokenId].erc721ContractAddress,
            tokens[_tokenId].erc721TokenId,
            tokens[_tokenId].totalFractionsAmount
        );
    }

    function pause() public onlyOwner() {
        _pause();
    }

    /**
     * @dev returns the ERC1155 tokenIds that the shareOwner has shares in
     */
    function getTokenIdsByShareOwner(address shareOwner)
        public
        view
        returns (uint256[] memory)
    {
        return tokenIdsByShareOwner[shareOwner];
    }

    /**
     * @dev returns the owners of a token
     */
    function getOwnersBYtokenId(uint256 tokenId)
        public
        view
        returns (address[] memory)
    {
        return ownersByTokenId[tokenId];
    }

    /**
     * @dev returns all ERC1155 tokenIds managed by this contract
     */
    function getTokenIds() public view returns (uint256[] memory) {
        return tokenIds;
    }

    /**
     * @dev helper to delete a tokenId from tokenIdsByShareOwner
     */
    function deleteIdFromTokenIdsByShareOwner(address owner, uint256 id)
        private
    {
        uint256 nrOfTokensByShareOwner = tokenIdsByShareOwner[owner].length;
        uint256 tokenIdPositionInShareOwner;
        for (uint256 i; i < nrOfTokensByShareOwner; i++) {
            if (id == tokenIdsByShareOwner[owner][i]) {
                tokenIdPositionInShareOwner = i;
                break;
            }
        }
        tokenIdsByShareOwner[owner][
            tokenIdPositionInShareOwner
        ] = tokenIdsByShareOwner[owner][nrOfTokensByShareOwner - 1];
        tokenIdsByShareOwner[owner].pop();
    }
}
