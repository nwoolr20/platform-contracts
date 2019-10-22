pragma solidity ^0.5.11;

import "../ICards.sol";

contract OpenMinter {

    ICards public cards;

    constructor(ICards _cards) public {
        cards = _cards;
    }

    function mintCards(address to, uint16[] memory _protos, uint8[] memory _qualities) public {
        cards.mintCards(to, _protos, _qualities);
    }

    function blockMintCards(address to, uint16[] memory _protos, uint8[] memory _qualities) public {
        cards.blockMintCards(to, _protos, _qualities);
    }


}